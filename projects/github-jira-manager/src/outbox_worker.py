import time
from dataclasses import dataclass
from typing import Dict

from provider_clients import JiraClient, ProviderError
from runtime_store import RuntimeStore


@dataclass(frozen=True)
class DrainSummary:
    completed: int = 0
    retried: int = 0
    dead_lettered: int = 0


class OutboxWorker:
    def __init__(
        self,
        store: RuntimeStore,
        jira: JiraClient,
        max_attempts: int = 5,
        base_backoff_seconds: int = 30,
        max_backoff_seconds: int = 900,
        time_fn=time.time,
    ) -> None:
        self.store = store
        self.jira = jira
        self.max_attempts = max_attempts
        self.base_backoff_seconds = base_backoff_seconds
        self.max_backoff_seconds = max_backoff_seconds
        self.time_fn = time_fn

    def _dispatch(self, operation: str, payload: Dict[str, object]) -> None:
        issue = str(payload.get("work_item_id") or "")
        if not issue:
            raise ProviderError("work_item_id is required", retryable=False)

        if operation == "jira.set_status":
            self.jira.set_status(issue, str(payload["status"]))
        elif operation == "jira.add_label":
            self.jira.add_label(issue, str(payload["label"]))
        elif operation == "jira.remove_label":
            self.jira.remove_label(issue, str(payload["label"]))
        else:
            raise ProviderError(
                f"unsupported outbox operation: {operation}",
                retryable=False,
            )

    def _backoff(self, attempts_so_far: int) -> float:
        return min(
            self.base_backoff_seconds * (2 ** attempts_so_far),
            self.max_backoff_seconds,
        )

    def drain_once(self, limit: int = 100) -> DrainSummary:
        completed = retried = dead = 0
        now = self.time_fn()
        for item in self.store.pending_outbox(limit=limit, now=now):
            operation_id = item["operation_id"]
            try:
                self._dispatch(item["operation"], item["payload"])
            except ProviderError as exc:
                next_attempt_number = int(item["attempts"]) + 1
                if (not exc.retryable) or next_attempt_number >= self.max_attempts:
                    self.store.mark_outbox_dead_letter(operation_id, str(exc))
                    dead += 1
                else:
                    self.store.mark_outbox_retry(
                        operation_id,
                        str(exc),
                        now + self._backoff(int(item["attempts"])),
                    )
                    retried += 1
            else:
                self.store.mark_outbox_complete(operation_id)
                completed += 1

        return DrainSummary(completed, retried, dead)
