# Three projects — deploy guide

Three Claude Projects that work on each other. Build them in the order below;
each `SETUP.md` runs top to bottom and carries the name, description, model,
instruction block, upload list, ledger setup and first test.

| Project | Does | Model | Knowledge | Withheld |
|---|---|---|---|---|
| **Sthapati** (स्थपति) | Builds Claude Projects | **Opus** | 12 | 17-test pack |
| **Parikshak** (परीक्षक) | Audits agentic systems with DMAIC | **Opus** | 13 | 3-test smoke pack |
| **Karkhana** (कारखाना) | Builds Hermes agents (skills) | Sonnet / Opus | 15 | smoke pack + validator |

## Deploy order

1. **Sthapati first** — the only one with a full test pack, so the only one you can
   verify today. Run T4 before anything else.
2. **Parikshak second** — then point it at the other two. Karkhana's file set is a
   good first subject.
3. **Karkhana third** — resolve the two `hermes` commands in its SETUP §6 first.

## What to create, per project

1. New Project, name and description straight from its `SETUP.md` §1
2. Set the model — **Opus for Sthapati and Parikshak**, both are reasoning-bound
3. Paste the instruction block: everything below the `---` in `instructions/`
4. Upload every file in `knowledge/`, nothing else
5. Create the Drive ledger folder and run the round-trip check
6. Run the first test in a fresh chat

## Nothing in `do-not-upload/` goes into project knowledge

Test packs hold the pass criteria. A project that can read its own pass criteria
cannot be tested by them. `validate_agent.py` belongs in your repo, not in a project.

## The loop

- **Sthapati** writes the real test packs for Karkhana and Parikshak — the fastest
  way to make both verifiable, and itself a live test of Sthapati
- **Parikshak** audits all three as an `eng-process`
- **Karkhana** builds the Hermes skills

## The ledger

All three share a byte-identical `run-ledger.md` and each needs its own Drive folder:
`sthapati-ledger`, `parikshak-ledger`, `karkhana-ledger`. Each project derives its
own `profile.md` at init — its own unit of work, its own definition of a defect.

**A chat cannot write to its own project knowledge.** So capture is automatic and
promotion is manual: at `recurrences: 2` a defect gets written into a knowledge file
and re-uploaded, by you. Ten minutes a month. **Skip the promotion pass and you have
a tidy log and no learning** — the loop closes through you, not around you.

## Honest state, 2026-09-20

- **Recovery structural pass completed 2026-09-25; behaviour still unverified.** The recovered Sthapati source now includes its own `brief.md` and `sources.md`, current platform claims were refreshed, and the instruction block was brought under its stated ceiling. The 17-test held-out pack still has zero recovery-run results, so this is not a behavioral readiness claim.
- **Only Sthapati has a full test pack.** Karkhana and Parikshak have three-test smoke
  packs covering their blocker behaviours. That is a floor, not a bar.
- **The Drive round-trip has never executed.** Mechanics are verified against the
  connector's tool schemas, not inferred, but no file has been written or read back.
  It is the first thing that could break in practice; each SETUP §4/§5 catches it.
- **Parikshak's verifier shares a model family with its orchestrator**, so blind spots
  correlate. v3 requires every report to name that limit and say what a second pass on
  a different model should re-check. Mitigated, not fixed.
- **MAST prevalence figures are priors** from 7 frameworks and may not transfer to
  hand-built systems. Labelled as priors throughout.
- **Karkhana reads 7 in-flight against a WIP limit of 2.** It will tell you so the
  moment you ask it to build anything. That is the system working.
