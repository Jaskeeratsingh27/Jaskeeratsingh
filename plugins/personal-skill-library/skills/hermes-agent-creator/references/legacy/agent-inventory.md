# agent-inventory.md — the portfolio

> So nothing gets rebuilt and new agents wire into what exists.
> **Fill the ⚠ rows before uploading.** Thin entries are the ones that cause rework.

Naming: Sanskrit, one word, describes the function.

## Status definitions

`Done` = 10 clean golden-set runs, contract validated in code, failure path tested,
control plan recorded. `In-flight` = started, not Done. `Parked` = deliberately
stopped, reason recorded. `Idea` = not started.

**WIP limit: 2 In-flight. Current count is over. Resolve before starting anything new.**

## Portfolio

| Name | Does | Status | Runs | FPY | Owner of |
|---|---|---|---|---|---|
| **Hermes** | Nightly: mine vault → ideate on cheap model → I approve → sandboxed build/run → morning report → I pick winners → winners to Claude. Also the orchestration layer. | In-flight | ⚠ | ⚠ | idea ledger, scheduling, runner workflow |
| **Smriti** | "Here's what I learned" → atomic Obsidian notes, integrated into vault | ⚠ | ⚠ | ⚠ | **vault write path** (shared) |
| **Kosha** | GitHub specialist — manages repos, teaches GitHub by doing | ⚠ | ⚠ | ⚠ | repo operations |
| **Netra** | YouTube URL → interactive HTML doc | ⚠ | ⚠ | ⚠ | transcript extraction |
| **Vartaa** | Daily AI-engineering intel radar + ask-anything lane | ⚠ | ⚠ | ⚠ | source registry |
| **Anveshak** | 3-day research-to-vault cycle with approval gate | ⚠ | ⚠ | ⚠ | research staging |
| **Vaani** | Autonomous AI YouTuber. Idea → plan → script → produce → publish → iterate. Vertical short-form first; long-form v2. Platform-agnostic core, pluggable publish adapter. | Blueprint ⚠ | — | — | — |
| **Sutradhaar** | Agentic project management, Windows 11 PC | Idea ⚠ | — | — | — |
| **Rasoi** | Kitchen — cooking automation, pantry, meal planning | ⚠ | — | — | — |
| **Verdant** | Multi-agent gardener | ⚠ | — | — | — |
| **Skill/Agent Factory** | Meta-skill: automated skill and agent generation. Architecture and roadmap done. | In-flight ⚠ | — | — | **agent generation** |

## Dependency map

Change anything in the left column and everything to the right of it is at risk.

```
Smriti ── vault write path ──┬── Anveshak
                             ├── Vartaa
                             └── Hermes (reports)

Hermes ── idea ledger ───────┬── Skill/Agent Factory (build queue)
       ── self-hosted runner ┘

Obsidian vault ── approval gates ──┬── Hermes
(+ Telegram backup)                ├── Anveshak
                                   └── Vaani (publish gate)

OmniRoute ── all local inference ── everything
```

**Single points of failure:** Smriti's vault write path and the Obsidian approval gate.
Both are unowned infrastructure carried inside an agent. Neither has a contract or a
test. If either breaks, five agents fail silently and the first signal is a missing
morning report.

## Shared infrastructure — reuse, don't reinvent

| Asset | Owner | Contract? |
|---|---|---|
| Vault write path | Smriti | ⚠ none |
| Approval gates (Obsidian checkbox + Telegram) | Hermes | ⚠ none |
| Idea ledger, never pruned, stdlib dedup | Hermes | ⚠ |
| Self-hosted GitHub Actions runner (gaming PC) | Hermes | ⚠ |
| Token Ledger + `session-token-audit` | standalone | ✅ |

An asset with no contract is a shared dependency with no interface. Extracting these
two into contracted, separately tested modules is the highest-leverage fix in the
portfolio — higher than any individual agent.

## Gate questions for any new agent

1. Does the Skill/Agent Factory generate this instead of hand-building?
2. Which existing agent already owns part of this job?
3. Writes to the vault? Use Smriti's path.
4. Needs approval? Use the existing gate, don't build a new one.
5. Local model or Claude? Default local unless justified.
6. Does starting this breach the WIP limit?
