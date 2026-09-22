# Weekly Hermes Knowledge Refresh Specification

Status: DESIGN ONLY — not scheduled by this package.

## Objective
Keep the Hermes Agent architecture knowledge base synchronized with official releases and documentation without silently introducing unverified behavior into production guidance.

## Cadence
Weekly. A future scheduled job can use `maintenance/weekly-refresh-prompt.md` on a fixed weekday. Prefer a repository-backed audit so it compares against the canonical committed version rather than transient chat state.

## Primary sources
Use `maintenance/source-manifest.json` as the machine-readable watch list and `references/13-source-index.md` as the human-readable index. Prefer official Hermes docs, official GitHub releases/tags, and deployed-tag source code.

## Workflow

1. Read current `references/12-versioning-known-caveats.md` and package changelog.
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
6. Do not directly rewrite production guidance when evidence is ambiguous. Mark it `NEEDS_VERIFICATION`.
7. When changes are verified, update the smallest relevant reference files, `SKILL.md` if procedure changes, and the research dossier.
8. Increment package version using semantic versioning.
9. Run validation: frontmatter parse, JSON Schema parse, internal link/path checks, and a small architecture regression suite.
10. Commit through Git/version control with a change summary. Prefer review/PR before promotion to the live shared skill.

## Suggested future Hermes cron behavior

- attach skill: `hermes-agent-architecture`
- continuity: true
- use a research-capable model with web/GitHub access
- run inside the Git repo/workspace containing this skill
- output: change report plus proposed patch
- do not self-schedule recursively
- do not automatically publish major semantic changes without review

## Acceptance criteria

A refresh is complete only if every changed claim has a primary-source citation and the package states the Hermes version/commit it was validated against.
