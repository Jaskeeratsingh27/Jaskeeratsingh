# Hermes Agent Architecture Knowledge Skill

A production-oriented Hermes knowledge-base skill for designing persistent agents, subagents, workflows, instructions, contracts, tool boundaries, automation, security, and observability.

## Invocation

When installed in Hermes, invoke with:

`/hermes-agent-architecture <request>`

Examples:

- `/hermes-agent-architecture design a researcher + engineer + QA system`
- `/hermes-agent-architecture write SOUL.md and AGENTS.md for my coding agents`
- `/hermes-agent-architecture design structured input/output contracts for subagents`
- `/hermes-agent-architecture review this architecture for Hermes compatibility`

## Baseline

Research date: 2026-09-21.
Latest stable release verified: Hermes Agent v0.21.3 (`v2026.9.14`).

## Important

Hermes develops rapidly. The package deliberately distinguishes pinned stable behavior from current documentation and includes a weekly-refresh design under `maintenance/`.

## Maintenance

- Machine-readable primary-source inventory: `maintenance/source-manifest.json`
- Scheduled audit specification: `maintenance/weekly-refresh-spec.md`
- Ready-to-schedule execution prompt: `maintenance/weekly-refresh-prompt.md`
- Structural validation: `python tests/validate_skill.py`

The preferred maintenance pattern is audit -> diff -> validate -> reviewed promotion for material changes.
