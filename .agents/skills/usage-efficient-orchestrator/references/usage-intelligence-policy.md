# Usage Intelligence Policy

## Purpose

Turn real v1.3 telemetry into conservative pre-task allowance guidance without pretending to know an exact future percentage.

v1.4 is an empirical estimator, not an account-side billing meter.

## Input data

Only tasks with compatible real before/after remaining-percentage checkpoints are eligible for burn calibration.

Unmeasured tasks remain useful for operational counts but are excluded from burn estimation.

Reset or incompatible-cycle pairs are excluded.

## Prediction hierarchy

Use the narrowest sample cohort with enough measured tasks:

1. exact: complexity + risk + profile;
2. complexity + profile;
3. complexity;
4. global.

If no cohort satisfies its minimum sample threshold, return `proxy_only` with no numeric prediction.

Never invent a value to fill missing data.

## Robust statistics

Use empirical, non-parametric statistics:
- lower band: p25;
- typical: median;
- conservative upper band: p90;
- dispersion: median absolute deviation (MAD).

The p25-p90 range is an empirical prediction band, **not** a formal confidence interval.

## Confidence

Confidence is based on:
- sample count;
- relative empirical spread;
- drift detection;
- backtest quality when enough historical predictions exist.

Low confidence never disables the existing proxy counters.

## Drift detection

When enough samples exist, compare the older and newer halves of the selected cohort.

If median burn shifts by at least the configured ratio, mark `drift_detected=true` and downgrade confidence.

Do not discard the samples silently.

## Gate semantics

- `proxy_only`: insufficient measured history; use proxy controls only.
- `proceed_with_proxy_guards`: estimate is below target but confidence/calibration is not strong enough to relax proxies.
- `proceed`: conservative upper band is at or below the target and confidence/calibration are acceptable.
- `approval_required`: conservative upper band exceeds the profile target but is not above its absolute ceiling.
- `split_required`: conservative upper band exceeds the absolute ceiling; do not execute as one autonomous turn.
- `plan_only`: LARGE or CRITICAL work remains plan-first regardless of predicted burn.

The stricter risk/control-plane gate always wins.

## Backtesting

Use leave-one-out historical backtesting.

Metrics:
- mean absolute error (MAE) of the typical/median prediction;
- median absolute error;
- conservative-upper-band coverage;
- number of predictions that could be made.

Backtest results are descriptive of historical calibration only. They do not guarantee future performance.

## No causal claims

Descriptive statistics by role, model, or route signature do not prove that one model caused lower usage.

Causal routing optimization belongs to later adaptive-routing stages.

## Privacy

Usage intelligence consumes the local structured telemetry ledger.

Predictions/reports must not expose task IDs, project IDs, prompts, source code, file contents, or raw tool output in aggregate exports.
