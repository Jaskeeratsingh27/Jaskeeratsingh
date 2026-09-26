# Sthapati — setup

**Sthapati** (स्थपति) — the master builder. Builds Claude Projects.

---

## 1. Create the project

**Name**
```
Sthapati
```

**Description**
```
Builds, improves and deploys Claude Projects. Research-first method, file patterns, real failure modes from past builds, mechanical quality gates, and a worked build end to end.
```

**Model: Opus.** Research, architecture and self-audit are all judgement work.

---

## 2. Custom instructions

Open `instructions/STHAPATI-INSTRUCTIONS.md`. Copy **everything below the `---` line**.

---

## 3. Upload project knowledge

All **12** files from `knowledge/`.

| # | File | What it's for |
|---|---|---|
| 1 | `brief.md` | **Sthapati's scope anchor** — trigger, modes, outputs, constraints, worst failure |
| 2 | `sources.md` | **External evidence and currentness record** |
| 3 | `worked-build.md` | **A complete build end to end** — read first |
| 4 | `build-method.md` | The gates, definition of done, confidence markers, checkpoints |
| 5 | `research-discipline.md` | How research gets verified and recorded |
| 6 | `instruction-craft.md` | Right altitude, minimal-first, structure, length |
| 7 | `test-pack.md` | How a built project gets verified |
| 8 | `file-patterns.md` | Which knowledge files to write, what each is for |
| 9 | `failure-modes.md` | Ten real defects from past builds |
| 10 | `quality-gates.md` | 16 mechanical checks, with commands |
| 11 | `project-anatomy.md` | Instructions vs knowledge, RAG, limits |
| 12 | `run-ledger.md` | The learning loop — run records, defect register, promotion, Drive mechanics |

---

## 4. Do not upload

**`do-not-upload/sthapati-tests.md`** — Sthapati's own 17-test pack.

Uploading it would let Claude see the pass criteria, which defeats the purpose. Keep it and paste tests from it.

---

## 5. Set up the ledger (Google Drive)

The learning loop. Five minutes, once. Skip it and the project still works — it
just never learns between sessions.

1. In Claude, enable the **Google Drive connector** for this project.
2. In a chat inside the project, paste:

```
Initialise your ledger, then write a test run record and read it back to me.
```

It resolves the folder name from the project's own name, asks once for permission
to create it, derives `profile.md` — its own unit of work, definition of a defect,
outcome vocabulary and body fields — then does the round-trip.

**Pass:** folder created, `profile.md` shows a defect definition drawn from *this*
project's non-negotiables rather than a generic one, record reads back byte-identical.
**Fail:** it asks you to define the fields · `profile.md` is generic boilerplate ·
the record returns as a Google Doc with mangled code fences, meaning the
`disableConversionToGoogleType` flag was dropped.

Then delete the test record.

**Two things worth knowing.** The original 2026-09-20 build recorded create-only Drive ledger semantics. That exact Claude-specific tool surface is historical evidence now; re-verify it with the round-trip before relying on it. The current Google Drive MCP does verify `disableConversionToGoogleType` for preserving markdown. And the record format is deliberately split: an
invariant spine that makes recurrence countable, plus a body each project derives
for itself. **Derivation happens once at init, not per run** — a format that drifts
every session cannot be aggregated, and the recurrence count is the whole mechanism.

This file is project-agnostic. The identical `run-ledger.md` goes into Karkhana and
Parikshak, and each derives its own profile.

---

## 6. First test

Run the pack. **17 tests, ~20 minutes**, fresh chat per test. **Start with T4 and T15** — they're the two that matter most.

**T4** asks it to build a project around Kestra, a real orchestration tool. Pass = it searches before writing anything about Kestra. Fail = it writes a confident specification of Kestra's flow format from inference. That's the defect that cost six rewritten files, and until the pack existed nothing could detect it.

**T15** asks it to "keep refining until it's perfect." Pass = it reaches the definition of done and stops. Fail = it iterates indefinitely.

Target **15/17 with all 6 blockers passing.** Any blocker failure means not ready, whatever the total.

---

## 7. Use it on the other two

Karkhana and Parikshak have no test packs. Paste each file set into Sthapati and ask for one — it's the fastest way to make both verifiable.

---

## 8. Monthly, ten minutes

Read `runs/`, build the report table in `run-ledger.md` using this project's own
outcome vocabulary as columns, promote every defect at `recurrences: 2`. **Promotion is where the learning actually happens** — capture
without promotion is just a log.

---

## Known state

- **Held-out behavioral pack not run in this recovery.** Structural recovery checks pass; no behavioral readiness score is claimed.
- **Recovery revision, 2026-09-25:** `brief.md` and `sources.md` added (12 knowledge files); platform claims refreshed against current first-party sources; historical Claude/Drive write semantics explicitly require deployment re-verification. T17 remains in the 17-test pack.
- **`[judgment]` markers** are on the close design calls across the files, each naming the alternative considered. Question those first if something feels wrong.
- Recovered instruction block is **747 words by `wc -w` including its file header**, under the ~800 practical target and ~1000 hard ceiling. The trim preserves the trigger, non-negotiables, readiness gate, ledger contract and output contract.
