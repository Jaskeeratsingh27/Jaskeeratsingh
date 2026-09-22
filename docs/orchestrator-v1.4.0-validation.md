# Orchestrator v1.4.0 Usage Intelligence Validation Plan

Status: release candidate branch `orchestrator-v1.4.0`

## Objective

Validate that historical measured usage can produce conservative pre-task guidance without fabricating data or weakening the existing proxy stop-loss.

## Core runtime scenarios

The v1.4 test suite verifies:

- measured SMALL/economy history below target -> `proceed_with_proxy_guards`;
- measured MEDIUM/balanced history with p90 above 5 but <=10 -> `approval_required`;
- measured MEDIUM/high-risk history with p90 >10 -> `split_required`;
- LARGE work -> `plan_only` regardless of numeric estimate;
- no recent measured history -> `proxy_only` with no invented estimate;
- historical median drift -> flagged and confidence downgraded;
- real baseline remaining percentage -> projected typical/conservative remaining values;
- leave-one-out backtest produces finite MAE and conservative-upper coverage;
- unmeasured tasks are excluded from burn calibration rather than treated as zero;
- private aggregate export omits task IDs and project IDs.

## Statistical design

The estimator uses:
- hierarchical cohorts;
- minimum-sample gates;
- p25 / median / p90 empirical bands;
- median absolute deviation;
- older-vs-newer median drift detection;
- leave-one-out historical calibration.

The p25-p90 band is an empirical prediction band, not a formal confidence interval.

## Accuracy boundary

Synthetic fixtures validate arithmetic and control logic.

They do not establish the estimator's real-world predictive accuracy for the user's account. Real-world calibration begins only after enough actual tasks have measured before/after checkpoints.

## Release gate

Run:

```bash
node scripts/orchestrator-qa.mjs
```

Promotion requires:
1. all QA suites green;
2. GitHub Actions runtime CI green;
3. budget profile/intelligence configuration consistency;
4. privacy/security checks green;
5. explicit user approval.
