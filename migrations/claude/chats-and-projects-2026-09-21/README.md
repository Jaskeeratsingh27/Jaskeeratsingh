# Claude migration: chats-and-projects.zip

Migration date: 2026-09-21

## Source integrity

- ZIP test: PASS — no compressed-data errors.
- Source package: 61 entries.
- Claude Projects: 10.
- Chat transcripts: 12.
- Raw export: present and parseable; top-level project/conversation counts match the generated indexes.

## Privacy decision

The source README explicitly states that the archive contains personal data (including employment/salary information, names, and local paths). This repository is public, so raw chat transcripts and `raw-export.json` are intentionally **not** copied here.

Reusable agent/project architecture is migrated in sanitized form. The untouched archive remains the source evidence outside this public repository.

## Migrated reusable projects

| Claude project | Migrated skill | Status |
|---|---|---|
| CI Pipeline Agentic AI | `kaizen-orchestrator` | Converted; source project knowledge preserved as references |
| Hermes Agents Creator | `hermes-agent-creator` | Converted; legacy knowledge preserved + OpenAI runtime map |
| SecondBrain-Complete-Package | `secondbrain-curator` | Converted with missing-dependency gate |
| Youtube Insights Extractor | `youtube-insights-extractor` | Converted; current transcript route replaces legacy direct `/mcp` assumption |

The six remaining Claude Projects were empty or near-empty project shells in this export and are recorded in `legacy-system-registry.md` rather than fabricated into executable skills.

## Chat history handling

Chats were inspected as migration evidence. Durable architecture decisions and missing artifacts are recorded in `decision-ledger.md` and `legacy-system-registry.md`. Time-sensitive subscription/model claims and unrelated personal chats are not promoted into reusable knowledge.
