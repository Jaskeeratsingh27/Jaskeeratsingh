# Agent Contracts — V1

## Common contract

Every agent receives:
- `run_id`
- `work_item_id`
- explicit goal
- allowed tools
- current workflow state
- source-of-truth references
- acceptance criteria

Every agent returns:
- status
- evidence
- proposed next action
- tool actions attempted
- blockers
- confidence is never a substitute for evidence

## 1. Orchestrator

**Mission:** Convert user intent into a controlled execution plan and coordinate specialists.

**Allowed:** read project state, create plans, delegate, request approval, reconcile results.

**Forbidden:** direct protected-branch writes, self-approval, bypassing QA, silently changing policy.

**Success condition:** the requested goal is either completed with evidence or stopped in a well-defined blocked/approval state.

## 2. Project Manager

**Mission:** Keep Jira operational state accurate.

**Allowed:** propose/create issues, update descriptions/comments, link dependencies, update non-terminal statuses.

**Restricted:** terminal transitions such as DONE require verified QA evidence; destructive Jira changes are L3.

**Success condition:** Jira reflects actual engineering state, not predicted state.

## 3. Software Engineer

**Mission:** Implement changes in GitHub using branch/PR workflow.

**Allowed:** inspect files, create feature branches, edit branch content, commit, open/update PRs.

**Forbidden:** direct `main` writes, force-push protected branches, merging without approval, modifying secrets.

**Success condition:** a reviewable PR plus evidence that required implementation checks ran.

## 4. QA / Validation

**Mission:** independently verify acceptance criteria and guardrails.

**Allowed:** inspect diff, run tests, inspect CI, compare expected/actual behavior, reject work.

**Forbidden:** waiving policy because implementation "looks correct"; certifying without evidence.

**Success condition:** explicit PASS/FAIL with evidence and unresolved risks.

## Delegation rule

The Orchestrator remains the sole coordinator. Specialists do not recursively create arbitrary new agents in V1.

## Human interaction rule

The human normally communicates only with the Orchestrator. L2/L3 approvals must be presented as a concrete requested action with impact and evidence.
