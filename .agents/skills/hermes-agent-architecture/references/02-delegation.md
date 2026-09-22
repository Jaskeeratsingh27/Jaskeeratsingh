# Subagent Delegation

## What `delegate_task` is

`delegate_task` spawns isolated child AIAgent instances. Children get fresh conversations, their own terminal sessions, and inherited enabled toolsets. Only their result returns to the parent context.

## Context contract

Assume a child knows nothing about the parent's conversation. The parent must pass required facts in `goal` and `context`.

When a workspace is resolved, project context files can be embedded for the child using Hermes' project-context rules. `SOUL.md` is excluded from child inheritance, so do not assume the child has the parent's persona instructions.

## Structured output

A delegated task may specify `output_schema` as JSON Schema. Hermes presents the schema to the child as an output contract, validates the result, and allows one bounded correction turn on validation failure. The result records validation status/errors.

Design schemas to be tolerant. Require only fields that downstream automation truly reads.

## Parallelism and depth

Hermes supports batch delegation for parallel work. Documentation current on the research date describes up to 10 concurrent subagents by default, configurable.

Nested delegation can multiply spend quickly. Treat depth as an explicit architecture decision and bound concurrency, depth, and child count.

## Durability

Delegation is not durable workflow execution. A restart does not resume a running child; attempts can become unknown when Hermes cannot prove which side effects happened.

Use delegation for short-lived fork/join work. Use Kanban when restart survival, agent reassignment, human blocking, or auditability matters.

## Good uses

- parallel research slices
- bounded code analysis
- independent review passes
- data extraction with structured results
- short deterministic worker tasks

## Poor uses

- long workflows spanning hours/days
- workflows requiring human intervention
- authoritative task queues
- cross-restart state machines
- many nested agents without bounded budgets
