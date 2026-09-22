# Hermes Research Dossier — Context, memory, tools, execute_code, MCP, models, cron

## 9. Context Files and Instruction Hierarchy

Hermes automatically discovers project context files. Current documentation lists the major types as `.hermes.md/HERMES.md`, `AGENTS.override.md`, `AGENTS.md`, `CLAUDE.md`, `SOUL.md`, `.cursorrules`, and Cursor rule modules. [S06]

### Priority and hierarchy

The project context system uses a priority model where one project-context type wins, with `AGENTS.md` supporting hierarchical merging from repository root toward deeper directories. More-specific nested instructions can therefore override broader repository instructions. Hermes can also progressively discover subdirectory context during tool usage. [S06]

### SOUL is different

`SOUL.md` is loaded from the Hermes home/profile and is independent of project-context discovery. It controls persistent agent identity/personality rather than project-local rules. [S06]

### Recommended separation

**SOUL.md** should contain:

- persistent role identity
- mission
- responsibility boundaries
- operating philosophy
- communication style

**AGENTS.md / .hermes.md** should contain:

- project architecture
- repository conventions
- build/test commands
- directory ownership
- engineering rules
- project-specific restrictions

**Skills** should contain:

- reusable procedures
- domain knowledge
- decision rules
- templates

**Task contracts** should contain:

- current objective
- inputs
- constraints
- acceptance criteria
- expected artifacts

This separation limits prompt conflict and makes each layer independently maintainable.

---

## 10. Memory: What It Is and What It Is Not

Hermes' built-in persistent memory is intentionally bounded. On the research date, documentation describes two core curated files: `MEMORY.md` for agent notes and `USER.md` for user/profile information, each with explicit size limits and injected at session start. [S09]

This is useful for small durable facts such as:

- user preferences
- environment conventions
- recurring project facts
- agent-specific learned notes

It is **not** the correct place for the entire Hermes architecture manual or large project knowledge. That belongs in skills, files, or a retrieval/memory provider designed for larger corpora.

Hermes also supports memory-provider plugins such as Honcho, which add server-side user modeling, semantic search, conclusions, session context, and multi-agent peer isolation. [S10][S11]

### Recommended persistence hierarchy

- Memory: compact personal/agent facts
- Session search: historical conversation retrieval
- Skill/reference corpus: reusable knowledge
- Git/files/database: engineering truth and artifacts
- Kanban: workflow state

---

## 11. Tools and Toolsets: Capability Boundaries

Hermes groups capabilities into toolsets. Official documentation lists categories such as web/search, terminal, file, browser, media, orchestration/delegation, memory/session search, cron, code execution, and integrations/MCP. [S12][S13]

A production agent should have a **capability manifest** rather than merely a prompt saying what it should not do.

For each Profile define:

- required built-in toolsets
- prohibited toolsets
- permitted MCP servers
- allowed MCP tools
- terminal backend
- workspace/CWD
- credentials/environment passthrough
- write/destructive permissions

### Why this matters

Natural-language restrictions are advisory. Removing a capability or filtering a tool is a stronger boundary.

Example:

| Profile | Typical capabilities |
|---|---|
| Orchestrator | Kanban, messaging, read-only context, limited delegation |
| Researcher | web/search, browser, files, read-only repo |
| Architect | files, search, read-only Git/MCP |
| Engineer | terminal, file write, Git, test tooling |
| QA | terminal/test/browser, read-only deploy credentials |
| Release manager | deployment MCP/tools only after review gate |

---

## 12. `execute_code`: Deterministic Multi-Tool Pipelines

Hermes' `execute_code` tool lets an agent write Python that calls selected Hermes tools over an RPC bridge. Official documentation explains that only the script's printed output returns to the LLM context; intermediate tool results remain outside the context window. [S14]

This is strategically important for cost and determinism.

### Good use cases

- 3+ tool calls with processing logic
- looping over many search/file results
- filtering/reducing large outputs
- conditional branching
- aggregating data before returning to the model

### Not a replacement for terminal

Use terminal for:

- builds
- test suites
- shell commands
- background processes
- interactive processes

Use `execute_code` for tool orchestration and in-memory processing. [S14]

### Security limits

The docs describe resource limits including timeout, output caps, tool-call limits, credential scrubbing, and tool whitelisting. Skills can explicitly declare environment variables that may be passed through, which should be treated as a privileged exposure. [S14][S18]

---

## 13. MCP: External Capability Layer

Hermes supports Model Context Protocol servers for tools outside core Hermes—GitHub, databases, APIs, SaaS, filesystems, and more. Current documentation describes local stdio and remote HTTP servers, automatic discovery, OAuth support, and per-server tool filtering. [S15]

### Production guidance

Treat each MCP server as a capability boundary. Do not expose an entire broad integration to every profile if only a few tools are required.

For each agent record:

```text
MCP server
  -> allowed tools
  -> auth source
  -> data classification
  -> expected side effects
  -> approval requirement
```

This makes least privilege auditable.

---

## 14. Model Architecture: Main and Auxiliary Models

Hermes supports a primary model for agent reasoning/tool-loop execution and multiple auxiliary model slots for narrower jobs such as context compression, vision, web summarization, approvals, MCP routing, session-title generation, and skill search. [S16]

This enables a production system to optimize cost intelligently.

### Role-based model pattern

Instead of one expensive model everywhere:

- Orchestrator/Architect -> strongest reasoning model
- Research profile -> retrieval/synthesis-oriented model
- Coding profile -> coding-specialized model
- QA -> independent verifier model where useful
- Formatting/release/routine jobs -> faster lower-cost model
- Auxiliary jobs -> inexpensive models unless the task specifically needs frontier quality

### Fallback providers

Hermes supports same-provider credential pools and cross-provider fallback chains. The docs explain that fallback can switch provider/model during a session on failures while preserving conversation state. [S21]

However, provider/model switches can invalidate prompt-cache benefits, making long sessions more expensive. Therefore fallback should be treated as resilience, not as a free routing optimization. [S21]

### OpenRouter provider routing

Hermes can pass OpenRouter provider-routing preferences such as price sorting, allow/deny lists, and priority order. The documentation notes that Nous Portal uses centrally managed routing and ignores the same caller-supplied provider-routing configuration. [S22]

---

## 15. Cron: Durable Scheduled Automation

Hermes Cron supports one-shot and recurring tasks, skill attachment, delivery to configured destinations, fresh agent sessions, no-agent scheduled scripts, event-triggered jobs, and pause/resume/edit/run/remove lifecycle management. [S17]

### Skills and cron

Cron can attach one or multiple skills so recurring work inherits procedures without embedding large instructions into every job prompt. [S17]

### Continuity

Recurring cron runs normally start fresh. Hermes supports a continuity mode that injects the previous substantive output so monitors/scouts can deduplicate prior findings and continue over time. [S17]

### Safety

Cron sessions cannot recursively create/manage cron jobs by default, reducing runaway scheduling loops. An opt-in exists for agent-managed scheduling; this should be considered privileged. [S17]

### How to use Cron in multi-agent architecture

Cron should trigger or reconcile work, not become the authoritative multi-agent workflow state store.

Recommended pattern:

```text
Cron trigger
   -> create/reconcile Kanban task(s)
   -> Profiles execute durable workflow
   -> final artifact/notification
```

---
