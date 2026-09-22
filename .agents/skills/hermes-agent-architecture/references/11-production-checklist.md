# Production-Readiness Checklist

## Version and reproducibility

- [ ] Hermes release/commit is pinned.
- [ ] Docs-vs-release differences are documented.
- [ ] Profile distributions/config are version controlled.
- [ ] Upgrade path and rollback path exist.

## Agent boundaries

- [ ] Every persistent specialist has a separate profile.
- [ ] Ephemeral work is delegated rather than creating unnecessary profiles.
- [ ] Each profile has an explicit role description and exclusions.
- [ ] No two independent writers share one profile home.

## Context design

- [ ] Identity lives in SOUL.
- [ ] Project rules live in AGENTS/.hermes.
- [ ] Reusable procedures live in skills.
- [ ] Large knowledge lives in skill references/retrieval stores, not memory.
- [ ] Task-specific facts are passed explicitly.

## Workflow

- [ ] Durable work uses Kanban or another durable state machine.
- [ ] Dependencies and lifecycle transitions are explicit.
- [ ] Human-blocked paths are modeled.
- [ ] Retries are bounded.
- [ ] Idempotency is defined for side-effecting tasks.
- [ ] Scratch artifacts are persisted intentionally.

## Contracts

- [ ] Agent input contract is defined.
- [ ] Agent output/result contract is defined.
- [ ] Delegated machine-consumed results use forgiving JSON Schema.
- [ ] Verification evidence is part of completion criteria.
- [ ] Partial/failed/blocked outcomes are representable.

## Capabilities/security

- [ ] Toolsets use least privilege.
- [ ] MCP tools are filtered.
- [ ] Execution sandbox is chosen explicitly.
- [ ] Filesystem/workspace boundary is explicit.
- [ ] Secret passthrough is minimized.
- [ ] Destructive actions have technical controls/approvals.

## Cost/performance

- [ ] Models are selected per role.
- [ ] Auxiliary model overrides are considered.
- [ ] Delegation concurrency/depth is bounded.
- [ ] Iteration/token/cost budgets exist.
- [ ] `execute_code` is used where it reduces context/tool-loop overhead.
- [ ] Fallback routing cost implications are understood.

## Observability

- [ ] Session/turn/request/tool/subagent IDs are captured.
- [ ] Token/latency/cost metrics are emitted.
- [ ] Kanban/task lifecycle is traceable.
- [ ] Errors and retries are attributable to a specific role/task.
- [ ] Sensitive content is redacted from telemetry.

## Validation

- [ ] Happy-path E2E workflow passes.
- [ ] Provider failure is tested.
- [ ] Agent crash/restart is tested.
- [ ] Schema-invalid child output is tested.
- [ ] Human block/unblock is tested.
- [ ] Duplicate/retry side effects are tested.
- [ ] Permission denial is tested.
- [ ] Upgrade compatibility test passes against the pinned Hermes version.
