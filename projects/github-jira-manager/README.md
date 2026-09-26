# GitHub Jira Manager — V1

Version: 1.0.0

## Purpose

A policy-controlled AI engineering control plane that lets one human command a four-agent team while GitHub remains the canonical technical source of truth and Jira remains the operational work-tracking system.

## V1 agent topology

1. **Orchestrator** — interprets the user's goal, decomposes work, routes tasks, and enforces policy/approval gates.
2. **Project Manager** — owns Jira planning/state: epics, issues, dependencies, milestones, comments, and status.
3. **Software Engineer** — owns branch-scoped GitHub changes: inspect, branch, modify, commit, and open PR.
4. **QA / Validation** — independently verifies acceptance criteria, CI status, regressions, and policy compliance.

The user normally talks only to the Orchestrator.

## V1 safety model

- No agent may push directly to `main`.
- No agent may merge a PR without a review-required approval.
- Destructive actions and production-impacting actions require explicit human approval.
- GitHub is canonical for code, agent definitions, architecture, documentation, and released versions.
- Jira is canonical for backlog, project status, issue workflow, dependencies, and milestones.
- Runtime job state belongs to the control plane, not chat history.
- V1 uses mocked adapters until policy/orchestration tests pass.

## V1 scope

Included:
- Four-agent contracts.
- Workflow/state machine.
- Approval policy.
- Deterministic Python reference implementation.
- Unit tests and structural validation.
- GitHub Actions CI.

Deferred to V1.1+:
- Live Jira OAuth/API adapter.
- Dedicated GitHub App adapter.
- Persistent database.
- Webhooks/event bus.
- Deployment worker.
- Hermes workers.
- Autonomous merging.

## Project layout

```
projects/github-jira-manager/
├── README.md
├── VERSION
├── CHANGELOG.md
├── architecture/V1.md
├── agents/AGENTS.md
├── config/approval-policy.yaml
├── config/workflow.yaml
├── src/control_plane.py
└── tests/
    ├── test_control_plane.py
    └── validate_v1.py
```

## V1 completion gate

V1 is structurally complete when:
- all required files exist,
- unit tests pass,
- policy tests prove unsafe actions are blocked without approval,
- workflow tests prove work cannot skip QA to reach DONE,
- CI executes those checks on pull requests.

Live Jira/GitHub mutation is deliberately not part of this gate.
