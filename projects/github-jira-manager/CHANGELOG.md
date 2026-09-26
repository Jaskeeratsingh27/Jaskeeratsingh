# Changelog

## 1.2.0 — 2026-09-26

### Added
- Executable contracts for the four V1 agents.
- Deny-by-default role/operation authorization.
- Deterministic GitHub-event to Jira-state reconciliation engine.
- Reconciliation event idempotency.
- Explicit CI-failure blocking and recovery semantics.
- Merge-to-Done rule requiring CI, independent QA, and human approval evidence.
- Regression tests for the full failure → recovery → review → approval → Done sequence.

### Validation plan
- V1.2 deliberately ships its first branch revision with one reconciliation defect so CI must catch it.
- After failure evidence is recorded, the defect is repaired and CI rerun.
- The PR remains unmerged until human approval.

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
