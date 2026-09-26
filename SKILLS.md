# Personal Skills Registry

This repository is the source of truth for reusable AI skills.

## Supported runtimes

| Runtime | Distribution | Explicit use | Automatic use |
|---|---|---|---|
| Normal ChatGPT desktop | Personal Skill Library plugin | Plugin/@ UI when available | Yes, after installation, via skill metadata |
| OpenAI Codex | Plugin or `.agents/skills/` | `$skill-name` | Yes |
| Claude Code | `.claude/skills/` | `/skill-name` | Yes |

## v2 normal ChatGPT support

Every canonical skill has:

`.agents/skills/<skill-name>/agents/openai.yaml`

Every plugin mirror has:

`plugins/personal-skill-library/skills/<skill-name>/agents/openai.yaml`

Each declares both `CHAT` and `CODEX` and enables implicit invocation.

Normal ChatGPT desktop setup: `docs/NORMAL_CHAT_SETUP.md`

Cross-device/mobile options: `docs/CROSS_DEVICE_DISTRIBUTION.md`

## Available skills

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

## Architecture

```
GitHub canonical library
.agents/skills/
        |
        | mirrored
        v
plugins/personal-skill-library/skills/
        |
        | install from marketplace
        v
ChatGPT / Codex
        |
        | name + description + agents/openai.yaml
        v
dedicated skill activation
```

The `skill-library-router` is for discovery and routing administration. Normal workflow prompts should activate dedicated skills directly.

## Validation

Run `python scripts/validate-skill-library.py`.

GitHub Actions also runs the validator on relevant changes.

## Version

Personal Skill Library: **2.0.0**
