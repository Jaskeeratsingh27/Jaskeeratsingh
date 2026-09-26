#!/usr/bin/env python3
"""Deterministic structural validation for the hermes-agent-architecture skill."""
from __future__ import annotations

import json
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def fail(message: str) -> None:
    raise SystemExit(f"FAIL: {message}")


def load_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        fail(f"invalid JSON in {path.relative_to(ROOT)}: {exc}")


def parse_date(value: str, label: str) -> None:
    try:
        date.fromisoformat(value)
    except Exception as exc:
        fail(f"invalid date for {label}: {value!r}: {exc}")


def main() -> None:
    skill = ROOT / "SKILL.md"
    if not skill.exists():
        fail("SKILL.md missing")

    text = skill.read_text(encoding="utf-8")
    if not text.startswith("---\n") or "\n---\n" not in text[4:]:
        fail("SKILL.md frontmatter is missing or malformed")

    version = (ROOT / "VERSION").read_text(encoding="utf-8").strip()
    if not re.fullmatch(r"\d+\.\d+\.\d+", version):
        fail(f"VERSION is not semver: {version!r}")
    if f"version: {version}" not in text:
        fail("SKILL.md version does not match VERSION")

    json_files = (
        list((ROOT / "templates").glob("*.json"))
        + list((ROOT / "compatibility").glob("*.json"))
        + [
            ROOT / "maintenance" / "source-manifest.json",
            ROOT / "maintenance" / "change-event.schema.json",
            ROOT / "maintenance" / "audit-snapshot.schema.json",
            ROOT / "maintenance" / "upgrade-proposal.schema.json",
            ROOT / "maintenance" / "approval-record.schema.json",
            ROOT / "tests" / "architecture-cases.json",
            ROOT / "tests" / "release-impact-cases.json",
            ROOT / "tests" / "health-drift-cases.json",
            ROOT / "maintenance" / "consumer-registry.schema.json",
            ROOT / "consumers" / "registry.json",
            ROOT / "tests" / "consumer-impact-cases.json",
            ROOT / "consumers" / "detection-rules.json",
            ROOT / "maintenance" / "consumer-drift-snapshot.schema.json",
            ROOT / "research" / "consumer-drift" / "index.json",
            ROOT / "tests" / "hardening-scenarios.json",
            ROOT / "research" / "audits" / "index.json",
            ROOT / "research" / "health" / "index.json",
        ]
    )
    parsed = {path: load_json(path) for path in json_files}

    manifest_path = ROOT / "maintenance" / "source-manifest.json"
    manifest = parsed[manifest_path]
    sources = manifest.get("sources", [])
    if not sources:
        fail("source manifest has no sources")

    ids = [s.get("id") for s in sources]
    if len(ids) != len(set(ids)):
        fail("source manifest contains duplicate IDs")
    source_ids = set(ids)
    source_priorities = {}

    for source in sources:
        priority = source.get("priority")
        if priority not in {"critical", "high", "medium", "low"}:
            fail(f"invalid source priority for {source.get('id')}")
        source_priorities[source["id"]] = priority
        if not str(source.get("url", "")).startswith("https://"):
            fail(f"source URL is not HTTPS for {source.get('id')}")

    compatibility = parsed[ROOT / "compatibility" / "hermes-compatibility.json"]
    if compatibility.get("skill_version") != version:
        fail("compatibility/hermes-compatibility.json skill_version does not match VERSION")
    if compatibility.get("hermes", {}).get("source_id") not in source_ids:
        fail("compatibility Hermes release source_id is missing from source manifest")

    capability_list = compatibility.get("capabilities", [])
    capability_ids = {item.get("id") for item in capability_list}
    if None in capability_ids:
        fail("compatibility capability missing ID")
    if len(capability_ids) != len(capability_list):
        fail("duplicate compatibility capability IDs")

    for capability in capability_list:
        unknown = set(capability.get("source_ids", [])) - source_ids
        if unknown:
            fail(f"compatibility capability {capability.get('id')} uses unknown sources: {sorted(unknown)}")
        verified_on = capability.get("last_verified_on")
        if not verified_on:
            fail(f"capability {capability.get('id')} is missing last_verified_on")
        parse_date(verified_on, f"{capability.get('id')}.last_verified_on")

    routing = parsed[ROOT / "compatibility" / "primitive-routing.json"]
    routing_rule_ids = {rule.get("id") for rule in routing.get("rules", [])}
    for rule in routing.get("rules", []):
        reference = ROOT / rule.get("reference", "")
        if not reference.exists():
            fail(f"routing rule {rule.get('id')} points to missing reference")

    architecture_cases = parsed[ROOT / "tests" / "architecture-cases.json"].get("cases", [])
    architecture_case_ids = {case.get("id") for case in architecture_cases}

    impact = parsed[ROOT / "compatibility" / "impact-map.json"]
    impact_ids = [item.get("id") for item in impact.get("capabilities", [])]
    if len(impact_ids) != len(set(impact_ids)):
        fail("impact map contains duplicate capability IDs")
    if set(impact_ids) != capability_ids:
        fail("impact map capability IDs do not exactly match compatibility capability IDs")

    for item in impact.get("capabilities", []):
        unknown_sources = set(item.get("source_ids", [])) - source_ids
        if unknown_sources:
            fail(f"impact capability {item.get('id')} uses unknown sources: {sorted(unknown_sources)}")
        unknown_routes = set(item.get("routing_rule_ids", [])) - routing_rule_ids
        if unknown_routes:
            fail(f"impact capability {item.get('id')} uses unknown routing rules: {sorted(unknown_routes)}")
        unknown_cases = set(item.get("regression_case_ids", [])) - architecture_case_ids
        if unknown_cases:
            fail(f"impact capability {item.get('id')} uses unknown architecture cases: {sorted(unknown_cases)}")
        for rel in item.get("knowledge_files", []):
            if not (ROOT / rel).exists():
                fail(f"impact capability {item.get('id')} points to missing knowledge file {rel}")

    upgrade = parsed[ROOT / "compatibility" / "upgrade-matrix.json"]
    if upgrade.get("skill_version") != version:
        fail("compatibility/upgrade-matrix.json skill_version does not match VERSION")
    if upgrade.get("current_baseline", {}).get("hermes_release") != compatibility.get("hermes", {}).get("stable_release"):
        fail("upgrade matrix Hermes release does not match compatibility baseline")

    freshness = parsed[ROOT / "compatibility" / "freshness-policy.json"]
    priority_names = {"critical", "high", "medium", "low"}
    if set(freshness.get("priority_max_age_days", {})) != priority_names:
        fail("freshness policy priority_max_age_days must define critical/high/medium/low")
    if set(freshness.get("priority_weights", {})) != priority_names:
        fail("freshness policy priority_weights must define critical/high/medium/low")
    due_ratio = freshness.get("due_soon_ratio")
    if not isinstance(due_ratio, (int, float)) or not (0 < due_ratio < 1):
        fail("freshness due_soon_ratio must be between 0 and 1")

    thresholds = freshness.get("health_thresholds", {})
    if not (
        thresholds.get("healthy_min", 0)
        > thresholds.get("watch_min", 0)
        > thresholds.get("degraded_min", 0)
        >= 0
    ):
        fail("health thresholds must descend healthy > watch > degraded")

    release_cases = parsed[ROOT / "tests" / "release-impact-cases.json"].get("cases", [])
    if not release_cases:
        fail("release-impact regression fixtures are missing")
    for case in release_cases:
        explicit = set(case.get("event", {}).get("explicit_capability_ids", []))
        unknown_explicit = explicit - capability_ids
        if unknown_explicit:
            fail(f"release-impact case {case.get('id')} uses unknown explicit capabilities: {sorted(unknown_explicit)}")

    health_cases = parsed[ROOT / "tests" / "health-drift-cases.json"].get("cases", [])
    if not health_cases:
        fail("health/drift regression fixtures are missing")

    consumer_registry = parsed[ROOT / "consumers" / "registry.json"]
    consumers = consumer_registry.get("consumers", [])
    consumer_ids = [item.get("id") for item in consumers]
    if len(consumer_ids) != len(set(consumer_ids)):
        fail("consumer registry contains duplicate consumer IDs")
    ignored_prefixes = tuple(consumer_registry.get("ignored_path_prefixes", []))
    for consumer in consumers:
        unknown_capabilities = set(consumer.get("capability_ids", [])) - capability_ids
        if unknown_capabilities:
            fail(f"consumer {consumer.get('id')} uses unknown capability IDs: {sorted(unknown_capabilities)}")
        for rel in consumer.get("paths", []):
            if ignored_prefixes and rel.startswith(ignored_prefixes):
                fail(f"active consumer {consumer.get('id')} uses ignored/archive path: {rel}")
            if not (ROOT.parents[2] / rel).exists():
                fail(f"consumer {consumer.get('id')} points to missing canonical path: {rel}")

    consumer_cases = parsed[ROOT / "tests" / "consumer-impact-cases.json"].get("cases", [])
    if not consumer_cases:
        fail("consumer-impact regression fixtures are missing")

    hardening_scenarios = parsed[ROOT / "tests" / "hardening-scenarios.json"].get("scenarios", [])
    if not hardening_scenarios:
        fail("end-to-end hardening scenarios are missing")
    hardening_ids = [item.get("id") for item in hardening_scenarios]
    if len(hardening_ids) != len(set(hardening_ids)):
        fail("end-to-end hardening scenarios contain duplicate IDs")

    detection_rules = parsed[ROOT / "consumers" / "detection-rules.json"]
    pattern_capabilities = set(detection_rules.get("capability_patterns", {}))
    if pattern_capabilities != capability_ids:
        fail("consumer detection-rule capability IDs do not exactly match compatibility capabilities")

    for consumer in consumers:
        assertion_ids = [a.get("id") for a in consumer.get("evidence_assertions", [])]
        if len(assertion_ids) != len(set(assertion_ids)):
            fail(f"consumer {consumer.get('id')} has duplicate evidence assertion IDs")
        declared = set(consumer.get("capability_ids", []))
        evidenced = set()
        for assertion in consumer.get("evidence_assertions", []):
            if assertion.get("path") not in consumer.get("paths", []):
                fail(f"consumer {consumer.get('id')} evidence path is not registered in consumer paths: {assertion.get('path')}")
            unknown_assertion_caps = set(assertion.get("capability_ids", [])) - declared
            if unknown_assertion_caps:
                fail(f"consumer {consumer.get('id')} evidence assertion uses undeclared capabilities: {sorted(unknown_assertion_caps)}")
            evidenced.update(assertion.get("capability_ids", []))
        if evidenced != declared:
            fail(f"consumer {consumer.get('id')} evidence assertions do not cover exactly its declared capabilities")

    audit_index = parsed[ROOT / "research" / "audits" / "index.json"]
    parse_date(audit_index.get("latest_audit_date", ""), "audit_index.latest_audit_date")
    latest_snapshot_rel = audit_index.get("latest_snapshot")
    if not latest_snapshot_rel or not (ROOT / latest_snapshot_rel).exists():
        fail("audit index latest_snapshot is missing")
    latest_snapshot = load_json(ROOT / latest_snapshot_rel)
    if latest_snapshot.get("audit_date") != audit_index.get("latest_audit_date"):
        fail("audit index latest_audit_date does not match latest snapshot")
    snapshot_ids = {item.get("id") for item in latest_snapshot.get("capability_results", [])}
    if snapshot_ids != capability_ids:
        fail("latest audit snapshot capability IDs do not match compatibility capability IDs")

    audit_paths = []
    for entry in audit_index.get("snapshots", []):
        rel = entry.get("path")
        if not rel or not (ROOT / rel).exists():
            fail(f"audit history points to missing snapshot: {rel}")
        audit_paths.append(rel)
    if len(audit_paths) != len(set(audit_paths)):
        fail("audit history contains duplicate snapshot paths")

    drift_index = parsed[ROOT / "research" / "consumer-drift" / "index.json"]
    parse_date(drift_index.get("latest_scan_date", ""), "consumer_drift_index.latest_scan_date")
    latest_drift_rel = drift_index.get("latest_snapshot")
    if not latest_drift_rel or not (ROOT / latest_drift_rel).exists():
        fail("consumer drift index latest_snapshot is missing")
    latest_drift = load_json(ROOT / latest_drift_rel)
    if latest_drift.get("scan_date") != drift_index.get("latest_scan_date"):
        fail("consumer drift index latest_scan_date does not match latest snapshot")
    drift_paths = []
    for entry in drift_index.get("snapshots", []):
        rel = entry.get("path")
        if not rel or not (ROOT / rel).exists():
            fail(f"consumer drift history points to missing snapshot: {rel}")
        drift_paths.append(rel)
    if len(drift_paths) != len(set(drift_paths)):
        fail("consumer drift history contains duplicate snapshot paths")

    health_index = parsed[ROOT / "research" / "health" / "index.json"]
    parse_date(health_index.get("latest_health_date", ""), "health_index.latest_health_date")
    latest_health_rel = health_index.get("latest_report")
    if not latest_health_rel or not (ROOT / latest_health_rel).exists():
        fail("health index latest_report is missing")
    latest_health = load_json(ROOT / latest_health_rel)
    if latest_health.get("as_of") != health_index.get("latest_health_date"):
        fail("health index latest_health_date does not match latest report")

    health_paths = []
    for entry in health_index.get("reports", []):
        rel = entry.get("path")
        if not rel or not (ROOT / rel).exists():
            fail(f"health history points to missing report: {rel}")
        health_paths.append(rel)
    if len(health_paths) != len(set(health_paths)):
        fail("health history contains duplicate report paths")

    candidates = re.findall(
        r"`((?:references|templates|maintenance|research|tests|compatibility|consumers)/[^`]+|VERSION|CHANGELOG\.md|README\.md)`",
        text,
    )
    missing = [p for p in candidates if not (ROOT / p).exists()]
    if missing:
        fail("missing referenced paths: " + ", ".join(sorted(set(missing))))

    required = [
        "references/00-architecture-map.md",
        "references/11-production-checklist.md",
        "references/13-source-index.md",
        "references/14-release-impact-engine.md",
        "references/15-knowledge-health-drift.md",
        "maintenance/weekly-refresh-spec.md",
        "maintenance/weekly-refresh-prompt.md",
        "maintenance/source-manifest.json",
        "maintenance/change-event.schema.json",
        "maintenance/audit-snapshot.schema.json",
        "maintenance/impact_engine.py",
        "maintenance/health_engine.py",
        "maintenance/autonomous-upgrade-runbook.md",
        "maintenance/upgrade-proposal.schema.json",
        "maintenance/approval-record.schema.json",
        "research/HERMES_AGENT_RESEARCH_DOSSIER.md",
        "research/audits/index.json",
        "research/health/index.json",
        "compatibility/hermes-compatibility.json",
        "compatibility/primitive-routing.json",
        "compatibility/impact-map.json",
        "compatibility/upgrade-matrix.json",
        "compatibility/freshness-policy.json",
        "tests/architecture-cases.json",
        "tests/test_architecture_regressions.py",
        "tests/release-impact-cases.json",
        "tests/test_release_impact.py",
        "tests/health-drift-cases.json",
        "tests/test_health_drift.py",
        "consumers/registry.json",
        "maintenance/consumer-registry.schema.json",
        "maintenance/consumer_impact.py",
        "references/16-consumer-impact.md",
        "tests/consumer-impact-cases.json",
        "tests/test_consumer_impact.py",
        "consumers/detection-rules.json",
        "maintenance/consumer_drift.py",
        "maintenance/consumer-drift-snapshot.schema.json",
        "research/consumer-drift/index.json",
        "references/17-consumer-dependency-drift.md",
        "tests/test_consumer_drift.py",
        "maintenance/promotion_gate.py",
        "references/18-promotion-recovery.md",
        "research/PRODUCTION_READINESS.md",
        "tests/hardening-scenarios.json",
        "tests/test_end_to_end_hardening.py",
    ]
    for rel in required:
        if not (ROOT / rel).exists():
            fail(f"required file missing: {rel}")

    print(f"PASS: hermes-agent-architecture v{version}")
    print(f"PASS: {len(sources)} primary-source entries")
    print(f"PASS: {len(json_files)} control JSON files parsed")
    print(f"PASS: {len(capability_ids)} compatibility/impact/freshness capabilities cross-checked")
    print(f"PASS: {len(audit_paths)} historical audit snapshot(s)")
    print(f"PASS: {len(health_paths)} historical health report(s)")
    print(f"PASS: {len(release_cases)} release-impact, {len(health_cases)} health/drift, and {len(consumer_cases)} consumer-impact fixtures structurally valid")
    print(f"PASS: {len(consumers)} active Hermes consumer(s) structurally valid")
    print(f"PASS: {len(drift_paths)} consumer dependency drift snapshot(s)")
    print(f"PASS: {len(hardening_scenarios)} end-to-end hardening scenario(s) structurally valid")


if __name__ == "__main__":
    main()
