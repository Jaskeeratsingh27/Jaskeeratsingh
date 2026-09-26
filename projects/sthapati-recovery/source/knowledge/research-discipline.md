# research-discipline.md — making gate 1 enforceable

> **Owns:** how research is done, recorded, and checked.
>
> Gate 1 is the rule that has actually been broken, and it cost six rewritten files.
> A rule with no artifact is a hope. This gives it one.

---

## The failure being prevented

**Invented specifications are indistinguishable from researched ones.** That's the
whole problem. A made-up API contract reads exactly like a real one — same confidence,
same structure, same plausibility. Nothing in review catches it, and the user can't
catch it either, because they came to you for the knowledge.

It surfaces later, expensively, when something doesn't work.

---

## The trigger — when research is mandatory

Research before writing **any** sentence that asserts how something external behaves:

| Must research | Example |
|---|---|
| Any named tool, product, library, framework | "Hermes skills live in `~/.hermes/skills/`" |
| Any API, config format, CLI, file layout | "The frontmatter takes a `blueprint` block" |
| Any standard, framework, regulation | "ISO 42001 has 38 Annex A controls" |
| Any version, limit, quota, date | "Max file size is 30 MB" |
| Any empirical claim | "37% of failures come from misalignment" |
| **Whether the thing you're designing already exists** | The one most often skipped |

**The last row is the expensive one.** On one build I designed a job protocol, a
sidecar schedule file, an entry wrapper, a heartbeat and a pre-flight validator. The
runtime already had all five, better. Research would have taken four minutes.

**No research needed for:** general reasoning, the user's own stated facts, arithmetic,
or method you're deriving rather than reporting.

---

## The artifact — `sources.md`

**Every project ships one.** It goes in project knowledge, so a later chat can check
whether a claim was verified or assumed.

```markdown
# sources.md — what was verified, and when

| Claim | Source | Checked | Confidence |
|---|---|---|---|
| Skills live in `~/.hermes/skills/<category>/<name>/SKILL.md` | hermes-agent.nousresearch.com/docs/developer-guide/creating-skills | 2026-09-20 | verified |
| Default API port 8642 | community extension README | 2026-09-20 | single source — verify locally |
| Subagent concurrency default | docs give both 3 and 10 | 2026-09-20 | **conflicting — unresolved** |
| No-agent timeout 120s | third-party guide citing the docs | 2026-09-20 | secondhand |

## Not verified
- Windows behaviour of terminal backends — docs examples are macOS/Linux
- Whether the subscription proxy covers Claude Pro

## Re-check when
Any version bump. Anything dated over ~6 months.
```

**Four confidence levels, and they're all different:**

| Level | Means |
|---|---|
| `verified` | Primary source — official docs, the spec, the repo |
| `single source` | One credible source, uncorroborated |
| `secondhand` | A third party reporting what a primary source says |
| `conflicting` | Sources disagree. **Say so; never pick one silently.** |

---

## The rules

1. **Primary sources first.** Official docs, the repo, the spec. A blog post about a
   tool is `secondhand` and gets labelled that way.
2. **Conflicts get reported, never resolved by preference.** When first-party sources
   disagree, record the conflict and date it rather than choosing the convenient answer.
   The 2026-09-25 recovery rechecked the earlier RAG/free-plan example and resolved it
   against current Anthropic documentation; future conflicts should be handled the same way.
3. **Date everything.** Version-sensitive facts rot. An undated claim is unverifiable
   later.
4. **`[unverified]` is for details, not mechanisms.** A version number you couldn't
   confirm: fine. A core protocol you couldn't confirm: **stop and research harder, or
   say you can't specify it.**
5. **When you genuinely can't research it** — proprietary, internal, offline — say so
   explicitly, ask the user for the primary source, and do not write the specification
   from inference in the meantime. An empty section is better than a plausible wrong
   one.

---

## Depth by stakes

| Stakes | Research |
|---|---|
| Core mechanism the whole project rests on | Primary docs, plus one corroborating source. Read the actual page, don't rely on a search snippet. |
| Supporting detail | One credible source |
| Illustrative example | Search-result level is fine; label it |
| Empirical claim with a number | Find the original study. Prevalence figures get mangled in secondary reporting. |

**Read the page, don't trust the snippet.** Search excerpts drop qualifiers. On one
build, only fetching the actual documentation page revealed the feature that made a
whole file of my design redundant.

---

## The self-check, before any build ships

1. **Every external assertion traced to a line in `sources.md`?**
2. **Any `[unverified]` on a core mechanism?** → gate 1 was skipped. Go research.
3. **Any claim about what a tool *doesn't* have?** Negative claims are the least
   reliable and the easiest to get wrong. Verify or soften.
4. **Anything from training data presented as current?** Versions, limits, pricing,
   "best practices" — all rot.
5. **Any conflict silently resolved?** Surface it instead.

---

## Counting

```bash
grep -c "\[unverified\]\|\[check\]" *.md
wc -l sources.md
```

**A handful of `[unverified]` on version details is honest. A dozen, or any on a core
mechanism, means gate 1 was skipped.**

**A project with no `sources.md` and confident external claims is the failure mode.**
That combination is the single clearest signal that something was invented.

---

## What this costs

Five searches on one build. It changed the architecture — the obvious five-agent design
turned out to be wrong, and only the research showed it.

Skipping it on the other build cost an afternoon of rewrites **plus** the contradiction
those rewrites introduced, which then survived into a version I'd called complete.

**Research is minutes. Invented specifications are afternoons, and they damage trust in
everything else in the file set.**
