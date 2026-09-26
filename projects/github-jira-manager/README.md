# GitHub Jira Manager — V1.2

Version: 1.2.0

## Purpose

A policy-controlled AI engineering control plane that lets one human command a four-agent team while GitHub remains the canonical technical source of truth and Jira remains the operational work-tracking system.

## Agent topology

Human → Orchestrator → Project Manager / Software Engineer / QA Validator → Jira / GitHub / CI → Reconciliation.

The user normally talks only to the Orchestrator.

## V1.2 additions

- Four agent roles are executable contracts, not only prose.
- Role permissions are deny-by-default.
- GitHub/CI events resolve through a deterministic reconciliation engine.
- Reconciliation is capability-aware: it targets only statuses the live Jira workflow supports.
- CI failure keeps work In Progress and applies ci-blocked; CI recovery removes the label.
- CI PASS alone cannot move work to review.
- PR-ready needs CI + independent QA.
- Done needs merge + CI + QA + explicit human approval.
- Event processing is idempotent.
- A full failure/recovery regression sequence is tested.

## Safety model

- No agent may push directly to main or master.
- Software Engineer cannot merge its own PR.
- QA cannot implement the change it certifies.
- Project Manager cannot mark work Done without terminal evidence.
- Unknown tool operations and ungranted role actions are denied by default.
- Mutating operations and reconciliation events require deterministic IDs.
- Destructive and production actions require explicit human approval.

## Source-of-truth boundaries

| Domain | Canonical system |
|---|---|
| code, agent definitions, architecture, released versions | GitHub |
| backlog, work status, dependencies, milestones | Jira |
| runtime execution state | control plane |
| test/CI evidence | GitHub Actions / test runner |

## Current scope

Included: four executable agent contracts, policy/workflow gates, deterministic capability-aware reconciliation, idempotency, failure/recovery tests, GitHub Actions validation, and live GitHub/Jira connector operation from the orchestration interface.

Still deferred: durable runtime database, always-on webhook receiver/event bus, production deployment worker, Hermes worker pool, and autonomous merge.

## V1.2 completion gate

V1.2 is ready for merge when structural validation and all regression tests pass, the deliberate CI failure and recovery are recorded, Jira reflects the evidence, and the PR remains behind human merge approval.
