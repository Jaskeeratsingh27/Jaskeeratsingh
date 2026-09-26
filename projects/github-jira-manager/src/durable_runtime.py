from dataclasses import dataclass
from typing import Dict, Optional

from control_plane import (
    ReconciliationEngine,
    ReconciliationEvent,
    ReconciliationEvidence,
)
from runtime_store import RuntimeStore
from webhooks import NormalizedWebhookEvent


@dataclass(frozen=True)
class IngestResult:
    event_id: str
    duplicate: bool
    ignored: bool
    decision: Optional[Dict[str, object]]


class DurableRuntime:
    """Persist-first reconciliation with a transactional-style outbox boundary.

    Inbound deliveries are written before decisions are produced. Side effects are
    represented as durable outbox intents and are not considered complete until an
    external worker explicitly acknowledges them.
    """

    def __init__(self, store: RuntimeStore) -> None:
        self.store = store

    def ingest(
        self,
        inbound: NormalizedWebhookEvent,
        evidence: ReconciliationEvidence,
    ) -> IngestResult:
        created = self.store.record_event(
            event_id=inbound.event_id,
            source=inbound.source,
            event_type=inbound.event_type,
            payload=inbound.payload,
            work_item_id=inbound.work_item_id,
        )
        if not created:
            return IngestResult(
                event_id=inbound.event_id,
                duplicate=True,
                ignored=False,
                decision=self.store.get_decision(inbound.event_id),
            )

        if inbound.reconciliation_event_type is None:
            self.store.mark_event_ignored(
                inbound.event_id,
                "Authenticated event retained for audit; no reconciliation action.",
            )
            return IngestResult(
                event_id=inbound.event_id,
                duplicate=False,
                ignored=True,
                decision=None,
            )

        if not inbound.work_item_id:
            self.store.mark_event_ignored(
                inbound.event_id,
                "Supported GitHub event could not be mapped to a Jira work item key.",
            )
            return IngestResult(
                event_id=inbound.event_id,
                duplicate=False,
                ignored=True,
                decision=None,
            )

        decision = ReconciliationEngine.decide(
            ReconciliationEvent(
                event_id=inbound.event_id,
                event_type=inbound.reconciliation_event_type,
            ),
            evidence,
        )
        self.store.save_decision(inbound.event_id, decision)

        if decision.desired_status is not None:
            self.store.enqueue_outbox(
                operation_id=f"{inbound.event_id}:jira-status",
                event_id=inbound.event_id,
                operation="jira.set_status",
                payload={
                    "work_item_id": inbound.work_item_id,
                    "status": decision.desired_status.value,
                    "reason": decision.reason,
                },
            )

        for label in sorted(decision.add_labels):
            self.store.enqueue_outbox(
                operation_id=f"{inbound.event_id}:jira-add-label:{label}",
                event_id=inbound.event_id,
                operation="jira.add_label",
                payload={"work_item_id": inbound.work_item_id, "label": label},
            )

        for label in sorted(decision.remove_labels):
            self.store.enqueue_outbox(
                operation_id=f"{inbound.event_id}:jira-remove-label:{label}",
                event_id=inbound.event_id,
                operation="jira.remove_label",
                payload={"work_item_id": inbound.work_item_id, "label": label},
            )

        return IngestResult(
            event_id=inbound.event_id,
            duplicate=False,
            ignored=False,
            decision=self.store.get_decision(inbound.event_id),
        )
