# Personal Skill Library Plugin

Version: 1.1.0

This plugin packages the user's complete canonical reusable skill library for native ChatGPT/Codex skill discovery.

## Source of truth

Canonical skills live under:

`.agents/skills/<skill-name>/`

The plugin mirrors those directories under:

`plugins/personal-skill-library/skills/<skill-name>/`

GitHub remains canonical. The plugin mirror is the distributable snapshot consumed by the marketplace.

## Runtime model

ChatGPT/Codex sees each skill's metadata first and loads the full skill only when the request matches or the user invokes it directly.

No runtime GitHub fetch is required merely to load skill instructions.

## Packaged skills

- skill-library-router
- github-access-helper
- github-project-sync
- project-knowledge-handoff
- kaizen-orchestrator
- hermes-agent-creator
- hermes-agent-architecture
- secondbrain-curator
- anveshak-research-cycle
- youtube-insights-extractor
- usage-efficient-orchestrator

## Router scope

`skill-library-router` is intentionally narrow. It handles skill discovery, selection, routing diagnostics, and library maintenance. Ordinary workflows should activate their dedicated skill directly.

## Validation

Run:

`python scripts/validate-skill-library.py`

The validator checks marketplace registration, manifest shape, skill metadata, canonical/plugin file parity, and unexpected extra/missing mirrored files.
