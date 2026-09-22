#!/usr/bin/env python3
"""Regression tests for Hermes knowledge freshness and drift health."""
from __future__ import annotations

import copy
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENGINE_PATH = ROOT / "maintenance" / "health_engine.py"


def load(rel: str):
    return json.loads((ROOT / rel).read_text(encoding="utf-8"))


def fail(message: str) -> None:
    raise SystemExit(f"FAIL: {message}")


spec = importlib.util.spec_from_file_location("hermes_health_engine", ENGINE_PATH)
module = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(module)


def signal_types(result):
    return sorted(item["type"] for item in result.get("drift_signals", []))


def main() -> None:
    cases = load("tests/health-drift-cases.json").get("cases", [])
    if not cases:
        fail("no health/drift regression cases")

    base_compatibility = load("compatibility/hermes-compatibility.json")
    base_upgrade = load("compatibility/upgrade-matrix.json")
    audit_index = load("research/audits/index.json")
    base_snapshot = load(audit_index["latest_snapshot"])

    for case in cases:
        compatibility = copy.deepcopy(base_compatibility)
        upgrade = copy.deepcopy(base_upgrade)
        snapshot = copy.deepcopy(base_snapshot)
        mutations = case.get("mutations", {})

        if "needs_revalidation" in mutations:
            compatibility["needs_revalidation"] = mutations["needs_revalidation"]
        if "candidate_release" in mutations:
            upgrade["next_upgrade"]["candidate_release"] = mutations["candidate_release"]
            upgrade["next_upgrade"]["status"] = "candidate_detected"
        if "observed_hermes_release" in mutations:
            snapshot["observed_hermes_release"] = mutations["observed_hermes_release"]

        result = module.compute(
            case["as_of"],
            compatibility=compatibility,
            upgrade=upgrade,
            audit_index=audit_index,
            latest_snapshot=snapshot,
        )
        expected = case["expected"]

        if "health_state" in expected and result["health_state"] != expected["health_state"]:
            fail(f"{case['id']}: health_state expected {expected['health_state']}, got {result['health_state']}")
        if "overall_score" in expected and result["overall_score"] != expected["overall_score"]:
            fail(f"{case['id']}: score expected {expected['overall_score']}, got {result['overall_score']}")
        if "audit_freshness" in expected and result["audit"]["freshness"] != expected["audit_freshness"]:
            fail(f"{case['id']}: audit freshness expected {expected['audit_freshness']}, got {result['audit']['freshness']}")
        if result["summary"]["stale"] < expected.get("minimum_stale", 0):
            fail(f"{case['id']}: expected at least {expected['minimum_stale']} stale capabilities")
        if result["summary"]["due_soon"] < expected.get("minimum_due_soon", 0):
            fail(f"{case['id']}: expected at least {expected['minimum_due_soon']} due-soon capabilities")
        expected_signals = sorted(expected.get("drift_signal_types", []))
        if signal_types(result) != expected_signals:
            fail(f"{case['id']}: drift signals expected {expected_signals}, got {signal_types(result)}")

    print(f"PASS: {len(cases)} health/drift scenarios")
    print("PASS: freshness aging, audit cadence, revalidation, upgrade, release mismatch, and health thresholds")


if __name__ == "__main__":
    main()
