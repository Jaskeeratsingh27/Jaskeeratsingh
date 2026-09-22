# Usage-Efficient Orchestrator v1.5.0 - Adaptive Routing Report

Date: 2026-09-21
Branch: orchestrator-v1.5.0
PR: #10
Status: Release candidate awaiting user approval

## TL;DR

- v1.4.0 was promoted to main after user approval and safely rebased around concurrent repository work.
- v1.5.0 Adaptive Routing is implemented on an isolated release branch.
- GitHub Actions runtime CI: **SUCCESS**
- Unified QA: **7/7 suites passed**
- Structural/control checks: **101/101 passed**
- Routing-policy checks: **138/138 passed across 24 scenarios**
- Security/reliability checks: **22/22 passed**
- Observability runtime checks: **37/37 passed**
- Usage-intelligence runtime checks: **33/33 passed**
- Adaptive-routing runtime checks: **29/29 passed**
- Release checks: **23/23 passed**

## What v1.5 adds

- explicit task-kind dimension: discovery, implementation, review, architecture, mixed;
- canonical route-template registry;
- canonical baseline routing rules;
- shadow-mode adaptive routing;
- route-level minimum task and measured-usage evidence thresholds;
- historical success-rate quality floor;
- historical validation-pass quality floor;
- no-material-quality-regression checks against the baseline route;
- absolute and relative p90 burn-improvement requirements;
- deterministic tie-breaking by median burn then duration;
- HIGH-risk reviewer retention;
- CRITICAL/LARGE plan-only protection;
- senior-specialist routes marked escalation-only;
- usage-drift suppression;
- active-mode calibration requirement;
- canonical route-approval registry, empty by default;
- structured adaptive recommendation telemetry;
- privacy-preserving aggregate adaptive export.

## Validated behavior

Synthetic runtime scenarios verified:

- a historically lower-burn route is recommended only after sample, quality, risk and efficiency gates pass;
- a cheaper route with materially worse completion/validation results is rejected;
- a HIGH-risk route without reviewer coverage is rejected;
- CRITICAL work is never adaptively downgraded;
- insufficient route evidence returns no candidate;
- material usage drift suppresses adaptation;
- shadow mode never activates a candidate;
- repeated decisions over identical evidence are deterministic;
- legacy/unrecognized route signatures do not become candidates;
- aggregate exports omit task/project identifiers;
- free-text adaptive-routing arguments are rejected.

## Default operating state

Adaptive mode is **shadow**.

That means v1.5 can say:

> Historically, route B used less measured allowance than baseline route A while clearing the configured quality/risk floors.

It does **not** silently switch production routing to B.

Active changes require:
1. sufficient evidence;
2. acceptable usage calibration;
3. no drift suppression;
4. applicable validation evidence;
5. a matching canonical approval;
6. explicit user approval;
7. all existing risk/budget controls.

The canonical approval registry is currently empty.

## Accuracy statement

The adaptive-routing engine is deterministic and its control logic is validated.

Historical route comparisons remain observational. They do not prove that a candidate route caused lower allowance usage because historical tasks were not randomly assigned.

Controlled exploration/canary evidence belongs to the final hardening/evaluation phase before v2.0.

## Defect caught during QA

The first v1.5 CI run caught an incorrect canonical GitHub owner string inherited in the orchestrator manifest/release validation.

The canonical repository was corrected to:
`Jaskeeratsingh27/Jaskeeratsingh`

The subsequent complete CI run passed all seven QA suites.

## Promotion recommendation

v1.5.0 is ready for user approval and promotion to main.

Next planned run after approval: **v1.6-v1.9 Final Hardening & Evaluation**
- adversarial policy tests;
- fault injection;
- controlled/canary route evaluation design;
- shadow-policy backtesting;
- budget-governor stress testing;
- migration/version compatibility;
- telemetry corruption/recovery testing;
- rollback and disaster-recovery drills;
- regression/fuzz testing;
- final v2.0 production-readiness gate.
