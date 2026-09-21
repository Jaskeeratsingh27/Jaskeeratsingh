# metrics.md — how I know whether an agent is any good

> The file set told Claude how to *build*. Nothing told it how to *judge*.
> This is that. Operational definitions first, because you can't measure what
> you haven't defined.

## Operational definitions

These are binary. If a judgment call is needed, the definition is wrong — tighten it.

| Term | Definition |
|---|---|
| **Defect** | A run whose output fails schema validation, violates a stated MUST NOT, or requires me to hand-edit before the next stage can consume it. |
| **Escape** | A defect I found *after* the output was used downstream. Weighted 5x a caught defect. |
| **Rework turn** | Any turn where I re-prompt for the same output because the previous attempt was unusable. Not counted: turns where I changed my mind about requirements. |
| **Clean run** | Full pipeline, no defects, no human touch except approved gates. |
| **Agent done** | 10 consecutive clean runs on the golden set, contract validated in code, failure path tested by deliberately breaking the input. |
| **In-flight** | An agent that has been started and is not Done. |

## The scorecard

Tracked per agent. Refresh when an agent changes or monthly, whichever first.

| Metric | Formula | Target | Why |
|---|---|---|---|
| First-pass yield | clean runs / total runs | ≥ 90% | The headline number |
| Rework turns per usable output | rework turns / accepted outputs | ≤ 0.5 | Measures instruction quality directly |
| Escape rate | escapes / total defects | ≤ 5% | Measures whether validation gates work |
| Cost per output | paid tokens + local runtime | falling | The whole point of the local tier |
| Local ratio | local model calls / total calls | ≥ 80% | Enforces the no-paid-bulk rule with a number |
| Cycle time | idea accepted → output produced | per agent | Find the queue, not the slow step |
| Time-to-first-output | build start → first real output | ≤ 1 session | Guards against designing before shipping |

## Golden set

10 fixed inputs per agent, versioned in the repo, never edited once set. Run them:

- Before and after any prompt change
- After any model or model-alias change
- Monthly regardless

Without a golden set, a drop in quality is unattributable — you cannot tell a prompt
regression from a model change from input variance. This is the single cheapest
control in the whole system.

## WIP limit

**Maximum 2 agents in-flight. Hard rule.**

Current state is 10 agents with 6 at unverified status and 4 in design. That is not a
portfolio, it is queue. Every additional in-flight agent increases cycle time on all of
them and produces nothing until it's Done.

Before starting a new agent: finish one, or explicitly kill one and record why.
Claude should refuse to start a third and say so.

## Where the waste actually is

The eight wastes, mapped to this system. Ranked by my own observed cost:

| Waste | Here | Countermeasure |
|---|---|---|
| **Inventory (WIP)** | 10 started, few finished | WIP limit of 2 |
| **Motion** | Re-explaining stack every session | This project (already fixed) |
| **Overprocessing** | Designing all stages before one runs | Thin-slice rule, time-to-first-output metric |
| **Defects** | Unvalidated agent output consumed downstream | Schema gate + retry loop |
| **Waiting** | Approval gates blocking overnight runs | Batch approvals; default-deny after timeout, never default-allow |
| **Transport** | Handoff files moving between vault, repo, disk | One canonical path per artifact type |
| **Overproduction** | Never-pruned idea ledger | Deliberate, accepted — but don't let it feed the build queue unfiltered |
| **Underused talent** | Claude doing deterministic work a script should do | Script-not-agent rule in conventions |

## FMEA — required for any agent with an irreversible action

Publishing, sending, spending, deleting. Before that agent goes live, fill this in:

| Failure mode | Effect | Sev 1-10 | Occ 1-10 | Det 1-10 | RPN | Control |
|---|---|---|---|---|---|---|

Anything with RPN > 100 gets a control before the agent runs unattended. Detection
scores are the ones people fake — if you have no automated check, detection is 9 or 10,
regardless of how carefully you intend to watch.

## Control plan

Working once is not working. For each Done agent, record:

- What's monitored (metric), how often, by what
- The out-of-control signal (specific threshold, not "looks wrong")
- The reaction plan (who/what does what when it trips)
- Where the golden set lives

An agent with no control plan is a prototype regardless of how long it's been running.

## Kill criteria

No agent currently has an exit condition, which is why the portfolio only grows.
Every agent gets one of these at start, recorded in the inventory:

| Trigger | Action |
|---|---|
| Not reached first real output within 2 sessions | Park. Record why. |
| Parked 60 days with no work | Delete. The idea stays in the ledger; the half-build doesn't. |
| First-pass yield below 70% after 3 improvement attempts | Kill or redesign from scratch. Incremental fixes have failed. |
| The job it does is now covered by another agent | Merge and delete. |
| Cost per output exceeds the manual alternative | Kill. Automation that costs more is a hobby, not a system. |

Killing is a result, not a failure. An unkilled half-agent consumes WIP capacity
indefinitely and produces nothing.

## Cost instrumentation

The `local ratio ≥ 80%` target is aspirational until it's measured. Wire it:

- Log per call: agent name, provider actually served by, token counts, wall time.
  OmniRoute's auto-fallback means the *intended* provider and the *serving* provider
  can differ silently — capture the serving one.
- Roll into the existing Token Ledger, keyed by agent rather than by session.
- Alert on any paid call from an agent whose config says local. That's either a
  fallback event or a misconfiguration, and both matter.
- Cost per output = (paid tokens × rate) + (local wall time × amortised electricity).
  The second term is small but non-zero and keeps "free" honest.

Until this exists, treat every local/paid claim in this project as unverified.
