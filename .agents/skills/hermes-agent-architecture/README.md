# Hermes Agent Architecture Knowledge Skill

A production-oriented Hermes knowledge-base skill for designing persistent agents, subagents, workflows, instructions, contracts, tool boundaries, automation, security, observability, and release compatibility.

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

## v1.2 release-impact layer

v1.2 adds a deterministic change-control engine on top of the v1.1 compatibility layer:

- `compatibility/impact-map.json` — maps Hermes capabilities and source areas to affected files/routing/tests.
- `compatibility/upgrade-matrix.json` — tracks the verified baseline and future stable-release transitions.
- `maintenance/change-event.schema.json` — strict input contract for weekly detected changes.
- `maintenance/impact_engine.py` — classifies severity, review requirements, blast radius, and targeted regression cases.
- `tests/release-impact-cases.json` — deterministic release/change scenarios.
- `tests/test_release_impact.py` — verifies classification and targeted regression selection.
- `references/14-release-impact-engine.md` — operating guide.

Severity levels are `info -> patch -> minor -> major -> critical`. Stable-release changes always require a branch/PR even when not breaking. Ambiguous, unknown, breaking, architectural, and security changes are review-gated.

## Maintenance

- Machine-readable primary-source inventory: `maintenance/source-manifest.json`
- Scheduled audit specification: `maintenance/weekly-refresh-spec.md`
- Ready-to-schedule execution prompt: `maintenance/weekly-refresh-prompt.md`
- Structural validation: `python tests/validate_skill.py`
- Architecture regression validation: `python tests/test_architecture_regressions.py`
- Release-impact regression validation: `python tests/test_release_impact.py`

Preferred maintenance pattern:

`research -> change event -> impact classification -> targeted patch -> compatibility/upgrade update -> deterministic tests -> reviewed promotion`

The impact engine selects the most relevant architecture regression cases for the affected capabilities while CI still runs the complete deterministic suite before merge.
