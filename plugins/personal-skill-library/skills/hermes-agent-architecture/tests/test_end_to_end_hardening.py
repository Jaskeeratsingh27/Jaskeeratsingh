#!/usr/bin/env python3
"""End-to-end hardening simulations for the Hermes knowledge-control system."""
from __future__ import annotations

import copy
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load(rel: str):
    return json.loads((ROOT / rel).read_text(encoding="utf-8"))


def module(name: str, rel: str):
    path = ROOT / rel
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(mod)
    return mod


impact_engine = module("hardening_impact", "maintenance/impact_engine.py")
consumer_engine = module("hardening_consumer", "maintenance/consumer_impact.py")
health_engine = module("hardening_health", "maintenance/health_engine.py")
promotion_gate = module("hardening_promotion", "maintenance/promotion_gate.py")


def fail(message: str) -> None:
    raise SystemExit(f"FAIL: {message}")


def all_validation(failures: list[str]) -> dict[str, str]:
    gates = [
        "structural", "architecture", "release_impact", "health_drift",
        "consumer_impact", "consumer_drift", "end_to_end",
    ]
    return {gate: ("failed" if gate in failures else "passed") for gate in gates}


def main() -> None:
    scenarios = load("tests/hardening-scenarios.json").get("scenarios", [])
    compatibility_base = load("compatibility/hermes-compatibility.json")
    upgrade_base = load("compatibility/upgrade-matrix.json")
    audit_index_base = load("research/audits/index.json")
    snapshot_base = load(audit_index_base["latest_snapshot"])

    if not scenarios:
        fail("no hardening scenarios")

    for scenario in scenarios:
        compatibility = copy.deepcopy(compatibility_base)
        upgrade = copy.deepcopy(upgrade_base)
        audit_index = copy.deepcopy(audit_index_base)
        snapshot = copy.deepcopy(snapshot_base)
        mutations = scenario.get("mutations", {})

        if "needs_revalidation" in mutations:
            compatibility["needs_revalidation"] = mutations["needs_revalidation"]
            for item in compatibility["capabilities"]:
                if item["id"] in mutations["needs_revalidation"]:
                    item["status"] = "needs_revalidation"

        if "verified_on" in mutations:
            for item in compatibility["capabilities"]:
                item["last_verified_on"] = mutations["verified_on"]

        if "candidate_release" in mutations:
            upgrade["next_upgrade"]["candidate_release"] = mutations["candidate_release"]
            upgrade["next_upgrade"]["status"] = (
                "candidate_detected" if mutations["candidate_release"] else "none_detected"
            )

        if "audit_date" in mutations:
            audit_index["latest_audit_date"] = mutations["audit_date"]
            snapshot["audit_date"] = mutations["audit_date"]

        if "observed_release" in mutations:
            snapshot["observed_hermes_release"] = mutations["observed_release"]

        event = scenario.get("event")
        impact = impact_engine.classify(event) if event else {
            "change_id": None,
            "severity": "info",
            "review_required": False,
            "stable_release_changed": False,
            "affected_capabilities": [],
            "affected_files": [],
            "routing_rule_ids": [],
            "recommended_regression_case_ids": [],
            "needs_revalidation": [],
            "unknown_source_ids": [],
            "unknown_capability_ids": [],
        }

        consumer = consumer_engine.compute(impact)
        health = health_engine.compute(
            scenario["as_of"],
            compatibility=compatibility,
            upgrade=upgrade,
            audit_index=audit_index,
            latest_snapshot=snapshot,
        )
        drift = {
            "drift_detected": bool(scenario.get("consumer_drift")),
            "finding_count": 1 if scenario.get("consumer_drift") else 0,
            "findings": [{"type": "simulated"}] if scenario.get("consumer_drift") else [],
        }

        bundle = {
            "proposal_id": scenario.get("proposal_id"),
            "impact": impact,
            "consumer_impact": consumer,
            "health": health,
            "consumer_drift": drift,
            "validation": all_validation(scenario.get("validation_failures", [])),
            "approval": scenario.get("approval"),
        }
        decision = promotion_gate.decide(bundle)
        expected = scenario["expected"]

        if decision["overall_state"] != expected["overall_state"]:
            fail(f"{scenario['id']}: overall expected {expected['overall_state']}, got {decision['overall_state']}")
        if decision["knowledge_promotion"]["state"] != expected["knowledge_state"]:
            fail(f"{scenario['id']}: knowledge expected {expected['knowledge_state']}, got {decision['knowledge_promotion']['state']}")
        if decision["ecosystem_compatibility"]["state"] != expected["ecosystem_state"]:
            fail(f"{scenario['id']}: ecosystem expected {expected['ecosystem_state']}, got {decision['ecosystem_compatibility']['state']}")

        if "consumer_ids" in expected:
            ids = sorted(item["consumer_id"] for item in consumer["affected_consumers"])
            if ids != sorted(expected["consumer_ids"]):
                fail(f"{scenario['id']}: consumers expected {expected['consumer_ids']}, got {ids}")

        if "blocking_consumer_ids" in expected:
            if decision["ecosystem_compatibility"]["blocking_consumer_ids"] != expected["blocking_consumer_ids"]:
                fail(
                    f"{scenario['id']}: blocking consumers expected "
                    f"{expected['blocking_consumer_ids']}, got "
                    f"{decision['ecosystem_compatibility']['blocking_consumer_ids']}"
                )

    print(f"PASS: {len(scenarios)} end-to-end hardening simulations")
    print("PASS: upgrade, approval, consumer clearance, security, ambiguity, unknown subsystem, staleness, registry drift, CI failure, and recovery")


if __name__ == "__main__":
    main()
