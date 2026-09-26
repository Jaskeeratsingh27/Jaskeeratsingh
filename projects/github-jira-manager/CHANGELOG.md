# Changelog

## 1.4.0 — 2026-09-26

### Added
- Long-running durable outbox worker.
- GitHub App installation authentication.
- Jira OAuth 2.0 refresh-token authentication.
- Durable handling of Atlassian rotating refresh tokens.
- Encrypted single-node rotating-secret store contract.
- Exponential retry scheduling and dead-letter state.
- Provider integration tests using isolated fake GitHub/Jira APIs.
- Docker worker image and deployment runbook.

### Reliability
- Temporary HTTP/network/auth failures are retryable.
- Permanent unsupported operations are dead-lettered.
- Completed outbox operations are not selected after restart.
- Logical operation IDs remain stable across retries.

### Security
- Secrets remain outside Git.
- Rotated Jira refresh tokens are persisted before the new access token is accepted.
- GitHub installation tokens are short-lived and generated dynamically.
- Production deployment requires a secure secret manager or encrypted persistent secret volume.

### Boundary
- Live account credentials are not fabricated in CI.
- Actual 24/7 hosted-provider validation remains blocked until the account owner creates/injects GitHub App and Jira OAuth credentials.

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

## 1.2.0 — 2026-09-26

### Added
- Executable contracts for the four V1 agents.
- Deny-by-default role/operation authorization.
- Deterministic GitHub-event to Jira-state reconciliation engine.
- Reconciliation event idempotency.
- Merge-to-Done rule requiring CI, independent QA, and human approval evidence.
- Regression tests for the full failure → recovery → review → approval → Done sequence.

## 1.0.1 — 2026-09-25

### Fixed
- Enforced human approval before entering READY_TO_MERGE.
- Added safe resume semantics for BLOCKED and INPUT_REQUIRED states.
- Added deterministic operation-id idempotency checks.

## 1.0.0 — 2026-09-25

### Added
- Four-agent topology and first deterministic control-plane reference implementation.
