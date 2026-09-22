# Usage-Efficient Orchestrator v1.4.0 - Usage Intelligence Report

Date: 2026-09-21
Branch: orchestrator-v1.4.0
PR: #6
Status: Release candidate awaiting user approval

## TL;DR

- v1.3.0 was promoted to main after user approval.
- v1.4.0 Usage Intelligence is implemented on an isolated release branch.
- GitHub Actions runtime CI: **SUCCESS**
- Unified QA: **6/6 suites passed**
- Structural/control checks: **74/74 passed**
- Routing-policy checks: **138/138 passed across 24 scenarios**
- Security/reliability checks: **17/17 passed**
- Observability runtime checks: **34/34 passed**
- Usage-intelligence runtime checks: **33/33 passed**
- Release checks: **17/17 passed**

## What v1.4 adds

- historical burn estimator based only on real measured before/after allowance checkpoints;
- hierarchical cohort selection:
  1. complexity + risk + profile;
  2. complexity + profile;
  3. complexity;
  4. global;
- minimum sample gates;
- empirical p25 / median / p90 prediction bands;
- median absolute deviation;
- older-vs-newer median drift detection;
- confidence downgrade on drift or weak calibration;
- leave-one-out historical backtesting;
- MAE, median absolute error, and conservative-upper coverage;
- optional current-baseline projection;
- deterministic pre-task gates:
  - proxy_only
  - proceed_with_proxy_guards
  - proceed
  - approval_required
  - split_required
  - plan_only
- aggregate analysis by complexity, profile, route signature, and orchestrator version;
- privacy-preserving aggregate intelligence export;
- orchestrator-version stamps on new telemetry.

## Control behavior validated

Synthetic runtime fixtures verified:

- SMALL/economy history below target stays under the target gate and retains proxy guards when confidence is low.
- MEDIUM/balanced history with conservative p90 above 5 but <=10 requires approval.
- MEDIUM/high-risk history with conservative p90 above 10 requires splitting.
- LARGE work stays plan-only even when a numeric estimate exists.
- A one-day window with no measured history returns proxy_only instead of inventing a prediction.
- Strong historical median shift is detected as drift and downgrades confidence.
- A real baseline remaining percentage produces typical and conservative post-task remaining estimates.
- Unmeasured work is excluded from burn calibration rather than being counted as zero.
- Aggregate export omits task IDs/project IDs.

## Defects caught during QA

The first v1.4 CI run failed for two source-generation defects:

1. a literal escaped newline was inserted into the telemetry module while adding the version stamp;
2. the same escaped-newline defect was inserted into the observability test.

Because the intelligence module imports telemetry, both observability and intelligence tests failed.

The defects were repaired. The subsequent GitHub Actions run passed all six QA suites.

This confirms the release gate is catching implementation regressions before promotion.

## Statistical accuracy statement

v1.4's arithmetic, cohort selection, gate logic, drift detection, privacy behavior, and historical backtesting implementation are now validated.

The release does **not** yet have enough real user history to claim a real-world forecast accuracy percentage.

The p25-p90 range is an empirical prediction band, not a formal confidence interval.

Predictions remain conservative guidance. Actual account-side usage is authoritative whenever a real meter/checkpoint is available.

## Promotion recommendation

v1.4.0 is ready for user review and promotion.

Next planned version after approval: **v1.5 Adaptive Routing**
- compare historical route signatures descriptively;
- identify candidate lower-cost routes;
- require evidence/minimum-sample gates before changing routing;
- shadow-test candidate routing policies;
- preserve risk/quality floors;
- learn which capability path most often succeeds within budget without making causal claims from weak data.
