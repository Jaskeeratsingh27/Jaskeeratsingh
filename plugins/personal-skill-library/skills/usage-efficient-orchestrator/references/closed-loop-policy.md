# v2.0 Closed-Loop Orchestrator Policy

## Purpose

v2.0 connects the existing control-plane components into one bounded lifecycle:

Plan -> Predict -> Route -> Delegate -> Execute -> Measure -> Evaluate -> Learn

The closed loop is **software-active but adaptive-route-shadowed**.

It actively performs preflight budget/risk decisions, produces a bounded delegation plan, enforces live checkpoints when supplied, evaluates outcomes, and feeds measured results into future estimation.

It does **not** silently activate a historically cheaper route.

## Preflight

Before substantial nontrivial work:

```bash
node ~/.agents/skills/usage-efficient-orchestrator/scripts/closed-loop.mjs preflight \
  --task-kind implementation \
  --complexity MEDIUM \
  --risk MEDIUM \
  --profile balanced \
  --json
```

If a real current weekly allowance reading is available, add:

```
--baseline <remaining-percent> --cycle <usage-cycle-id>
```

Preflight performs:

1. task-start telemetry;
2. usage-intelligence prediction;
3. canonical baseline-route selection;
4. adaptive-routing shadow evaluation;
5. strict gate arbitration;
6. delegation-plan construction from the capability registry;
7. privacy-preserving preflight telemetry.

## Gate arbitration

The strictest applicable gate wins.

Order of authority:

1. security / permission boundary;
2. CRITICAL/LARGE plan-only risk boundary;
3. measured live budget stop;
4. usage-intelligence split/approval gate;
5. proxy governor;
6. adaptive-routing recommendation;
7. efficiency preference.

Adaptive routing cannot weaken a higher-level gate.

## Execution route

In v2.0 the selected execution route remains the canonical baseline route.

A shadow candidate is returned separately for observation and learning.

The candidate may not replace the baseline until future operational-evidence, canary, canonical-approval, and explicit-user-approval gates are satisfied.

## Delegation plan

The execution route expands into ordered work units.

Each unit includes only controlled metadata:

- work-unit ID;
- capability role;
- configured model;
- reasoning effort;
- read/write access;
- role purpose.

The primary model remains supervisor/architect.

Workers receive bounded task context from the chat/runtime, not from telemetry.

## Live checkpoint

When an authoritative remaining-percentage reading is available during work:

```bash
node ~/.agents/skills/usage-efficient-orchestrator/scripts/closed-loop.mjs checkpoint \
  --task-id <id> --remaining <percent> --cycle <cycle-id> --json
```

If measured burn reaches the profile target, return `stop_target`.

If it exceeds the absolute ceiling, return `stop_ceiling`.

Without a live meter, never fabricate a percentage. Use proxy limits.

## Proxy governor

Before additional agent spawns, retries, test cycles, or escalation, inspect:

```bash
node ~/.agents/skills/usage-efficient-orchestrator/scripts/closed-loop.mjs status \
  --task-id <id> --json
```

The proxy governor derives conservative counters from structured telemetry and returns `stop_proxy_limit` when a configured hard limit has been reached.

## Finalize

At the end of a task:

```bash
node ~/.agents/skills/usage-efficient-orchestrator/scripts/closed-loop.mjs finalize \
  --task-id <id> --status complete --json
```

When a real final remaining percentage is available, include it.

Finalize:

1. optionally records validation;
2. records task finish;
3. reconstructs measured burn;
4. compares actual burn with preflight prediction when available;
5. classifies budget outcome;
6. classifies quality outcome;
7. records privacy-preserving post-task evaluation;
8. marks whether the outcome is eligible to inform future learning.

## Learning

Learning is conservative:

- measured compatible usage deltas can calibrate burn;
- failed/blocked outcomes inform route quality;
- unmeasured usage is never treated as zero;
- legacy unknown task-kind evidence cannot authorize active route switching;
- route comparisons remain observational.

There is no automatic model-weight update or opaque self-modification.

The "learn" step means future deterministic estimators and shadow router decisions consume newly accumulated validated telemetry.

## Hard percentage limit

A true hard weekly-percentage stop is enforceable only when an authoritative live remaining-percentage checkpoint is available.

When it is unavailable, the closed loop enforces the configured proxy governor and conservative prediction gates instead.

Never describe proxy enforcement as an exact account-side usage limit.

## Privacy

Closed-loop telemetry must never contain:

- prompt or conversation content;
- source code or file contents;
- secrets;
- raw worker output;
- full local paths;
- free-form chain-of-thought or rationale.

Only controlled enums, IDs, counts, route names, percentages, and numeric evaluation metrics are permitted.
