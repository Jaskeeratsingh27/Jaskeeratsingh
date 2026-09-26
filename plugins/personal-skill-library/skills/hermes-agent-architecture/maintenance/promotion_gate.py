#!/usr/bin/env python3
"""Resolve Hermes maintenance signals into deterministic promotion/clearance decisions."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

VALIDATION_GATES = (
    "structural",
    "architecture",
    "release_impact",
    "health_drift",
    "consumer_impact",
    "consumer_drift",
    "end_to_end",
)


def _validation_failures(validation: dict[str, str]) -> list[str]:
    return sorted(
        gate for gate in VALIDATION_GATES
        if validation.get(gate, "not_run") != "passed"
    )


def _approval(bundle: dict[str, Any]) -> tuple[bool, dict[str, Any]]:
    approval = bundle.get("approval") or {}
    proposal_id = bundle.get("proposal_id")
    valid = (
        approval.get("approved") is True
        and approval.get("scope") == "full_upgrade"
        and bool(approval.get("approved_by"))
        and bool(approval.get("approved_at"))
        and (proposal_id is None or approval.get("proposal_id") == proposal_id)
    )
    return valid, approval


def decide(bundle: dict[str, Any]) -> dict[str, Any]:
    impact = bundle.get("impact") or {}
    consumer = bundle.get("consumer_impact") or {}
    health = bundle.get("health") or {}
    drift = bundle.get("consumer_drift") or {}
    validation = bundle.get("validation") or {}
    approval_valid, approval = _approval(bundle)

    knowledge_blockers: list[str] = []
    knowledge_review: list[str] = []
    ecosystem_blockers: list[str] = []
    ecosystem_review: list[str] = []

    failed_gates = _validation_failures(validation)
    if failed_gates:
        knowledge_blockers.append("validation_failed:" + ",".join(failed_gates))
        ecosystem_blockers.append("validation_failed:" + ",".join(failed_gates))

    if impact.get("unknown_source_ids") or impact.get("unknown_capability_ids"):
        knowledge_blockers.append("impact_coverage_gap")

    if impact.get("needs_revalidation"):
        knowledge_blockers.append("unresolved_capability_revalidation")

    if drift.get("drift_detected"):
        knowledge_blockers.append("consumer_registry_drift")
        ecosystem_blockers.append("consumer_registry_drift")

    health_state = health.get("health_state")
    if health_state == "critical":
        knowledge_blockers.append("knowledge_health_critical")
        ecosystem_blockers.append("knowledge_health_critical")
    elif health_state in {"degraded", "watch"}:
        knowledge_review.append(f"knowledge_health_{health_state}")

    # Explicit approval satisfies policy review for a verified upgrade, but never
    # validation, ambiguity, freshness, coverage, or migration blockers.
    if impact.get("review_required") and not approval_valid:
        knowledge_review.append("impact_review_required")
    if impact.get("stable_release_changed") and not approval_valid:
        knowledge_review.append("stable_release_transition")

    raw_blocking_consumers = set(consumer.get("blocking_consumer_ids", []))
    cleared_consumers = set()
    if approval_valid and approval.get("consumer_migrations_verified") is True:
        cleared_consumers = set(approval.get("cleared_consumer_ids", []))
    blocking_consumers = sorted(raw_blocking_consumers - cleared_consumers)

    if consumer.get("requires_consumer_review") and not approval_valid:
        ecosystem_review.append("consumer_review_required")

    if blocking_consumers:
        ecosystem_blockers.append(
            "consumer_compatibility_blocked:" + ",".join(blocking_consumers)
        )

    if consumer.get("coverage_gap"):
        ecosystem_blockers.append("consumer_impact_coverage_gap")

    drift_signals = {item.get("type") for item in health.get("drift_signals", [])}
    if "needs_revalidation" in drift_signals:
        knowledge_blockers.append("health_reports_needs_revalidation")
    if "release_baseline_mismatch" in drift_signals:
        knowledge_review.append("release_baseline_mismatch")
    if "pending_upgrade" in drift_signals:
        knowledge_review.append("pending_upgrade")
    if "audit_stale" in drift_signals:
        knowledge_review.append("audit_stale")
    if "critical_capability_stale" in drift_signals:
        knowledge_review.append("critical_capability_stale")

    knowledge_blockers = sorted(set(knowledge_blockers))
    knowledge_review = sorted(set(knowledge_review))
    ecosystem_blockers = sorted(set(ecosystem_blockers))
    ecosystem_review = sorted(set(ecosystem_review))

    if knowledge_blockers:
        knowledge_state = "blocked"
    elif knowledge_review:
        knowledge_state = "review_required"
    else:
        knowledge_state = "allow"

    if ecosystem_blockers:
        ecosystem_state = "blocked"
    elif ecosystem_review or knowledge_state != "allow":
        ecosystem_state = "review_required"
    else:
        ecosystem_state = "cleared"

    overall_state = (
        "blocked"
        if knowledge_state == "blocked" or ecosystem_state == "blocked"
        else "review_required"
        if knowledge_state == "review_required" or ecosystem_state == "review_required"
        else "allow"
    )

    return {
        "schema_version": "1.1.0",
        "proposal_id": bundle.get("proposal_id"),
        "approval": {
            "valid": approval_valid,
            "approved_by": approval.get("approved_by"),
            "approved_at": approval.get("approved_at"),
            "consumer_migrations_verified": bool(
                approval_valid and approval.get("consumer_migrations_verified") is True
            ),
            "cleared_consumer_ids": sorted(cleared_consumers),
        },
        "overall_state": overall_state,
        "knowledge_promotion": {
            "state": knowledge_state,
            "blockers": knowledge_blockers,
            "review_reasons": knowledge_review,
        },
        "ecosystem_compatibility": {
            "state": ecosystem_state,
            "blockers": ecosystem_blockers,
            "review_reasons": ecosystem_review,
            "blocking_consumer_ids": blocking_consumers,
        },
        "failed_validation_gates": failed_gates,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("bundle", help="JSON bundle containing impact/consumer/health/drift/validation/approval")
    parser.add_argument("--pretty", action="store_true")
    args = parser.parse_args()
    payload = json.loads(Path(args.bundle).read_text(encoding="utf-8"))
    result = decide(payload)
    print(json.dumps(result, indent=2 if args.pretty else None, sort_keys=True))


if __name__ == "__main__":
    main()
