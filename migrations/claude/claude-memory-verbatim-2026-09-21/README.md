# Claude migration: claude-memory-verbatim.zip

Migration date: 2026-09-21

## Source integrity

- ZIP compressed-data test: PASS.
- ZIP entries: 54 (including directories).
- Memory-store records: 40 Markdown files.
- Wrapper documents: `README.md` + `ALL-MEMORY-VERBATIM.md`.
- `ALL-MEMORY-VERBATIM.md` contains the exact text of all 40 memory-store files.

## Relationship to Batch 3

Batch 4 covers the same memory-store scope as Batch 3, but is a later **verbatim** snapshot. It uses opaque Claude Project UUID directories rather than the friendly project names used in Batch 3. Of the 31 same-path files between the two memory exports, 8 are byte-identical and 23 contain wording/context refinements. The 10 project-scoped files map one-to-one between friendly-name and UUID paths.

This means Batch 4 is primarily a **precision/delta audit**, not a second independent memory corpus.

## New durable recovery material promoted

The verbatim pass exposed or sharpened durable architecture that was under-preserved after Batch 3:

- `Idea-to-Deploy Loop` — six-stage controlled loop with human gates and stop conditions.
- `Vishwakarma (Vish)` — Antigravity-oriented multi-agent forge/model-routing architecture.
- `Karkhana / Parikshak / Sthapati` — stronger shipped-project provenance and role definitions.
- `Token Ledger / session-token-audit` — usage-coaching dashboard/audit intent.
- SecondBrain — exact historical canonical tag vocabulary, generated-hub names, and refresh semantics.
- Netra — package + stepwise setup deliverable requirement.
- Vartaa — explicit exclusions and anti-hallucination/rollout behavior.
- Kosha — teaching-by-doing requirement and shipped-package provenance.

No duplicate executable skill was created where the original source bundle remains missing.

## Privacy decision

This archive is explicitly personal and includes profile, people, employment/compensation context, local paths, device/home details, and potentially organization-specific automation notes. The canonical GitHub repository is public, so the raw memory files and the concatenated verbatim export are intentionally **not** committed. Only sanitized reusable architecture, evidence hashes for non-private agent/project files, and migration records are stored publicly.
