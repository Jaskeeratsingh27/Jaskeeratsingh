# build-method.md — how a project gets built

> **Owns:** the build sequence — gates 0-10, and what each produces.
>
> Ten gates. Derived from two real builds, including what went wrong in both.
> Gate 1 is the one that matters most and is the one most often skipped.

---

## Gate 0 — is a project the right answer?

**A project is worth building when the same context would otherwise be re-explained
across many future chats.** That's the whole test.

| Build a project | Don't |
|---|---|
| Recurring work with stable conventions | A one-off task |
| A domain with standards worth encoding | Something a single good prompt handles |
| Output quality depends on shared context | Context fits in one message |
| You'll do this weekly for months | You'll do it twice |

**Say no when the answer is no.** A project that gets used three times cost more to
build than it saved, and it will sit in the sidebar going stale.

**Also ask: is this capacity at the constraint?** Building a project to produce more
things, when the existing things aren't finished, adds capacity where it isn't needed.
That's a real pattern and worth naming out loud before starting.

---

## Gate 1 — research before writing. Non-negotiable.

**This is the expensive lesson.** On the first build I wrote an integration file from
inference about a tool I hadn't looked up. It was plausible and wrong, and correcting
it meant rewriting six files and patching six more — and the patching introduced a
fresh contradiction, because some files got updated and one didn't.

**Before writing any file, research:**

| Research | Because |
|---|---|
| Every named tool, product, API, framework | Plausible-sounding invention is the failure mode, and it's undetectable in review |
| The domain's actual standards and current versions | "Best practices" from training data may be a year stale |
| Whether the thing you're about to design already exists | On the second build, the runtime already had blueprints, cron-with-skill-attachment, and subagent delegation. Everything I'd designed was redundant. |
| Empirical failure data for the domain | Grounded taxonomies beat invented checklists |

**Rule:** if you catch yourself writing a specification for something you haven't
verified, stop and look it up. `[unverified]` markers are a fallback for when you
genuinely can't check — not a licence to skip checking.

**Cost comparison:** research is minutes. Rewriting twelve files is an afternoon, and
the contradictions it introduces are worse than the original error.

**The artifact makes it checkable.** Every project ships a `sources.md` recording each
external claim, its source, the date, and a confidence level — `verified`,
`single source`, `secondhand`, or `conflicting`. Full method in
`research-discipline.md`. A project with confident external claims and no `sources.md`
is the failure signature; that combination is the clearest evidence something was
invented.

---

## Gate 2 — scope

**Derive these seven before writing anything.** Infer what you can from the request;
ask only where a different answer produces a different project, and never more than
three questions.

| # | Question | Where it lands |
|---|---|---|
| 1 | **Trigger** — what will they paste or type to start a session? | Instruction block, first section |
| 2 | **Default action** — what happens with no further prompting? | Instruction block |
| 3 | **Output** — file, decision, report, draft, code? | Output contract |
| 4 | **Modes** — one job or several, and how to tell which? | Mode selection |
| 5 | **Domain knowledge** — what must be researched? | Gate 1 scope |
| 6 | **Non-obvious constraint** — the thing that makes this project specific | Non-negotiables |
| 7 | **Failure that matters most** — what wrong output would cost the most? | Non-negotiables + test pack |

**State assumptions rather than asking.** A wrong stated assumption costs one line to
correct; a question costs a turn and usually returns something vague.

**Write the answers into `brief.md` and ship it with the project.** Seven answers held
only in conversation degrade across a multi-pass build — that's MAST 2.3, and the
countermeasure is an artifact, not better memory. Every later pass checks against it,
and if a pass contradicts the brief, one of the two is wrong and you find out then
rather than at deploy.

```markdown
# brief.md
| # | Question | Answer |
|---|---|---|
| 1 | Trigger | <what starts a session> |
| 2 | Default action | <with no further prompting> |
| 3 | Output | <what gets produced> |
| 4 | Modes | <one job or several> |
| 5 | Domain knowledge | <what had to be researched> |
| 6 | Non-obvious constraint | <what makes this specific> |
| 7 | Worst failure | <what wrong output costs most> |

## Assumptions
- <stated, not hidden>

## Out of scope
- <what this project deliberately does not do>
```

Question 7 is the one most often skipped and it sets the project's whole risk posture.
For an auditor it's *inventing a number*. For a builder it's *specifying an
unresearched tool*. Whatever it is, it becomes a hard rule and a test.

---

## Gate 3 — divide into passes

Anything beyond ~5 files gets passes `[judgment]` — alternative: 8, which means fewer, longer turns. Flips if a 6-file build starts truncating. Announce the division, then execute pass 1
immediately — don't stop for approval of the plan.

**The division that works:**

| Pass | Contents |
|---|---|
| 1 | Foundation — instructions, the domain knowledge, the reference material |
| 2 | Method — how the work gets done, roles, contracts, rubrics |
| 3 | Demonstration — the worked example, templates, runbook |

**Why this order:** the worked example must demonstrate the rubrics, so the rubrics
come first. Building the example early means rewriting it.

---

## Gate 4 — write the instructions block

See `instruction-craft.md` for how. The short version: right altitude — concrete enough
to act on, general enough to survive an input you didn't imagine.

**Ship it lean and grow it from test failures.** Anthropic's guidance is to start with
a minimal prompt on the best model, then add instructions and examples based on failure
modes found in testing, not preemptively. Knowledge files ship comprehensive; the
instruction block does not. Every line you add later should trace to a specific failed
test.

Under ~800 words. Must contain:

- **The trigger** — what happens when the user pastes something and says nothing. This
  is the most-used path and the most-often-underspecified one. Both projects needed it
  strengthened after the fact.
- **The default action** — what to do with no further prompting
- **The ambiguity rule** — assume and label, or ask? Pick one and make it unambiguous.
- **Non-negotiables** — the rules that hold regardless
- **Push-back triggers** — when to disagree with the user
- **Output contract** — structure, length, what must always be present
- **Pointers to knowledge files**, named, with what each is for

---

## Gate 5 — write the knowledge files

See `file-patterns.md` for the file types that recur.

**Order matters.** Write reference material first, rubrics second, worked example last.
The example must demonstrate the rubrics or it teaches the wrong thing.

**Canonical ownership:** decide as you go which file owns which fact, and say so in
that file's header. Retrofitting this means re-reading everything.

---

## Gate 6 — the worked example

**The highest-leverage file in any project.** Both builds improved more from adding one
than from any amount of additional rules.

- Use a **real** subject, preferably one of the user's own systems
- Show the hard case, not the easy one — the unmeasured system, the ambiguous input,
  the case where the honest answer is "insufficient evidence"
- Demonstrate the discipline, including what the method *declines* to do
- End with what to copy from it

A project of pure rules produces generic output. One worked example changes that more
than ten more rules would.

---

## Gate 7 — consistency pass

**The defect class of multi-file projects is contradiction between files**, and it's
created by exactly one thing: updating some files and not others.

Run `quality-gates.md`. Mechanically, not by reading.

---

## Gate 8 — test pack

**Every project ships with one.** See `test-pack.md`.

8-12 inputs with written pass and fail criteria, derived mechanically from the
instruction block's non-negotiables. Composition: trigger tests, happy path, hard
cases, refusal tests, anti-tests. Every rule that can't become a test isn't a rule.

Run it. Fix the smallest surface that resolves each failure. Re-run.

**Readiness is now a number, not an adjective:** "11/12, dated, on model X, known
failure T7" rather than "structurally sound."

## Gate 9 — self-audit

Run the project's own method against itself where that's possible, and against
`failure-modes.md` where it isn't.

**On the second build this found six real defects in something I'd already called
complete** — and all six were in the interaction contract, not the domain content.
That's the pattern: the method gets over-specified and the conversation under-specified.

---

## Definition of done — the build stops here

**Without this, a build runs until subjective satisfaction.** That produced three
trimming passes on one file in a single session, and it is the mechanism behind every
"is it ready?" round-trip.

A build is **done** when all of these hold. Not "looks good" — these.

- [ ] Every external claim traces to a line in `sources.md`
- [ ] No `[unverified]` on a core mechanism
- [ ] Every knowledge file declares what it owns
- [ ] Every non-negotiable in the block maps to at least one test
- [ ] Test pack written, 8-12 tests, all five types present, every test has a FAIL line
- [ ] Instruction block within the ceiling, or over it with a stated reason
- [ ] `brief.md` shipped and consistent with what was built
- [ ] One worked example, real subject, hard case
- [ ] Checks 1-14 in `quality-gates.md` pass
- [ ] Deployment card written, including `FIRST TEST`
- [ ] "What I could be wrong about" stated

**When every box is ticked, stop and deliver.** Further polish without a failed test
driving it is step repetition (MAST 1.3), and it delays the only thing that finds real
defects.

**One trim pass on the instruction block, not three.** If it's still over the ceiling
after one pass, raise the ceiling with a reason — don't iterate toward a number.

**The build is NOT done if** any box is unticked. Say which and why rather than
shipping with a soft caveat.

## Checkpoints — recovering mid-build

A multi-pass build can go wrong at file 3 and not surface until file 11. Contain it.

- **State the design decision before implementing it**, in one or two lines, and name
  the alternative you rejected. A wrong decision caught in prose costs a sentence;
  caught in twelve files it costs an afternoon.
- **At the end of each pass, state what the next pass depends on** from this one. If a
  later pass contradicts an earlier file, that dependency is where to look.
- **When something is discovered mid-build that invalidates earlier work** — as
  research did on one build — **rewrite every file the change touches, then grep.**
  Never patch some and leave others. That's F2 and it survived into a version already
  called complete.
- **Never silently revise a delivered file.** Say what changed and why.

## Marking confidence inside the files

Gate 9.5 states uncertainty in the reply. **The reply gets forgotten; the files get
re-read.** So the files carry the marking too.

Four markers, used inline wherever a line would otherwise read as settled fact:

| Marker | Means | Reader should |
|---|---|---|
| `[verified]` | External fact with a `sources.md` row | Trust it; re-check on version change |
| `[judgment]` | Design call where the alternative was close. **Name the alternative.** | Question this first if something feels wrong |
| `[convention]` | Arbitrary but applied consistently | Change freely, just change it everywhere |
| *(unmarked)* | Derived from a stated principle in this file set | Traceable — follow the principle |

Example:

> Delegate above 3 components `[judgment]` — below that, fan-out costs more than it
> saves. Alternative considered: 2, which parallelizes sooner at higher coordination
> cost.

**Mark sparingly.** Every line marked means nothing stands out. Mark the calls that
would actually change the design if reversed — typically five to ten per project.

**This is the countermeasure for fluent-but-uncertain output.** A confident-looking file
set that can't distinguish its researched claims from its coin flips is the exact
mechanism of ASI09, and it matters most precisely when someone is relying on it.

## Gate 9.5 — what I could be wrong about

Before the deployment card, state it explicitly. Three things minimum:

1. **The assumption that would hurt most if wrong** — usually about how the user works,
   or what they'll paste
2. **The claim with the weakest sourcing** — from `sources.md`, the `single source` and
   `secondhand` rows
3. **The design decision that was closest** — where the rejected alternative was nearly
   as good, and what would flip it

This is not hedging. **Hedging spreads doubt evenly and makes everything unusable;
this concentrates it where it belongs and leaves the rest solid.** A user relying on
this for serious work needs to know which parts to check, not to distrust all of it.

## Gate 10 — the deployment card

Every build closes with one block the user can act on without reading anything else:

```
PROJECT       <name>
DESCRIPTION   <one line for the sidebar>
MODEL         <which, and why>
INSTRUCTIONS  <file> — paste below the ---
KNOWLEDGE     <files in upload order, one line each on what it's for>
NOT UPLOADED  <scripts, test packs — where they go instead>
BEFORE YOU    <the one thing to do first>
FIRST TEST    <the exact thing to paste into a fresh chat>
```

`FIRST TEST` matters most. It turns "deploy and hope" into "deploy and know inside two
minutes."

## The thing that doesn't converge

**Static review does not converge on "ready."** Every time I re-checked a finished
project I found something, and I would have kept finding things.

At some point further review is the wrong move and the next defect has to come from a
real run. **Say that plainly** rather than implying one more pass will finish it.

**The test pack is what breaks the loop.** Without it, "ready" is an opinion and static
review never converges. With it, readiness is a score with a date and a model, and the
open question becomes specific: which tests fail, and is that acceptable.

## After deployment — the iteration loop

A project is not finished at deploy; it's instrumented.

| Trigger | Do |
|---|---|
| A session produces obviously wrong output | Write it up as a new test case. Add it to the pack **before** fixing anything. |
| A rule gets violated | The rule is in the wrong place — usually knowledge when it should be instructions |
| Claude ignores a knowledge file | Filename or pointer isn't specific enough; retrieval searches, not reads |
| Something fails that was already tried | Add to `risks.md` with the date |
| Model changes | Re-run the whole pack. Log the score against the new model. |
| Monthly | Re-run the pack; grep the instructions for staleness |

**Test first, then fix.** A fix with no test that would have caught it is a fix you
can't verify and will silently lose on the next edit.

---

## Naming

Short, distinct, memorable. If the user has a naming convention, follow it.

**Check for filename collisions across their existing projects.** Two files called
`runbook.md` in two projects is a real hazard — nothing warns you, and a misfiled
knowledge file produces confident nonsense that neither project flags.
