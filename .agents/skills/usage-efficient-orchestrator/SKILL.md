---
name: usage-efficient-orchestrator
description: Conserve Work/Codex weekly allowance by planning once, routing bounded work to the cheapest capable subagents, limiting context/test/retry waste, enforcing a 5%-target stop-loss and 10%-absolute planning ceiling, and requiring user approval before expensive escalation. Use for nontrivial coding, repository work, file/process creation, agent creation, debugging, refactors, deployments, or multi-step technical tasks.
---

# Usage-Efficient Orchestrator v1.0.0

## Mission

Act as a supervisor/architect, not an expensive universal worker. Achieve the requested outcome with the least capable model and least amount of context, tool use, retries, and duplicated work that can reliably complete each work unit.

This skill applies to:
- coding and debugging
- repository/file changes
- agent/subagent creation
- process/workflow creation
- architecture and migrations
- tests/reviews
- deployments and release work

## Non-negotiable budget policy

- Default per-user-turn target: **<= 5 percentage points of the weekly Work/Codex allowance**.
- Absolute policy ceiling: **never intentionally plan a single turn expected to consume >10 percentage points**.
- The model usually does **not** have a reliable live percentage-consumed meter during the turn. Therefore these are execution stop-loss rules, not a guaranteed account-side hard cap.
- If live usage information is available, record the starting point and stop before crossing the 5-point target.
- If live usage is unavailable, use the conservative proxy limits below and stop before a likely expensive escalation.
- If the task appears likely to exceed 5%, split it into phases before execution. Complete the safest useful phase, summarize, and ask the user before the next expensive phase.
- Never continue merely because more work is possible.

## Preflight: analyze once

Before substantial work, create an internal compact task map:

1. Goal and definition of done.
2. What is already known.
3. Minimum missing evidence.
4. Likely files/components.
5. Independent work units.
6. Cheapest capable model for each work unit.
7. Expected expensive operations.
8. Stop condition.

Do not produce a long planning essay unless the user asks. Planning itself must be cheap.

## Routing hierarchy

Use the cheapest capable route:

1. **Direct cheap action** when delegation overhead would exceed the task.
2. **Luna / low** for:
   - repository/file discovery
   - grep/search/symbol mapping
   - log/error extraction
   - documentation lookup
   - repetitive transformations
   - concise summaries
3. **Terra / low-medium** for:
   - routine implementation
   - focused frontend/backend changes
   - config edits
   - targeted tests
   - small refactors
4. **Terra / medium-high** for:
   - correctness/security review
   - tricky but bounded debugging
5. **Sol / medium** only for:
   - difficult integration
   - cross-cutting implementation
   - a demonstrated Terra failure
6. **Primary Astra/Sol** should primarily:
   - understand intent
   - choose architecture
   - decompose and delegate
   - reconcile worker outputs
   - make final integration decisions
   - decide whether escalation is justified

Do not use Astra/Sol for mechanical work that Luna/Terra can reliably do.

## Delegation contract

Every delegated task must specify:
- exact goal
- exact scope/path when known
- read-only vs write
- expected output format
- stop condition
- maximum useful detail

Workers must return distilled results, not raw context dumps.

Default maximum concurrently open subagents: **3**.

Do not spawn multiple agents for the same question unless independent verification materially reduces risk.

Do not delegate a trivial task when explaining it costs more than doing it.

## Context conservation

- Never rescan the whole repository if an earlier scout mapped the relevant paths.
- Pass workers only the context required for their assignment.
- Prefer file/symbol references over pasting large files.
- Prefer summaries of completed worker work over replaying worker transcripts.
- Reuse known-good evidence until a code change invalidates it.
- Stop research when evidence is sufficient for the decision.

## Test conservation

- Match test breadth to change breadth.
- Tiny/config/UI text change -> targeted check.
- Bounded behavior change -> relevant unit/integration tests.
- Cross-cutting release -> broader suite only when justified.
- Never rerun an unchanged passing suite simply for reassurance.
- After a failed test, change code/evidence before rerunning.

## Retry and escalation stop-loss

Stop and return control to the user when any of these occurs:
- two implementation attempts fail;
- the required architecture materially changes;
- scope expands outside the original request;
- more than three independent investigations are now needed;
- a second high-cost reasoning escalation appears necessary;
- the task is now plausibly beyond the 5% target;
- continuing would require Astra high/extra-high or another major full-repo/test pass.

Report:
- Completed
- Remaining
- Blocker/why it became expensive
- Cheapest recommended next phase

## Version-control policy

For file/repository work:
1. Inspect current Git state/history before edits.
2. Preserve unrelated user changes.
3. Keep changes scoped and reversible.
4. Use focused commits for meaningful phases.
5. Do not rewrite history unless explicitly requested.
6. When the project uses versions, update version/changelog for releases.
7. Deployment must be traceable to a commit.
8. Record the last known-good commit before risky migrations.

## Usage checkpoint protocol

When the user supplies current remaining weekly percentage, treat it as the authoritative baseline for the turn.

If a reliable live meter/status becomes available to the session:
1. Record baseline.
2. Execute one bounded phase.
3. Re-check before escalation.
4. Stop at the 5-point target and ask.

Without a reliable live meter:
- do not claim an exact percentage was consumed;
- enforce the proxy stop-loss rules;
- split medium/large tasks into user-approved phases.

## Default response after a bounded phase

Keep it compact:
- what changed
- what was delegated and to which tier
- validation result
- commit/version when applicable
- whether another phase is needed
- whether continuing is expected to be cheap or expensive

Read the reference files only when needed:
- `references/routing-policy.md`
- `references/budget-policy.md`
- `references/escalation-policy.md`
