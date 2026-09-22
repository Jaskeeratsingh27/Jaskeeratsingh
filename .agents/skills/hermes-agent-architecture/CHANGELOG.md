# Changelog

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
- Added deterministic architecture regression fixtures and runner covering persistent agents, delegation, Kanban, skills, project context, SOUL, Cron, MCP, execute_code, and sandboxing.
- Extended structural validation to cross-check compatibility status, source references, routing references, and regression fixtures.
- Added GitHub Actions CI for Hermes skill changes and pull requests.
- Updated the weekly refresh contract so maintenance runs refresh compatibility state and run both structural and regression validation before promotion.
- Documented v1.1 quality gates and compatibility-status usage.

## 1.0.0 — 2026-09-21

- Initial Hermes Agent architecture knowledge-base skill.
- Verified stable release baseline v0.21.3 / v2026.9.14.
- Added references for profiles, delegation, Kanban, skills/context, memory, tools/MCP, models, cron, security, and observability.
- Added task/result contracts and profile/context templates.
- Added a design-only weekly refresh specification.
- Added machine-readable maintenance source manifest and ready-to-schedule weekly refresh prompt.
- Added deterministic structural validator for version, JSON, paths, and source manifest.
