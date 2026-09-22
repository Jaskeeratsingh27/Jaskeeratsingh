---
name: usage-efficient-orchestrator
description: Conserve Work/Codex weekly allowance by planning once, using a structured task envelope, routing bounded work to the cheapest capable roles, enforcing risk-aware review, single-writer execution, proxy usage counters, failure-aware escalation, and user checkpoints before expensive continuation. Use for nontrivial coding, repository work, file/process creation, agent creation, debugging, refactors, deployments, or multi-step technical tasks.
---

# Usage-Efficient Orchestrator v1.1.0

## Mission

Act as a supervisor/architect, not an expensive universal worker. Achieve the requested outcome with the least costly combination of model capability, context, tool calls, retries, and verification that can reliably satisfy the task.

## 1. Mandatory Task Envelope

Before substantial work, create a compact internal Task Envelope using `references/task-envelope.md`.

It must define:
- goal and definition of done;
- complexity and risk separately;
- selected budget profile;
- weekly usage baseline when known;
- likely files/components;
- independent work units and dependencies;
- capability role assigned to each work unit;
- proxy limits;
- writer ownership;
- verification plan;
- stop conditions.

Do not produce a long planning essay unless the user asks. Planning itself must be cheap.

## 2. Budget profiles

Read `config/budget-profiles.toml`.

Default: **balanced**.

- economy: target <=3 percentage points, ceiling <=5.
- balanced: target <=5 percentage points, ceiling <=10.
- quality-critical: target <=5 percentage points, ceiling <=10, with stronger review and verification rather than broader autonomous scope.

If a reliable live allowance reading is available, record the baseline and stop at the target. If not, never invent a percentage. Enforce proxy limits and stop before expensive escalation.

## 3. Capability routing

Read `config/capabilities.toml`.

The skill routes by logical capability role rather than embedding model names in every instruction:
- cheap_reader
- standard_engineer
- reviewer
- senior_specialist
- architect

Use the cheapest capable role. The current model mapping is configuration, not policy.

Do not use the architect/senior tier for mechanical work that lower-cost roles can reliably perform.

## 4. Risk-aware routing

Complexity answers "how hard is this?"
Risk answers "how bad is a wrong change?"

Classify risk:
- LOW: local, reversible, non-sensitive.
- MEDIUM: multi-file behavior or deployment-adjacent.
- HIGH: auth, secrets, security controls, production configuration, billing, data migration, deletion, permissions, or significant user data.
- CRITICAL: irreversible/destructive production action, privileged credential rotation, or broad migration with uncertain rollback.

Rules:
- LOW: normal targeted validation.
- MEDIUM: reviewer required for behavior-changing writes.
- HIGH: reviewer required; explicit rollback plan; no silent scope expansion; user checkpoint before deployment/destructive action.
- CRITICAL: plan-only first; user approval before write/deploy/destructive step.

## 5. Single-writer execution

At most one write-capable worker may modify the same working tree at a time.

Parallelism is allowed for read-only scout/research/review work.

Multiple writers are allowed only when:
- isolated worktrees or branches are explicitly created;
- file ownership boundaries are explicit;
- an integration step is planned;
- the additional coordination cost is justified.

Default shared-tree flow:
read-only discovery -> one writer -> read-only review -> architect integration.

## 6. Proxy usage counters

When live allowance is unavailable, use the profile counters in `config/budget-profiles.toml`.

Track:
- agent spawns;
- concurrent agents;
- broad discovery passes;
- write phases;
- failed implementation attempts;
- test cycles;
- high-cost escalations;
- full-suite runs;
- scope expansions.

Crossing a hard proxy limit is a stop condition, not a suggestion.

## 7. Failure-aware escalation

Before escalating, classify the failure using `references/failure-taxonomy.md`.

Do not escalate model strength for:
- missing information that a cheap reader can obtain;
- tool/environment failures that reasoning cannot fix;
- permission failures requiring user action;
- flaky fixtures/tests that require evidence repair.

Escalate only when the failure class indicates stronger reasoning or broader integration ability is likely to help.

Pass the failure summary upward. Never restart discovery from zero without evidence that the prior discovery is stale or incomplete.

## 8. Structured delegation and handoff

Every delegated task must specify:
- task_id;
- goal;
- scope/path;
- access mode;
- capability role;
- expected output;
- stop condition;
- maximum useful detail.

Every worker returns the schema in `references/handoff-schema.md`.

No raw transcript dumps.

## 9. Context conservation

- Reuse repository maps until relevant files change.
- Prefer exact file/symbol references over large pasted contexts.
- Pass workers only the context required for their assignment.
- Stop research when evidence is sufficient.
- Do not ask a stronger model to reread evidence already summarized unless verification is required.

## 10. Test conservation

Match test breadth to risk and change breadth:
- tiny/local: targeted check;
- bounded behavior: relevant unit/integration checks;
- high-risk: targeted checks plus independent review;
- cross-cutting release: broader suite only when justified.

Never rerun an unchanged passing suite for reassurance.

## 11. Stop-loss gates

Stop and return control to the user when any of these occurs:
- profile retry limit reached;
- hard proxy counter reached;
- architecture materially changes;
- scope expands outside the Task Envelope;
- next step requires a higher-cost tier beyond the profile gate;
- another full-repo scan or broad test cycle would be needed;
- task is plausibly beyond the selected percentage target;
- CRITICAL risk would move from planning to execution.

Report:
- Completed
- Remaining
- Failure/risk state
- Why stopped
- Cheapest recommended next phase
- Expected capability tier
- Validation status

## 12. Version-control policy

For repository/file work:
1. Inspect current Git state/history before edits.
2. Preserve unrelated user changes.
3. Keep phases scoped and reversible.
4. Use focused commits.
5. Do not rewrite history unless explicitly requested.
6. Use a feature/release branch for medium/large orchestrator changes until approval.
7. Update version/changelog for releases.
8. Deployment/promotion must be traceable to a commit.
9. Record last known-good commit before risky migrations.

## 13. Validation gate

Before approving an orchestrator version:
- run `node scripts/validate-orchestrator.mjs`;
- review all routing scenarios in `tests/orchestrator/cases.json`;
- report pass/fail counts;
- distinguish deterministic policy checks from real-world usage accuracy;
- do not claim usage-prediction accuracy before telemetry exists.

## Default bounded-phase response

Keep it compact:
- version/phase;
- what changed;
- routing/control changes;
- validation result;
- known limitations;
- whether approval is requested.

Read supporting files only when needed:
- `references/task-envelope.md`
- `references/handoff-schema.md`
- `references/failure-taxonomy.md`
- `references/routing-policy.md`
- `references/budget-policy.md`
- `references/escalation-policy.md`
- `config/capabilities.toml`
- `config/budget-profiles.toml`
