#!/usr/bin/env python3
"""
validate_agent.py -- mistake-proofing for agent definition files.

Policy that isn't enforced is a suggestion. This turns agent-conventions.md
into a gate. Run it in CI, in a pre-commit hook, or before any first
unattended run.

Usage:
    python3 validate_agent.py .claude/agents/
    python3 validate_agent.py .claude/agents/script-writer.md

Exit codes: 0 = all pass, 1 = at least one failure.
Stdlib only, to match the existing Hermes tooling convention.
"""

import sys
import re
from pathlib import Path

REQUIRED_FIELDS = ["name", "description", "tools", "model", "maxTurns"]
NAME_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
MIN_DESCRIPTION_WORDS = 8
MAX_TURNS_CEILING = 50


def parse_frontmatter(text):
    """Return (frontmatter_dict, body). Naive YAML -- flat key: value only."""
    if not text.startswith("---"):
        return None, text
    parts = text.split("---", 2)
    if len(parts) < 3:
        return None, text
    fm = {}
    for line in parts[1].splitlines():
        line = line.strip()
        if not line or line.startswith("#") or ":" not in line:
            continue
        key, _, value = line.partition(":")
        fm[key.strip()] = value.strip()
    return fm, parts[2]


def check(path):
    """Return list of failure strings for one agent file."""
    problems = []
    text = path.read_text(encoding="utf-8")
    fm, body = parse_frontmatter(text)

    if fm is None:
        return ["no YAML frontmatter"]

    for field in REQUIRED_FIELDS:
        if field not in fm or not fm[field]:
            problems.append(f"missing required field: {field}")

    name = fm.get("name", "")
    if name and not NAME_RE.match(name):
        problems.append(f"name '{name}' must be lowercase-with-hyphens")
    if ":" in name:
        problems.append("name must not contain ':'")

    desc = fm.get("description", "")
    if desc and len(desc.split()) < MIN_DESCRIPTION_WORDS:
        problems.append(
            f"description too thin ({len(desc.split())} words) -- it is routing "
            f"logic, not a label"
        )

    tools = fm.get("tools", "")
    if not tools:
        problems.append("tools omitted -- agent would inherit ALL tools")
    elif tools.strip() in ("*", "all"):
        problems.append("tools wildcard -- must be an explicit whitelist")

    turns = fm.get("maxTurns", "")
    if turns:
        try:
            n = int(turns)
            if n <= 0:
                problems.append("maxTurns must be positive")
            elif n > MAX_TURNS_CEILING:
                problems.append(f"maxTurns {n} exceeds ceiling {MAX_TURNS_CEILING}")
        except ValueError:
            problems.append(f"maxTurns '{turns}' is not an integer")

    if "model" in fm and "#" not in [c for c in text.splitlines() if "model:" in c][0]:
        problems.append("model not pinned with a date comment")

    lowered = body.lower()
    if "must not" not in lowered:
        problems.append("body has no MUST NOT section")
    if not any(w in lowered for w in ("on failure", "if missing", "fails, ")):
        problems.append("body has no failure path")
    if "## output" not in lowered and "output:" not in lowered:
        problems.append("body does not declare an output contract")

    for smell in ("think step by step", "double-check", "you are a helpful"):
        if smell in lowered:
            problems.append(f"anti-pattern present: '{smell}'")

    return problems


def main(argv):
    if len(argv) < 2:
        print(__doc__)
        return 1

    target = Path(argv[1])
    files = sorted(target.glob("*.md")) if target.is_dir() else [target]

    if not files:
        print(f"no agent files found in {target}")
        return 1

    failed = 0
    for f in files:
        problems = check(f)
        if problems:
            failed += 1
            print(f"FAIL  {f.name}")
            for p in problems:
                print(f"      - {p}")
        else:
            print(f"PASS  {f.name}")

    print(f"\n{len(files) - failed}/{len(files)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
