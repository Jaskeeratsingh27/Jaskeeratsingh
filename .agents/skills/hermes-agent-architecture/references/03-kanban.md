# Kanban: Durable Multi-Agent Control Plane

Hermes Kanban is a durable board shared across profiles on the same host. It stores tasks, dependencies, comments, handoffs, workspaces, events, and worker lifecycle state in SQLite.

## When to use it

Use Kanban when work:

- crosses persistent agent/profile boundaries
- must survive process restarts
- may need human input
- may be reassigned to another specialist
- needs durable review/audit/history
- has dependencies or a task graph

Use `delegate_task` when a parent needs a short isolated result back in its own context. A Kanban worker can delegate internally.

## Task lifecycle

Current documented states include:

`triage -> todo -> ready -> running -> review/blocked/done -> archived`

Dependencies gate children until parents complete. Comments are a durable inter-agent protocol and are restored into worker context.

## Worker termination contract

Workers should explicitly terminate their run through lifecycle actions such as completion, review request, or block. Silent exit is a failure path.

A production worker result should leave enough evidence to answer:

1. What changed?
2. How was it verified?
3. What is needed to unblock/retry?
4. What residual risk remains?

## Workspaces

Kanban can use scratch workspaces and Git worktrees. For coding systems, prefer per-task worktrees to reduce conflicting edits and make review/recovery clearer.

Durable deliverables should be attached/persisted explicitly; do not assume arbitrary scratch files survive.

## Control-plane principle

Kanban owns workflow lifecycle truth. Bot messages, chat history, and files may provide collaboration/evidence, but should not become competing sources of workflow state.

## Current scope boundary

Hermes documentation describes Kanban as single-host. Do not assume one SQLite board safely coordinates workers across multiple hosts. Multi-host architectures need a different distributed coordination primitive or separate boards bridged through a queue/service.
