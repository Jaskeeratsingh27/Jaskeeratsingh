# Orchestrator v1.3.0 Observability Validation Plan

Status: release candidate branch `orchestrator-v1.3.0`

## Objective

Prove that v1.3 can collect useful orchestration metadata without recording task content, and that measured weekly-usage burn is only calculated from real compatible checkpoints.

## Runtime tests

`node scripts/test-observability.mjs` exercises:

- complete task lifecycle;
- generated task IDs;
- hashed project identity;
- role/model routing events;
- worker completion metadata;
- validation events;
- real before/after usage checkpoints;
- measured burn calculation;
- unmeasured-task separation;
- reset/cycle mismatch handling;
- aggregate-only TokenTrack export;
- rejection of unknown/free-text telemetry arguments;
- user-only storage permissions where supported;
- retention pruning.

## Privacy acceptance criteria

The local ledger must not contain:
- cwd/full project path;
- prompt/conversation text;
- source code/file contents;
- raw tool output;
- free-form notes;
- credentials.

## Accuracy acceptance criteria

For the synthetic measured case:

- baseline remaining = 64;
- final remaining = 61;
- expected burn = exactly 3 percentage points.

Tasks without compatible real checkpoints must remain unmeasured rather than being treated as zero.

A reset or cycle mismatch must never produce a negative burn.

## Release gate

Run:

```bash
node scripts/orchestrator-qa.mjs
```

Promotion requires all suites green and user approval.

## Accuracy boundary

v1.3 establishes measurement and observability. It does not yet predict future burn. Calibration and prediction begin in v1.4 after real usage history exists.
