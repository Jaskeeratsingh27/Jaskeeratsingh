# Changelog

## 1.0.1 — 2026-09-25

### Fixed
- Enforced human approval before entering READY_TO_MERGE.
- Added safe resume semantics for BLOCKED and INPUT_REQUIRED states.
- Added deterministic operation-id idempotency checks.
- Added regression coverage for duplicate operations and protected-branch writes.

## 1.0.0 — 2026-09-25

### Added
- Four-agent topology: Orchestrator, Project Manager, Software Engineer, QA/Validation.
- Source-of-truth contract for GitHub, Jira, and runtime state.
- Explicit approval tiers.
- Workflow state machine with QA gate.
- Deterministic Python control-plane reference implementation.
- Unit and structural validation tests.
- CI workflow for V1 validation.

### Deferred
- Live Jira integration.
- Dedicated GitHub App authentication.
- Database-backed job state.
- Webhook/event processing.
- Deployment automation.
- Hermes execution workers.
