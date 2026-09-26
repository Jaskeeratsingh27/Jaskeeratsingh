# glossary.md — decode ring

> My naming is Sanskrit and my stack terms overlap confusingly. Read this first;
> it prevents the most common category errors.

## Agent names

| Name | Literal | In this system |
|---|---|---|
| **Hermes** | Greek messenger | Nightly ideation pipeline + the orchestration layer for everything else. Not Sanskrit — predates the convention. |
| **Smriti** | memory, that which is remembered | Turns learning into atomic Obsidian notes. Owns the vault write path. |
| **Kosha** | sheath, treasury | GitHub specialist. Manages repos, teaches by doing. |
| **Netra** | eye | Watches YouTube so I don't have to. URL → interactive HTML doc. |
| **Vartaa** | news, tidings | Daily AI-engineering intel radar. |
| **Anveshak** | seeker, investigator | 3-day research-to-vault cycle with an approval gate. |
| **Vaani** | speech, voice | Autonomous AI YouTuber. |
| **Sutradhaar** | thread-holder, stage manager | Agentic project management. |
| **Rasoi** | kitchen | Cooking automation, pantry, meal planning. |
| **Verdant** | (English) | Multi-agent gardener. |

**Naming rule for new agents:** one Sanskrit word, names the *function* not the domain.
If the word needs a sentence to justify, pick a different word.

## Stack terms — the distinction people get wrong

| Term | Is | Is not |
|---|---|---|
| **Gateway** | Routes model calls, handles fallback. OmniRoute, OpenRouter. | An agent framework. Cannot define or run an agent. |
| **Runtime** | Runs the agent loop, tools, files. Claude Code, CrewAI, Hermes desktop app. | A model provider. |
| **Orchestrator** | Triggers, schedules, chains runs. Hermes. | A place agents are defined. |
| **OmniRoute** | Open-source gateway, `localhost:20128/v1`, 339+ providers, auto-fallback. | A replacement for Claude Code. |
| **Hermes** | Ambiguous — see below. | — |

**"Hermes" means two things.** (1) The nightly pipeline I designed and shipped as a
plugin bundle. (2) The Nous Research open-source Hermes desktop app installed on my
Windows PC at `%LOCALAPPDATA%\hermes\hermes-agent`. When I say **"my real Hermes app"**
I mean (2). Default to (1) otherwise.

## Process terms

| Term | Means here |
|---|---|
| **Agent** | Scoped worker: instructions, tool whitelist, pinned model, typed contracts, failure path. All five, or it's a prompt. |
| **Contract** | Typed input/output shape, enforced in code, not in the prompt. |
| **Gate** | Human approval point before an irreversible action. |
| **Golden set** | 10 fixed inputs, versioned, never edited, used to detect drift. |
| **In-flight** | Started, not Done. Capped at 2. |
| **Escape** | Defect found after the output was consumed downstream. Weighted 5x. |
| **Thin slice** | End-to-end path producing one real output, manual steps allowed. |
| **SPOF** | Shared dependency with no contract and no test. |
