# Personal Skill Library Plugin

Version: 1.0.0

This plugin is the ChatGPT/Codex discovery layer for the canonical skill library in `Jaskeeratsingh27/Jaskeeratsingh`.

## v1 scope

Packaged natively:
- `skill-library-router`
- `github-access-helper`

Indexed external canonical skills:
- `github-project-sync`
- `project-knowledge-handoff`
- `kaizen-orchestrator`
- `hermes-agent-creator`
- `hermes-agent-architecture`
- `secondbrain-curator`
- `anveshak-research-cycle`
- `youtube-insights-extractor`
- `usage-efficient-orchestrator`

The router reads a compact local index and retrieves only the selected canonical `SKILL.md` from GitHub.

## Why this design

v1 avoids copying every large skill and its references into the plugin. GitHub remains authoritative while the plugin supplies native discovery and routing.

## Validation targets

1. GitHub access question -> `github-access-helper`
2. Hermes agent build -> router -> `hermes-agent-creator`
3. DMAIC/FMEA request -> router -> `kaizen-orchestrator`
4. YouTube transcript/insights request -> router -> `youtube-insights-extractor`
5. Unrelated simple question -> no forced personal skill
