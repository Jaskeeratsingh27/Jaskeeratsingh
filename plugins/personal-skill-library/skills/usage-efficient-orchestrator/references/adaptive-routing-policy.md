# Adaptive Routing Policy

## Purpose

Use measured historical outcomes to identify cheaper candidate capability routes while preserving quality, risk controls, and human approval.

v1.5 is deliberately conservative. It can recommend a route and shadow-evaluate alternatives. It does not treat observational history as proof that a cheaper route caused better results.

## Operating mode

Default: `shadow`.

Shadow mode:
- computes a baseline route;
- evaluates eligible historical routes;
- may recommend a lower-burn candidate;
- records the recommendation;
- does **not** automatically replace the baseline route.

Active mode is permitted only when:
- the candidate has passed all evidence/quality/risk gates;
- usage-intelligence calibration is acceptable;
- no relevant drift is detected;
- the route is canonically approved after explicit user approval;
- the task is not CRITICAL/LARGE;
- the task is not quality-critical unless specifically approved.

## Comparison cohort

Compare routes only inside the narrowest cohort with enough evidence:

1. task_kind + complexity + risk + profile;
2. task_kind + complexity + profile;
3. complexity + profile.

Do not compare fundamentally different task kinds when task-kind evidence exists.

Legacy tasks without task_kind may contribute only through broader fallback analysis and cannot by themselves justify active routing.

## Candidate qualification

A route must meet all of the following:

- minimum task count;
- minimum measured-burn count;
- success rate >= configured quality floor;
- validation pass rate >= configured quality floor;
- no material quality regression versus baseline;
- role sequence is a known route template;
- route is allowed for the current task kind;
- HIGH risk includes reviewer;
- senior_specialist is never proposed as an initial cheaper route;
- CRITICAL/LARGE work remains plan-only.

## Efficiency decision

Among qualified routes, compare conservative p90 measured burn first.

A candidate must improve p90 by at least:
- the configured absolute point improvement, and
- the configured relative improvement.

Tie-breakers:
1. lower median burn;
2. lower median duration.

Do not select a candidate merely because it has fewer roles.

## Stability / anti-thrashing

Do not adapt when:
- usage-intelligence reports drift;
- calibration is weak for active mode;
- evidence margin is too small;
- a recent policy change is still inside the configured cooldown;
- sample counts are below threshold.

Shadow recommendations may still be surfaced when safe, but must be labeled low-confidence or observational.

## Quality floors

A cheaper route is rejected if it lowers historical success or validation-pass rate beyond configured tolerances.

This is a hard safety floor, not a weighted preference.

## Risk floors

- HIGH: reviewer role required.
- CRITICAL: plan-only.
- LARGE: plan-only.
- quality-critical profile: active route changes require explicit approval.
- escalation-only routes are never used as cheaper initial candidates.

The stricter risk rule always overrides the adaptive recommendation.

## Telemetry

Record recommendations as structured metadata only:
- baseline route;
- candidate route;
- decision mode;
- decision code;
- evidence sample count;
- estimated p90 savings.

Do not record prompts, code, file contents, or free-form reasoning.

## Decision codes

- keep_baseline
- candidate_lower_burn
- insufficient_data
- insufficient_baseline
- no_qualified_candidate
- quality_floor
- risk_floor
- drift_suppressed
- calibration_suppressed
- manual_approval_required

## Accuracy boundary

Route statistics are descriptive historical evidence.

They do not establish causal superiority because tasks were not randomly assigned to routes.

Controlled exploration/canary testing and stronger evaluation belong to the hardening phase before v2.0.
