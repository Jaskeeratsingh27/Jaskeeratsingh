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

## v1.1 quality layer

The skill now includes a machine-readable compatibility/control layer:

- `compatibility/hermes-compatibility.json` — current verified Hermes baseline and capability status.
- `compatibility/primitive-routing.json` — canonical Hermes primitive-selection rules.
- `tests/architecture-cases.json` — regression scenarios that must keep routing to the intended primitive.
- `tests/test_architecture_regressions.py` — deterministic architecture contract tests.
- `.github/workflows/hermes-architecture-ci.yml` — repository CI for skill changes and pull requests.

The regression tests intentionally validate deterministic architecture contracts rather than trying to grade arbitrary LLM prose.

## Maintenance

- Machine-readable primary-source inventory: `maintenance/source-manifest.json`
- Scheduled audit specification: `maintenance/weekly-refresh-spec.md`
- Ready-to-schedule execution prompt: `maintenance/weekly-refresh-prompt.md`
- Structural validation: `python tests/validate_skill.py`
- Architecture regression validation: `python tests/test_architecture_regressions.py`

The preferred maintenance pattern is:

`audit -> diff -> compatibility update -> structural validation -> regression validation -> reviewed promotion`

Material or ambiguous Hermes changes should be proposed through a branch/PR instead of silently rewriting the canonical knowledge base.
