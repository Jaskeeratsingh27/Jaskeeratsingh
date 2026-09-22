#!/usr/bin/env python3
"""Structural validation for project-knowledge-handoff."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def fail(message: str) -> None:
    raise SystemExit(f"FAIL: {message}")

def main() -> None:
    version = (ROOT / "VERSION").read_text(encoding="utf-8").strip()
    if not re.fullmatch(r"\d+\.\d+\.\d+", version):
        fail(f"VERSION is not semver: {version}")

    skill = (ROOT / "SKILL.md").read_text(encoding="utf-8")
    if f"version: {version}" not in skill:
        fail("SKILL.md version does not match VERSION")
    if "name: project-knowledge-handoff" not in skill:
        fail("SKILL.md name mismatch")

    required = [
        "README.md",
        "CHANGELOG.md",
        "references/versioning-policy.md",
        "references/quality-checklist.md",
        "templates/MASTER_GUIDE.template.md",
        "templates/knowledge-manifest.schema.json",
        "scripts/validate_master_guide.py",
    ]
    for rel in required:
        if not (ROOT / rel).exists():
            fail(f"required file missing: {rel}")

    schema = json.loads((ROOT / "templates/knowledge-manifest.schema.json").read_text(encoding="utf-8"))
    required_manifest = set(schema.get("required", []))
    expected = {
        "schema_version","project_name","project_slug","repository","project_root",
        "project_version","guide_revision","canonical_guide","latest_snapshot",
        "source_commit","last_updated_on","snapshot_policy","exports","status","known_gaps"
    }
    if required_manifest != expected:
        fail("knowledge manifest required fields drifted")

    template = (ROOT / "templates/MASTER_GUIDE.template.md").read_text(encoding="utf-8")
    for phrase in [
        "Fresh-Chat / New-Agent Bootstrap",
        "Executive Overview",
        "Architecture / Mental Model",
        "Version and Milestone History",
        "Validation, Tests, CI, and Quality Gates",
        "Known Limitations, Caveats, and Non-Goals",
        "New-Chat Continuation Protocol",
    ]:
        if phrase not in template:
            fail(f"master guide template missing section: {phrase}")

    print(f"PASS: project-knowledge-handoff v{version}")
    print("PASS: manifest schema and master-guide template")

if __name__ == "__main__":
    main()
