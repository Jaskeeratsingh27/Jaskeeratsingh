#!/usr/bin/env python3
"""Deterministic structural validation for the hermes-agent-architecture skill."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def fail(message: str) -> None:
    raise SystemExit(f"FAIL: {message}")


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

    json_files = list((ROOT / "templates").glob("*.json")) + [ROOT / "maintenance" / "source-manifest.json"]
    for path in json_files:
        try:
            json.loads(path.read_text(encoding="utf-8"))
        except Exception as exc:
            fail(f"invalid JSON in {path.relative_to(ROOT)}: {exc}")

    manifest = json.loads((ROOT / "maintenance" / "source-manifest.json").read_text(encoding="utf-8"))
    sources = manifest.get("sources", [])
    if not sources:
        fail("source manifest has no sources")
    ids = [s.get("id") for s in sources]
    if len(ids) != len(set(ids)):
        fail("source manifest contains duplicate IDs")
    for source in sources:
        if source.get("priority") not in {"critical", "high", "medium", "low"}:
            fail(f"invalid source priority for {source.get('id')}")
        if not str(source.get("url", "")).startswith("https://"):
            fail(f"source URL is not HTTPS for {source.get('id')}")

    candidates = re.findall(r"`((?:references|templates|maintenance|research|tests)/[^`]+|VERSION|CHANGELOG\.md|README\.md)`", text)
    missing = [p for p in candidates if not (ROOT / p).exists()]
    if missing:
        fail("missing referenced paths: " + ", ".join(sorted(set(missing))))

    required = [
        "references/00-architecture-map.md",
        "references/11-production-checklist.md",
        "references/13-source-index.md",
        "maintenance/weekly-refresh-spec.md",
        "maintenance/weekly-refresh-prompt.md",
        "maintenance/source-manifest.json",
        "research/HERMES_AGENT_RESEARCH_DOSSIER.md",
    ]
    for rel in required:
        if not (ROOT / rel).exists():
            fail(f"required file missing: {rel}")

    print(f"PASS: hermes-agent-architecture v{version}")
    print(f"PASS: {len(sources)} primary-source entries")
    print(f"PASS: {len(json_files)} JSON files parsed")


if __name__ == "__main__":
    main()
