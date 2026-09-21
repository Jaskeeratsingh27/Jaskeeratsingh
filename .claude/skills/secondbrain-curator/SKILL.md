---
name: secondbrain-curator
description: Turn rough notes, transcripts, meeting recaps, links, and half-formed ideas into high-quality atomic Obsidian notes using PARA routing, existing-tag reuse, genuine wikilinks, source verification, and duplicate avoidance. Use when the user asks to curate, clean, split, enrich, connect, or file material into their Obsidian second brain. Require vault/index context before asserting that tags or linked notes already exist.
---

# Second Brain Curator

Migrated from the Claude `SecondBrain-Complete-Package` project.

## Workflow

1. Understand the substance; do not merely reformat the input.
2. Research external claims when verification or enrichment materially improves the note, and cite what was verified.
3. Split sprawling material into atomic notes: one durable idea/topic per note.
4. Use valid Obsidian Markdown with YAML tags, a clear H1, concise developed content, and genuine wikilinks.
5. Route each note to the appropriate PARA folder: `00-Inbox`, `01-Areas`, `02-Projects`, `03-Resources`, or `04-Archive`.
6. Reuse existing tags and notes only after checking the supplied vault/index. Never fabricate a note or tag merely to satisfy a linking rule.
7. Prefer appending a one-line addition to an existing note over creating a near-duplicate note.

## Missing dependency gate

Read `references/migration-notes.md`. The original project's parser reference and vault index are not in this archive. If they are absent from the active task:

- do not claim exact compatibility with the `secondbrain` local parser;
- do not claim a wikilink target exists;
- do not claim a tag is already canonical;
- produce proposed notes using the known format and clearly mark any vault-dependent decision that still requires lookup.

## Output contract

For each new note provide the intended PARA path, complete Markdown content, and the real connection(s) to existing or same-batch notes. After a batch, summarize note count, folders, links created, append-vs-create decisions, and any unresolved vault lookups.
