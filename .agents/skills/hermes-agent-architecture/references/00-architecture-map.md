# Hermes Architecture Map

## Core mental model

Hermes is best understood as an agent runtime with several orthogonal primitives rather than one monolithic "agent" abstraction.

| Need | Hermes primitive | Design interpretation |
|---|---|---|
| Long-lived specialist with its own state | Profile / Bot | Persistent agent identity |
| Short isolated worker | `delegate_task` | Ephemeral function-like agent |
| Durable cross-agent workflow | Kanban | Workflow/state-machine control plane |
| Reusable procedure | Skill | On-demand SOP/knowledge module |
| Project instructions | `.hermes.md` / `AGENTS.md` | Project policy and architecture |
| Persona/identity | `SOUL.md` | Global profile identity |
| Persistent user/agent facts | Memory | Small curated context, not KB |
| External integrations | MCP / tools | Capability plane |
| Repeated execution | Cron | Durable scheduler |
| Enforcement/telemetry | Hooks/plugins | Policy and observability plane |
| File/code state | Workspace/Git/artifacts | Objective shared state |

## Recommended production topology

```text
User / API / messaging
        |
        v
Orchestrator Profile
        |
        v
Hermes Kanban board (durable task graph)
        |
   +----+------------------+
   |                       |
   v                       v
Research Profile      Engineering Profile
   |                       |
   +-> delegate_task       +-> delegate_task
       ephemeral workers       ephemeral workers
   |                       |
   +-----------+-----------+
               v
        Durable artifacts
               |
               v
        Review / QA Profile
               |
               v
           Completion
```

## Boundary rule

Keep these separate:

- WHO: Profile/Bot
- HOW: Skill
- WHERE/RULES: project context files
- WHAT TASK: task envelope / Kanban card
- WHAT RESULT: structured result envelope + artifacts
- WHAT IS TRUE: Git/files/datastores
- WHAT PERSISTS PERSONALLY: memory
- WHAT FLOWS NEXT: Kanban lifecycle/dependencies
- WHAT IS ALLOWED: toolsets, sandbox, approvals, hooks

This separation makes systems composable and debuggable.
