# Orchestrator v1.9.0 Final Hardening & Evaluation Validation Plan

Status: release candidate branch `orchestrator-v1.9.0`

## Objective

Complete the consolidated v1.6-v1.9 hardening track and establish whether the orchestrator control plane is ready for v2.0 shadow closed-loop operation.

This release does not automatically enable active adaptive routing.

## Test layers

The unified QA must validate:

1. structural/configuration integrity;
2. existing routing-policy scenarios;
3. security/privacy invariants;
4. observability runtime behavior;
5. usage-intelligence behavior;
6. adaptive-routing behavior;
7. full routing property matrix across 288 task-kind/complexity/risk/profile combinations;
8. budget-governor threshold sweeps;
9. telemetry fault injection;
10. historical-version compatibility;
11. readiness classification;
12. release-integrity checks.

## Adversarial cases

Inject:
- malformed JSONL telemetry;
- foreign telemetry schema;
- usage reset;
- usage-cycle mismatch;
- incomplete task lifecycle;
- free-text telemetry injection attempt;
- free-text adaptive-routing injection attempt;
- legacy v1.3/v1.4 events with no task-kind field.

Expected behavior is fail-closed without weakening risk/budget/quality floors.

## Budget boundaries

Economy:
- <=3 points: within target;
- >3 and <=5: approval required;
- >5: split required.

Balanced / quality-critical:
- <=5 points: within target;
- >5 and <=10: approval required;
- >10: split required.

LARGE and CRITICAL remain plan-only regardless of low predicted burn.

## Routing invariants

Across all 288 query combinations:
- a canonical baseline route resolves;
- CRITICAL is plan-only;
- LARGE is plan-only;
- HIGH retains reviewer coverage;
- senior-specialist is never an initial baseline route.

## Compatibility

v1.3 and v1.4 telemetry without task-kind must remain readable for usage analysis and map to `task_kind=unknown`.

Legacy evidence alone cannot authorize active adaptation.

## Rollback

Last known good:
- version: v1.5.0
- immutable commit: `001dce0b9cd30231bf334101bc792b862e0f4ce7`

Rollback remains explicit and non-destructive.

## Readiness outcome

The final report must distinguish:

- **software/control-plane readiness**
- **active-adaptation evidence readiness**

A green test suite can establish the first.

The second requires real measured operational evidence and separately approved controlled canary execution.

## Promotion gate

Promotion requires:
- every unified QA suite green;
- GitHub Actions green on the final head;
- adaptive mode still shadow;
- canonical approval registry empty;
- canary disabled;
- release-state/rollback metadata valid;
- explicit user approval.
