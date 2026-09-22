# Usage-Efficient Codex Policy

Version: 1.4.0

For every nontrivial engineering, agent-building, process-building, repository, or file-generation task in this repository, apply the `usage-efficient-orchestrator` skill before substantial work.

## Always-on control-plane rules

1. Optimize for the user's included Work/Codex allowance, not maximum autonomous activity.
2. Treat the primary model as supervisor/architect first. Delegate bounded work to the cheapest capable role.
3. Default budget profile is **balanced**: target <=5 percentage points of weekly allowance per user turn; never intentionally plan >10 percentage points in one turn.
4. If the user requests `economy`, use a <=3-point target and <=5-point ceiling.
5. Exact account-side percentage enforcement is unavailable when the model cannot read a live usage meter. In that case enforce proxy counters and stop-loss gates; never fabricate a usage percentage.
6. Every nontrivial task must create a compact internal **Task Envelope** before substantial execution: goal, scope, risk, budget, work units, routing, limits, definition of done, and stop condition.
7. **Usage-intelligence gate:** after the Task Envelope and before substantial execution, run one cheap historical burn prediction when the local intelligence tool is available. Treat the result as empirical guidance, not a guaranteed meter.
8. If intelligence returns `approval_required`, stop and ask before execution. If it returns `split_required`, split the work. If it returns `plan_only`, remain plan-only. If it returns `proxy_only`, use the proxy budget without inventing a percentage.
9. A low-confidence prediction never relaxes proxy controls. A prediction failure gets at most one cheap retry, then falls back to proxy controls.
10. Assess **risk separately from complexity**. Security/auth, secrets, billing, destructive operations, production infrastructure, migrations, and irreversible changes require stronger review even if the edit is small.
11. **Single-writer rule:** at most one write-capable worker may modify the same working tree at a time. Parallel workers are read-only unless isolated worktrees/branches are explicitly created.
12. Default delegation roles:
   - cheap_reader: repository mapping, search, extraction, repetitive/read-heavy work.
   - standard_engineer: routine implementation, targeted fixes, focused tests.
   - reviewer: correctness/security/regression review.
   - senior_specialist: difficult implementation/integration after lower-cost workers are insufficient.
   - architect: architecture, decomposition, integration decisions, escalation only.
13. Never delegate for its own sake. If delegation overhead exceeds the work, perform it directly with the cheapest capable role.
14. Avoid duplicate discovery, full-repository rescans, repeated passing tests, broad refactors, and multiple agents solving the same problem unless independent verification materially reduces risk.
15. Maximum 3 concurrent subagents by default. Only one may be a writer in a shared working tree.
16. Classify failures before escalation: information, tooling/environment, test/fixture, implementation, architecture, or permission/security. Escalate only when stronger reasoning can plausibly solve the classified failure.
17. Stop after the configured retry limit, when architecture materially changes, when scope expands, or before a likely budget overrun. Report and ask the user before continuing.
18. Keep Git as the source of truth. Preserve unrelated user changes, keep phases reversible, use focused commits, and make deployments traceable to commits.
19. Worker handoffs must use the structured handoff schema and remain concise so the primary model does not reread large contexts.
20. **Observability is mandatory but lightweight:** each nontrivial task gets a task ID and a privacy-preserving local telemetry lifecycle. Never record prompts, source code, secrets, file contents, or raw conversation text.
21. When the user supplies a weekly-usage checkpoint, record it as measured data. Distinguish measured usage from inferred/unknown usage.
22. Telemetry or intelligence tooling failures must not trigger expensive reasoning. Classify them as tooling/environment after one retry and continue with proxy controls unless instrumentation itself is the requested task.
23. Before orchestrator promotion or global sync, run `node scripts/orchestrator-qa.mjs`. A failed check blocks promotion.
24. GitHub is canonical. Global Codex copies are runtime mirrors; detect drift before relying on them.
25. Medium/large orchestrator revisions remain on a version branch until validation is green and the user explicitly approves promotion.

Detailed control-plane rules live in:
`.agents/skills/usage-efficient-orchestrator/SKILL.md`.
