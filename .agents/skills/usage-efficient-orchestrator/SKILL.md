---
name: usage-efficient-orchestrator
description: Conserve Work/Codex weekly allowance by planning once, estimating burn from measured history, evaluating cheaper capability routes conservatively, preserving quality/risk floors, routing bounded work to the cheapest proven-capable roles, enforcing single-writer execution, proxy usage counters, failure-aware escalation, privacy-preserving telemetry, reliability gates, and user checkpoints before expensive continuation. Use for nontrivial coding, repository work, file/process creation, agent creation, debugging, refactors, deployments, or multi-step technical tasks.
---

# Usage-Efficient Orchestrator v1.9.0

## Mission

Act as a supervisor/architect, not an expensive universal worker. Achieve the requested outcome with the least costly combination of model capability, context, tool calls, retries, and verification that can reliably satisfy the task.

Use measured history to improve budget and routing decisions, but never substitute a prediction for an actual usage meter and never trade away required quality or risk controls for lower historical usage.

## 1. Mandatory Task Envelope

Before substantial work, create a compact internal Task Envelope using `references/task-envelope.md`.

It must define:
- task_id;
- task_kind: discovery | implementation | review | architecture | mixed;
- goal and definition of done;
- complexity and risk separately;
- selected budget profile;
- weekly usage baseline when known;
- baseline route;
- adaptive mode and candidate route when available;
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
- `proceed`: conservative historical upper band is within target and calibration is acceptable; proxies remain a safety backstop.
- `approval_required`: stop and ask before execution.
- `split_required`: split into smaller phases.
- `plan_only`: risk/complexity control plane forbids direct execution.

The prediction is empirical guidance, not a guaranteed billing meter. The p25-p90 range is an empirical prediction band, not a formal confidence interval.

A predictor failure gets one cheap retry at most. Then classify it as `tooling_environment` and continue with proxy controls rather than escalating model strength.

## 4. Adaptive routing gate

Read:
- `references/adaptive-routing-policy.md`;
- `config/adaptive-routing.json`;
- `config/route-templates.json`;
- `config/adaptive-routing-approvals.json`.

After the usage-intelligence gate, evaluate the baseline route against measured historical route evidence:

```bash
node ~/.agents/skills/usage-efficient-orchestrator/scripts/adaptive-routing.mjs recommend \
  --task-kind <discovery|implementation|review|architecture|mixed> \
  --complexity <MICRO|SMALL|MEDIUM|LARGE> \
  --risk <LOW|MEDIUM|HIGH|CRITICAL> \
  --profile <economy|balanced|quality-critical> \
  --json
```

Default mode is **shadow**.

Shadow mode may recommend a candidate but must not silently replace the baseline route.

A candidate route must clear:
- minimum route-level task samples;
- minimum measured usage samples;
- success-rate floor;
- validation-pass floor when evidence exists;
- no material quality regression versus baseline;
- task-kind compatibility;
- risk-role requirements;
- absolute p90 improvement threshold;
- relative p90 improvement threshold;
- stability/drift gates.

Hard rules:
- HIGH risk requires reviewer coverage.
- CRITICAL or LARGE work remains plan-only.
- `senior_specialist` routes are escalation-only and are never chosen as a cheaper initial route.
- quality-critical active route changes require explicit user approval.
- missing task-kind data cannot by itself justify active adaptation.
- weak calibration or drift may allow shadow observation but suppresses active adaptation.

### Canonical approval requirement

Active route changes require a matching canonical approval entry and explicit user approval.

The orchestrator must never create an approval entry merely because a candidate looks cheaper.

### Observational evidence caveat

Historical route comparisons are observational.

Do not claim that a route **caused** lower usage unless controlled evidence exists. Use language such as:
- historically lower measured burn;
- candidate route;
- observational evidence;
- shadow recommendation.

## 5. Capability routing

Read `config/capabilities.toml`.

Route by logical capability role:
- cheap_reader
- standard_engineer
- reviewer
- senior_specialist
- architect

The current role-to-model mapping is configuration, not policy.

Use the cheapest **proven-capable** role, not simply the cheapest available model.

## 6. Risk-aware routing

Complexity answers "how hard is this?"
Risk answers "how bad is a wrong change?"
Task kind answers "what kind of work is being performed?"

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

The strictest of risk, usage-intelligence, budget, and adaptive-routing gates wins.

## 7. Single-writer execution

At most one write-capable worker may modify the same working tree at a time.

Parallelism is allowed for read-only scout/research/review work.

Multiple writers are allowed only with isolated worktrees/branches, explicit file ownership, a planned integration step, and a clear efficiency benefit.

## 8. Proxy usage counters

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

Predictions and adaptive routing supplement these counters; they do not replace them.

## 9. Failure-aware escalation

Before escalating, classify the failure with `references/failure-taxonomy.md`.

Do not escalate model strength for:
- missing information;
- environment/tool failures;
- permission failures;
- bad/flaky fixtures;
- telemetry failures;
- prediction-tool failures;
- adaptive-routing tool failures;

unless evidence shows stronger reasoning is relevant.

Pass a concise failure summary upward. Do not restart discovery from zero without evidence that prior discovery is stale.

## 10. Structured delegation and handoff

Every delegated task specifies:
- task_id;
- work unit;
- goal;
- scope/path;
- access mode;
- capability role;
- expected output;
- stop condition;
- maximum useful detail.

Workers return `references/handoff-schema.md`. No raw transcript dumps.

## 11. Privacy-preserving observability

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

Allowed telemetry is structured metadata only.

New task-start events should record `task_kind`.

Adaptive route recommendations may record:
- baseline route;
- candidate route;
- decision mode;
- controlled decision code;
- evidence sample count;
- estimated p90 savings.

Use checkpoints only when a real remaining-percentage value is available. Do not infer one.

Telemetry gets one retry at most. Then continue the primary task.

## 12. Intelligence and routing reporting

Usage intelligence:

```bash
node ~/.agents/skills/usage-efficient-orchestrator/scripts/usage-intelligence.mjs analyze --days 56 --json
node ~/.agents/skills/usage-efficient-orchestrator/scripts/usage-intelligence.mjs backtest --days 56
```

Adaptive routing:

```bash
node ~/.agents/skills/usage-efficient-orchestrator/scripts/adaptive-routing.mjs analyze --days 56 --json
node ~/.agents/skills/usage-efficient-orchestrator/scripts/adaptive-routing.mjs shadow --days 56 --json
```

The adaptive router:
- compares known route templates only;
- uses the narrowest adequately sampled cohort;
- compares conservative p90 burn first;
- enforces success/validation floors;
- reports rejected routes and reasons;
- suppresses active changes on drift/weak evidence;
- never treats unmeasured work as zero usage.

## 13. Context conservation

- Reuse repository maps until relevant files change.
- Prefer exact file/symbol references over large pasted contexts.
- Pass workers only required context.
- Stop research when evidence is sufficient.
- Do not make a stronger model reread already-distilled evidence unless verification is required.

## 14. Test conservation

Match test breadth to risk and change breadth.

Never rerun an unchanged passing suite for reassurance.

## 15. Final hardening and readiness

Read:
- `references/hardening-policy.md`;
- `references/rollback-policy.md`;
- `config/hardening.json`;
- `config/compatibility.json`;
- `config/canary-policy.json`;
- `config/release-state.json`.

Hardening requirements:
- malformed telemetry must not poison the whole ledger;
- foreign telemetry schemas are ignored and warned, never coerced;
- reset/cycle mismatches stay unmeasured;
- all task-kind × complexity × risk × profile baseline combinations must preserve safety invariants;
- budget thresholds must hold at and around exact target/ceiling boundaries;
- v1.3/v1.4/v1.5 telemetry remains non-destructively readable;
- rollback targets an immutable last-known-good commit;
- active adaptive routing remains disabled before v2 evidence gates are met.

Readiness command:

```bash
node ~/.agents/skills/usage-efficient-orchestrator/scripts/readiness.mjs --json
```

Interpret readiness in two layers:
- software/control-plane readiness;
- active-adaptation evidence readiness.

Passing software QA must never be described as proof that active routing has enough real-world evidence.

### Canary boundary

The canary policy is disabled by default.

Future canary activation requires explicit user approval, canonical route approval, acceptable calibration, no drift, LOW risk, bounded exposure, and immediate rollback triggers.

## 16. Reliability control plane

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

The release must pass `node scripts/test-usage-intelligence.mjs`.

### Adaptive routing gate

The release must pass `node scripts/test-adaptive-routing.mjs`.

Adaptive mode must remain `shadow` unless an active-mode change has been separately approved.

### CI gate

GitHub Actions must run the unified QA suite for orchestrator branches and pull requests.

A failing CI result blocks promotion.

### Safe sync

```bash
node scripts/orchestrator-sync.mjs --dry-run
node scripts/orchestrator-sync.mjs
```

## 17. Stop-loss gates

Stop and return control to the user when:
- profile retry limit is reached;
- a hard proxy counter is reached;
- usage intelligence returns `approval_required`, `split_required`, or `plan_only`;
- adaptive routing returns a result that requires manual approval for active use;
- architecture materially changes;
- scope expands outside the Task Envelope;
- next step requires a higher-cost tier beyond the profile gate;
- task is plausibly beyond the selected percentage target;
- CRITICAL risk would move from planning to execution;
- QA/security/drift status is unsafe for requested promotion or sync.

## 18. Version-control and release policy

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
11. Concurrent main changes must be preserved by rebasing/reconciling before promotion.

## 19. Validation accuracy

v1.9 can validate:
- exact burn arithmetic from measured checkpoints;
- usage and adaptive cohort selection;
- route-template and baseline-route invariants across the full query matrix;
- budget behavior at/around target and ceiling boundaries;
- quality/risk floor dominance over efficiency;
- deterministic shadow decisions;
- malformed/foreign telemetry recovery;
- v1.3-v1.5 read compatibility;
- immutable rollback metadata;
- canary disablement and bounded future exposure;
- privacy/security invariants;
- software/control-plane readiness.

v1.9 still cannot prove that a candidate route will causally reduce future usage.

Synthetic/adversarial fixtures validate implementation and policy behavior, not real-world causal effect.

Real active-adaptation confidence requires enough actual measured outcomes and separately approved controlled canary evidence.

## Default bounded-phase response

Keep it compact:
- version/phase;
- usage-intelligence gate and confidence when available;
- adaptive-routing decision and mode when available;
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
- `references/adaptive-routing-policy.md`
- `config/capabilities.toml`
- `config/budget-profiles.toml`
- `config/observability.json`
- `config/usage-intelligence.json`
- `config/adaptive-routing.json`
- `config/route-templates.json`
- `config/adaptive-routing-approvals.json`
- `references/hardening-policy.md`
- `references/rollback-policy.md`
- `config/hardening.json`
- `config/compatibility.json`
- `config/canary-policy.json`
- `config/release-state.json`
