#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="$REPO_ROOT/.agents/skills"
CODEX_DIR="$HOME/.codex/skills"
CLAUDE_DIR="$HOME/.claude/skills"

mkdir -p "$CODEX_DIR" "$CLAUDE_DIR"

if [[ ! -d "$SOURCE_DIR" ]]; then
  echo "Skill source directory not found: $SOURCE_DIR" >&2
  exit 1
fi

count=0
for skill_dir in "$SOURCE_DIR"/*; do
  [[ -d "$skill_dir" ]] || continue
  [[ -f "$skill_dir/SKILL.md" ]] || continue

  skill_name="$(basename "$skill_dir")"

  ln -sfn "$skill_dir" "$CODEX_DIR/$skill_name"
  ln -sfn "$skill_dir" "$CLAUDE_DIR/$skill_name"

  echo "Installed $skill_name"
  echo "  Codex:  $CODEX_DIR/$skill_name"
  echo "  Claude: $CLAUDE_DIR/$skill_name"
  count=$((count + 1))
done

echo
echo "Installed $count skill(s)."
echo "Codex invocation:  \$<skill-name>"
echo "Claude invocation: /<skill-name>"
