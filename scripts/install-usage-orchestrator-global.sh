#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
SKILLS_HOME="$HOME/.agents/skills"
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$CODEX_HOME" "$CODEX_HOME/agents" "$SKILLS_HOME"

# Skill: replace with the canonical repository version.
rm -rf "$SKILLS_HOME/usage-efficient-orchestrator"
cp -R "$ROOT/.agents/skills/usage-efficient-orchestrator" "$SKILLS_HOME/usage-efficient-orchestrator"

# Custom subagents.
cp "$ROOT"/.codex/agents/*.toml "$CODEX_HOME/agents/"

# Global AGENTS instructions. Preserve existing instructions and append once.
if [ ! -f "$CODEX_HOME/AGENTS.md" ]; then
  cp "$ROOT/AGENTS.md" "$CODEX_HOME/AGENTS.md"
elif ! grep -q "Usage-Efficient Codex Policy" "$CODEX_HOME/AGENTS.md"; then
  cp "$CODEX_HOME/AGENTS.md" "$CODEX_HOME/AGENTS.md.bak-$STAMP"
  {
    printf "\n\n<!-- usage-efficient-orchestrator:start -->\n"
    cat "$ROOT/AGENTS.md"
    printf "\n<!-- usage-efficient-orchestrator:end -->\n"
  } >> "$CODEX_HOME/AGENTS.md"
fi

# Global config. Avoid clobbering an existing [agents] table.
if [ ! -f "$CODEX_HOME/config.toml" ]; then
  cp "$ROOT/.codex/config.toml" "$CODEX_HOME/config.toml"
elif ! grep -Eq '^\[agents\][[:space:]]*$' "$CODEX_HOME/config.toml"; then
  cp "$CODEX_HOME/config.toml" "$CODEX_HOME/config.toml.bak-$STAMP"
  {
    printf "\n\n# usage-efficient-orchestrator global agent configuration\n"
    cat "$ROOT/.codex/config.toml"
  } >> "$CODEX_HOME/config.toml"
else
  cp "$ROOT/.codex/config.toml" "$CODEX_HOME/usage-efficient-orchestrator.config.toml"
  echo "Existing [agents] config detected."
  echo "I did not overwrite it. Merge:"
  echo "  $CODEX_HOME/usage-efficient-orchestrator.config.toml"
  echo "into:"
  echo "  $CODEX_HOME/config.toml"
fi

echo "Installed usage-efficient-orchestrator globally."
echo "Restart Codex if the skill/agents are not visible immediately."
