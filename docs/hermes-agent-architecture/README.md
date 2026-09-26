# Hermes Agent Architecture Knowledge Package

This directory is managed using `project-knowledge-handoff`.

## Canonical latest guide

`MASTER_GUIDE.md`

Use this stable path for future-chat/bootstrap reference.

Current documented project version: **1.8.0**

## Version snapshots

- `history/MASTER_GUIDE_v1.6.0.md`
- `history/MASTER_GUIDE_v1.8.0.md`

Historical snapshots preserve meaningful semantic release states. v1.7 is captured in the v1.8 guide's version history; the continuity defect discovered at v1.7 is why the handoff package is now mandatory for semantic releases.

## Derived exports

The historical v1.6 Word mirror remains at:

`exports/MASTER_GUIDE_v1.6.0.docx`

No v1.8 binary mirror is declared current. Markdown is the canonical automation-safe source. A future DOCX/PDF may be generated from the current Markdown when artifact tooling is available.

## Manifest

`manifest.json` records the project version, guide revision, implementation source commit, latest snapshot, current export paths, and known continuity gaps.

## Scheduler continuity

Semantic Hermes architecture releases must update this package as part of the same candidate PR before approval/merge. The canonical lifecycle is:

`.agents/skills/hermes-agent-architecture/maintenance/autonomous-upgrade-runbook.md`
