# stack.md — what I run agents on

> Canonical description of my environment. **This file is the single source of truth
> for stack facts.** If memory, another project, or an older doc disagrees, this wins
> and the other one needs updating. Known traps live in `risks.md`, not here.

## Layers — keep these straight

| Layer | What it is | Mine |
|---|---|---|
| Gateway | Routes model calls, handles fallback | **OmniRoute** — open-source AI gateway, 339+ providers, auto-fallback, local at `http://localhost:20128/v1`. Also **OpenRouter** for hosted models. |
| Runtime | Runs the agent loop, tools, files | **Claude Code** (primary), **CrewAI** (exploring), **Hermes desktop app** |
| Orchestrator | Triggers, schedules, chains runs | **Hermes** (the pipeline, not the app — see `glossary.md`) |
| Knowledge / state | Notes, handoff files, approval state | **Obsidian** second-brain vault (PARA) |

A gateway is not a runtime. OmniRoute cannot define or run an agent. Claude Code can be
pointed at OmniRoute via its base URL — the same method already proven with OpenRouter —
so local models and the subagent primitive are not a trade-off. This is the most
frequently repeated category error in this project.

## Hardware

| Machine | Role |
|---|---|
| Windows gaming laptop | Dedicated 24/7 box. Always plugged in. Runs Home Assistant, Hermes, agents. Local Ollama / Gemma-class models. Nothing else. |
| Gaming PC — RTX 4080 Super | Heavy GPU jobs routed here from the laptop |
| macOS machine | Node.js + Claude Code CLI. Arch caveat in `risks.md`. |

Remote control from outside the house: **Telegram**.

## Model routing rules

- **Volume / bulk** → local Ollama / Gemma via OmniRoute. Free. Ideation, variant
  generation, tagging, classification, first-pass drafts.
- **Judgment / final build** → Claude. Architecture, hard code, anything where being
  wrong is expensive.
- **No paid APIs in the bulk path.** Hard rule. Target: local ratio ≥ 80%, measured,
  not assumed.
- **Claude Pro**, not an API plan. Allowance is finite and tracked via the Token Ledger.
  Token cost is a design constraint in every proposal.

## Version control

GitHub. Agent definitions version-controlled. Runs triggered from GitHub where
practical — scheduled, event-triggered, self-hosted runner on the gaming PC.
`validate_agent.py` runs in CI on every agent file.

## Not part of this stack

- No paid orchestration SaaS.
- Nothing requiring the 24/7 box to be reachable from the public internet.
- Home Assistant shares the laptop and is off-limits to agents. Never touch it.
