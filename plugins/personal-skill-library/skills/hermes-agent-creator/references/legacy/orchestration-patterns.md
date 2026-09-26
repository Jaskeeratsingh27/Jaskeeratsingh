# orchestration-patterns.md — how agents get linked

> Reference for choosing a coordination mechanism. Default is the cheapest one that works.

## The mechanisms

| Mechanism | Where | Communication | Relative cost | Use when |
|---|---|---|---|---|
| **Subagents** | Inside one Claude Code session | Report to the spawning agent only. Peers can't talk. | ~2–3x single agent | 2–5 independent subtasks, context isolation |
| **Dynamic workflows** (`/workflows`) | Script holds the plan | Script routes and cross-checks results | Varies | Fixed sequence, many agents, results need verifying against each other |
| **Agent teams** | Separate sessions | Peer messaging, shared task list, dependency tracking, file locking | ~7x | Workers genuinely need to tell each other things mid-task |
| **Managed agents API** | Claude Platform, programmatic | Coordinator declares its agent list; per-agent model and MCP servers | Varies | External orchestrator drives it; closest to a visual agent-builder in structure |
| **External orchestrator** (Hermes) | My own scheduler | Files on disk / vault | Local models = free | Unattended, scheduled, cross-machine |

## Choosing

**Do the subtasks depend on each other mid-run?**
- No → subagents
- Yes, sequence is fixed → dynamic workflow
- Yes, and workers must negotiate → agent teams (rarely worth 7x)

**Who holds the plan?**
- Claude's judgment → subagents + an orchestrator skill
- A script → dynamic workflow
- My code → managed agents API or Hermes

**Do they touch the same files?** → worktree isolation. Agent teams don't isolate
teammates, so partition file ownership explicitly.

## The routing gap

Visual agent builders let you draw the edge — you declare that agent A feeds agent B.
Claude Code subagents don't work that way: you write a `description` and Claude decides
at runtime whether to delegate. Same architecture, non-deterministic wiring.

Close the gap in ascending order of control:

1. An orchestrator skill that names the agents and the order in prose (medium control)
2. A dynamic workflow script (high control)
3. My own orchestrator calling Claude Code headless per stage (total control, most plumbing)

## Where Hermes fits

Hermes is not an alternative to a runtime. It's the layer above.

- **Runtime** (Claude Code / CrewAI) defines and runs agents
- **Hermes** triggers, schedules, chains across machines, routes to local models, talks
  to me via Telegram
- **Obsidian vault** carries handoff files and approval state between stages

Correct build order: prove the agent set manually → move wiring into a workflow script →
only then hand the trigger to Hermes. Debugging agent quality and scheduling plumbing
at the same time is the thing to avoid.

## Accuracy is not an orchestration property

More agents does not mean more accurate — usually the opposite, because each agent
summarizes upward and the coordinator can't tell a verified claim from a plausible one.
Accuracy comes from: evidence in the return payload rather than conclusions, strict
contracts at every boundary, a verifier that reads the original spec rather than the
producer's summary, and loud failures.
