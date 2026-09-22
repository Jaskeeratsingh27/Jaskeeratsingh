# Orchestrator v1.5.0 Adaptive Routing Validation Plan

Status: release candidate branch `orchestrator-v1.5.0`

## Objective

Validate that the orchestrator can identify historically cheaper capability routes without weakening quality, validation, risk, privacy, or human-approval controls.

## Core runtime scenarios

The adaptive-routing test suite verifies:

1. a historically lower-burn route clears sample, quality, and efficiency floors and is recommended in shadow mode;
2. a lower-burn route with poor completion/validation quality is rejected;
3. a HIGH-risk route without reviewer coverage is rejected;
4. CRITICAL work is never adaptively downgraded;
5. insufficient route-level evidence produces no adaptive candidate;
6. material usage drift suppresses adaptation;
7. shadow mode never marks a candidate active;
8. repeated decisions over the same evidence are deterministic;
9. legacy/unrecognized route sequences cannot become candidates;
10. shadow evaluation covers multiple historical task classes;
11. aggregate export omits task/project identifiers;
12. free-text adaptive-routing arguments are rejected.

## Evidence model

Route comparison requires:
- known route template;
- compatible task kind;
- minimum route task count;
- minimum measured-usage count;
- success-rate floor;
- validation-pass floor when observed;
- no material quality regression versus baseline;
- p90 absolute improvement threshold;
- p90 relative improvement threshold.

## Safety model

- default mode: shadow;
- active changes require canonical approval;
- approval registry starts empty;
- HIGH risk retains reviewer coverage;
- CRITICAL/LARGE remain plan-only;
- senior-specialist route is escalation-only;
- quality-critical active changes require explicit user approval;
- drift/weak calibration suppress active adaptation.

## Accuracy boundary

Historical route comparisons are observational, not randomized experiments.

The suite validates routing control logic and evidence gates. It does not prove that a recommended route causally reduces future usage.

Controlled exploration/canary evaluation belongs to the final hardening phase before v2.0.

## Release gate

Run:

```bash
node scripts/orchestrator-qa.mjs
```

Promotion requires:
1. all QA suites green;
2. GitHub Actions runtime CI green;
3. adaptive mode remains shadow;
4. canonical approval registry remains empty unless separately approved;
5. privacy/security gates green;
6. explicit user approval.
