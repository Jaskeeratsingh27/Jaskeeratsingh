# Agent Contracts — V1.2

The executable source of truth for operation grants is src/control_plane.py::AGENT_CONTRACTS. This document explains the human-readable contract. If this file and executable policy disagree, validation must fail and the executable policy is not silently overridden.

## Common envelope

Every specialist receives:
- run_id
- work_item_id
- explicit goal
- acceptance criteria
- allowed operation surface
- current Jira/GitHub state
- source-of-truth references

Every specialist returns evidence, not confidence:
- status
- evidence
- actions attempted
- proposed next action
- blockers/risks

## Orchestrator

**Owns:** planning, delegation, reconciliation decisions, approval requests.

**May:** read state, create plans, delegate to the three specialists, invoke reconciliation logic, request approval.

**Must not:** commit code, merge PRs, self-certify QA, silently change policy.

## Project Manager

**Owns:** Jira operational truth.

**May:** read/create/link Jira work, add comments/labels, and apply non-terminal transitions supported by verified reconciliation evidence.

**Must not:** write code, merge PRs, or mark work Done without the terminal evidence gate.

## Software Engineer

**Owns:** branch-scoped implementation.

**May:** read repos, create branches, commit on feature branches, open/update PRs.

**Must not:** write directly to main/master, merge its own PR, modify secrets, or certify its own implementation.

## QA Validator

**Owns:** independent acceptance evidence.

**May:** inspect repository/PR/checks, run tests, and issue PASS/FAIL reports.

**Must not:** implement the change under review, merge it, or waive acceptance criteria.

## Reconciliation contract

The current AI Agents Jira workflow supports only **To Do, In Progress, In Review, Done**. V1.2 therefore represents a CI block using the supported In Progress status plus a ci-blocked label.

| Event | Jira outcome |
|---|---|
| PR opened | In Progress |
| CI failed | In Progress + ci-blocked |
| CI passed | In Progress, remove ci-blocked; QA still required |
| PR ready + CI PASS + QA PASS | In Review |
| PR merged + CI PASS + QA PASS + human approval | Done |

The reconciliation layer must never target a Jira status the project cannot actually accept. A merge event alone is never sufficient for Done.

## Human approval boundary

Merge/release/production/destructive operations remain human-gated. A specialist cannot grant itself the approval it needs.
