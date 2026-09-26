# Changelog

## 1.2.0 — 2026-09-26

### Added
- Executable contracts for the four V1 agents.
- Deny-by-default role/operation authorization.
- Deterministic GitHub-event to Jira-state reconciliation engine.
- Reconciliation event idempotency.
- Merge-to-Done rule requiring CI, independent QA, and human approval evidence.
- Regression tests for the full failure → recovery → review → approval → Done sequence.

### Validated
- Deliberate CI failure observed in GitHub Actions run #12: structural validation passed and unit tests failed.
- Jira correctly remained out of In Review during the failure.
- Live Jira capability discovery showed the AI Agents workflow has no Blocked status.
- Reconciliation was hardened to represent CI failure as In Progress + ci-blocked, then remove that label after CI recovery.

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
- Persistent database.
- Webhook/event receiver service.
- Deployment automation.
- Hermes execution workers.
