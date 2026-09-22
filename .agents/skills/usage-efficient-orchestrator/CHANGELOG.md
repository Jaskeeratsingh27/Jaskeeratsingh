# Changelog

## 1.3.0 - 2026-09-21

Observability release candidate.

- Added privacy-preserving local append-only orchestration telemetry.
- Added task/event IDs and project hashing without storing full paths.
- Added structured lifecycle events for task start, routing, workers, validation, checkpoints, budget stops, and finish.
- Added explicit measured weekly-usage checkpoints; no inferred percentages are stored.
- Added aggregate 7/30-day reporting with measured-vs-unmeasured separation.
- Added private TokenTrack aggregate export contract without automatic network publishing.
- Added telemetry retention and prune controls.
- Added observability schema/configuration and validation tests.
- Added observability runtime tests to unified QA.
- Kept telemetry best-effort so instrumentation failures do not consume expensive reasoning.

## 1.2.0 - 2026-09-21

Reliability release.

- Added a unified QA runner for orchestrator releases.
- Added GitHub Actions CI for orchestrator policy/config changes.
- Added canonical manifest and version consistency checks.
- Added global install drift detection.
- Added safe one-command global sync with dry-run and backups.
- Added high-confidence secret scanning and sandbox/config safety checks.
- Expanded routing/reliability scenario coverage from 12 to 24 cases.
- Added deterministic routing-policy evaluation.
- Added release-consistency validation.

## 1.1.0 - 2026-09-21

Control-plane hardening release.

- Added mandatory structured Task Envelope.
- Added budget profiles and proxy counters.
- Added risk classification, single-writer rule, capability registry, failure taxonomy, structured handoffs, and deterministic routing scenarios.

## 1.0.0 - 2026-09-21

Initial version-controlled release of the usage-efficient Codex orchestration policy.
