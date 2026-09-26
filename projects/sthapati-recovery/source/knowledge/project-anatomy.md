# project-anatomy.md — what a Claude Project actually is

> **Owns:** platform mechanics — what a Claude Project is, instructions vs knowledge, RAG, limits.
>
> Researched Sept 2026. Platform details change — verify anything marked `[check]`.

---

## Three surfaces, different economics

| Surface | Behaves like | Loaded when | Cost |
|---|---|---|---|
| **Custom instructions** | A system prompt for every chat in the project | **Every message** | Recurring, per message |
| **Project knowledge** | A reference shelf read before responding | Read before composing; searched once RAG kicks in | Amortized |
| **The chat itself** | Working memory | Now | Now |

**The whole design problem is deciding what goes where**, and the deciding factor is
recurrence, not importance.

---

## Custom instructions

- Sets role, standing constraints, output contract, tone, and the trigger for what
  should happen by default
- **Loads on every single message.** A 2,000-word instruction block on a 60-message
  project is 2,000 words × 60.
- Combines with account-level profile instructions
- Editable from Project settings

**Belongs here:** who Claude is in this project, what it does by default with no
prompting, the non-negotiables, output structure, the push-back triggers, and pointers
to the knowledge files.

**Never here:** anything that changes weekly. Status, current phase, what's in flight.
It becomes a permanent token tax and it goes stale silently — a chat will confidently
act on last month's state.

**Target:** under ~800 words. Both projects I built landed near 700 and neither
suffered. If it's longer, something in it is knowledge, not instruction.

---

## Project knowledge

- Files Claude can see in every conversation in the project
- Project-knowledge files can be up to **30 MB** each `[verified]`; chat uploads support up to **20 files per chat** `[verified]` (S7).
- **RAG mode auto-enables on paid plans** when project knowledge approaches the context limit, expanding capacity by up to **10x** and retrieving relevant knowledge rather than loading everything at once `[verified]` (S5, S7).

**Belongs here:** reference material, standards, taxonomies, worked examples, rubrics,
templates — anything consulted rather than obeyed.

**Two rules that matter more than they sound:**

1. **A smaller relevant knowledge base retrieves more accurately than a large noisy
   one.** Resist dumping. Every marginal file makes every other file slightly harder to
   find.
2. **Filenames and headings are retrieval surface.** Once RAG is active Claude is
   *searching*, not reading everything. `defect-taxonomy.md` gets found;
   `notes-v2-final.md` does not. Name files by what's inside them.

---

## The division test

For any piece of content, in order:

1. **Does Claude need this on every message to behave correctly?** → instructions
2. **Does it change more often than monthly?** → neither. It goes in the chat.
3. **Is it consulted for some tasks and not others?** → knowledge
4. **Is it an example of good output?** → knowledge, always. Few-shot is the single
   highest-leverage file type and it's too long for instructions.

---

## What a project cannot do

- **No folders.** Flat file list. Structure lives in filenames and in the instructions'
  pointers.
- **No conditional loading.** You can't load a file only for certain tasks; you can
  only write instructions that tell Claude when to consult it.
- **No execution.** A project is context, not automation. If you need scheduled or
  triggered runs, that's a different tool.
- **No enforcement.** Nothing validates that Claude followed the instructions. If a
  rule must hold, it needs a checkable artifact or an explicit self-check step.
- **No cross-project access.** Isolation is the point. Files in one project are
  invisible to another — which is why the same fact in two projects will drift.

---

## Project settings that matter

| Setting | Why |
|---|---|
| **Name** | How you find it. Short and distinct. |
| **Description** | For you, in the sidebar. Not loaded into context. |
| **Custom instructions** | The system prompt |
| **Model** | Set deliberately. A reasoning-heavy project should be pinned to the strongest model. |

---

## Scope — one project per work stream

**One project per work stream, not per task.** The shared context is what makes it
worth building; if two work streams share a stack and conventions but different
subjects, that's one project.

The counter-signal: if the instructions need an "if the user is doing X, else Y"
branch, that's two projects.

Claude Projects are currently documented for paid plans `[verified]` (S5). The practical constraint is still maintenance: each project is a set of files that can drift from reality, and drift is invisible until a chat acts on stale facts.

---

## The drift problem

**The same fact in two places will diverge.** Both projects I've built now describe
the same hardware, the same stack, the same conventions.

**Countermeasure:** declare one file canonical for each fact domain, in that file's own
header, and make every other reference point at it rather than restate it. A sentence
that says "see `stack.md`" cannot go stale. A sentence that repeats stack.md can.

Decide canonical ownership at build time. Retrofitting it means re-reading everything.
