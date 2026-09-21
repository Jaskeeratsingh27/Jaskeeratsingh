# UNIVERSAL AGENT PORTABILITY — Reference Guide
### Reusable rules for writing agent instructions that work on any platform

---

## WHAT THIS IS FOR

Use this reference every time you're about to build a new agent (any
persona, any purpose) and want it to work unmodified across Claude, Hermes,
Toqan, ChatGPT, or a plain chat window — instead of writing a
platform-specific version and having to redo it later. This was extracted
from building the Kaizen-Orchestrator system; the rules below are general,
not specific to that project.

---

## RULE 1: WRITE INSTRUCTIONS, NOT CODE

An agent's core instructions should be plain Markdown/text — persona,
rules, workflow, output format. Never bake in a specific platform's tool
syntax, function names, or API calls into the instructions themselves.

- ✅ "If you have a working search tool, use it. If not, fall back to your
  training knowledge and flag which mode you used."
- ❌ "Call `web_search({query: ...})` and parse `results.data.web`."

The second version breaks the moment you paste it into a platform that
names its search tool differently (or doesn't have one). The first version
works everywhere, because it describes *behavior*, not a *function call*.

---

## RULE 2: MARKDOWN FOR HANDOFF CONTENT, NOT JSON

When one agent's output becomes another agent's input, the content itself
should be structured Markdown with **fixed, predictable headings** — not
JSON.

Why: Markdown renders as plain readable text on every platform, whether a
human is copy-pasting it, a sub-agent is receiving it as a context string,
or it's sitting in a memory/file store. JSON risks a model wrapping it in
prose, breaking formatting, or a platform-specific parser expecting a
different schema.

- If a platform's *transport layer* uses JSON (e.g., Toqan passes data
  between agents as JSON), that's fine — put the Markdown block as the
  **string value of a field**. The transport wrapper can be JSON; the
  content payload should stay Markdown.

```
{"handoff_content": "## STATUS\nPROCEEDED\n\n## FINDINGS\n..."}
```

---

## RULE 3: EVERY AGENT NEEDS AN "IDENTITY BLOCK" SEPARATE FROM ITS FULL INSTRUCTIONS

Many platforms (Toqan's agent creation, Hermes's agent list, Claude's
sub-agent definitions) ask for a short name + one-line description
*separately* from the full system prompt. Write this once, explicitly, at
the top of every agent's file:

```
- Name: [short, memorable]
- One-line purpose: [what it does, in one sentence]
- Use this agent when: [the trigger condition — what should exist before
  this agent runs]
```

This saves you from having to summarize a long instruction file on the spot
when a platform's UI asks for a short description.

---

## RULE 4: THE HANDOFF CONTRACT — FOUR QUESTIONS EVERY AGENT MUST ANSWER

Every agent, at the end of its instructions, needs an explicit contract
covering:

1. **What does "done" mean for this agent, specifically?** Not "finish the
   task" — a concrete deliverable (a table, a decision, a status flag).
2. **What format does it return in?** Fixed headings, always in the same
   order, so the next agent (or a human relaying the output) never has to
   guess where to find something.
3. **What must this agent never touch?** Explicit scope boundary — the
   thing that keeps one agent from silently doing another agent's job
   (e.g., "Define does not touch Measure's data collection plan").
4. **What triggers a stop, instead of a guess?** The condition under which
   this agent should say "I need more input" rather than produce a
   plausible-sounding answer.

An agent missing #4 is the single most common cause of hallucination in a
pipeline — it will fill a gap with something invented rather than flagging
the gap, because nothing told it that stopping was an acceptable outcome.

---

## RULE 5: SEARCH/TOOL ACCESS — ASSUME NOTHING, DESIGN FOR BOTH

Any agent that might benefit from live information (web search, a database,
a connected tool) should be written with this exact shape:

1. Try the tool if available.
2. If unavailable or it fails, fall back to internal/training knowledge.
3. **Explicitly flag which mode was used** in the output — never blend
   silently. A one-line flag is enough:
   - `✅ Live search used — current as of [date/context].`
   - `⚠ No live search available — based on training knowledge, may be
     outdated.`

This one pattern is what let the same Research Agent instructions work
whether deployed on a platform with search (Claude, Toqan) or one where
search might be disabled (some Hermes configurations).

---

## RULE 6: TIME GAPS AND REAL-WORLD DATA — DON'T ASSUME A PIPELINE WAITS

Most agent platforms run each step the instant it's triggered — there is no
built-in "wait a few days for real-world data collection to happen" unless
you build that gap deliberately (a scheduled re-trigger, a monitor/flag
file, or a human manually waiting before sending the next input).

Any agent whose job depends on real data existing (not just a plan to
collect it) should:
1. Check for an explicit status flag from the prior agent (e.g., `DATA
   COLLECTED` vs. `PLAN ONLY — NOT YET COLLECTED`).
2. If the data doesn't actually exist yet, **self-report as blocked**
   rather than analyzing a plan as if it were real results.
3. Only proceed with estimated/partial data if explicitly instructed to —
   never as a silent default.

This is a general pattern for any pipeline with a "plan this" phase
followed by an "analyze the results" phase — not unique to DMAIC.

---

## RULE 7: WHEN TWO AGENTS NEED OPPOSITE INSTINCTS, KEEP THEM SEPARATE

If a phase benefits from both a *constructive* pass and an *adversarial*
pass (e.g., Research vs. Critique), write them as two separate agents, run
in sequence — never merge them into one agent with "be both supportive and
critical" instructions. In practice, one instinct dilutes the other when
combined in a single persona; keeping them as isolated agents with genuinely
different mandates produces sharper results from both.

---

## RULE 8: VERSION AND TAG EVERY HANDOFF

Tag each agent's output with what produced it and what it's built on top
of — a one-line header is enough:

```
## AGENT: [agent name] | PHASE: [phase name] | [VERSION/STATUS: whatever's relevant]
```

This matters most once a pipeline has more than 2-3 agents: a human
skimming a long chain of outputs (or debugging why something went wrong)
needs to identify provenance at a glance, without reading every section.

---

## QUICK CHECKLIST FOR A NEW AGENT

Before considering a new agent's instructions "done," confirm:

- [ ] No platform-specific function names or tool syntax in the core instructions
- [ ] Handoff content is Markdown with fixed headings (even if the transport is JSON)
- [ ] Has a short Identity Block separate from the full instructions
- [ ] Has an explicit "stop and ask" condition, not just a "do the task" instruction
- [ ] If it might use search/tools: has a try-then-fallback rule with an explicit flag
- [ ] If it depends on real-world data/events: checks a status flag rather than assuming
- [ ] If paired with an agent needing an opposite instinct: kept as a separate agent
- [ ] Output is tagged with agent name + phase/version for provenance
