# Usage-Efficient Codex Orchestrator

Version: 1.9.0

GitHub is the canonical source for the orchestration policy.

## Runtime architecture

Primary supervisor
-> Task Envelope
-> usage-intelligence budget gate
-> adaptive-routing shadow evaluation
-> privacy-preserving telemetry start
-> bounded delegation
-> one shared-tree writer maximum
-> independent review when risk requires it
-> targeted validation
-> measured checkpoint when available
-> telemetry finish
-> calibration/routing history
-> readiness evaluation

## Usage profiles

- economy: target <=3 percentage points, ceiling <=5.
- balanced: target <=5, ceiling <=10.
- quality-critical: target <=5, ceiling <=10 with stronger assurance.

If live usage is unavailable, proxy counters remain enforceable. Historical predictions never replace the proxy stop-loss.

## Usage Intelligence

```bash
node ~/.agents/skills/usage-efficient-orchestrator/scripts/usage-intelligence.mjs predict \
  --complexity MEDIUM --risk MEDIUM --profile balanced --json
```

The estimator uses measured tasks only, chooses the narrowest sufficiently populated historical cohort, and reports p25/median/p90 empirical bands.

## Adaptive Routing

```bash
node ~/.agents/skills/usage-efficient-orchestrator/scripts/adaptive-routing.mjs recommend \
  --task-kind implementation \
  --complexity MEDIUM \
  --risk MEDIUM \
  --profile balanced \
  --json
```

Default mode remains `shadow`.

A lower-burn historical route is only a candidate when it clears sample, quality, validation, risk, and p90-improvement floors.

The adaptive router never treats observational history as causal proof.

## Final Hardening: v1.6-v1.9 Consolidated

The final pre-v2 run hardens the full control plane rather than adding another optimization layer.

It adds:

- policy-invariant evaluation across 288 task-kind/complexity/risk/profile combinations;
- exact budget-threshold sweeps around economy 3/5 and balanced/quality-critical 5/10 gates;
- malformed-ledger and foreign-schema fault injection;
- usage-reset/cycle-mismatch recovery checks;
- v1.3-v1.5 telemetry compatibility tests;
- immutable last-known-good rollback metadata;
- disabled-by-default controlled-canary policy;
- explicit separation of software readiness from active-adaptation evidence readiness.

## Elevated-risk baseline protection

The final route registry guarantees:

- CRITICAL work -> reviewed plan-only route;
- LARGE work -> reviewed plan-only route;
- HIGH-risk implementation -> reviewer retained;
- HIGH-risk discovery -> cheap reader + reviewer;
- HIGH-risk architecture -> architect + reviewer, plan-only;
- senior-specialist routes remain escalation-only.

Efficiency cannot override these floors.

## Fault tolerance

Malformed telemetry is isolated rather than allowed to corrupt the whole ledger.

Foreign telemetry schema versions are ignored with warnings.

Reset or cycle-mismatch measurements stay unmeasured and never produce negative burn.

Incomplete tasks and legacy tasks without task-kind metadata cannot authorize active route adaptation.

## Compatibility

Supported historical generations:

- v1.3.x: usage telemetry readable; task kind defaults to unknown.
- v1.4.x: usage intelligence telemetry readable; task kind defaults to unknown.
- v1.5.x: adaptive metadata optional; fully readable.
- v1.9.x: current hardening generation.

Migration is non-destructive read compatibility. The system does not rewrite old telemetry to make it appear newer.

## Readiness

```bash
node ~/.agents/skills/usage-efficient-orchestrator/scripts/readiness.mjs --json
```

Readiness has two independent states:

1. **software/control-plane ready** — code, policies, privacy, compatibility, rollback, routing invariants, and QA are valid.
2. **active-adaptation evidence ready** — enough real measured outcomes and approved controlled-canary evidence exist for route switching.

A green CI result can establish the first state.

It cannot manufacture the second.

## Canary policy

Canary routing remains disabled in v1.9.

Future activation requires:

- LOW risk only;
- MICRO/SMALL scope only;
- acceptable usage calibration;
- no detected drift;
- sufficient baseline/candidate measured samples;
- sufficient validation evidence;
- canonical route approval;
- explicit user approval;
- one active canary maximum;
- immediate rollback on validation/security/failure/burn-regression signals.

## Rollback

The immutable last-known-good release for this candidate is approved v1.5.0:

`001dce0b9cd30231bf334101bc792b862e0f4ce7`

Rollback is never an automatic destructive `git reset --hard`.

Concurrent main changes must be preserved.

## Reliability

```bash
node scripts/orchestrator-qa.mjs
node scripts/orchestrator-status.mjs
node scripts/orchestrator-sync.mjs --dry-run
node scripts/orchestrator-sync.mjs
```

## Pre-v2 state

- v1.0 foundation
- v1.1 control plane
- v1.2 reliability
- v1.3 observability
- v1.4 usage intelligence
- v1.5 adaptive routing
- v1.9 final hardening/evaluation (consolidated v1.6-v1.9 track)
- v2.0 closed-loop orchestrator

v2.0 may operate as a software-ready closed loop in shadow/recommendation mode before active adaptation has enough operational evidence.
