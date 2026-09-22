#!/usr/bin/env python3
"""Regression tests for Hermes consumer dependency drift detection."""
from __future__ import annotations

import importlib.util
import json
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENGINE_PATH = ROOT / "maintenance" / "consumer_drift.py"


def fail(message: str) -> None:
    raise SystemExit(f"FAIL: {message}")


spec = importlib.util.spec_from_file_location("hermes_consumer_drift", ENGINE_PATH)
module = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(module)


def types(result):
    return sorted(item["type"] for item in result["findings"])


def base_rules():
    return {
        "scan_roots":[".agents/skills"],
        "file_extensions":[".md"],
        "candidate_markers":["Hermes runtime","delegate_task"],
        "capability_patterns":{
            "profiles":["Hermes Profile"],
            "delegation":["delegate_task"]
        },
        "candidate_policy":{
            "minimum_marker_matches":1,
            "minimum_capability_matches":1,
            "new_candidate_requires_review":True,
            "never_auto_register":True,
            "never_auto_remove":True
        }
    }


def main() -> None:
    # The canonical repository should start v1.5 with no unresolved dependency drift.
    baseline = module.scan()
    if baseline["drift_detected"]:
        fail(f"canonical repository unexpectedly has consumer drift: {baseline['findings']}")

    with tempfile.TemporaryDirectory() as tmp:
        repo = Path(tmp)
        skill = repo / ".agents/skills/example"
        skill.mkdir(parents=True)
        (skill / "SKILL.md").write_text("Hermes runtime\ndelegate_task\n", encoding="utf-8")

        registry = {
            "schema_version":"test",
            "ignored_path_prefixes":[".agents/skills/hermes-agent-architecture/"],
            "consumers":[]
        }
        result = module.scan(repo, registry, base_rules())
        if types(result) != ["candidate_unregistered_consumer"]:
            fail(f"candidate consumer scenario returned {result['findings']}")

    with tempfile.TemporaryDirectory() as tmp:
        repo = Path(tmp)
        skill = repo / ".agents/skills/example"
        skill.mkdir(parents=True)
        (skill / "SKILL.md").write_text("Hermes Profile\n", encoding="utf-8")
        registry = {
            "schema_version":"test",
            "ignored_path_prefixes":[],
            "consumers":[{
                "id":"example","type":"skill","status":"active","criticality":"medium",
                "dependency_mode":"runtime_dependency",
                "paths":[".agents/skills/example/SKILL.md"],
                "capability_ids":["profiles"],
                "evidence_assertions":[{
                    "id":"profile-proof",
                    "path":".agents/skills/example/SKILL.md",
                    "patterns":["missing proof"],
                    "capability_ids":["profiles"],
                    "mode":"any_pattern"
                }],
                "rationale":"test"
            }]
        }
        result = module.scan(repo, registry, base_rules())
        expected = ["registered_capability_without_evidence","registered_evidence_missing"]
        if types(result) != expected:
            fail(f"missing evidence scenario returned {result['findings']}")

    with tempfile.TemporaryDirectory() as tmp:
        repo = Path(tmp)
        skill = repo / ".agents/skills/example"
        skill.mkdir(parents=True)
        (skill / "SKILL.md").write_text("Hermes Profile\ndelegate_task\n", encoding="utf-8")
        registry = {
            "schema_version":"test",
            "ignored_path_prefixes":[],
            "consumers":[{
                "id":"example","type":"skill","status":"active","criticality":"medium",
                "dependency_mode":"runtime_dependency",
                "paths":[".agents/skills/example/SKILL.md"],
                "capability_ids":["profiles"],
                "evidence_assertions":[{
                    "id":"profile-proof",
                    "path":".agents/skills/example/SKILL.md",
                    "patterns":["Hermes Profile"],
                    "capability_ids":["profiles"],
                    "mode":"any_pattern"
                }],
                "rationale":"test"
            }]
        }
        result = module.scan(repo, registry, base_rules())
        if types(result) != ["unregistered_capability_dependency"]:
            fail(f"undeclared capability scenario returned {result['findings']}")
        finding = result["findings"][0]
        if finding["capability_ids"] != ["delegation"]:
            fail(f"undeclared capability expected delegation, got {finding}")

    print("PASS: canonical repository has zero consumer dependency drift")
    print("PASS: candidate consumer, missing evidence, and undeclared capability scenarios")


if __name__ == "__main__":
    main()
