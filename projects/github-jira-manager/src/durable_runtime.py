from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

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
    resumed: bool
    ignored: bool
    decision: Optional[Dict[str, object]]


class DurableRuntime:
    """Persist-first reconciliation with atomic decision + outbox persistence."""

    def __init__(self, store: RuntimeStore) -> None:
        self.store = store

    @staticmethod
    def _operations(
        inbound: NormalizedWebhookEvent,
        decision,
    ) -> List[Tuple[str, str, Dict[str, object]]]:
        operations: List[Tuple[str, str, Dict[str, object]]] = []
        if decision.desired_status is not None:
            operations.append(
                (
                    f"{inbound.event_id}:jira-status",
                    "jira.set_status",
                    {
                        "work_item_id": inbound.work_item_id,
                        "status": decision.desired_status.value,
                        "reason": decision.reason,
                    },
                )
            )
        for label in sorted(decision.add_labels):
            operations.append(
                (
                    f"{inbound.event_id}:jira-add-label:{label}",
                    "jira.add_label",
                    {"work_item_id": inbound.work_item_id, "label": label},
                )
            )
        for label in sorted(decision.remove_labels):
            operations.append(
                (
                    f"{inbound.event_id}:jira-remove-label:{label}",
                    "jira.remove_label",
                    {"work_item_id": inbound.work_item_id, "label": label},
                )
            )
        return operations

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
        prior_status = self.store.event_status(inbound.event_id)
        prior_decision = self.store.get_decision(inbound.event_id)

        if not created and prior_status in {"DECIDED", "IGNORED"}:
            return IngestResult(
                event_id=inbound.event_id,
                duplicate=True,
                resumed=False,
                ignored=prior_status == "IGNORED",
                decision=prior_decision,
            )

        resumed = not created and prior_status == "RECEIVED"

        if inbound.reconciliation_event_type is None:
            self.store.mark_event_ignored(
                inbound.event_id,
                "Authenticated event retained for audit; no reconciliation action.",
            )
            return IngestResult(
                event_id=inbound.event_id,
                duplicate=not created,
                resumed=resumed,
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
                duplicate=not created,
                resumed=resumed,
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
        operations = self._operations(inbound, decision)
        self.store.persist_decision_and_outbox(
            inbound.event_id,
            decision,
            operations,
        )

        return IngestResult(
            event_id=inbound.event_id,
            duplicate=not created,
            resumed=resumed,
            ignored=False,
            decision=self.store.get_decision(inbound.event_id),
        )
