import hashlib
import json
import sqlite3
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Tuple

from control_plane import (
    Approval,
    ApprovalLevel,
    Job,
    ReconciliationDecision,
    WorkflowState,
)


class RuntimeStoreViolation(RuntimeError):
    pass


class RuntimeStore:
    """Durable control-plane state and side-effect outbox."""

    def __init__(self, path: str) -> None:
        self.path = path
        if path != ":memory:":
            Path(path).parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(path)
        self.conn.row_factory = sqlite3.Row
        self.conn.execute("PRAGMA foreign_keys = ON")
        if path != ":memory:":
            self.conn.execute("PRAGMA journal_mode = WAL")
        self._init_schema()

    def close(self) -> None:
        self.conn.close()

    def _init_schema(self) -> None:
        self.conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS jobs (
                work_item_id TEXT PRIMARY KEY,
                run_id TEXT NOT NULL,
                goal TEXT NOT NULL,
                state TEXT NOT NULL,
                previous_state TEXT,
                qa_pass INTEGER NOT NULL,
                ci_pass INTEGER NOT NULL,
                human_merge_approved INTEGER NOT NULL,
                merged_or_closed INTEGER NOT NULL,
                approvals_json TEXT NOT NULL,
                events_json TEXT NOT NULL,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS inbound_events (
                event_id TEXT PRIMARY KEY,
                source TEXT NOT NULL,
                event_type TEXT NOT NULL,
                payload_sha256 TEXT NOT NULL,
                work_item_id TEXT,
                status TEXT NOT NULL DEFAULT 'RECEIVED',
                decision_json TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS outbox (
                operation_id TEXT PRIMARY KEY,
                event_id TEXT NOT NULL,
                operation TEXT NOT NULL,
                payload_json TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'PENDING',
                attempts INTEGER NOT NULL DEFAULT 0,
                last_error TEXT,
                next_attempt_at REAL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(event_id) REFERENCES inbound_events(event_id)
            );
            """
        )
        columns = {
            row["name"]
            for row in self.conn.execute("PRAGMA table_info(outbox)").fetchall()
        }
        if "next_attempt_at" not in columns:
            self.conn.execute("ALTER TABLE outbox ADD COLUMN next_attempt_at REAL")
        self.conn.commit()

    @staticmethod
    def payload_hash(payload: bytes) -> str:
        return hashlib.sha256(payload).hexdigest()

    def save_job(self, job: Job) -> None:
        approvals = [
            {
                "level": approval.level.value,
                "approved_by": approval.approved_by,
                "reason": approval.reason,
            }
            for approval in job.approvals
        ]
        with self.conn:
            self.conn.execute(
                """
                INSERT INTO jobs (
                    work_item_id, run_id, goal, state, previous_state,
                    qa_pass, ci_pass, human_merge_approved, merged_or_closed,
                    approvals_json, events_json, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(work_item_id) DO UPDATE SET
                    run_id=excluded.run_id,
                    goal=excluded.goal,
                    state=excluded.state,
                    previous_state=excluded.previous_state,
                    qa_pass=excluded.qa_pass,
                    ci_pass=excluded.ci_pass,
                    human_merge_approved=excluded.human_merge_approved,
                    merged_or_closed=excluded.merged_or_closed,
                    approvals_json=excluded.approvals_json,
                    events_json=excluded.events_json,
                    updated_at=CURRENT_TIMESTAMP
                """,
                (
                    job.work_item_id,
                    job.run_id,
                    job.goal,
                    job.state.value,
                    job.previous_state.value if job.previous_state else None,
                    int(job.qa_pass),
                    int(job.ci_pass),
                    int(job.human_merge_approved),
                    int(job.merged_or_closed),
                    json.dumps(approvals, sort_keys=True),
                    json.dumps(job.events),
                ),
            )

    def load_job(self, work_item_id: str) -> Optional[Job]:
        row = self.conn.execute(
            "SELECT * FROM jobs WHERE work_item_id = ?", (work_item_id,)
        ).fetchone()
        if row is None:
            return None
        approvals = [
            Approval(
                level=ApprovalLevel(item["level"]),
                approved_by=item["approved_by"],
                reason=item["reason"],
            )
            for item in json.loads(row["approvals_json"])
        ]
        return Job(
            run_id=row["run_id"],
            work_item_id=row["work_item_id"],
            goal=row["goal"],
            state=WorkflowState(row["state"]),
            previous_state=(
                WorkflowState(row["previous_state"])
                if row["previous_state"]
                else None
            ),
            qa_pass=bool(row["qa_pass"]),
            ci_pass=bool(row["ci_pass"]),
            human_merge_approved=bool(row["human_merge_approved"]),
            merged_or_closed=bool(row["merged_or_closed"]),
            approvals=approvals,
            events=json.loads(row["events_json"]),
        )

    def record_event(
        self,
        event_id: str,
        source: str,
        event_type: str,
        payload: bytes,
        work_item_id: Optional[str],
    ) -> bool:
        if not event_id:
            raise RuntimeStoreViolation("event_id is required")
        digest = self.payload_hash(payload)
        try:
            with self.conn:
                self.conn.execute(
                    """
                    INSERT INTO inbound_events (
                        event_id, source, event_type, payload_sha256, work_item_id
                    ) VALUES (?, ?, ?, ?, ?)
                    """,
                    (event_id, source, event_type, digest, work_item_id),
                )
            return True
        except sqlite3.IntegrityError:
            row = self.conn.execute(
                "SELECT source, event_type, payload_sha256, work_item_id "
                "FROM inbound_events WHERE event_id = ?",
                (event_id,),
            ).fetchone()
            if row is None:
                raise
            prior = (
                row["source"],
                row["event_type"],
                row["payload_sha256"],
                row["work_item_id"],
            )
            current = (source, event_type, digest, work_item_id)
            if prior != current:
                raise RuntimeStoreViolation(
                    "event_id reuse with different delivery content is denied"
                )
            return False

    def event_status(self, event_id: str) -> Optional[str]:
        row = self.conn.execute(
            "SELECT status FROM inbound_events WHERE event_id = ?", (event_id,)
        ).fetchone()
        return row["status"] if row else None

    @staticmethod
    def _decision_payload(decision: ReconciliationDecision) -> Dict[str, Any]:
        return {
            "desired_status": (
                decision.desired_status.value if decision.desired_status else None
            ),
            "reason": decision.reason,
            "blocked": decision.blocked,
            "add_labels": sorted(decision.add_labels),
            "remove_labels": sorted(decision.remove_labels),
            "requires_human_approval": decision.requires_human_approval,
        }

    def get_decision(self, event_id: str) -> Optional[Dict[str, Any]]:
        row = self.conn.execute(
            "SELECT decision_json FROM inbound_events WHERE event_id = ?",
            (event_id,),
        ).fetchone()
        if row is None or row["decision_json"] is None:
            return None
        return json.loads(row["decision_json"])

    def mark_event_ignored(self, event_id: str, reason: str) -> None:
        payload = json.dumps({"ignored": True, "reason": reason}, sort_keys=True)
        with self.conn:
            updated = self.conn.execute(
                """
                UPDATE inbound_events
                SET status='IGNORED', decision_json=?, updated_at=CURRENT_TIMESTAMP
                WHERE event_id=?
                """,
                (payload, event_id),
            )
            if updated.rowcount != 1:
                raise RuntimeStoreViolation(f"unknown event_id: {event_id}")

    def persist_decision_and_outbox(
        self,
        event_id: str,
        decision: ReconciliationDecision,
        operations: Sequence[Tuple[str, str, Dict[str, Any]]],
    ) -> None:
        decision_json = json.dumps(self._decision_payload(decision), sort_keys=True)
        try:
            with self.conn:
                updated = self.conn.execute(
                    """
                    UPDATE inbound_events
                    SET status='DECIDED', decision_json=?, updated_at=CURRENT_TIMESTAMP
                    WHERE event_id=?
                    """,
                    (decision_json, event_id),
                )
                if updated.rowcount != 1:
                    raise RuntimeStoreViolation(f"unknown event_id: {event_id}")

                for operation_id, operation, payload in operations:
                    encoded = json.dumps(payload, sort_keys=True)
                    self.conn.execute(
                        """
                        INSERT INTO outbox (
                            operation_id, event_id, operation, payload_json
                        ) VALUES (?, ?, ?, ?)
                        """,
                        (operation_id, event_id, operation, encoded),
                    )
        except sqlite3.IntegrityError as exc:
            raise RuntimeStoreViolation(
                "atomic decision/outbox write collided with an existing operation"
            ) from exc

    def pending_outbox(
        self, limit: int = 100, now: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        now = time.time() if now is None else now
        rows = self.conn.execute(
            """
            SELECT operation_id, event_id, operation, payload_json,
                   attempts, last_error, next_attempt_at, status
            FROM outbox
            WHERE status IN ('PENDING', 'FAILED')
              AND (next_attempt_at IS NULL OR next_attempt_at <= ?)
            ORDER BY created_at, operation_id
            LIMIT ?
            """,
            (now, limit),
        ).fetchall()
        return [
            {
                "operation_id": row["operation_id"],
                "event_id": row["event_id"],
                "operation": row["operation"],
                "payload": json.loads(row["payload_json"]),
                "attempts": row["attempts"],
                "last_error": row["last_error"],
                "next_attempt_at": row["next_attempt_at"],
                "status": row["status"],
            }
            for row in rows
        ]

    def mark_outbox_complete(self, operation_id: str) -> None:
        with self.conn:
            updated = self.conn.execute(
                """
                UPDATE outbox
                SET status='COMPLETE', attempts=attempts+1,
                    last_error=NULL, next_attempt_at=NULL,
                    updated_at=CURRENT_TIMESTAMP
                WHERE operation_id=?
                """,
                (operation_id,),
            )
            if updated.rowcount != 1:
                raise RuntimeStoreViolation(f"unknown operation_id: {operation_id}")

    def mark_outbox_retry(
        self, operation_id: str, error: str, next_attempt_at: float
    ) -> None:
        with self.conn:
            updated = self.conn.execute(
                """
                UPDATE outbox
                SET status='FAILED', attempts=attempts+1,
                    last_error=?, next_attempt_at=?,
                    updated_at=CURRENT_TIMESTAMP
                WHERE operation_id=?
                """,
                (error, next_attempt_at, operation_id),
            )
            if updated.rowcount != 1:
                raise RuntimeStoreViolation(f"unknown operation_id: {operation_id}")

    def mark_outbox_failed(self, operation_id: str, error: str) -> None:
        """V1.3 compatibility: immediately replayable failed operation."""
        self.mark_outbox_retry(operation_id, error, 0.0)

    def mark_outbox_dead_letter(self, operation_id: str, error: str) -> None:
        with self.conn:
            updated = self.conn.execute(
                """
                UPDATE outbox
                SET status='DEAD_LETTER', attempts=attempts+1,
                    last_error=?, next_attempt_at=NULL,
                    updated_at=CURRENT_TIMESTAMP
                WHERE operation_id=?
                """,
                (error, operation_id),
            )
            if updated.rowcount != 1:
                raise RuntimeStoreViolation(f"unknown operation_id: {operation_id}")

    def outbox_record(self, operation_id: str) -> Optional[Dict[str, Any]]:
        row = self.conn.execute(
            """
            SELECT operation_id, event_id, operation, payload_json,
                   status, attempts, last_error, next_attempt_at
            FROM outbox WHERE operation_id=?
            """,
            (operation_id,),
        ).fetchone()
        if row is None:
            return None
        return {
            "operation_id": row["operation_id"],
            "event_id": row["event_id"],
            "operation": row["operation"],
            "payload": json.loads(row["payload_json"]),
            "status": row["status"],
            "attempts": row["attempts"],
            "last_error": row["last_error"],
            "next_attempt_at": row["next_attempt_at"],
        }

    def counts(self) -> Dict[str, int]:
        return {
            "jobs": self.conn.execute("SELECT COUNT(*) FROM jobs").fetchone()[0],
            "events": self.conn.execute(
                "SELECT COUNT(*) FROM inbound_events"
            ).fetchone()[0],
            "outbox": self.conn.execute("SELECT COUNT(*) FROM outbox").fetchone()[0],
            "pending_outbox": self.conn.execute(
                """
                SELECT COUNT(*) FROM outbox
                WHERE status IN ('PENDING', 'FAILED')
                """
            ).fetchone()[0],
            "dead_letter_outbox": self.conn.execute(
                "SELECT COUNT(*) FROM outbox WHERE status='DEAD_LETTER'"
            ).fetchone()[0],
        }
