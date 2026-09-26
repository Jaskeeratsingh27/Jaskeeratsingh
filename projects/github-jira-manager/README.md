# GitHub Jira Manager — V1.3

Version: 1.3.0

## Purpose

A policy-controlled AI engineering control plane where GitHub is canonical for technical artifacts, Jira is canonical for work state, and event processing can survive process/chat restarts.

## Runtime topology

Human → Orchestrator → Project Manager / Software Engineer / QA Validator → GitHub/Jira/CI.

External events enter through:

GitHub/Jira webhook → signature verification → durable event store → reconciliation → durable outbox → authenticated side-effect worker.

## V1.3 additions

- SQLite reference runtime store for jobs, inbound event identity, decisions and outbox intents.
- Persist-before-reconcile semantics.
- Atomic reconciliation-decision + outbox persistence.
- Crash/restart recovery for events received but not yet decided.
- Delivery replay protection using provider delivery IDs plus payload hashes.
- GitHub HMAC-SHA256 webhook verification.
- Jira HMAC webhook verification.
- GitHub PR/workflow-run event normalization.
- Jira webhook auditing without feedback-loop side effects.
- Durable failed/pending outbox replay.
- No raw webhook secrets or credentials stored in Git or runtime event records.

## Reliability model

1. Authenticate the webhook.
2. Normalize only known event shapes.
3. Persist delivery identity before reconciliation.
4. Reject a reused delivery ID with different content.
5. Compute a deterministic reconciliation decision.
6. Atomically persist the decision and all side-effect intents.
7. Let a worker execute outbox operations.
8. Mark a side effect complete only after the destination API acknowledges it.
9. Re-run pending/failed outbox rows after restart.

## Storage

SQLite is the deterministic V1.3 reference because it is dependency-free and testable in CI. The production target remains Postgres.

## Important deployment boundary

V1.3 makes receipt, persistence, reconciliation and replay deployment-ready. It does **not** embed ChatGPT connector credentials in a server. True unattended Jira/GitHub writes require a deployed worker authenticated with service credentials/OAuth.

## Safety model

All V1.2 role and approval gates remain. Webhook events are evidence, not authority: a merge event still cannot produce Jira Done without CI, QA and explicit human-approval evidence.

## Completion gate

V1.3 is ready for review when:
- V1/V1.2 regressions pass,
- official GitHub/Jira signature vectors pass,
- tampered requests are rejected,
- job state survives restart,
- identical retries are idempotent,
- conflicting retries are rejected,
- a crash after event receipt resumes on redelivery,
- outbox work survives restart,
- failed outbox actions remain replayable,
- CI is green,
- merge remains human-gated.
