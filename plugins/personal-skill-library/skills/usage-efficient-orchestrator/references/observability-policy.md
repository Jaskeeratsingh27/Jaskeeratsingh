# Observability Policy

## Purpose

Collect enough structured execution metadata to measure routing behavior and, when real usage checkpoints exist, actual weekly-allowance burn. Do not turn observability into a new source of token or privacy cost.

## Local-first storage

Default ledger:

`~/.codex/orchestrator/telemetry/events.jsonl`

The directory is created with user-only permissions where supported. The event file is user-readable/writable only where supported.

The ledger is not committed to GitHub and is not uploaded automatically.

## Privacy boundary

Never store:
- prompts or conversation text;
- source code or file contents;
- raw tool output;
- API keys, tokens, credentials, or secrets;
- full file-system paths;
- email/message/document bodies.

Project identity is a truncated SHA-256 hash of the current working directory unless an explicit non-sensitive project ID is supplied.

`task_kind`, closed-loop control decisions, prediction/error numbers, and adaptive-routing metadata are controlled enums/identifiers/numbers only; free-form routing rationale is intentionally excluded.

## Event lifecycle

Supported event types:
- task_started
- preflight_decision
- routing_recommendation
- route_selected
- worker_finished
- validation
- usage_checkpoint
- budget_stop
- task_finished
- post_task_evaluation

Events are append-only JSON Lines.

## Usage measurements

A percentage is **measured** only when it comes from:
- an explicit user-provided remaining percentage; or
- a reliable product/status meter available to the session.

Never infer or synthesize a remaining percentage from task complexity.

Burn is calculated only when a task has compatible before/after checkpoints in the same declared usage cycle, or when no cycle identifier is supplied and the final remaining percentage is not greater than the baseline.

If remaining percentage increases, classify the pair as reset/invalid rather than negative usage.

## Instrumentation budget

Telemetry itself should be cheap:
- one start event;
- at most one closed-loop preflight decision event;
- at most one adaptive routing recommendation event per preflight decision;
- route events only for actual routed work;
- one worker-finished event per completed/blocked worker;
- validation events only for checks actually run;
- checkpoints only when real measurements exist;
- one finish or budget-stop event;
- at most one post-task evaluation event.

Do not narrate telemetry actions to the user unless relevant.

A telemetry tooling failure gets one retry at most; then classify it as tooling_environment and continue the primary task.

## Reporting

Reports must separate:
- tasks with measured allowance deltas;
- tasks without measured deltas;
- successful/blocked/failed tasks;
- routing by role/model;
- budget stops;
- retry/test/file-count metadata.

Do not treat unmeasured tasks as zero usage.

## TokenTrack export

The default export is aggregate-only and omits task IDs and project IDs.

v1.3 defines the export contract but does not automatically transmit telemetry to TokenTrack or any other network service.
