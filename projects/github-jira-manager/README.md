# GitHub Jira Manager — V1.4

Version: 1.4.0

## Purpose

A policy-controlled AI engineering control plane with durable event state and a deployable authenticated side-effect worker.

## Runtime path

GitHub/Jira webhook → signature verification → durable event store → reconciliation → durable outbox → authenticated worker → Jira/GitHub APIs.

## V1.4 additions

- Long-running durable outbox worker.
- Jira OAuth 2.0 refresh-token authentication.
- Durable persistence of Atlassian rotating refresh tokens through an encrypted/external secret-store contract.
- GitHub App installation authentication for unattended GitHub-side operations.
- Bounded exponential retry scheduling.
- Permanent-failure dead-letter handling.
- Provider-token invalidation/re-authentication on unauthorized responses.
- Isolated fake GitHub/Jira provider integration tests.
- Docker worker image and secret-safe environment template.

## Delivery semantics

The outbox provides durable logical operation IDs and at-least-once provider delivery. Operations are designed to be idempotent where the destination permits it. V1.4 does not claim impossible network-level exactly-once delivery.

## Security

- No access token, refresh token, private key, or client secret belongs in Git.
- Jira rotating refresh tokens must be durably replaced after refresh.
- The reference single-node deployment encrypts rotating secrets on disk with a key supplied separately by the hosting platform.
- A production cloud deployment may replace the encrypted file with a managed secret-store adapter.
- GitHub App permissions and Jira OAuth scopes must follow least privilege.

## Current live boundary

CI proves the full worker lifecycle against isolated provider APIs. A truly live 24/7 provider test still requires account-owner creation of a GitHub App, an Atlassian OAuth integration, and injection of those secrets into a hosting platform.

## V1.4 completion gate

V1.4 is ready for review when:
- all V1.0-V1.3 regression tests remain green,
- GitHub App JWT → installation-token exchange works against the fake provider,
- Jira OAuth rotating refresh token is persisted before reuse,
- encrypted secret persistence survives restart,
- a durable outbox operation reaches fake Jira,
- transient 5xx failure retries after backoff,
- permanent unsupported work dead-letters,
- completed logical operations do not replay after restart,
- CI passes,
- live credential/deployment work remains explicitly gated rather than simulated.
