# Hermes Research Dossier — Bot Mode, delegation, Kanban, skills

## 5. Bot Mode: Persistent Named Collaboration

Bot Mode is primarily a UI/interaction layer over Profiles. Official documentation states that each Bot is a Hermes Profile with its own role, model, memory, skills, and avatar; the same Profile remains accessible through CLI commands. [S04]

This makes Bot Mode useful for persistent human-facing specialists such as:

- Architect
- Researcher
- Engineer
- QA reviewer
- Release manager

However, Bot-to-Bot chat should not become the authoritative workflow database. Messages are useful as collaboration, discussion, and notification; durable workflow truth should be owned by Kanban or another explicit state machine.

---

## 6. Subagent Delegation: Ephemeral Workers

Hermes' `delegate_task` tool creates child AIAgent instances with isolated context, inherited tool access, and separate terminal sessions. The official delegation documentation explicitly states that each child gets a fresh conversation and only its final result returns to the parent context. [S07]

### Critical context behavior

Subagents start with **zero knowledge of the parent's conversation history**. The parent must pass all required facts in `goal` and `context`. [S07]

When a parent has a resolved workspace, project context may be embedded into the subagent's system prompt according to Hermes' context-file rules. The documentation specifically notes that `SOUL.md` is excluded from this inheritance. [S07]

Therefore, a delegated task should be treated like a function call:

```text
explicit input contract
        |
        v
isolated worker execution
        |
        v
explicit output contract
```

### Parallel delegation

Current documentation states that Hermes supports parallel batches and describes up to 10 concurrent subagents by default, configurable without a documented hard ceiling. [S07]

Parallel delegation is appropriate for independent workstreams such as:

- multiple research questions
- multiple code-review slices
- independent test/debug hypotheses
- independent data extraction tasks

### Structured `output_schema`

One of Hermes' most important production features is structured delegated output. A task can include an `output_schema` JSON Schema. Hermes provides the schema to the child, validates the response, and on failure sends one bounded correction turn containing validation errors. The parent receives schema validity metadata. Useful work is not discarded if the second result is still invalid; raw child output remains available with validation failure metadata. [S07]

This is well suited for agent-to-agent contracts.

Recommended delegated result shape:

```json
{
  "status": "completed",
  "summary": "...",
  "artifacts": [],
  "evidence": [],
  "assumptions": [],
  "verification": [],
  "residual_risks": [],
  "blocked_reason": null,
  "follow_up_tasks": []
}
```

Hermes documentation advises keeping schemas forgiving and requiring only fields downstream logic actually reads. [S07]

### Nested delegation and cost explosion

Current documentation also describes nested delegation/orchestrator children gated by spawn-depth configuration and warns that concurrency multiplied across depth can produce large numbers of simultaneous agents and high cost. [S07]

Regardless of exact release-specific syntax, the production design principle is stable:

- bound delegation depth
- bound concurrent children
- bound total children
- set iteration/time/cost budgets
- require a reason for recursive delegation

### Delegation is not durable workflow

Hermes documentation explicitly states that a process restart does not resume an in-flight child; Hermes may classify the attempt as unknown because it cannot prove which side effects occurred. [S07]

Therefore:

**Use `delegate_task` for short fork/join work. Use Kanban for durable multi-agent workflow.**

---

## 7. Kanban: Durable Multi-Agent Orchestration

Hermes Kanban is the central production primitive for durable cross-agent collaboration. The documentation describes a durable board backed by SQLite, shared across Hermes profiles on one host, where each task, handoff, worker run, comments, dependencies, and lifecycle state are persisted. [S08]

### When Hermes itself recommends Kanban

The official documentation draws a direct boundary: [S08]

- Use `delegate_task` for a short reasoning result needed by the parent before continuing.
- Use Kanban when work crosses agent boundaries, must survive restarts, may need humans, may be picked up by different roles, or must remain discoverable/auditable.
- The two can coexist: a Kanban worker may internally use delegation.

### Core task state

The current documented task states include:

`triage | todo | ready | running | blocked | review | done | archived` [S08]

Dependencies are represented by parent-child links. Workers and humans can append durable comments. When a worker starts/restarts, Hermes includes the relevant durable context/comments. [S08]

### Workspaces

Kanban tasks can execute in different workspace modes such as scratch directories and Git worktrees. For software engineering, worktrees are particularly valuable because they isolate parallel code changes by task/branch. [S08][S19]

Scratch workspaces are ephemeral; deliverables should be explicitly attached/persisted so important artifacts do not disappear with cleanup. [S08]

### Lifecycle termination

Worker lanes are expected to end through explicit lifecycle actions such as completion, review request, or blocking. A worker that exits without the lifecycle contract is treated as a failure path. [S20]

A good worker handoff should make these questions easy for the next agent/human to answer:

1. What changed?
2. How was it verified?
3. What is needed to unblock or retry?
4. What risk remains?

### Review gates

Kanban supports a first-class review state and request-changes/review workflows. This enables a durable separation between implementer and reviewer rather than relying on the same agent to self-certify. [S08][S20]

### Single-host limitation

Current documentation explicitly says Kanban is deliberately single-host and uses a local SQLite board with host-local worker process assumptions. Multi-host coordination requires separate architecture (e.g. independent boards plus an external queue/service). [S08]

### Recommended architecture

For one-machine production systems:

```text
Kanban = authoritative workflow state
Git/files = authoritative artifact state
Profiles = worker identities
Delegation = temporary worker compute
Messages = collaboration/notifications
```

---

## 8. Skills: Reusable Knowledge and Procedures

Hermes Skills are on-demand knowledge documents using progressive disclosure. Official documentation describes `~/.hermes/skills/` as the primary skill source and notes compatibility with the Agent Skills standard. [S05]

### Progressive disclosure

Hermes exposes a skill index/metadata first, full `SKILL.md` only when needed, and individual reference files on demand. This reduces token usage by keeping the full knowledge corpus out of every prompt. [S05]

For a large corpus, Hermes documentation specifically describes a **knowledge-base skill** pattern: a lean `SKILL.md` containing mental models/index plus detailed topic files under `references/`. [S05]

That is why this Hermes architecture package is structured that way.

### Typical skill structure

```text
skill/
  SKILL.md
  references/
  templates/
  scripts/
  examples/
  assets/
```

The official docs provide a standard `SKILL.md` frontmatter format plus sections such as When to Use, Procedure, Pitfalls, and Verification. [S05]

### Project-local skills

Hermes can discover project-local skills under `.hermes/skills/` or `.agents/skills/`. Project skills require trust and are scanned; dangerous content can be quarantined. Project skills have higher precedence than profile-local/external skills. [S05]

### Shared skill repositories

Hermes supports external skill directories and configurable creation directories, making it practical to maintain a Git-tracked shared skill repository for multiple profiles. [S05]

For a team/fleet architecture, a strong pattern is:

```text
Git repo = canonical shared skill source
Profiles = consumers
Versioned releases/tags = promotion mechanism
```

---
