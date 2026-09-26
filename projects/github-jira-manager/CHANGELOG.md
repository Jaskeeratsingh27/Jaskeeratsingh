# Changelog

## 1.3.0 — 2026-09-26

### Added
- Durable SQLite reference runtime for jobs, inbound events, decisions and outbox intents.
- Authenticated GitHub and Jira webhook ingestion.
- Provider-delivery-id and payload-hash replay protection.
- Atomic reconciliation-decision + outbox persistence.
- Crash/restart recovery for partially processed webhook events.
- Persistent retry state for failed outbound operations.
- V1.3 webhook, durability, replay and restart regression suite.

### Security
- GitHub webhook validation uses X-Hub-Signature-256 and HMAC-SHA256.
- Jira webhook validation uses X-Hub-Signature with a safe HMAC algorithm allowlist.
- Secrets and raw credentials are runtime-only and never persisted in source control or event rows.
- Reused delivery IDs with changed content are rejected.

### Boundary
- V1.3 does not pretend ChatGPT interactive connector authorization is a deployable service credential.
- Unattended API writes require a separately authenticated worker.

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
