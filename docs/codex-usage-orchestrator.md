# Usage-Efficient Codex Orchestrator

Version: 1.0.0

This repository contains a version-controlled Codex architecture for conserving Work/Codex allowance while still using strong models for architecture and integration.

## Architecture

Primary supervisor (for example Astra at Light/Low)
-> Luna scouts/researchers for read-heavy work
-> Terra implementer/reviewer for routine engineering
-> Sol specialist only when justified
-> primary supervisor integrates and decides whether another phase is worth the budget

The project-level implementation is:
- `AGENTS.md`: always-on policy for this repository.
- `.agents/skills/usage-efficient-orchestrator/`: detailed skill and references.
- `.codex/config.toml`: project subagent defaults and role declarations.
- `.codex/agents/*.toml`: narrow model-specific workers.

## Why the 5% limit is a stop-loss rather than an account hard cap

OpenAI exposes current Work/Codex allowance in Settings -> Usage and `/status` in an active Codex CLI session, but the model is not guaranteed a continuously queryable percentage meter during every turn. Therefore this system never claims it can technically prevent an exact account-side percentage crossing when no live usage reading is available.

Instead it enforces:
- <=5 percentage-point target per turn;
- >10 percentage-point work is never intentionally planned as one turn;
- bounded phase sizes;
- three subagents maximum by default;
- no duplicate scans/tests;
- two-failure stop rule;
- user approval before expensive escalation.

If a live usage reading is available, use the start percentage as a real checkpoint and stop at the configured target.

## Make it global across all repositories

Codex supports user-level instructions at `~/.codex/AGENTS.md` and user-level skills at `~/.agents/skills`.

To make this policy apply everywhere:
1. Copy this repository's `AGENTS.md` to `~/.codex/AGENTS.md` (merge it if you already have global instructions).
2. Copy `.agents/skills/usage-efficient-orchestrator` to `~/.agents/skills/usage-efficient-orchestrator`.
3. Copy the custom agent TOMLs to `~/.codex/agents/`.
4. Merge the `[agents]` settings and role declarations from `.codex/config.toml` into `~/.codex/config.toml`.
5. Restart Codex if the skill does not immediately appear.

Keep this GitHub repository as the canonical source. Update here first, then sync the global copies.

## Recommended primary setting

For expensive architectural work, use the strong primary model at its lowest practical reasoning/intelligence level and let the skill explicitly delegate bounded work. Raise reasoning only when the escalation policy justifies it.

## Version control

Changes to this orchestration policy should use semantic versions:
- patch: wording/routing refinements;
- minor: new worker role or new budget behavior;
- major: changed orchestration contract.

Record every deployed/installed revision by Git commit so it can be rolled back.
