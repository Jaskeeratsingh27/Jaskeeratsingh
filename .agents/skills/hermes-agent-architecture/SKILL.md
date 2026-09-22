---
name: hermes-agent-architecture
description: Design production Hermes agents and multi-agent systems
version: 1.1.0
metadata:
  hermes:
    tags: [hermes, agents, multi-agent, architecture, orchestration]
    category: engineering
---

# Hermes Agent Architecture

## When to Use

Load this skill whenever the task involves Hermes Agent architecture, profile/Bot design, subagents, Kanban orchestration, SOUL.md, AGENTS.md, skills, model/tool routing, MCP, memory, cron, agent-to-agent contracts, production hardening, observability, or creating instructions/files for Hermes agents.

## Knowledge Baseline

- Research date: 2026-09-21.
- Stable release verified during research: Hermes Agent v0.21.3 (`v2026.9.14`).
- Hermes documentation can describe behavior ahead of the latest stable tag. Treat docs/current-main behavior and pinned-release behavior as separate claims.
- For production work, pin a Hermes release/commit and validate generated config against that target.
- Before making version-sensitive claims, consult `compatibility/hermes-compatibility.json`; if a capability is marked `needs_revalidation`, verify it against primary sources before relying on it.

## Operating Procedure

1. Classify the requested Hermes primitive before designing anything:
   - persistent specialist identity -> Profile/Bot
   - short isolated reasoning/execution -> `delegate_task`
   - durable cross-agent workflow -> Kanban
   - reusable procedure -> Skill
   - project-wide instructions -> `.hermes.md` / `AGENTS.md`
   - identity/personality -> `SOUL.md`
   - durable recurring execution -> Cron
   - external capability -> built-in tool/toolset or MCP
   - enforcement/telemetry -> hooks/plugins
2. Load only the references needed for the task. Start with `references/00-architecture-map.md` and then topic-specific files.
3. Separate identity, procedure, project context, task context, workflow state, artifacts, and machine-readable contracts. Do not collapse them into one giant prompt.
4. For delegated children, assume zero parent conversation context. Pass all required facts in `goal` and `context`; workspace project context may be inherited, but `SOUL.md` is not.
5. Prefer structured `output_schema` contracts for machine-consumed child results. Keep schemas forgiving: require only fields downstream logic actually consumes.
6. Use Kanban, not nested subagents, when work must survive restarts, cross persistent agent boundaries, require human input/review, or remain auditable/discoverable.
7. Give each persistent specialist its own Hermes profile. Never treat a profile as a security sandbox; use terminal/container sandboxing and capability restrictions separately.
8. Use explicit toolsets/MCP exposure to enforce least privilege. Do not rely on prose instructions to prohibit capabilities that can be removed technically.
9. Use `execute_code` for deterministic multi-tool pipelines with processing/branching and `terminal` for shell/build/process work.
10. Design failure behavior explicitly: retries, timeouts, blocked state, human escalation, idempotency, partial results, provider fallback, and verification evidence.
11. Build observability around Hermes correlation IDs so sessions, turns, API requests, tools, and child agents can be stitched into one trace.
12. Before finalizing production architecture, consult `references/11-production-checklist.md`.

## Compatibility and Control Layer

- `compatibility/hermes-compatibility.json` records the skill version, pinned stable Hermes baseline, verified capability status, source IDs, and revalidation flags.
- `compatibility/primitive-routing.json` is the machine-readable canonical decision table for choosing core Hermes primitives.
- `tests/architecture-cases.json` contains regression fixtures that protect those routing decisions.
- Run both `python tests/validate_skill.py` and `python tests/test_architecture_regressions.py` before promoting a knowledge-base update.
- Do not clear `needs_revalidation` entries until the affected capability has been checked against official primary sources for the intended Hermes version.

## Architecture Defaults

Use this default hierarchy unless the task warrants a different topology:

User/API -> Orchestrator Profile -> Kanban task graph -> Specialist Profiles -> ephemeral `delegate_task` workers -> durable artifacts -> Review/QA Profile -> completion.

Treat Bot-to-Bot messaging as collaboration, not authoritative workflow state. Treat Kanban as the durable control plane for multi-agent execution.

## Output Expectations

When producing Hermes agent architecture or instruction files, include when relevant:

- target Hermes version/commit
- profiles and role boundaries
- toolsets and permission boundaries
- model/provider per role
- context and memory boundaries
- task/result contracts
- workflow/DAG and handoff rules
- artifact locations/source of truth
- retry/block/review/escalation rules
- verification/acceptance criteria
- security/sandboxing
- token/cost controls
- observability fields
- deployment/update strategy

## Reference Index

- `references/00-architecture-map.md` — primitive selection and system mental model
- `references/01-profiles-bots.md` — persistent agents and Bot Mode
- `references/02-delegation.md` — subagents, context, structured output, depth
- `references/03-kanban.md` — durable orchestration and lifecycle
- `references/04-skills-context-soul.md` — skills, AGENTS, project context, SOUL
- `references/05-memory-sessions.md` — built-in memory and external memory providers
- `references/06-tools-code-mcp.md` — toolsets, execute_code, MCP
- `references/07-model-routing.md` — main/auxiliary models, fallback, routing
- `references/08-cron-automation.md` — scheduled execution and continuity
- `references/09-security.md` — isolation, approvals, credential boundaries
- `references/10-observability-hooks.md` — hooks, IDs, tracing, policy interception
- `references/11-production-checklist.md` — production-readiness checklist
- `references/12-versioning-known-caveats.md` — release pinning and compatibility caveats
- `references/13-source-index.md` — primary-source links

## Templates

Use the templates under `templates/` rather than inventing incompatible handoff structures:

- `task-envelope.schema.json`
- `delegation-result.schema.json`
- `agent-profile-design.md`
- `AGENTS.template.md`
- `SOUL.template.md`

## Pitfalls

- Do not use memory as a large knowledge base.
- Do not assume a subagent sees the parent conversation.
- Do not equate a profile with a sandbox.
- Do not use `delegate_task` as durable workflow state.
- Do not let multiple independent agent processes write the same profile home.
- Do not expose broad toolsets when a role needs only a subset.
- Do not put secrets/raw credentials in task metadata, prompts, artifacts, or telemetry.
- Do not track Hermes `main` blindly in production.
- Do not overconstrain `output_schema`; schema failure should not make useful work unusable.
- Do not mark a task complete without verification evidence when verification is part of the contract.

## Verification

A Hermes architecture is ready to implement only when every agent has a persistent/ephemeral classification, every handoff has a contract, workflow state has an authoritative owner, permissions are explicit, failure paths terminate safely, artifacts are durable, and the design names the pinned Hermes version it targets.

For skill maintenance, promotion is allowed only when structural validation and architecture regression validation both pass and compatibility status is consistent with the pinned Hermes baseline.
