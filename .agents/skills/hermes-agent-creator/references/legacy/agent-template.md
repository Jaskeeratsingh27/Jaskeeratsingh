# agent-template.md — standard work

> Copy this. Fill every field. A field you can't fill is a design decision you
> haven't made yet, not a field to delete.

## The file

```markdown
---
name: <lowercase-with-hyphens>
description: <What it does + when to delegate to it. Routing logic. Include the trigger phrase I'd actually use.>
tools: <explicit whitelist — never omit>
model: <haiku | sonnet | opus | local-via-omniroute>   # pinned <YYYY-MM-DD>
maxTurns: <integer>
permissionMode: default
---

You <one job, stated as a verb>.

## Input
<Contract: path or shape. Name every required field.>

## Output
<Contract: exact shape. One artifact. Nothing else.>

## Method
<3-6 numbered steps. Each verifiable.>

## MUST NOT
- <the 2-3 things that break the pipeline downstream>
- Write anywhere outside <directory>
- Proceed on missing input

## On failure
If <precondition> is absent or <check> fails, write a failure note to
<path> stating what was missing, and stop. Do not guess, substitute, or
partially complete.
```

## The companion contract

Every agent ships with its output schema in the same commit. Not in the prompt — in
code, where it gets enforced.

```python
# contracts/<agent-name>.py  — stdlib only
REQUIRED = {"id": str, "created_at": str, "payload": dict}

def validate(obj: dict) -> list[str]:
    """Return list of problems. Empty list = valid."""
    problems = []
    for key, typ in REQUIRED.items():
        if key not in obj:
            problems.append(f"missing: {key}")
        elif not isinstance(obj[key], typ):
            problems.append(f"wrong type: {key} is {type(obj[key]).__name__}, want {typ.__name__}")
    return problems
```

## Pre-flight checklist

Run before an agent is allowed its first unattended execution.

- [ ] `tools` is an explicit whitelist
- [ ] `maxTurns` set
- [ ] Model pinned, with date
- [ ] Input contract defined and documented
- [ ] Output contract defined **and validated in code**
- [ ] Failure path written, and tested by deliberately breaking the input
- [ ] Scope lock names the one directory it owns
- [ ] Golden set of 10 inputs committed
- [ ] If it does anything irreversible: FMEA complete, no RPN > 100 uncontrolled
- [ ] Control plan recorded
- [ ] Added to agent-inventory.md with its dependencies

Unchecked box = not Done. No exceptions for "it's only a small one."

## Deliberately not in the template

- Personality, tone, or persona. Agents do jobs.
- "Think step by step" or reasoning scaffolding. It degrades instruction-following.
- "Double-check your work." Redundant on current models and adds turns.
- Anything deterministic. If the step has one correct answer computable from the
  input, it is a script the agent calls, not a thing the agent produces.

---

# A2 — one page per agent

> Fill before building anything non-trivial. If it doesn't fit on one page, the
> scope is wrong. This is the artifact the ⚠ rows in the inventory are dodging.

```markdown
# A2: <agent-name>                          Date: <YYYY-MM-DD>

## 1. Problem
<What I do by hand today, and what it costs me — time per week, or
error rate, or the thing I keep not doing because it's tedious.
A number, not an adjective.>

## 2. Current state
<How it happens now. Steps, handoffs, where it breaks.
Where does the time actually go?>

## 3. Target
<Specific and measurable. "Produces N per week at ≥90% first-pass
yield with ≤1 approval touch." Not "automates X".>

## 4. Root cause
<Why isn't this already automated? Usually one of: no contract,
deterministic work handed to a model, or no measurement.
Five whys if it isn't obvious.>

## 5. Countermeasures
| What | Why it addresses the root cause | Done when |
|---|---|---|

## 6. Plan
| Phase | Deliverable | Date |
|---|---|---|
| 1 | Thin end-to-end slice, manual steps allowed | |
| 2 | <one manual step automated> | |

## 7. Results
<Filled after. Actual vs target. If missed, why — and what that
teaches the next agent.>

## 8. Follow-up
<What stays open. Control plan location. Kill criteria.>
```

## Why an A2 and not a spec

A spec describes what to build. An A2 forces you to state what's wrong now, in
numbers, before you're allowed to describe a solution. Most of the agents in the
inventory were started from an idea rather than a problem, which is why their
value is hard to assess and their status is unknown.

If section 1 has no number in it, don't build the agent yet.
