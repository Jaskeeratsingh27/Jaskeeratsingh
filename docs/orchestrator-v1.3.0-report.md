# Usage-Efficient Orchestrator v1.3.0 - Observability Report

Date: 2026-09-21
Branch: orchestrator-v1.3.0
PR: #3
Status: Release candidate awaiting user approval

## TL;DR

- v1.2.0 was promoted to main after user approval.
- v1.3.0 Observability is implemented on an isolated release branch.
- GitHub Actions runtime CI: **SUCCESS**
- Unified QA: **5/5 suites passed**
- Structural/control checks: **61/61 passed**
- Routing-policy checks: **138/138 passed across 24 scenarios**
- Security/reliability checks: **14/14 passed**
- Observability runtime checks: **33/33 passed**
- Release checks: **10/10 passed**
- Synthetic measured-usage test: baseline 64 -> final 61 = **3.00 percentage points**, calculated exactly.
- Tasks without compatible checkpoints remain unmeasured; reset/cycle mismatches never become negative usage.

## v1.3 capabilities

- local append-only JSONL orchestration ledger;
- generated task/event IDs;
- one-way hashed project identity;
- role/model/reasoning/access routing metadata;
- worker, validation, retry/test/file-count metadata;
- explicit measured weekly-usage checkpoints;
- measured-vs-unmeasured reporting;
- reset/cycle mismatch detection;
- 7/30-day aggregate reports;
- aggregate-only TokenTrack export contract;
- retention/prune controls;
- max ledger size/event controls;
- user-only directory/file permissions where supported;
- rejection of unknown/free-text telemetry fields.

## Privacy verification

Runtime tests confirmed:
- no cwd/full project path in ledger;
- no prompt/source/file-content/raw-output fields;
- free-text telemetry argument rejected;
- directory mode 0700 and ledger mode 0600 on Linux CI;
- TokenTrack export omits task IDs and project IDs;
- high-confidence secret scan remains green.

## Test history

The first CI attempt failed because v1.3 had preserved the reliability behavior but removed three exact gate headings expected by the v1.2 security validator.

The defect was corrected by restoring explicit Drift/Security/CI gate headings and extending the security validator to check observability privacy configuration.

The next CI run passed all suites.

This is evidence that the release gate is catching control-plane regressions rather than merely documenting them.

## Accuracy boundary

v1.3 can accurately calculate a measured allowance delta when real compatible before/after checkpoints exist.

v1.3 does **not** yet predict future allowance burn. Real predictive accuracy, calibration confidence, and routing recommendations belong to v1.4 after telemetry is collected from actual tasks.

## Promotion recommendation

v1.3.0 is ready for user approval and promotion to main.

Next planned version after approval: **v1.4 Usage Intelligence**
- calibrated burn estimator;
- task-feature extraction from non-sensitive telemetry;
- confidence intervals / minimum-sample gates;
- per-role and per-task-class efficiency statistics;
- conservative pre-task burn range;
- approval gate when predicted burn exceeds the selected profile target.
