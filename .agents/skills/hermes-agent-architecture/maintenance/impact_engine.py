#!/usr/bin/env python3
"""Classify Hermes release/doc changes and compute the knowledge/test blast radius."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
SEVERITY = {"info": 0, "patch": 1, "minor": 2, "major": 3, "critical": 4}


def load(rel: str) -> dict[str, Any]:
    return json.loads((ROOT / rel).read_text(encoding="utf-8"))


def max_severity(*levels: str) -> str:
    return max(levels, key=lambda level: SEVERITY[level])


def classify(event: dict[str, Any], impact_map: dict[str, Any] | None = None) -> dict[str, Any]:
    impact_map = impact_map or load("compatibility/impact-map.json")
    source_ids = set(event.get("source_ids", []))
    explicit = set(event.get("explicit_capability_ids", []))
    change_types = set(event.get("change_types", []))

    capabilities = impact_map.get("capabilities", [])
    by_id = {item["id"]: item for item in capabilities}
    manifest = load("maintenance/source-manifest.json")
    known_source_ids = {item["id"] for item in manifest.get("sources", [])}
    unknown_sources = sorted(source_ids - known_source_ids)

    affected_ids = {
        item["id"]
        for item in capabilities
        if source_ids.intersection(item.get("source_ids", []))
    }
    affected_ids.update(explicit)
    unknown_capabilities = sorted(affected_ids - set(by_id))
    affected_ids.intersection_update(by_id)

    severity = "info"
    if change_types == {"documentation"}:
        severity = max_severity(severity, "patch")
    if event.get("stable_release_changed"):
        severity = max_severity(severity, "minor")
    if change_types.intersection({"behavior", "deprecation"}):
        severity = max_severity(severity, "minor")
    if change_types.intersection({"breaking", "architecture"}):
        severity = max_severity(severity, "major")
    if "security" in change_types:
        severity = max_severity(severity, "critical")
    if event.get("evidence_status") == "ambiguous":
        severity = max_severity(severity, "major")
    if unknown_sources or unknown_capabilities:
        severity = max_severity(severity, "major")

    affected_files: set[str] = set()
    routing_rule_ids: set[str] = set()
    regression_case_ids: set[str] = set()
    for capability_id in affected_ids:
        item = by_id[capability_id]
        affected_files.update(item.get("knowledge_files", []))
        routing_rule_ids.update(item.get("routing_rule_ids", []))
        regression_case_ids.update(item.get("regression_case_ids", []))

    review_required = (
        bool(event.get("stable_release_changed"))
        or SEVERITY[severity] >= SEVERITY["major"]
        or event.get("evidence_status") == "ambiguous"
        or bool(unknown_sources)
        or bool(unknown_capabilities)
    )
    needs_revalidation = sorted(affected_ids) if event.get("evidence_status") == "ambiguous" else []

    return {
        "change_id": event.get("change_id"),
        "severity": severity,
        "review_required": review_required,
        "stable_release_changed": bool(event.get("stable_release_changed")),
        "from_release": event.get("from_release"),
        "to_release": event.get("to_release"),
        "affected_capabilities": sorted(affected_ids),
        "affected_files": sorted(affected_files),
        "routing_rule_ids": sorted(routing_rule_ids),
        "recommended_regression_case_ids": sorted(regression_case_ids),
        "needs_revalidation": needs_revalidation,
        "unknown_source_ids": unknown_sources,
        "unknown_capability_ids": unknown_capabilities,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("event", help="Path to a JSON change-event file")
    parser.add_argument("--pretty", action="store_true")
    args = parser.parse_args()

    event = json.loads(Path(args.event).read_text(encoding="utf-8"))
    result = classify(event)
    print(json.dumps(result, indent=2 if args.pretty else None, sort_keys=True))


if __name__ == "__main__":
    main()
