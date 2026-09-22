# Orchestrator v2.0.0 Closed-Loop Validation Plan

Status: release candidate branch `orchestrator-v2.0.0`

## Objective

Validate the complete bounded lifecycle:

Plan -> Predict -> Route -> Delegate -> Execute -> Measure -> Evaluate -> Learn

without enabling unapproved active adaptive routing.

## Integration scenarios

The v2 closed-loop suite verifies:

1. preflight creates a task and bounded control action;
2. a historically cheaper candidate can be observed;
3. the execution route remains the canonical baseline in shadow mode;
4. route roles expand to configured model/reasoning/access assignments;
5. proxy counters are derived from structured telemetry;
6. an authoritative live checkpoint below target continues;
7. a checkpoint at the profile target returns `stop_target`;
8. a checkpoint above the ceiling returns `stop_ceiling`;
9. finalization records measured learning evidence;
10. prediction error is recorded when both prediction and actual burn exist;
11. CRITICAL work remains plan-only;
12. LARGE work remains plan-only;
13. no-history work falls back to proxy controls without fabricated usage;
14. free-text closed-loop metadata is rejected;
15. rejected prompt/source content is absent from the ledger.

## Hard-limit interpretation

The controller can enforce an exact percentage stop only when an authoritative current remaining percentage is supplied.

Without that reading it uses:
- conservative historical p90 usage gates;
- task risk/complexity gates;
- deterministic proxy counters.

The release must not describe proxy enforcement as an exact account-side percentage limit.

## Adaptive routing boundary

v2.0 executes the canonical baseline route.

Shadow candidates are advisory only.

The following remain disabled:
- active adaptive route replacement;
- canary routing;
- automatic canonical approval creation.

## Learning boundary

The learning step means new validated task telemetry is available to subsequent usage-intelligence and shadow-routing calculations.

It does not perform opaque model training, chain-of-thought persistence, or autonomous policy mutation.

## Release gate

Promotion requires:

1. all legacy QA suites remain green;
2. the v2 closed-loop integration suite is green;
3. GitHub Actions is green on the final head;
4. closed-loop mode remains `shadow_closed_loop`;
5. adaptive mode remains `shadow`;
6. canary remains disabled;
7. canonical adaptive approvals remain empty;
8. last-known-good rollback points to approved v1.9.0;
9. privacy/security checks remain green;
10. explicit user approval.
