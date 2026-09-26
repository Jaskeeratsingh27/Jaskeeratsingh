# Cron and Durable Automation

Hermes cron supports one-shot and recurring tasks, skill attachment, delivery targets, fresh agent sessions, no-agent scripts, external event triggers, provider/model overrides, and continuity between recurring runs.

## Architecture use

Use Cron for scheduled execution, not as the multi-agent workflow database. A scheduled job can start/reconcile work, but Kanban or another durable task system should own cross-agent lifecycle state.

## Skill attachment

Cron jobs can attach one or multiple skills. This is useful for recurring jobs that should inherit stable procedures without duplicating their full text in every prompt.

## Continuity

Recurring jobs normally start fresh. `continuity=true` can inject the previous substantive result so monitors/scouts can deduplicate and continue from prior state.

## Safety

Cron management is disabled inside cron-run sessions by default to prevent runaway recursive scheduling. If agent-managed scheduling is enabled, treat it as a privileged capability.

## Weekly Hermes knowledge refresh (planned, not automatically enabled)

A future weekly job for this knowledge base should:

1. Check the Hermes GitHub releases page for the newest stable tag.
2. Check official docs pages listed in the source index for material architecture changes.
3. Compare findings to the package's `VERSION` and research baseline.
4. Produce a change report before modifying knowledge files.
5. Update only claims that are verified against primary sources.
6. Record source URLs, release/tag/commit, and retrieval date.
7. Run contract/skill lint tests.
8. Commit changes through version control, ideally via branch/PR rather than silently overwriting the live skill.

See `maintenance/weekly-refresh-spec.md` for the proposed maintenance contract.
