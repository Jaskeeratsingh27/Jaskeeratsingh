#!/usr/bin/env python3
"""Deterministic architecture-regression tests for hermes-agent-architecture."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load(rel: str):
    return json.loads((ROOT / rel).read_text(encoding="utf-8"))


def fail(message: str) -> None:
    raise SystemExit(f"FAIL: {message}")


def main() -> None:
    version = (ROOT / "VERSION").read_text(encoding="utf-8").strip()
    compatibility = load("compatibility/hermes-compatibility.json")
    routing = load("compatibility/primitive-routing.json")
    cases = load("tests/architecture-cases.json")
    sources = load("maintenance/source-manifest.json")

    if compatibility.get("skill_version") != version:
        fail("compatibility skill_version does not match VERSION")

    source_ids = {item["id"] for item in sources.get("sources", [])}
    capabilities = compatibility.get("capabilities", [])
    capability_ids = [item.get("id") for item in capabilities]
    if len(capability_ids) != len(set(capability_ids)):
        fail("duplicate compatibility capability IDs")

    for capability in capabilities:
        if capability.get("status") not in {"verified", "partial", "needs_revalidation", "unsupported"}:
            fail(f"invalid capability status for {capability.get('id')}")
        unknown = set(capability.get("source_ids", [])) - source_ids
        if unknown:
            fail(f"unknown source IDs for {capability.get('id')}: {sorted(unknown)}")

    rules = routing.get("rules", [])
    by_id = {rule["id"]: rule for rule in rules}
    if len(by_id) != len(rules):
        fail("duplicate primitive-routing rule IDs")

    required_primitives = {
        "profile",
        "delegate_task",
        "kanban",
        "skill",
        "project_context",
        "soul",
        "cron",
        "mcp",
        "execute_code",
        "sandbox",
    }
    actual_primitives = {rule.get("primitive") for rule in rules}
    missing_primitives = required_primitives - actual_primitives
    if missing_primitives:
        fail(f"missing core primitive routes: {sorted(missing_primitives)}")

    for rule in rules:
        reference = ROOT / rule["reference"]
        if not reference.exists():
            fail(f"routing rule {rule['id']} points to missing reference {rule['reference']}")

    case_list = cases.get("cases", [])
    if not case_list:
        fail("no architecture regression cases")

    seen_cases = set()
    for case in case_list:
        case_id = case["id"]
        if case_id in seen_cases:
            fail(f"duplicate regression case ID: {case_id}")
        seen_cases.add(case_id)

        rule_id = case["rule_id"]
        if rule_id not in by_id:
            fail(f"case {case_id} references unknown rule {rule_id}")
        actual = by_id[rule_id]["primitive"]
        expected = case["expected_primitive"]
        if actual != expected:
            fail(f"case {case_id}: expected {expected}, routing table gives {actual}")

    if len(case_list) < len(required_primitives):
        fail("regression suite does not cover every core primitive at least once")

    print(f"PASS: hermes-agent-architecture v{version}")
    print(f"PASS: {len(capabilities)} compatibility capabilities cross-checked")
    print(f"PASS: {len(rules)} primitive-routing rules validated")
    print(f"PASS: {len(case_list)} architecture regression cases passed")


if __name__ == "__main__":
    main()
