# Changelog

## 1.3.0 — 2026-09-21

- Added per-capability verification dates and source-priority freshness thresholds.
- Added deterministic knowledge-health scoring and drift detection.
- Added weekly audit snapshot schema plus append-only audit-history index.
- Added historical knowledge-health reports and health-history index.
- Added drift signals for unresolved revalidation, pending upgrades, release-baseline mismatch, stale audits, and stale critical capabilities.
- Added health/drift regression fixtures covering time aging and control-plane drift.
- Expanded structural validation to cross-check freshness policy, verification dates, audit history, health history, and new control files.
- Added a fourth GitHub CI gate for knowledge-health and drift regressions.
- Updated weekly maintenance so every audit records history and health even when no Hermes knowledge changes.
- Established that routine audit/health telemetry does not by itself require a semantic skill version bump.

## 1.2.0 — 2026-09-21

- Added a deterministic release-impact engine that classifies Hermes changes by severity and computes their blast radius.
- Added capability-to-source, knowledge-file, primitive-routing, and regression-case impact mapping.
- Added a machine-readable upgrade matrix for the pinned Hermes baseline and future release transitions.
- Added a strict change-event JSON Schema for scheduled audit findings.
- Added targeted regression selection so affected capabilities identify the architecture cases that matter most.
- Added release-impact regression fixtures covering documentation changes, stable behavior changes, breaking Kanban changes, security changes, ambiguous evidence, and unknown future subsystems.
- Expanded structural validation to cross-check compatibility, impact mapping, source IDs, routing IDs, knowledge files, upgrade baseline, and impact fixtures.
- Extended GitHub CI with release-impact regression tests.
- Updated the weekly maintenance contract to classify change events before patching the knowledge base.

## 1.1.0 — 2026-09-21

- Added machine-readable Hermes compatibility manifest tied to the skill version and official source IDs.
- Added machine-readable primitive-routing decision table for core Hermes architecture choices.
- Added deterministic architecture regression fixtures and runner.
- Extended structural validation and GitHub Actions CI.
- Updated the weekly refresh contract to refresh compatibility state and run deterministic validation before promotion.

## 1.0.0 — 2026-09-21

- Initial Hermes Agent architecture knowledge-base skill.
- Verified stable release baseline v0.21.3 / v2026.9.14.
- Added references, task/result contracts, maintenance source manifest, weekly refresh prompt, and deterministic structural validation.
