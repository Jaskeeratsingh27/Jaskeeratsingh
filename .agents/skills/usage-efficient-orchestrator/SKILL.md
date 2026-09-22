---
name: usage-efficient-orchestrator
description: Conserve Work/Codex weekly allowance by planning once, using a structured task envelope, routing bounded work to the cheapest capable roles, enforcing risk-aware review, single-writer execution, proxy usage counters, failure-aware escalation, reliability/CI gates, drift detection, and user checkpoints before expensive continuation. Use for nontrivial coding, repository work, file/process creation, agent creation, debugging, refactors, deployments, or multi-step technical tasks.
---

# Usage-Efficient Orchestrator v1.2.0

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

Planning itself must be cheap.

## 2. Budget profiles

Read `config/budget-profiles.toml`.

Default: **balanced**.

- economy: target <=3 percentage points, ceiling <=5.
- balanced: target <=5 percentage points, ceiling <=10.
- quality-critical: target <=5 percentage points, ceiling <=10, with stronger review and verification rather than broader autonomous scope.

If a reliable live allowance reading is available, record the baseline and stop at the target. If not, never invent a percentage. Enforce proxy limits and stop before expensive escalation.

## 3. Capability routing

Read `config/capabilities.toml`.

Route by logical capability role:
- cheap_reader
- standard_engineer
- reviewer
- senior_specialist
- architect

The current role-to-model mapping is configuration, not policy. Use the cheapest capable role.

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

Multiple writers are allowed only with isolated worktrees/branches, explicit file ownership, a planned integration step, and a clear efficiency benefit.

## 6. Proxy usage counters

When live allowance is unavailable, use `config/budget-profiles.toml`.

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

Crossing a hard proxy limit is a stop condition.

## 7. Failure-aware escalation

Before escalating, classify the failure with `references/failure-taxonomy.md`.

Do not escalate model strength for missing information, environment/tool failures, permission failures, or bad/flaky fixtures unless evidence shows stronger reasoning is relevant.

Pass a concise failure summary upward. Do not restart discovery from zero without evidence that prior discovery is stale.

## 8. Structured delegation and handoff

Every delegated task specifies task_id, goal, scope/path, access mode, capability role, expected output, stop condition, and maximum useful detail.

Workers return `references/handoff-schema.md`. No raw transcript dumps.

## 9. Context conservation

- Reuse repository maps until relevant files change.
- Prefer exact file/symbol references over large pasted contexts.
- Pass workers only required context.
- Stop research when evidence is sufficient.
- Do not make a stronger model reread already-distilled evidence unless verification is required.

## 10. Test conservation

Match test breadth to risk and change breadth.

Never rerun an unchanged passing suite for reassurance.

## 11. Reliability control plane

v1.2 adds mandatory reliability gates:

### Canonical source
GitHub repository content is canonical. Global Codex copies are runtime mirrors, not independent sources of truth.

### QA gate
Before orchestrator promotion, run:

```bash
node scripts/orchestrator-qa.mjs
```

All component checks must pass.

### Drift gate
Use:

```bash
node scripts/orchestrator-status.mjs
```

If global files are stale or missing, sync them before relying on the installed policy.

### Safe sync
Use:

```bash
node scripts/orchestrator-sync.mjs --dry-run
node scripts/orchestrator-sync.mjs
```

The sync process backs up managed files before replacement and refuses to silently overwrite an unrecognized existing global `[agents]` configuration.

### Security gate
`scripts/security-check-orchestrator.mjs` rejects high-confidence credential material, unsafe sandbox expansion in managed worker roles, and policy/config violations.

### CI gate
Pull requests and orchestrator branches run the same deterministic QA in GitHub Actions. A red CI result blocks promotion.

## 12. Stop-loss gates

Stop and return control to the user when:
- profile retry limit is reached;
- a hard proxy counter is reached;
- architecture materially changes;
- scope expands outside the Task Envelope;
- next step requires a higher-cost tier beyond the profile gate;
- task is plausibly beyond the selected percentage target;
- CRITICAL risk would move from planning to execution;
- QA/security/drift status is unsafe for the requested promotion or sync.

## 13. Version-control and release policy

1. Inspect current Git state/history before edits.
2. Preserve unrelated user changes.
3. Keep phases scoped and reversible.
4. Use focused commits.
5. Do not rewrite history unless explicitly requested.
6. Use a version branch for medium/large orchestrator changes.
7. Update manifest/version/changelog for releases.
8. Promotion must be traceable to a PR/commit.
9. Record last known-good release.
10. Do not merge an orchestrator release candidate until QA is green and the user approves.

## 14. Validation accuracy

Deterministic policy/CI checks prove configuration consistency and policy invariants only.

Do not claim:
- exact weekly usage savings;
- real-model routing accuracy;
- predicted task burn accuracy;

until the observability and feedback stages collect real telemetry.

## Default bounded-phase response

Keep it compact:
- version/phase;
- what changed;
- validation result;
- security/drift state;
- known limitations;
- approval required or not.

Read supporting files only when needed:
- `references/task-envelope.md`
- `references/handoff-schema.md`
- `references/failure-taxonomy.md`
- `references/routing-policy.md`
- `references/budget-policy.md`
- `references/escalation-policy.md`
- `config/capabilities.toml`
- `config/budget-profiles.toml`
