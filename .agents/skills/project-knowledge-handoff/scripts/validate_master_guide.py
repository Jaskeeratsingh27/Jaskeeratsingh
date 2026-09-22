#!/usr/bin/env python3
"""Validate a project master guide and optional knowledge manifest."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

REQUIRED_HEADINGS = [
    "How to Use",
    "Fresh-Chat",
    "Executive Overview",
    "Architecture",
    "Capabilities",
    "Version",
    "Validation",
    "Known Limitations",
    "Future",
    "Continuation Protocol",
]

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
    missing = [h for h in REQUIRED_HEADINGS if h.lower() not in heading_text]
    if missing:
        fail("missing required conceptual sections: " + ", ".join(missing))

    if "source-of-truth" not in text.lower() and "source of truth" not in text.lower():
        fail("guide must state a source-of-truth hierarchy")

    if "new-agent" not in text.lower() and "new agent" not in text.lower() and "fresh chat" not in text.lower():
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

        canonical = manifest["canonical_guide"]
        if Path(canonical).name != guide.name and canonical != guide.as_posix():
            # Allow repo-relative invocation from a different working directory, but flag obvious mismatch.
            if guide.name != "MASTER_GUIDE.md":
                fail("manifest canonical_guide does not appear to identify the validated guide")

        if manifest["guide_revision"] < 1:
            fail("manifest guide_revision must be >= 1")

    print(f"PASS: master guide continuity structure ({guide})")
    print(f"PASS: {len(headings)} Markdown heading(s) detected")

if __name__ == "__main__":
    main()
