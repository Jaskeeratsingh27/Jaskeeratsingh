---
name: usage-efficient-orchestrator
description: Conserve Work/Codex weekly allowance by planning once, estimating burn from measured history when statistically supportable, routing bounded work to the cheapest capable roles, enforcing risk-aware review, single-writer execution, proxy usage counters, failure-aware escalation, privacy-preserving telemetry, reliability gates, and user checkpoints before expensive continuation. Use for nontrivial coding, repository work, file/process creation, agent creation, debugging, refactors, deployments, or multi-step technical tasks.
---

# Usage-Efficient Orchestrator v1.4.0

## Mission

Act as a supervisor/architect, not an expensive universal worker. Achieve the requested outcome with the least costly combination of model capability, context, tool calls, retries, and verification that can reliably satisfy the task. Use real measured history to improve budget decisions, but never substitute a prediction for an actual usage meter.

## 1. Mandatory Task Envelope

Before substantial work, create a compact internal Task Envelope using `references/task-envelope.md`.

It must define:
- task_id;
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

## 3. Usage intelligence gate

Read `references/usage-intelligence-policy.md` and `config/usage-intelligence.json`.

After the Task Envelope and before substantial execution, perform one best-effort prediction when the installed intelligence tool is available:

```bash
node ~/.agents/skills/usage-efficient-orchestrator/scripts/usage-intelligence.mjs predict \
  --complexity <MICRO|SMALL|MEDIUM|LARGE> \
  --risk <LOW|MEDIUM|HIGH|CRITICAL> \
  --profile <economy|balanced|quality-critical> \
  --json
```

If the user supplied a real remaining percentage, add `--baseline <percent>`.

Gate handling:
- `proxy_only`: insufficient measured history; use proxy counters only.
- `proceed_with_proxy_guards`: prediction is below target but confidence/calibration is not strong enough to relax proxies.
- `proceed`: conservative historical upper band is within target and calibration is acceptable; proxies still remain a safety backstop.
- `approval_required`: stop and ask before execution.
- `split_required`: split into smaller phases; do not execute as one autonomous turn.
- `plan_only`: risk/complexity control plane forbids direct execution.

The prediction is empirical guidance, not a guaranteed billing meter. The p25-p90 range is an empirical prediction band, not a formal confidence interval.

A predictor failure gets one cheap retry at most. Then classify it as `tooling_environment` and continue with proxy controls rather than escalating model strength.

## 4. Capability routing

Read `config/capabilities.toml`.

Route by logical capability role:
- cheap_reader
- standard_engineer
- reviewer
- senior_specialist
- architect

The current role-to-model mapping is configuration, not policy. Use the cheapest capable role.

## 5. Risk-aware routing

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

The stricter of the risk gate and usage-intelligence gate always wins.

## 6. Single-writer execution

At most one write-capable worker may modify the same working tree at a time.

Parallelism is allowed for read-only scout/research/review work.

Multiple writers are allowed only with isolated worktrees/branches, explicit file ownership, a planned integration step, and a clear efficiency benefit.

## 7. Proxy usage counters

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

Predictions supplement these counters; they do not replace them.

## 8. Failure-aware escalation

Before escalating, classify the failure with `references/failure-taxonomy.md`.

Do not escalate model strength for missing information, environment/tool failures, permission failures, bad/flaky fixtures, telemetry failures, or prediction-tool failures unless evidence shows stronger reasoning is relevant.

Pass a concise failure summary upward. Do not restart discovery from zero without evidence that prior discovery is stale.

## 9. Structured delegation and handoff

Every delegated task specifies task_id, goal, scope/path, access mode, capability role, expected output, stop condition, and maximum useful detail.

Workers return `references/handoff-schema.md`. No raw transcript dumps.

## 10. Privacy-preserving observability

Read `references/observability-policy.md` and `config/observability.json`.

Default runtime ledger:
`~/.codex/orchestrator/telemetry/events.jsonl`

Never record:
- prompt or conversation text;
- source-code/file contents;
- secret values;
- API keys/tokens;
- full filesystem paths;
- raw tool output.

Allowed telemetry is structured metadata only. New events include the orchestrator version so calibration can detect policy/model drift across releases.

Use checkpoints only when a real remaining-percentage value is available. Do not infer one.

Telemetry gets one retry at most. Then continue the primary task.

## 11. Intelligence reporting and calibration

Useful commands:

```bash
node ~/.agents/skills/usage-efficient-orchestrator/scripts/usage-intelligence.mjs analyze --days 56 --json
node ~/.agents/skills/usage-efficient-orchestrator/scripts/usage-intelligence.mjs backtest --days 56
node ~/.agents/skills/usage-efficient-orchestrator/scripts/usage-intelligence.mjs export --days 56 --out <file>
```

The estimator:
- uses only measured compatible checkpoint pairs;
- selects the narrowest cohort with enough samples;
- uses robust empirical quantiles and MAD;
- detects median drift between older/newer halves when sample size permits;
- uses leave-one-out backtesting for historical calibration;
- downgrades confidence when calibration is weak;
- never treats unmeasured work as zero burn.

Descriptive role/route statistics are not causal claims. Adaptive routing decisions belong to v1.5.

## 12. Context conservation

- Reuse repository maps until relevant files change.
- Prefer exact file/symbol references over large pasted contexts.
- Pass workers only required context.
- Stop research when evidence is sufficient.
- Do not make a stronger model reread already-distilled evidence unless verification is required.

## 13. Test conservation

Match test breadth to risk and change breadth. Never rerun an unchanged passing suite for reassurance.

## 14. Reliability control plane

GitHub repository content is canonical. Global Codex copies are runtime mirrors.

Before orchestrator promotion:

```bash
node scripts/orchestrator-qa.mjs
```

### Drift gate

```bash
node scripts/orchestrator-status.mjs
```

### Security gate

The release must pass `node scripts/security-check-orchestrator.mjs`.

### Usage intelligence gate

The release must pass `node scripts/test-usage-intelligence.mjs` and the intelligence configuration must match the budget profiles.

### CI gate

GitHub Actions must run the unified QA suite for orchestrator branches and pull requests. A failing CI result blocks promotion.

### Safe sync

```bash
node scripts/orchestrator-sync.mjs --dry-run
node scripts/orchestrator-sync.mjs
```

## 15. Stop-loss gates

Stop and return control to the user when:
- profile retry limit is reached;
- a hard proxy counter is reached;
- usage intelligence returns `approval_required`, `split_required`, or `plan_only`;
- architecture materially changes;
- scope expands outside the Task Envelope;
- next step requires a higher-cost tier beyond the profile gate;
- task is plausibly beyond the selected percentage target;
- CRITICAL risk would move from planning to execution;
- QA/security/drift status is unsafe for requested promotion or sync.

## 16. Version-control and release policy

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

## 17. Validation accuracy

v1.4 can validate:
- exact burn arithmetic from real checkpoints;
- cohort selection;
- deterministic gate behavior;
- drift detection;
- historical leave-one-out calibration metrics;
- privacy boundaries.

v1.4 cannot guarantee future burn. A prediction remains an empirical estimate based on historical tasks.

Do not describe synthetic-test accuracy as real-world predictive accuracy. Real confidence improves only after enough of the user's actual tasks have measured checkpoints.

## Default bounded-phase response

Keep it compact:
- version/phase;
- usage-intelligence gate and confidence when available;
- what changed;
- validation result;
- measured-data coverage;
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
- `references/observability-policy.md`
- `references/usage-intelligence-policy.md`
- `config/capabilities.toml`
- `config/budget-profiles.toml`
- `config/observability.json`
- `config/usage-intelligence.json`
