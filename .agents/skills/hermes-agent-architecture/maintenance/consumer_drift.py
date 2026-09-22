#!/usr/bin/env python3
"""Detect drift between active Hermes consumers and the explicit dependency registry."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = ROOT.parents[2]


def load(rel: str) -> dict[str, Any]:
    return json.loads((ROOT / rel).read_text(encoding="utf-8"))


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return ""


def contains(text: str, pattern: str) -> bool:
    return pattern.lower() in text.lower()


def path_is_ignored(rel: str, ignored_prefixes: list[str]) -> bool:
    return any(rel.startswith(prefix) for prefix in ignored_prefixes)


def scan(repo_root: Path | None = None, registry: dict[str, Any] | None = None,
         rules: dict[str, Any] | None = None) -> dict[str, Any]:
    repo_root = repo_root or REPO_ROOT
    registry = registry or load("consumers/registry.json")
    rules = rules or load("consumers/detection-rules.json")

    ignored = registry.get("ignored_path_prefixes", [])
    consumers = [item for item in registry.get("consumers", []) if item.get("status") == "active"]
    registered_ids = {item["id"] for item in consumers}
    registered_skill_dirs = {
        path.split("/")[2]
        for item in consumers
        for path in item.get("paths", [])
        if path.startswith(".agents/skills/") and len(path.split("/")) > 2
    }

    findings: list[dict[str, Any]] = []

    # 1. Verify explicit evidence assertions for every registered dependency.
    for consumer in consumers:
        declared = set(consumer.get("capability_ids", []))
        evidenced: set[str] = set()
        for assertion in consumer.get("evidence_assertions", []):
            rel = assertion["path"]
            text = read_text(repo_root / rel)
            matches = [pattern for pattern in assertion["patterns"] if contains(text, pattern)]
            mode = assertion["mode"]
            ok = bool(matches)
            if mode == "all_patterns":
                ok = len(matches) == len(assertion["patterns"])
            if not ok:
                findings.append({
                    "type": "registered_evidence_missing",
                    "severity": "major",
                    "consumer_id": consumer["id"],
                    "path": rel,
                    "assertion_id": assertion["id"],
                    "capability_ids": assertion["capability_ids"],
                    "expected_patterns": assertion["patterns"]
                })
            else:
                evidenced.update(assertion["capability_ids"])

        missing_evidence = sorted(declared - evidenced)
        if missing_evidence:
            findings.append({
                "type": "registered_capability_without_evidence",
                "severity": "major",
                "consumer_id": consumer["id"],
                "capability_ids": missing_evidence
            })

        # 2. Detect high-confidence capability use that was not declared.
        combined = "\n".join(read_text(repo_root / rel) for rel in consumer.get("paths", []))
        detected = {
            capability_id
            for capability_id, patterns in rules.get("capability_patterns", {}).items()
            if any(contains(combined, pattern) for pattern in patterns)
        }
        undeclared = sorted(detected - declared)
        if undeclared:
            findings.append({
                "type": "unregistered_capability_dependency",
                "severity": "major",
                "consumer_id": consumer["id"],
                "capability_ids": undeclared
            })

    # 3. Scan canonical skill directories for candidate Hermes consumers not in registry.
    extensions = set(rules.get("file_extensions", []))
    markers = rules.get("candidate_markers", [])
    minimum_markers = int(rules.get("candidate_policy", {}).get("minimum_marker_matches", 1))
    minimum_capabilities = int(rules.get("candidate_policy", {}).get("minimum_capability_matches", 1))

    for scan_root in rules.get("scan_roots", []):
        root = repo_root / scan_root
        if not root.exists():
            continue
        for child in sorted(path for path in root.iterdir() if path.is_dir()):
            consumer_id = child.name
            rel_dir = child.relative_to(repo_root).as_posix() + "/"
            if consumer_id in registered_skill_dirs or consumer_id in registered_ids:
                continue
            if path_is_ignored(rel_dir, ignored):
                continue

            texts = []
            evidence_paths = []
            for path in child.rglob("*"):
                if path.is_file() and path.suffix.lower() in extensions:
                    rel = path.relative_to(repo_root).as_posix()
                    if path_is_ignored(rel, ignored):
                        continue
                    text = read_text(path)
                    if text:
                        texts.append(text)
                        evidence_paths.append(rel)
            combined = "\n".join(texts)
            marker_matches = sorted({marker for marker in markers if contains(combined, marker)})
            capability_matches = sorted({
                capability_id
                for capability_id, patterns in rules.get("capability_patterns", {}).items()
                if any(contains(combined, pattern) for pattern in patterns)
            })
            if len(marker_matches) >= minimum_markers and len(capability_matches) >= minimum_capabilities:
                findings.append({
                    "type": "candidate_unregistered_consumer",
                    "severity": "major",
                    "consumer_id": consumer_id,
                    "capability_ids": capability_matches,
                    "marker_matches": marker_matches,
                    "evidence_paths": evidence_paths[:20]
                })

    findings.sort(key=lambda item: (item["type"], item.get("consumer_id", "")))
    return {
        "schema_version": "1.0.0",
        "registry_schema_version": registry.get("schema_version"),
        "finding_count": len(findings),
        "drift_detected": bool(findings),
        "findings": findings
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", default=str(REPO_ROOT))
    parser.add_argument("--pretty", action="store_true")
    parser.add_argument("--fail-on-drift", action="store_true")
    parser.add_argument("--output")
    args = parser.parse_args()

    result = scan(Path(args.repo_root))
    rendered = json.dumps(result, indent=2 if args.pretty else None, sort_keys=True) + "\n"
    if args.output:
        Path(args.output).write_text(rendered, encoding="utf-8")
    else:
        print(rendered, end="")
    if args.fail_on_drift and result["drift_detected"]:
        raise SystemExit(2)


if __name__ == "__main__":
    main()
