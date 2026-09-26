#!/usr/bin/env python3
"""Check minimum GitHub-project controls without reading or sending secrets."""
from __future__ import annotations

import argparse
import re
from pathlib import Path

REQUIRED = ("PROJECT.md", "docs/artifact-manifest.md", "docs/decisions.md", "docs/run-ledger.md")
SECRET_PATTERNS = (
    ("private key", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----")),
    ("GitHub token", re.compile(r"\bgh[pousr]_[A-Za-z0-9_]{20,}\b")),
    ("OpenAI-style key", re.compile(r"\bsk-[A-Za-z0-9_-]{20,}\b")),
    ("assigned secret", re.compile(r"(?i)(api[_-]?key|secret|token)\s*[:=]\s*['\"][^'\"]{8,}")),
)
SKIP = {".git", "node_modules", ".venv", "venv", "dist", "build"}


def text_files(root: Path):
    for path in root.rglob("*"):
        if not path.is_file() or any(part in SKIP for part in path.parts):
            continue
        try:
            if path.stat().st_size > 1_000_000:
                continue
            yield path, path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("project_root", type=Path)
    args = parser.parse_args()
    root = args.project_root.resolve()
    failures: list[str] = []

    for relative in REQUIRED:
        if not (root / relative).is_file():
            failures.append(f"missing required record: {relative}")

    project = root / "PROJECT.md"
    if project.is_file():
        content = project.read_text(encoding="utf-8")
        for heading in ("## Identity", "## Requirements", "## Open risks and next action"):
            if heading not in content:
                failures.append(f"PROJECT.md missing section: {heading}")
        if "REQ-" not in content:
            failures.append("PROJECT.md has no requirement ID")

    for path, content in text_files(root):
        if path.name == ".env" or path.name.startswith(".env."):
            failures.append(f"environment file must not be committed: {path.relative_to(root)}")
        for label, pattern in SECRET_PATTERNS:
            if pattern.search(content):
                failures.append(f"possible {label}: {path.relative_to(root)}")

    if failures:
        for item in failures:
            print(f"FAIL: {item}")
        return 1
    print("PASS: project records and basic secret controls verified")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
