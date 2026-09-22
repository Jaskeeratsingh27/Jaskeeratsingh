# Usage-Efficient Orchestrator v2.0.0 - Closed-Loop Release Report

Date: 2026-09-21
Branch: orchestrator-v2.0.0
PR: #14
Status: Release candidate awaiting user approval

## TL;DR

v2.0 now connects the full bounded lifecycle:

Plan -> Predict -> Route -> Delegate -> Execute -> Measure -> Evaluate -> Learn

Final validated behavior on the current implementation:

- Unified QA: **13/13 suites passed**
- Structural/control checks: **80/80**
- Routing-policy checks: **138/138 across 24 scenarios**
- Security/reliability checks: **36/36**
- Observability checks: **37/37**
- Usage-intelligence checks: **33/33**
- Adaptive-routing checks: **29/29**
- Policy-invariant checks: **524/524 across 288 query combinations**
- Budget-governor checks: **208/208**
- Fault-injection checks: **17/17**
- Version-compatibility checks: **12/12**
- Readiness checks: **7/7**
- Closed-loop integration checks: **31/31**
- Release checks: **46/46**
- GitHub Actions: **SUCCESS**

## Closed-loop runtime

The new controller exposes four bounded lifecycle commands:

- `preflight`
- `checkpoint`
- `status`
- `finalize`

Preflight creates the task telemetry lifecycle, runs the usage estimator, evaluates the shadow adaptive router, resolves the canonical baseline route, maps route roles to configured models/reasoning/access, and returns proxy limits.

## Supervisor and delegation behavior

The primary model remains supervisor/architect.

The route registry determines ordered capability roles.

The capability registry maps those roles to configured workers. For example:

- cheap_reader -> GPT-5.6 Luna / low reasoning / read-only;
- standard_engineer -> GPT-5.6 Terra / medium reasoning / workspace write;
- reviewer -> GPT-5.6 Terra / medium reasoning / read-only;
- senior_specialist -> GPT-5.6 Sol / medium reasoning / escalation-only;
- architect -> primary model / low reasoning / read-only supervision.

The closed loop does not choose the strongest model for every subtask.

## Adaptive-routing boundary

A lower-burn historical route can be identified and returned as a shadow candidate.

v2.0 deliberately continues to execute the canonical baseline route.

The integration suite explicitly validated a case where `scout_standard` was historically cheaper than `direct_standard`, while the selected execution route remained `direct_standard`.

This keeps learning active without silently changing production routing.

## Usage enforcement

When an authoritative live remaining percentage is supplied:

- below target -> continue;
- at target -> `stop_target`;
- at/above ceiling -> `stop_ceiling`.

The runtime test verified the economy profile:

- baseline 60 -> remaining 57.1 = 2.9 point burn -> continue;
- baseline 60 -> remaining 57.0 = 3.0 point burn -> stop_target;
- baseline 80 -> remaining 74.9 = 5.1 point burn -> stop_ceiling.

Without an authoritative meter, the controller does not invent usage.

It falls back to prediction plus proxy limits.

## Proxy governor

The closed loop derives conservative counters from structured telemetry:

- agent spawns;
- discovery passes;
- write phases;
- failed implementation attempts;
- test cycles;
- senior escalations.

Saturated dimensions are reported before additional work. Exceeded dimensions return `stop_proxy_limit`.

## Evaluation and learning

Finalization records:

- actual burn when measurable;
- budget outcome;
- quality outcome;
- prediction error when a prediction exists;
- learning status;
- learning eligibility.

Learning remains transparent and deterministic.

New validated telemetry becomes input to future usage-intelligence and shadow-routing decisions.

There is no opaque policy-weight mutation, hidden chain-of-thought persistence, or autonomous route approval.

## Privacy

v2.0 adds two controlled telemetry event types:

- `preflight_decision`;
- `post_task_evaluation`.

The ledger still excludes prompts, source code, file contents, raw worker output, secrets, and full paths.

Free-text closed-loop metadata is rejected.

## Safety state

- adaptive routing: **shadow**
- active route replacement: **disabled**
- canary routing: **disabled**
- canonical adaptive approvals: **empty**
- single shared-tree writer: **enforced by policy**
- HIGH-risk reviewer floor: **preserved**
- CRITICAL/LARGE plan-only floor: **preserved**
- automatic destructive rollback: **disabled**

## Compatibility and rollback

Historical v1.3+ telemetry remains non-destructively readable.

Last known good release:

- v1.9.0
- commit `1685d9395bb91b751d3b7dcc887a73418e744fd5`

The v2 branch is mergeable with concurrent Hermes documentation changes currently on main.

## Defects caught by CI

The first v2 CI attempt caught two test/control issues:

1. the structural validator expected an explicit `finalize` command branch while the runtime used a safe final `else`;
2. the no-history integration fixture shared historical SMALL-task data, so the usage estimator correctly used its broader complexity fallback instead of returning insufficient data.

The controller was made explicit for `finalize`, and the no-history test was isolated into a clean telemetry directory.

The subsequent full CI run passed all 13 suites.

## Readiness interpretation

### Closed-loop software readiness

**PASS**

The integrated lifecycle, safety gates, telemetry, compatibility, rollback, usage checks, proxy governor, and deterministic learning path are validated.

### Active adaptive-route evidence readiness

**NOT CLAIMED**

This remains separately gated by real measured operational evidence and future explicitly approved canary data.

v2.0 therefore ships as a functioning closed loop with baseline execution and shadow adaptive learning rather than an unproven autonomous route switcher.
