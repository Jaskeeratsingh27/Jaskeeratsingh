# Weekly Hermes Knowledge Refresh Specification

Status: ACTIVE MAINTENANCE CONTRACT. The canonical skill currently has an external ChatGPT scheduled audit every Tuesday at 02:00 America/Winnipeg; this repository file defines how that audit must behave.

## Objective

Keep the Hermes Agent architecture knowledge base synchronized with official releases and documentation without silently introducing unverified behavior into production guidance.

## Cadence

Weekly. The active external scheduler runs this audit on Tuesday at 02:00 America/Winnipeg. Prefer a repository-backed audit so it compares against the canonical committed version rather than transient chat state.

## Primary sources

Use `maintenance/source-manifest.json` as the machine-readable watch list and `references/13-source-index.md` as the human-readable index. Prefer official Hermes docs, official GitHub releases/tags, and deployed-tag source code.

## Workflow

1. Read current `references/12-versioning-known-caveats.md`, `compatibility/hermes-compatibility.json`, and package changelog.
2. Check GitHub releases for a stable tag newer than the recorded baseline.
3. Review release notes for architecture-relevant changes: profiles, delegation, Kanban, skills/context, memory, tools/MCP, cron, model routing, security, hooks/telemetry, state persistence.
4. Review the corresponding official docs pages for changed semantics.
5. Produce `research/weekly-change-report-YYYY-MM-DD.md` with:
   - old/new stable version
   - material changes
   - breaking/deprecated behavior
   - docs-vs-release ambiguity
   - files that should change
   - tests required
6. Do not directly rewrite production guidance when evidence is ambiguous. Mark the affected capability `needs_revalidation`.
7. When changes are verified, update the smallest relevant reference files, `SKILL.md` if procedure changes, the research dossier when the conceptual model changes, and the affected entries in `compatibility/hermes-compatibility.json`.
8. Increment package version using semantic versioning.
9. Run `python tests/validate_skill.py` and `python tests/test_architecture_regressions.py`; these validate frontmatter/version consistency, JSON files, source IDs, compatibility state, routing references, and architecture regression fixtures.
10. Commit through Git/version control with a change summary. Prefer review/PR before promotion to the live shared skill.

## Scheduled-run behavior

- use `hermes-agent-architecture` as the governing knowledge/maintenance contract
- use a research-capable ChatGPT chat model with web/GitHub access
- operate against the Git repository containing the canonical skill
- output a change report plus proposed patch when changes are material
- do not self-schedule recursively
- do not automatically publish major semantic changes without review
- do not use Work/Codex for the scheduled maintenance task unless the user explicitly changes that policy

## Acceptance criteria

A refresh is complete only if every changed claim has a primary-source citation, the package states the Hermes version/commit it was validated against, compatibility status is synchronized with `VERSION`, and both deterministic validation suites pass.
