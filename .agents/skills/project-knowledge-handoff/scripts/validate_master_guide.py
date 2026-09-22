#!/usr/bin/env python3
"""Validate a project master guide and optional knowledge manifest."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

REQUIRED_CONCEPTS = {
    "how_to_use": ["how to use"],
    "bootstrap": [
        "new-chat bootstrap",
        "fresh-chat",
        "fresh chat",
        "new-agent bootstrap",
        "fresh chat or agent",
        "new chat or agent",
    ],
    "executive_overview": ["executive overview"],
    "architecture": ["architecture", "mental model"],
    "capabilities": [
        "capabilities",
        "capability deep dive",
        "feature inventory",
        "what the skill can now do",
        "what the project can now do",
    ],
    "version_history": [
        "version history",
        "version timeline",
        "version and milestone history",
        "milestone history",
    ],
    "validation": ["validation", "quality gate", "deterministic ci", "tests, ci"],
    "limitations": ["known limitations", "limitations", "caveats"],
    "future": ["future iteration", "future development", "roadmap"],
    "continuation": [
        "continuation protocol",
        "future development handoff protocol",
        "future development handoff",
        "new-chat continuation",
        "new chat continuation",
    ],
}


def fail(message: str) -> None:
    raise SystemExit(f"FAIL: {message}")


def main() -> None:
    if len(sys.argv) < 2:
        fail("usage: validate_master_guide.py <guide.md> [manifest.json]")

    guide = Path(sys.argv[1])
    if not guide.exists():
        fail(f"guide missing: {guide}")

    text = guide.read_text(encoding="utf-8")
    if len(text.strip()) < 1000:
        fail("guide is too short to be an end-to-end handoff")

    headings = re.findall(r"^#{1,6}\s+(.+)$", text, flags=re.MULTILINE)
    heading_text = "\n".join(headings).lower()

    missing = []
    for concept, alternatives in REQUIRED_CONCEPTS.items():
        if not any(phrase in heading_text for phrase in alternatives):
            missing.append(concept)
    if missing:
        fail("missing required conceptual sections: " + ", ".join(missing))

    body_lower = text.lower()
    if "source-of-truth" not in body_lower and "source of truth" not in body_lower:
        fail("guide must state a source-of-truth hierarchy")

    bootstrap_terms = [
        "new-agent", "new agent", "fresh chat", "new chat",
        "future ai", "future chat",
    ]
    if not any(term in body_lower for term in bootstrap_terms):
        fail("guide must contain future-chat/new-agent bootstrap guidance")

    if len(sys.argv) >= 3:
        manifest_path = Path(sys.argv[2])
        if not manifest_path.exists():
            fail(f"manifest missing: {manifest_path}")
        try:
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        except Exception as exc:
            fail(f"manifest is invalid JSON: {exc}")

        required = {
            "schema_version","project_name","project_slug","repository","project_root",
            "project_version","guide_revision","canonical_guide","latest_snapshot",
            "source_commit","last_updated_on","snapshot_policy","exports","status","known_gaps"
        }
        missing_keys = sorted(required - set(manifest))
        if missing_keys:
            fail("manifest missing required keys: " + ", ".join(missing_keys))

        canonical = Path(manifest["canonical_guide"])
        if canonical.name != guide.name and canonical.as_posix() != guide.as_posix():
            if guide.name != "MASTER_GUIDE.md":
                fail("manifest canonical_guide does not appear to identify the validated guide")
        if canonical.as_posix() != guide.as_posix() and canonical.exists() and canonical.resolve() != guide.resolve():
            fail("manifest canonical_guide points to a different existing guide")

        snapshot = manifest.get("latest_snapshot")
        if snapshot and not Path(snapshot).exists():
            fail(f"manifest latest_snapshot missing from repository: {snapshot}")

        for export in manifest.get("exports", []):
            if not Path(export).exists():
                fail(f"manifest export missing from repository: {export}")

        if manifest["guide_revision"] < 1:
            fail("manifest guide_revision must be >= 1")

    print(f"PASS: master guide continuity structure ({guide})")
    print(f"PASS: {len(headings)} Markdown heading(s) detected")
    print(f"PASS: {len(REQUIRED_CONCEPTS)} continuity concept(s) covered")


if __name__ == "__main__":
    main()
