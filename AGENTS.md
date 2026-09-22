# Usage-Efficient Codex Policy

For every nontrivial engineering, agent-building, process-building, repository, or file-generation task in this repository, apply the `usage-efficient-orchestrator` skill before substantial work.

## Always-on rules

1. Optimize for the user's included Work/Codex allowance, not maximum autonomous activity.
2. Treat the primary model as supervisor/architect first. Delegate bounded work to the cheapest capable subagent.
3. Default task budget target: **<= 5 percentage points of weekly allowance per user turn**.
4. Absolute policy ceiling: **never intentionally plan a single turn expected to consume > 10 percentage points**.
5. Codex does not expose a reliable live percent-consumed meter to the model during every turn. Therefore the 5% rule is a conservative stop-loss policy, not a guaranteed billing meter. If live usage is unavailable, stop before expensive escalation or scope expansion rather than guessing.
6. If a task is plausibly >5%, split it into phases and ask the user before the next expensive phase.
7. Default delegation:
   - Luna/low: repository mapping, search, extraction, repetitive/read-heavy work.
   - Terra/low-medium: routine implementation, targeted fixes, focused tests.
   - Terra/medium-high: review, security/correctness checks.
   - Sol/medium: difficult implementation/integration after lower-cost workers are insufficient.
   - Primary Astra/Sol: architecture, decomposition, integration decisions, escalation only.
8. Never delegate for its own sake. If delegation overhead exceeds the work, do it directly with the cheapest capable model.
9. Avoid duplicate discovery, full-repository rescans, repeated passing tests, broad refactors, and multiple agents doing the same job unless independent verification is necessary.
10. Maximum 3 concurrent subagents by default.
11. Stop after two failed implementation attempts or when the architecture materially changes; summarize and ask before continuing.
12. Keep Git as the source of truth. Before edits, inspect status/history. Keep changes scoped and reviewable. Do not overwrite unrelated user changes.
13. For meaningful work, use focused commits. Preserve rollback points. Releases require a version/changelog/QA step when the project uses versioning.
14. Return concise progress summaries so the primary agent does not re-read large worker contexts.

The detailed routing, budget, escalation, and stop-loss rules are in:
`.agents/skills/usage-efficient-orchestrator/SKILL.md`.
