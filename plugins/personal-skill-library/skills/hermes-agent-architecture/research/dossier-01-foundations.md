# Hermes Research Dossier — Foundations: executive summary, release discipline, core map, Profiles

# Hermes Agent Architecture — Research Dossier

**Research date:** 2026-09-21  
**Purpose:** NotebookLM/Gemini-compatible reference corpus for designing production-grade Hermes Agent systems, persistent agents, subagents, workflows, skills, instruction files, I/O contracts, automation, security, and observability.  
**Stable release verified:** Hermes Agent **v0.21.3**, tag **v2026.9.14**, released **2026-09-14**. [S01]

> This dossier is a synthesized engineering reference, not a copy of the Hermes documentation. Hermes evolves rapidly; production systems should pin a release or commit and validate architecture against that target.

---

## 1. Executive Summary

Hermes Agent is best modeled as an **agent runtime with multiple orthogonal primitives** rather than as a single all-purpose "agent" abstraction. The most important production-design decision is to choose the correct primitive for each responsibility.

A persistent specialist should normally be a **Hermes Profile**. A Bot in Bot Mode is a Profile surfaced through a persistent desktop/chat identity. A short-lived isolated worker should normally be spawned through **`delegate_task`**. Durable work spanning agents, restarts, reviews, human intervention, or dependency graphs should normally use **Hermes Kanban**. Reusable procedures and domain knowledge belong in **Skills**; project rules belong in **`.hermes.md` / `AGENTS.md`**; persistent identity belongs in **`SOUL.md`**; compact durable personal/project facts belong in **Memory**; external capabilities belong in built-in **toolsets** or **MCP**; scheduled work belongs in **Cron**; policy enforcement and telemetry belong in **hooks/plugins**. [S03][S04][S06][S07][S08][S10][S13][S15][S17]

For a production multi-agent system, a strong default topology is:

```text
User / API / Messaging
        |
        v
Orchestrator Profile
        |
        v
Hermes Kanban (durable workflow state)
        |
   +----+-------------------+
   |                        |
   v                        v
Research Profile        Engineering Profile
   |                        |
   +-> delegate_task        +-> delegate_task
       ephemeral workers        ephemeral workers
   |                        |
   +------------+-----------+
                v
          Durable Artifacts
                |
                v
          Review / QA Profile
                |
                v
             Complete
```

This separates **persistent identity**, **ephemeral reasoning**, **workflow state**, **artifact state**, and **verification**, which is essential for reliable multi-agent orchestration.

---

## 2. Release State and Versioning Discipline

The official GitHub releases page shows Hermes Agent **v0.21.3 (`v2026.9.14`)** as the latest stable release available during this research, released September 14, 2026. The release notes characterize it as a patch roll-up for downstream consumers and state that fuller curated notes for the broader release window are intended for v0.22.0. [S01]

This matters because current documentation may describe behavior from recent `main` development that is newer than the latest stable release. Hermes is a fast-moving project: the release page shows multiple patch releases within days, while current open PR activity includes delegation, Kanban, context, plugin, session-state, and runtime changes. [S01][S02]

### Production rule

For any serious Hermes system:

1. Pin a Hermes version or commit.
2. Record the documentation snapshot/research date.
3. Generate configuration/instructions for that target.
4. Run compatibility tests against the exact deployed target.
5. Upgrade intentionally through staging/branch review rather than tracking `main` automatically.

### High-change surfaces to test on every upgrade

- Profile/gateway isolation and multiplexing
- `state.db` persistence behavior
- Delegation semantics and nested spawn limits
- Kanban lifecycle/review/dispatch behavior
- Skill scanning/loading/trust behavior
- MCP authentication and SDK compatibility
- Model/provider/fallback routing
- Cron continuity and scheduler behavior
- Plugin/hook payload schemas
- Desktop/Bot Mode integration

---

## 3. Core Architecture Model

Hermes exposes several different layers. Mixing these layers creates brittle systems; separating them produces composable systems.

| Architectural concern | Hermes primitive | Engineering meaning |
|---|---|---|
| Persistent identity | Profile / Bot | Long-lived specialist agent |
| Short isolated computation | `delegate_task` | Function-like ephemeral worker |
| Durable workflow | Kanban | Task state machine / control plane |
| Reusable procedure | Skill | SOP / knowledge module |
| Project policy/context | `.hermes.md`, `AGENTS.md` | Project-level instruction layer |
| Personality/role identity | `SOUL.md` | Persistent profile identity |
| Compact durable facts | Memory | Curated persistence |
| Historical retrieval | Session search / provider memory | Recall layer |
| External actions | Toolsets / MCP | Capability plane |
| Repeated execution | Cron | Scheduler/automation |
| Deterministic multi-tool logic | `execute_code` | Programmatic tool pipeline |
| Isolation | terminal backend/sandbox | Security/execution boundary |
| Enforcement/telemetry | Hooks/plugins | Policy/observability plane |
| Objective engineering truth | Git/files/datastores | Durable artifact/state plane |

This mapping should be treated as the fundamental mental model when designing agent systems on Hermes. [S03][S04][S06][S07][S08][S10][S13][S15][S17]

---

## 4. Profiles: Persistent Agent Identity

Hermes Profiles are independent Hermes home directories. The official documentation states that each profile can have its own configuration, API keys, `SOUL.md`, memory, sessions, skills, cron jobs, state database, and gateway state. Profiles are explicitly intended to let multiple independent Hermes agents coexist without mixing state. [S03]

### Important isolation rule

Hermes warns not to point multiple independent agent processes at the same profile/home. Automatic memory writes can be loaded by the other process and compound into unintended shared state. If multiple persistent agents need shared memory, the documentation recommends an external memory provider rather than shared profile-home writes. [S03][S09]

### Profile vs Agent vs Bot vs Subagent

Hermes documentation distinguishes these terms: [S03][S04]

- **Profile:** persistent home for configuration and state.
- **Agent:** a running Hermes assistant using a profile.
- **Bot Mode Bot:** a Profile presented as a named desktop Bot with persistent chat/roster metadata.
- **Messaging bot:** the external Telegram/Discord/Slack/etc. account connected through a gateway.
- **Subagent:** fresh child assistant created by `delegate_task`; a new conversation is not the same thing as a new Profile.

### Profile descriptions matter

Profiles can carry descriptions, and Hermes' Kanban routing/decomposition can use the profile roster/descriptions to decide which specialist is appropriate for a task. Therefore, profile descriptions should be operationally specific: responsibilities, inputs, outputs, and exclusions. [S03][S08]

### Profile is not sandbox

A Profile scopes Hermes state with `HERMES_HOME`, but it does **not** restrict OS-level filesystem access. On a local terminal backend the agent still runs with the user's normal permissions. Sandboxing must be designed separately. [S03][S18]

### Recommended use

Create a distinct Profile when a specialist needs one or more of:

- independent model/provider
- independent credentials
- different tool/MCP permissions
- distinct SOUL/persona
- independent memory/history
- independent skills
- independent cron/gateway behavior

Do not create separate Profiles merely to parallelize one short task; use delegation for that.

---
