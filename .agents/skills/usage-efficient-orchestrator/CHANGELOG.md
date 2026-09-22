# Changelog

## 1.5.0 - 2026-09-21

Adaptive Routing release candidate.

- Added explicit task-kind classification to the Task Envelope and telemetry.
- Added canonical route templates and baseline routing rules.
- Added shadow-mode adaptive routing with no silent route replacement.
- Added route-level minimum sample and measured-usage gates.
- Added success-rate and validation-pass quality floors.
- Added p90 absolute and relative improvement requirements before recommending a cheaper route.
- Added HIGH-risk reviewer retention, CRITICAL/LARGE plan-only protection, and escalation-only senior routes.
- Added drift/calibration suppression for active adaptation.
- Added canonical approval registry for future active route changes; default registry is empty.
- Added structured adaptive-routing recommendation telemetry.
- Added deterministic route comparison, shadow analysis, and privacy-preserving aggregate export.
- Added 12 adaptive-routing scenarios and runtime QA coverage.
- Preserved the non-causal interpretation of observational route history.
- Added safe rebased-release branch compatibility after concurrent repository changes.

## 1.4.0 - 2026-09-21

Usage Intelligence release candidate.

- Added calibrated pre-task burn estimation from real measured telemetry.
- Added hierarchical cohort fallback with minimum-sample gates.
- Added robust p25/median/p90 empirical prediction bands and MAD dispersion.
- Added low/medium/high confidence classification with drift downgrades.
- Added historical median-drift detection.
- Added leave-one-out backtesting with MAE, median absolute error, and conservative-upper coverage.
- Added deterministic usage gates: proxy_only, proceed_with_proxy_guards, proceed, approval_required, split_required, plan_only.
- Added profile-target/ceiling consistency checks against the canonical budget configuration.
- Added baseline remaining-percentage projection when a real baseline is available.
- Added aggregate analysis by complexity, profile, route signature, and orchestrator version.
- Added privacy-preserving aggregate intelligence export for TokenTrack.
- Added orchestrator-version stamps to new telemetry events.
- Added usage-intelligence runtime tests to the unified QA suite.
- Kept predictions explicitly non-guaranteed and prevented unmeasured work from being treated as zero usage.

## 1.3.0 - 2026-09-21

Observability release.

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

- Added unified QA, CI, manifest/version checks, global drift detection, safe sync, security scanning, 24 routing scenarios, and release consistency validation.

## 1.1.0 - 2026-09-21

Control-plane hardening release.

- Added Task Envelopes, budget profiles/proxy counters, risk classification, single-writer execution, capability registry, failure taxonomy, structured handoffs, and deterministic routing scenarios.

## 1.0.0 - 2026-09-21

Initial version-controlled release of the usage-efficient Codex orchestration policy.
