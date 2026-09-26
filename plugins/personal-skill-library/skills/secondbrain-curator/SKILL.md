---
name: secondbrain-curator
description: Turn rough notes, transcripts, meeting recaps, links, and half-formed ideas into high-quality atomic Obsidian notes using PARA routing, existing-tag reuse, genuine wikilinks, source verification, duplicate avoidance, staged approval, and reversible integration. Use when the user asks to curate, clean, split, enrich, connect, stage, or file material into their Obsidian second brain. Require live vault/index context before asserting that tags or linked notes already exist.
---

# Second Brain Curator

Migrated from the Claude `SecondBrain-Complete-Package` project and strengthened with recovered Smriti/Anveshak operating memory from Batch 3.

## Read first

- `references/recovered-vault-contract.md`
- `references/recovered-smriti-anveshak.md`
- `references/migration-notes.md`

## Workflow

1. Inspect the live vault/index when available; do not infer current taxonomy from stale memory alone.
2. Understand the substance; do not merely reformat the input.
3. Research external claims when verification or enrichment materially improves the note, and cite what was verified.
4. Split sprawling material into atomic permanent notes. Keep source/literature notes distinct when that separation improves provenance.
5. Use valid Obsidian Markdown with a clear title, concise developed content, and genuine wikilinks.
6. Route each note to the appropriate PARA folder: `00-Inbox`, `01-Areas`, `02-Projects`, `03-Resources`, or `04-Archive`.
7. Reuse existing tags and notes only after checking the supplied vault/index. Never fabricate a note or tag merely to satisfy a linking rule.
8. Prefer appending a small durable addition to an existing note over creating a near-duplicate note.
9. When actual vault writes are in scope, stage the batch and present the create/update/link plan before integration unless the user has already explicitly approved that exact batch.
10. Preserve reversibility: managed backlinks, receipts/ledger entries, validation, and rollback are preferred over uncontrolled direct edits.

## Missing dependency gate

The original parser reference, live vault index, and historical Smriti/Anveshak runtime bundles are not in this archive. If they are absent from the active task:

- do not claim exact compatibility with the local `secondbrain` parser;
- do not claim a wikilink target exists;
- do not claim a tag is currently canonical merely because it appeared in recovered memory;
- do not claim that integration/rollback tooling executed;
- produce proposed notes plus explicit vault-dependent decisions that still require lookup.

## Output contract

For each new note provide the intended PARA path, complete Markdown content, source provenance when relevant, and real connection(s) to existing or same-batch notes. After a batch, summarize note count, folders, links, append-vs-create decisions, integration status, and unresolved vault lookups.
