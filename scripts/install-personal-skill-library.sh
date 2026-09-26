#!/usr/bin/env bash
set -euo pipefail

MARKETPLACE_NAME="jaskeeratsingh-tools"
SOURCE="Jaskeeratsingh27/Jaskeeratsingh"

if ! command -v codex >/dev/null 2>&1; then
  echo "Codex CLI is not installed or not on PATH. Install/open Codex first, then rerun this script." >&2
  exit 1
fi

echo "Checking configured plugin marketplaces..."
if codex plugin marketplace list 2>&1 | grep -q "$MARKETPLACE_NAME"; then
  echo "Marketplace already exists. Refreshing $MARKETPLACE_NAME..."
  codex plugin marketplace upgrade "$MARKETPLACE_NAME"
else
  echo "Adding GitHub marketplace $SOURCE..."
  codex plugin marketplace add "$SOURCE" --ref main
fi

echo
echo "Configured marketplaces:"
codex plugin marketplace list

echo
echo "Marketplace setup passed."
echo "Next: restart ChatGPT desktop -> Plugins -> Jaskeeratsingh Tools -> install Personal Skill Library -> start a new regular ChatGPT chat."
