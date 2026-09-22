# Weekly Hermes Architecture Refresh Prompt

Use this as the execution prompt for a scheduled maintenance job. The canonical copy of the skill is the GitHub repository version; do not treat chat history as source of truth.

## Prompt

Audit the canonical `hermes-agent-architecture` skill against current official Hermes Agent primary sources.

1. Read the current skill, `VERSION`, `CHANGELOG.md`, `maintenance/source-manifest.json`, and `references/12-versioning-known-caveats.md` from the canonical repository.
2. Check the official Hermes Agent GitHub releases first and identify the current stable release/tag. Compare it with the skill baseline.
3. Review every `critical` source in `maintenance/source-manifest.json`. Review `high` sources when release notes, changed docs, or repository changes indicate relevance. Use `medium` sources only when affected.
4. Detect material changes to profiles/Bots, delegation/subagents, output schemas, Kanban, skills/context/SOUL, memory, tools/toolsets, execute_code, MCP, model/provider routing, cron, security/sandboxing, checkpoints, plugins/hooks, observability, persistence, or deployment behavior.
5. Produce `research/weekly-change-report-YYYY-MM-DD.md` containing: sources checked; old/new versions; factual deltas; breaking/deprecated behavior; docs-vs-release discrepancies; affected files; recommended tests; confidence; unresolved questions.
6. If no material change is found, do not rewrite the knowledge base. Record the audit result only.
7. If a material change is verified by official primary sources, update only the smallest affected files, update the research dossier when the conceptual model changes, increment semantic version, and update `CHANGELOG.md`.
8. Never silently convert documentation for `main` into claims about the pinned stable release. Label release-specific versus docs/current-main behavior.
9. Run `python tests/validate_skill.py` after edits. Do not promote an update if validation fails.
10. For any ambiguous, breaking, security-sensitive, or architecture-wide change, create a proposed patch/PR for review rather than directly overwriting the live canonical version.
11. For a small, unambiguous documentation correction with passing validation, an automated update is acceptable only when the repository maintenance policy explicitly permits it.
12. Report a concise TL;DR containing: audit status, current stable Hermes version, whether the skill changed, new skill version if any, files changed, validation result, and anything requiring human review.

## Safety / quality gates

- Official Hermes docs, GitHub releases/tags, and matching source code outrank secondary commentary.
- Do not remove a previous caveat merely because a newer page omits it; verify the underlying behavior.
- Preserve Git history and changelog traceability.
- Do not update unrelated user agent designs merely because the knowledge-base skill changed.
- Do not expose credentials or repository secrets in reports.
