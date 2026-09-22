#!/usr/bin/env python3
"""Map Hermes capability changes to active repository consumers."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
SEVERITY = {"info":0,"patch":1,"minor":2,"major":3,"critical":4}
CRITICALITY = {"low":0,"medium":1,"high":2,"critical":3}


def load(rel: str) -> dict[str, Any]:
    return json.loads((ROOT / rel).read_text(encoding="utf-8"))


def action_for(severity: str, criticality: str, dependency_mode: str) -> str:
    if SEVERITY[severity] >= SEVERITY["critical"]:
        return "migration_review"
    if SEVERITY[severity] >= SEVERITY["major"]:
        return "migration_review"
    if severity == "minor":
        return "compatibility_review" if dependency_mode in {"canonical_knowledge_dependency","runtime_dependency"} else "targeted_review"
    if severity == "patch":
        return "targeted_review" if CRITICALITY[criticality] >= CRITICALITY["high"] else "advisory"
    return "none"


def compute(impact: dict[str, Any], registry: dict[str, Any] | None = None) -> dict[str, Any]:
    registry = registry or load("consumers/registry.json")
    affected = set(impact.get("affected_capabilities", []))
    severity = impact.get("severity", "info")
    matches = []

    for consumer in registry.get("consumers", []):
        if consumer.get("status") != "active":
            continue
        matched = sorted(affected.intersection(consumer.get("capability_ids", [])))
        if not matched:
            continue
        action = action_for(severity, consumer["criticality"], consumer["dependency_mode"])
        blocks_promotion = (
            action == "migration_review"
            and consumer["criticality"] in {"high","critical"}
        )
        matches.append({
            "consumer_id": consumer["id"],
            "consumer_type": consumer["type"],
            "criticality": consumer["criticality"],
            "dependency_mode": consumer["dependency_mode"],
            "matched_capabilities": matched,
            "paths": consumer["paths"],
            "recommended_action": action,
            "blocks_consumer_compatibility_clearance": blocks_promotion
        })

    matches.sort(key=lambda item: (-CRITICALITY[item["criticality"]], item["consumer_id"]))
    coverage_gap = bool(impact.get("unknown_source_ids") or impact.get("unknown_capability_ids"))

    return {
        "schema_version": "1.0.0",
        "change_id": impact.get("change_id"),
        "severity": severity,
        "affected_capabilities": sorted(affected),
        "affected_consumers": matches,
        "consumer_count": len(matches),
        "coverage_gap": coverage_gap,
        "unknown_source_ids": impact.get("unknown_source_ids", []),
        "unknown_capability_ids": impact.get("unknown_capability_ids", []),
        "requires_consumer_review": any(item["recommended_action"] not in {"none","advisory"} for item in matches),
        "blocking_consumer_ids": [
            item["consumer_id"] for item in matches
            if item["blocks_consumer_compatibility_clearance"]
        ]
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("impact_result", help="JSON output from maintenance/impact_engine.py")
    parser.add_argument("--pretty", action="store_true")
    args = parser.parse_args()
    impact = json.loads(Path(args.impact_result).read_text(encoding="utf-8"))
    result = compute(impact)
    print(json.dumps(result, indent=2 if args.pretty else None, sort_keys=True))


if __name__ == "__main__":
    main()
