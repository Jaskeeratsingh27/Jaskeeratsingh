# Changelog

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
