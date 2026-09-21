# Recovered Skill/Agent Factory principles

Source: Claude persistent memory summary. The referenced long-form `SKILL.md`, research findings, implementation roadmap, and published architecture artifact were not present in the export.

## Recovered lifecycle

`discovery -> research -> design -> implementation -> documentation -> QA -> deployment`

## Durable quality bars

Every agent/skill build should explicitly consider:

- security and trust boundaries;
- performance/token/cost budgets;
- reliability, retries, timeouts, and failure states;
- observability and run evidence;
- deterministic validation where possible;
- documentation/runbooks;
- evaluation/golden sets;
- deployment and rollback;
- post-run lessons that can improve future builds.

## Portability rule

Framework selection is an implementation choice, not the architecture. Preserve contracts, tool boundaries, state, gates, and evaluation semantics independently of a particular agent framework.

## Evidence warning

Do not claim the original enterprise factory has been recovered. These are the durable requirements available from memory; replace or enrich them if the authoritative original factory package appears in a later batch.
