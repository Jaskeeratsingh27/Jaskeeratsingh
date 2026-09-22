# Usage-Efficient Codex Policy

Version: 1.1.0

For every nontrivial engineering, agent-building, process-building, repository, or file-generation task in this repository, apply the `usage-efficient-orchestrator` skill before substantial work.

## Always-on control-plane rules

1. Optimize for the user's included Work/Codex allowance, not maximum autonomous activity.
2. Treat the primary model as supervisor/architect first. Delegate bounded work to the cheapest capable role.
3. Default budget profile is **balanced**: target <=5 percentage points of weekly allowance per user turn; never intentionally plan >10 percentage points in one turn.
4. If the user requests `economy`, use a <=3-point target and <=5-point ceiling.
5. Exact account-side percentage enforcement is unavailable when the model cannot read a live usage meter. In that case enforce the proxy counters and stop-loss gates in the skill.
6. Every nontrivial task must create a compact internal **Task Envelope** before substantial execution: goal, scope, risk, budget, work units, routing, limits, definition of done, and stop condition.
7. Assess **risk separately from complexity**. Security/auth, secrets, billing, destructive operations, production infrastructure, migrations, and irreversible changes require stronger review even if the edit is small.
8. **Single-writer rule:** at most one write-capable worker may modify the same working tree at a time. Parallel workers are read-only unless isolated worktrees/branches are explicitly created.
9. Default delegation roles:
   - cheap_reader: repository mapping, search, extraction, repetitive/read-heavy work.
   - standard_engineer: routine implementation, targeted fixes, focused tests.
   - reviewer: correctness/security/regression review.
   - senior_specialist: difficult implementation/integration after lower-cost workers are insufficient.
   - architect: architecture, decomposition, integration decisions, escalation only.
10. Never delegate for its own sake. If delegation overhead exceeds the work, perform it directly with the cheapest capable role.
11. Avoid duplicate discovery, full-repository rescans, repeated passing tests, broad refactors, and multiple agents solving the same problem unless independent verification materially reduces risk.
12. Maximum 3 concurrent subagents by default. Only one may be a writer in a shared working tree.
13. Classify failures before escalation: information, tooling/environment, test/fixture, implementation, architecture, or permission/security. Escalate only when stronger reasoning can plausibly solve the classified failure.
14. Stop after the configured retry limit, when architecture materially changes, when scope expands, or before a likely budget overrun. Report and ask the user before continuing.
15. Keep Git as the source of truth. Preserve unrelated user changes, keep phases reversible, use focused commits, and make deployments traceable to commits.
16. Worker handoffs must use the structured handoff schema and remain concise so the primary model does not reread large contexts.
17. Before release or promotion, run the orchestrator validation suite and include a TL;DR validation report.

Detailed control-plane rules live in:
`.agents/skills/usage-efficient-orchestrator/SKILL.md`.
