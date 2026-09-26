# run-ledger.md — the learning loop

> **Owns:** run records, the defect register, the promotion rule, ledger
> self-configuration, and the Google Drive mechanics behind all of it.
> **Universal.** This file is project-agnostic and ships unmodified into every
> project — it never names a project, a domain or a subject type. Each project
> configures its own ledger on first use. v2, 2026-09-20.

## The constraint this works around

**A chat cannot write to its own project knowledge.** Uploaded files are read-only
from inside the project. Anything learned in a chat is gone when the chat closes.

So the loop splits:

- **Capture** — a record written at the end of every run. Automatic, every time.
- **Promotion** — a defect that recurs gets written into a knowledge file and
  re-uploaded. Deliberate, rare.

**Capture alone is a log, not learning.** Promotion is where behaviour changes.

## Fixed spine, adaptive body

The tension: a schema rigid enough to count, loose enough to fit any project.
Resolved by splitting every record into two parts.

- **The spine is invariant.** Same eight fields in every project forever. It is
  what makes recurrence countable, and **recurrence is the entire mechanism** —
  a ledger that cannot count cannot promote, and a loop that cannot promote is a
  diary. Never rename, drop or reinterpret a spine field, however well the
  project's own vocabulary would fit.
- **The body is derived.** Each project works out its own fields, its own
  outcome vocabulary and its own definition of a defect from its instructions
  and knowledge, and records that decision once.

**Adaptation happens at ledger init, not per run.** A format that drifts every
session is unaggregatable, and the second run would already be incomparable to
the first. Derive once, write it down, then hold it.

## Ledger init — first run in any project

Resolve the folder before anything else:

1. `search_files` for a folder named `<project-slug>-ledger`, where the slug is
   the project's own name, lowercased, spaces to hyphens.
2. Found → read `profile.md` from it and follow that profile. Done.
3. Not found → **ask once** whether to create it. On yes, create the folder, the
   two subfolders and `profile.md`. On no, run in emit-only mode and don't ask again.

`profile.md` is written once and is the project's answer to five questions,
derived from its own instructions and knowledge rather than from this file:

```
project:        <name as the project calls itself>
unit_of_work:   <what one run produces here — a built project, an audit,
                 a skill, a report, a decision>
defect:         <the operational definition of a defect for THIS project,
                 in one sentence, drawn from its own non-negotiables>
outcomes:       <the vocabulary that fits this work, 3-5 values>
body_fields:    <3-6 fields worth recording every run here, and why each earns
                 its place>
derived:        YYYY-MM-DD
```

Rules for deriving it: the defect definition comes from what the project's own
instructions call a failure, not from a generic notion of one. Body fields must
be things that would change a decision later — **if a field would be the same on
every run, it is not a field, it is a constant.** Three good fields beat six weak
ones. Where a project has no strong opinion, fewer.

`profile.md` is rewritten only when the project's own definition of failure
changes. Note the date and what changed; never silently redefine a field that
past records already use.

## Folder layout

```
<project-slug>-ledger/
├── profile.md    written once at init, rarely changed
├── runs/         one file per run, created once, never touched again
└── defects/      one file per defect, replaced in place
```

Naming: `run-YYYY-MM-DD-NN.md` · `D-<nn>.md`, numbered per project.

## Run record

Spine, then body. Written at the end of **every** run — including one that failed
or was abandoned. A run that produced nothing is often the most informative
record in the file.

```
--- spine ---
project:     <name>
date:        YYYY-MM-DD
model:       <model actually used>
outcome:     <one value from profile.outcomes>
job:         <one line — what was asked for>
duration:    <turns, not minutes>
defects:     <D-id, D-id — or none>
note:        <one line, only if something surprised me>
--- body ---
<the fields from profile.body_fields, one per line>
```

Body stays under six lines. A run record that grows into a summary of the work
defeats the point — the work is already in the chat.

## Defect entry

Spine fields are fixed. `symptom` and `trigger` are written in the project's own
vocabulary; the rest of the structure is not negotiable.

```
id:          D-<nn>
opened:      YYYY-MM-DD
last_seen:   YYYY-MM-DD
symptom:     <what was seen, not what caused it>
trigger:     <the input or condition that produced it>
cause:       <confirmed | suspected — say which>
fix:         <what was done in the moment>
prevention:  <the gate, knowledge file or instruction change that would stop it>
recurrences: 1
status:      open | promoted | closed
promoted:    <file> YYYY-MM-DD
```

**Symptom before cause, always.** A register full of guessed causes is worse than
one full of unexplained symptoms, because the guesses stop anyone looking.

Same defect again → **increment `recurrences` on the existing entry.** Never open
a second entry for the same defect; matching is on symptom and trigger, not on
wording. The count is the whole signal.

## Promotion rule

**`recurrences: 2` promotes.** At two it stops being bad luck.

Three destinations, in strict order of preference:

1. **A mechanical check** — a gate, a validator, a grep. Best: costs nothing at
   runtime and cannot be forgotten.
2. **A knowledge-file addition** — a rule or worked example in the file that owns
   that subject. Cheap, retrieved when relevant.
3. **An instruction-block line** — last resort. It loads on every message forever,
   so it must be true of every run, not this one case.

Set `status: promoted`, record `promoted: <file> <date>`, leave the entry in place.
That history is what stops the fix being reinvented.

**If promotion keeps landing in the instruction block, the block is becoming the
register.** Move it to a knowledge file and name that file in the instructions.

## Reading at session start

Read **`profile.md` and `defects/` only** — never `runs/`. The run log is for the
monthly report, not for the project.

From `defects/`, take only `status: open` **and** `recurrences ≥ 2`. Those are
binding constraints on this run. Everything else is context cost with no return.

**No ledger, no folder, no connector → skip silently and emit the records in chat
instead. Absence of a ledger never blocks a run and is never worth a paragraph.**

## Drive mechanics — historical connector evidence from 2026-09-20

The original build recorded that its Claude/Drive connector **could not edit an existing file's content** and that `update_file` changed title/parent only `[historical evidence]` (S8). This exact Claude-specific tool surface was not independently re-verified in the 2026-09-25 recovery pass, so the deployment round-trip is mandatory before relying on create-only semantics.

| Operation | Call | Notes |
|---|---|---|
| Find folder or file | `search_files` | Once per session; hold the id in the chat |
| Write a record | `create_file` | `textContent`, `contentMimeType: text/markdown`, `parentId` = folder id |
| Keep it markdown | `disableConversionToGoogleType: true` | **Required for the documented Google Drive MCP create-file surface** `[verified]` (S6); re-check the exact Claude connector call shape at deployment |
| Read a record | `download_file_content` | `read_file_content` does not support `text/markdown` |
| Update a defect | `create_file` **then** `trash_file` | Create the replacement first. A failure then leaves a duplicate, which is recoverable; the other order loses the entry |

Duplicate titles are legal in Drive, so the defect **id**, not the filename, is
the identity.

Any other durable store works on the same shape — a folder, create-only files, a
profile. Nothing above depends on Drive except the call names.

## Keeping it small

- `runs/` — at 40 files, roll the oldest into `summary-YYYY-MM.md`: date range,
  run count, outcome split, defect ids raised. Then trash the originals.
- `defects/` — never rolled up. Small by nature; if it is not, that is the finding.
- Monthly: promote everything at 2+, set `status: closed` on anything unseen in 90 days.

## The monthly report

From `runs/` alone, using the project's own outcome vocabulary as columns:

| Project | Runs | *(outcome columns from profile)* | New defects | Promoted |
|---|---|---|---|---|

Plus three lines: the most common defect, the check that catches the most, and the
single change that would have prevented the most runs from going sideways.

**This is the only legitimate source of a readiness claim** — a score, a date and
a model, never an opinion.
