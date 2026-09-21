# KAIZEN-ORCHESTRATOR — Master Guide
### The complete agentic DMAIC system: overview, file map, and platform setup

---

## WHAT THIS IS

A 7-agent system that takes a raw project idea and runs it through a full,
rigorous DMAIC (Define-Measure-Analyze-Improve-Control) cycle — with a
hardening pass before execution and a traceability audit before closeout.
Every agent is written as plain, portable instructions: no platform-specific
syntax, no assumed tools beyond "can this model read text and, optionally,
search the web." The same files work in Claude, Hermes, Toqan, ChatGPT, or a
plain chat window.

## THE 7 AGENTS AND WHAT THEY DO

| # | Agent Name | File | Job |
|---|---|---|---|
| 1 | **Kaizen-Orchestrator** | Step 1 | Intake, clarifying questions, drafts Charter + Blueprint v0.1; later revises to locked v1.0 |
| 2a | **Kaizen-Research** | Step 2 | Checks draft blueprint against current LSS/PM best practice (constructive) |
| 2b | **Kaizen-Critique** | Step 2 | Red-teams the draft blueprint (adversarial, independent of Research) |
| 3a | **Kaizen-Define** | Step 3 | Executes Define phase: SIPOC, VOC/CTQ tree, stakeholder map |
| 3b | **Kaizen-Measure** | Step 3 | Executes Measure phase: operational definitions, data plan, baseline, MSA |
| 4a | **Kaizen-Analyze** | Step 4 | Executes Analyze phase: root-cause analysis, strictly data-gated |
| 4b | **Kaizen-Improve** | Step 4 | Executes Improve phase: solutions, FMEA, pilot plan |
| 5a | **Kaizen-Control** | Step 5 | Executes Control phase: control plan, SOPs, sustain-the-gain |
| 5b | **Kaizen-Synthesis** | Step 5 | Final traceability audit across all five phases — catches orphan claims |

That's 9 distinct agent personas across 5 files (some files hold two agents
each, since they run as a pair). Use each as a **separate agent instance** on
your platform — do not merge multiple personas into one agent, the
separation of concerns is what keeps each one accurate.

## THE FULL PIPELINE, END TO END

```
Project idea
   │
   ▼
[1] Kaizen-Orchestrator ──► Charter + Blueprint v0.1
   │
   ▼
[2a] Kaizen-Research ──► findings          [2b] Kaizen-Critique ──► findings
   │  (run in sequence, both outputs return to Orchestrator)
   ▼
[1] Kaizen-Orchestrator revises ──► Blueprint v1.0 (LOCKED)
   │  (loops back to 2a/2b again if Critique said "needs significant rework")
   ▼
[3a] Kaizen-Define ──► Define output
   ▼
[3b] Kaizen-Measure ──► Measure output (includes DATA STATUS gate)
   ▼
[4a] Kaizen-Analyze ──► Analyze output (checks DATA STATUS; BLOCKED if no real data)
   ▼
[4b] Kaizen-Improve ──► Improve output
   ▼
[5a] Kaizen-Control ──► Control output
   ▼
[5b] Kaizen-Synthesis ──► Traceability audit (pass/fail on the whole chain)
   ▼
[1] Kaizen-Orchestrator ──► Phase 6 Closeout: final report + control plan + lessons learned
```

## THE THREE RULES THAT HOLD THE WHOLE SYSTEM TOGETHER

These are restated in each individual agent file for self-containedness, but
they are, structurally, one design decision each:

1. **Stop and ask, never guess.** Every agent checks its input; if
   something's missing or unclear, it asks rather than inventing a
   plausible answer.
2. **Every claim must trace to a source.** A stated fact, a search result,
   or a labeled assumption/recommendation — never an unlabeled invention.
   The Synthesis Agent's entire job is auditing this at the end.
3. **No agent does another agent's job.** Define doesn't measure. Measure
   doesn't analyze. Analyze doesn't solve. This narrow scoping is what
   keeps each agent accurate — it's the direct answer to "no hallucinations
   from doing too much at once."

## HOW HANDOFF WORKS (platform-agnostic, with platform notes)

Every agent's output ends in a `HANDOFF NOTE` and a structured block under
fixed Markdown headings (e.g., `## CHARTER`, `## STATUS`, `## TOLLGATE
CHECK`). This block is the actual payload passed to the next agent. How it
physically travels depends on your platform:

- **Hermes:** use `delegate_task` (spawn a sub-agent, pass the prior agent's
  handoff block as the `context` string), OR write it to a workspace file
  and have the next agent read it, OR use Hermes memory. All three work
  with these instructions unchanged — see the Hermes setup section below.
- **Toqan:** Toqan passes agent-to-agent data as JSON. Put the Markdown
  handoff block as the string value of a field (e.g.,
  `{"handoff_content": "## CHARTER\n..."}`) — the block's internal content
  doesn't need to become JSON itself, only the transport wrapper does.
- **Claude (Projects, Cowork, or Code sub-agents):** pass the handoff block
  directly as the next agent's input/context.
- **Manual / any plain chat:** copy-paste the output between one chat window
  and the next.

## SEARCH / INTERNET ACCESS

Kaizen-Research, Kaizen-Measure (optionally), and any agent noted with a
"SEARCH PROTOCOL" section follow the same rule: try search if available, use
training knowledge if not, and **always explicitly flag which mode was
used** in the output (`✅ Live search used` / `⚠ No live search`). This
makes the same instructions work whether you're on a platform with internet
access (Toqan, Claude) or one without it enabled.

---

## SETTING THIS UP ON HERMES

Based on Hermes's own documentation of its capabilities:

### Step-by-step
1. **Create 9 separate agents** (or 5, if your Hermes setup allows one agent
   definition to hold multiple "modes" — check what's cleaner in your
   instance), one per persona listed in the table above. Use each agent's
   **AGENT IDENTITY BLOCK** (found near the top of its section in each file)
   for the name/description field, and the **full remaining instructions**
   as the agent's system prompt / core instructions.

2. **Choose your handoff mechanism:**
   - **Recommended for a first run — manual/checkpointed:** run each agent
     one at a time, copy its `HANDOFF NOTE` block output, paste as the
     `context` when you spawn the next agent via `delegate_task`. This lets
     you inspect every phase before it proceeds — valuable while you're
     still validating the system works as intended.
   - **For a more automated run once validated:** chain agents with
     `delegate_task`, passing each agent's output directly into the next
     `context` field, OR use cron jobs with `context_from` pointing at the
     prior job's ID.

3. **Handle the Measure → Analyze data gap explicitly.** Per Hermes's own
   guidance: there's no built-in wait between agents. If real-world data
   collection needs to happen between Measure and Analyze:
   - Use a monitor-based cron job for Analyze (Hermes's Option C) that only
     fires once the expected data file/flag appears in the workspace, OR
   - Run Measure, then manually wait until data collection is actually
     done in the real world, then manually trigger Analyze.
   - Either way, Kaizen-Analyze's built-in `DATA STATUS` gate check means it
     will self-report as `BLOCKED` rather than fabricate an analysis if you
     trigger it too early — this is a safety net, not a replacement for
     proper sequencing.

4. **Enable web_search / web_extract** for Kaizen-Research and
   Kaizen-Measure if your Hermes instance has it available — check with
   your admin/instance settings. If unavailable, no changes needed; the
   fallback instructions handle it.

### What NOT to do on Hermes
- Don't merge Research and Critique into one agent — the adversarial framing
  needs its own isolated context to stay sharp.
- Don't skip the Synthesis Agent to save a step — it's the one check that
  catches a broken chain (e.g., Improve solved the wrong root cause) before
  you act on a flawed project.

---

## FILE MAP (for your reference)

- `kaizen-orchestrator-step1-orchestrator.md` — Agent 1: Kaizen-Orchestrator
- `kaizen-orchestrator-step2-research-critique.md` — Agents 2a/2b: Kaizen-Research, Kaizen-Critique
- `kaizen-orchestrator-step3-define-measure.md` — Agents 3a/3b: Kaizen-Define, Kaizen-Measure
- `kaizen-orchestrator-step4-analyze-improve.md` — Agents 4a/4b: Kaizen-Analyze, Kaizen-Improve
- `kaizen-orchestrator-step5-control-synthesis.md` — Agents 5a/5b: Kaizen-Control, Kaizen-Synthesis
- `kaizen-orchestrator-master-guide.md` — this file
