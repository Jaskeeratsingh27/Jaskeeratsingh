#!/usr/bin/env python3
"""Compute deterministic freshness, drift, and health for the Hermes knowledge skill."""
from __future__ import annotations

import argparse
import json
from datetime import date
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
PRIORITY_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3}


def load(rel: str) -> dict[str, Any]:
    return json.loads((ROOT / rel).read_text(encoding="utf-8"))


def parse_date(value: str) -> date:
    return date.fromisoformat(value)


def health_state(score: float, thresholds: dict[str, Any]) -> str:
    if score >= thresholds["healthy_min"]:
        return "healthy"
    if score >= thresholds["watch_min"]:
        return "watch"
    if score >= thresholds["degraded_min"]:
        return "degraded"
    return "critical"


def strictest_priority(source_ids: list[str], priorities: dict[str, str]) -> str:
    found = [priorities[source_id] for source_id in source_ids if source_id in priorities]
    if not found:
        return "critical"
    return min(found, key=lambda item: PRIORITY_ORDER[item])


def compute(as_of: str, *, compatibility: dict[str, Any] | None = None,
            manifest: dict[str, Any] | None = None,
            policy: dict[str, Any] | None = None,
            upgrade: dict[str, Any] | None = None,
            audit_index: dict[str, Any] | None = None,
            latest_snapshot: dict[str, Any] | None = None) -> dict[str, Any]:
    compatibility = compatibility or load("compatibility/hermes-compatibility.json")
    manifest = manifest or load("maintenance/source-manifest.json")
    policy = policy or load("compatibility/freshness-policy.json")
    upgrade = upgrade or load("compatibility/upgrade-matrix.json")
    audit_index = audit_index or load("research/audits/index.json")
    latest_snapshot = latest_snapshot or load(audit_index["latest_snapshot"])

    as_of_date = parse_date(as_of)
    source_priorities = {item["id"]: item["priority"] for item in manifest.get("sources", [])}
    max_ages = policy["priority_max_age_days"]
    weights = policy["priority_weights"]
    due_ratio = float(policy["due_soon_ratio"])
    freshness_scores = policy["freshness_scores"]
    status_scores = policy["status_scores"]

    capability_results = []
    weighted_total = 0.0
    weight_total = 0.0
    stale_critical = []

    for capability in compatibility.get("capabilities", []):
        capability_id = capability["id"]
        priority = strictest_priority(capability.get("source_ids", []), source_priorities)
        max_age = int(max_ages[priority])
        verified_value = capability.get("last_verified_on")

        if verified_value:
            verified_on = parse_date(verified_value)
            age_days = (as_of_date - verified_on).days
            if age_days < 0:
                freshness = "unknown"
            elif age_days > max_age:
                freshness = "stale"
            elif age_days >= max_age * due_ratio:
                freshness = "due_soon"
            else:
                freshness = "fresh"
        else:
            age_days = None
            freshness = "unknown"

        status = capability.get("status", "needs_revalidation")
        score = min(
            int(freshness_scores.get(freshness, freshness_scores["unknown"])),
            int(status_scores.get(status, 0)),
        )
        weight = float(weights[priority])
        weighted_total += score * weight
        weight_total += weight

        if priority == "critical" and freshness == "stale":
            stale_critical.append(capability_id)

        capability_results.append({
            "id": capability_id,
            "status": status,
            "priority": priority,
            "last_verified_on": verified_value,
            "age_days": age_days,
            "max_age_days": max_age,
            "freshness": freshness,
            "score": score,
        })

    capability_score = round(weighted_total / weight_total, 1) if weight_total else 0.0

    audit_date = parse_date(audit_index["latest_audit_date"])
    audit_age = (as_of_date - audit_date).days
    cadence = policy["audit_cadence"]
    if audit_age < 0:
        audit_freshness = "unknown"
        audit_score = 20
    elif audit_age > int(cadence["max_age_days"]):
        audit_freshness = "stale"
        audit_score = 40
    elif audit_age >= int(cadence["due_soon_after_days"]):
        audit_freshness = "due_soon"
        audit_score = 80
    else:
        audit_freshness = "fresh"
        audit_score = 100

    score = round(capability_score * 0.85 + audit_score * 0.15, 1)
    drift_signals = []

    revalidation = sorted(set(compatibility.get("needs_revalidation", [])) | {
        item["id"] for item in compatibility.get("capabilities", [])
        if item.get("status") == "needs_revalidation"
    })
    if revalidation:
        drift_signals.append({"type":"needs_revalidation","severity":"major","capabilities":revalidation})
        score = min(score, 74.0)

    candidate = upgrade.get("next_upgrade", {}).get("candidate_release")
    if candidate:
        drift_signals.append({"type":"pending_upgrade","severity":"minor","candidate_release":candidate})
        score = min(score, 74.0)

    observed_release = latest_snapshot.get("observed_hermes_release")
    baseline_release = compatibility.get("hermes", {}).get("stable_release")
    if observed_release != baseline_release:
        drift_signals.append({
            "type":"release_baseline_mismatch",
            "severity":"major",
            "observed_release":observed_release,
            "baseline_release":baseline_release,
        })
        score = min(score, 49.0)

    if audit_freshness == "stale":
        drift_signals.append({"type":"audit_stale","severity":"major","audit_age_days":audit_age})
        score = min(score, 74.0)

    if stale_critical:
        drift_signals.append({"type":"critical_capability_stale","severity":"major","capabilities":sorted(stale_critical)})
        score = min(score, 74.0)

    thresholds = policy["health_thresholds"]
    return {
        "schema_version": "1.0.0",
        "as_of": as_of,
        "skill_version": compatibility.get("skill_version"),
        "hermes_baseline": baseline_release,
        "overall_score": score,
        "health_state": health_state(score, thresholds),
        "capability_score": capability_score,
        "audit": {
            "latest_audit_date": audit_index["latest_audit_date"],
            "age_days": audit_age,
            "freshness": audit_freshness,
            "score": audit_score,
        },
        "capabilities": capability_results,
        "drift_signals": drift_signals,
        "summary": {
            "fresh": sum(1 for item in capability_results if item["freshness"] == "fresh"),
            "due_soon": sum(1 for item in capability_results if item["freshness"] == "due_soon"),
            "stale": sum(1 for item in capability_results if item["freshness"] == "stale"),
            "unknown": sum(1 for item in capability_results if item["freshness"] == "unknown"),
            "needs_revalidation": len(revalidation),
            "drift_signal_count": len(drift_signals),
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--as-of", required=True, help="ISO date (YYYY-MM-DD)")
    parser.add_argument("--output", help="Optional output JSON path")
    args = parser.parse_args()

    result = compute(args.as_of)
    rendered = json.dumps(result, indent=2, sort_keys=True) + "\n"
    if args.output:
        Path(args.output).write_text(rendered, encoding="utf-8")
    else:
        print(rendered, end="")


if __name__ == "__main__":
    main()
