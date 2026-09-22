# Usage-Efficient Orchestrator v1.9.0 - Final Hardening & Evaluation Report

Date: 2026-09-21
Branch: orchestrator-v1.9.0
PR: #13
Status: Release candidate awaiting user approval

## TL;DR

The planned v1.6-v1.9 hardening track was consolidated into v1.9.0.

Final GitHub Actions validation on the release candidate:

- GitHub Actions runtime CI: **SUCCESS**
- Unified QA: **12/12 suites passed**
- Structural/control checks: **119/119**
- Routing-policy checks: **138/138 across 24 scenarios**
- Security/reliability checks: **31/31**
- Observability runtime checks: **37/37**
- Usage-intelligence runtime checks: **33/33**
- Adaptive-routing runtime checks: **29/29**
- Policy-invariant checks: **524/524 across 288 query combinations**
- Budget-governor checks: **208/208**
- Fault-injection checks: **17/17**
- Version-compatibility checks: **12/12**
- Readiness checks: **7/7**
- Release checks: **41/41**

## Hardening added

- full task-kind × complexity × risk × profile baseline-routing property evaluation;
- exact usage-budget boundary sweeps around economy 3/5 and balanced/quality-critical 5/10 gates;
- malformed JSONL telemetry fault injection;
- foreign telemetry schema handling;
- usage-reset and cycle-mismatch fault injection;
- incomplete-task handling;
- free-text telemetry/adaptive input rejection;
- non-destructive v1.3/v1.4/v1.5 telemetry compatibility tests;
- immutable last-known-good release metadata;
- explicit rollback/recovery policy;
- disabled-by-default controlled canary policy;
- software-vs-operational-evidence readiness separation.

## Safety defect found during hardening design

Before the final matrix test was committed, a third-person review of the baseline route ordering found a safety inconsistency:

task-kind rules could resolve before CRITICAL/LARGE overrides, and some HIGH-risk read/architecture paths did not guarantee reviewer coverage in the baseline route itself.

The route registry was hardened before final CI:

- CRITICAL -> reviewed plan-only route;
- LARGE -> reviewed plan-only route;
- HIGH-risk architecture -> architect + reviewer, plan-only;
- HIGH-risk discovery -> cheap reader + reviewer;
- HIGH-risk implementation -> writer + reviewer.

The final 288-combination matrix then verified the corrected invariants.

## Budget-governor validation

The final suite sweeps exact and near-boundary measured burns.

Economy:
- <=3 points -> within target;
- >3 to <=5 -> approval required;
- >5 -> split required.

Balanced / quality-critical:
- <=5 points -> within target;
- >5 to <=10 -> approval required;
- >10 -> split required.

LARGE and CRITICAL remain plan-only regardless of an inexpensive historical estimate.

## Fault-tolerance validation

Injected malformed and incompatible telemetry does not poison the complete ledger.

Verified behavior:
- malformed lines are ignored with warning;
- foreign schema events are ignored;
- resets do not produce negative burn;
- cycle mismatches remain unmeasured;
- incomplete tasks do not become measured burn;
- adaptive routing fails closed with sparse/damaged history;
- free-text metadata injection is rejected;
- rejected free text is not written to telemetry.

## Compatibility

Historical telemetry remains readable without destructive migration:

- v1.3.x -> task kind defaults to unknown;
- v1.4.x -> task kind defaults to unknown;
- v1.5.x -> explicit adaptive/task-kind fields preserved;
- v1.9.x -> current generation.

Legacy evidence alone cannot authorize active adaptive routing.

## Rollback state

Last known good release for this candidate:

- v1.5.0
- commit: 001dce0b9cd30231bf334101bc792b862e0f4ce7

Automatic destructive repository rollback is disabled.

A repository rollback requires explicit approval and must preserve unrelated concurrent work.

## Canary state

Canary routing is **disabled**.

Future canary activation requires:
- LOW risk;
- MICRO/SMALL scope;
- acceptable usage calibration;
- no drift;
- minimum measured baseline/candidate history;
- validation evidence;
- canonical route approval;
- explicit user approval;
- one canary at a time;
- immediate rollback triggers.

## Readiness conclusion

### Software/control-plane readiness

**PASS**

The code/policy control plane satisfies the current deterministic release gates for v2.0 shadow closed-loop operation.

### Active-adaptation evidence readiness

**NOT YET CLAIMED**

This is intentional.

CI, synthetic fixtures, and adversarial tests cannot manufacture real account-side evidence that active route switching will reduce future weekly allowance usage.

Active adaptation stays gated until sufficient real measured outcomes and separately approved controlled-canary evidence exist.

## Pre-v2 conclusion

v1.9.0 is ready for user approval and promotion.

After promotion, the next release is v2.0: the closed-loop orchestrator that connects planning, budget prediction, shadow route selection, execution, measurement, evaluation, and learning while retaining the hard safety/evidence gates established here.
