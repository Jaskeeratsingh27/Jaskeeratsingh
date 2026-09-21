# agent-conventions.md — how I build agents

> House rules. Any agent built for me follows these unless I say otherwise.

## Definition

An agent is a scoped worker with:

1. Its own instructions (a job description, not a personality)
2. A whitelisted tool set
3. A declared model
4. A typed input contract and a typed output contract
5. A failure path that returns a failure instead of a guess

Anything missing one of those five is a prompt, not an agent.

## File format (Claude Code)

Markdown with YAML frontmatter. Body is the system prompt.

```markdown
---
name: lowercase-with-hyphens
description: What it does and when to delegate to it. This is routing logic, not documentation.
tools: Read, Write, Grep
model: haiku
maxTurns: 15
permissionMode: default
---

You do <one job>.

Input: <contract, with path or shape>
Output: <contract, exactly>

MUST NOT: <the two or three things that would break the pipeline>
If <precondition> is missing, write a failure note and stop.
```

**Locations:** `.claude/agents/` (project, wins) or `~/.claude/agents/` (user, global).
Names can't contain `:`. Filename doesn't have to match `name`.

**Other frontmatter available:** `disallowedTools`, `skills`, `mcpServers`, `memory`,
`isolation`, `background`, `effort`, `initialPrompt`, `omitClaudeMd`.

**Programmatic alternative:** `claude --agents '{...}'` takes the same fields as JSON,
with `prompt` replacing the markdown body. Use this when Hermes generates agents at
runtime rather than reading committed files.

## Non-negotiables

- **Always whitelist tools.** Omitting `tools` inherits everything. That's how agents
  go rogue.
- **Always set `maxTurns`.** Runaway-loop brake.
- **Pin the model deliberately.** Aliases drift on upgrades and the breakage shows up
  weeks later. If consistency matters, note the pin and the date.
- **One job per agent.** If the description has an "and" in it, split it.
- **The description is routing logic.** Vague description → unpredictable delegation.

## Data contracts

Stages hand each other typed objects, never free text. This is what makes agents
swappable and what makes failures debuggable.

- Define the shape before writing the agent.
- **Validate in code after the agent returns.** Don't trust the output.
- Invalid output → reject and re-run. Never hand-repair.
- Underspecified contract → say so and propose the minimal fix, don't code around it.

## Consistency — what's achievable

Same instructions and same input still produce different output. LLMs sample.
Separate the two kinds of consistency:

**Shape — get this to ~100%**
- Strict schema + validation gate + retry loop
- 2–5 few-shot examples lock format better than describing it
- Anything deterministic (naming, slugs, math, ordering) is a **script the agent
  calls**, not something the agent produces
- Pinned model

**Judgment — manage, don't solve**
- Narrow the decision space: "pick one of these five hooks" is stable,
  "write a compelling hook" is not
- Smaller models follow instructions more literally — Haiku on a tight task beats
  Opus on the same task
- Verify against the original spec, not the producer's summary

**Golden set:** 10 fixed inputs, run periodically. Without it you can't tell a prompt
regression from a model change.

## Safety gates

Human stop-gate before anything irreversible — publishing, sending, deleting,
spending, or posting publicly. Approval happens via Obsidian checkbox or Telegram.

Scope lock on every agent that touches the filesystem: name the directory it owns,
and forbid everything outside it.

Never touch Home Assistant.

## Enforcement

Rules that aren't enforced are suggestions with a defect rate. `validate_agent.py`
turns this file into a gate:

```bash
python3 validate_agent.py .claude/agents/
```

It fails a file that omits the tool whitelist, leaves the model unpinned, lacks a
MUST NOT section, lacks a failure path, declares no output contract, uses a
non-conforming name, or contains known anti-patterns. Run it as a pre-commit hook
and in CI. An agent that hasn't passed it has not been reviewed, regardless of who
read it.

Standard work lives in `agent-template.md` — copy from there, don't write from memory.

## Build order — always

1. Thinnest end-to-end slice that produces one real output, even if half is manual.
2. Each later phase replaces exactly one manual step.
3. Binary pass/fail definition of done per phase, verifiable by me.

Designing all stages before one works is the failure mode I'm most prone to.
