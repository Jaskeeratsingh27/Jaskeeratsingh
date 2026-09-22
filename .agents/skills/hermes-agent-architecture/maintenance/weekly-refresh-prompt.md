# Weekly Hermes Architecture Refresh Prompt

Use this as the execution prompt for the scheduled maintenance job. The canonical copy of the skill is the GitHub repository version; do not treat chat history as source of truth.

## Prompt

Audit the canonical `hermes-agent-architecture` skill against current official Hermes Agent primary sources.

1. Read the current skill, `VERSION`, `CHANGELOG.md`, `maintenance/source-manifest.json`, `compatibility/hermes-compatibility.json`, `compatibility/primitive-routing.json`, `compatibility/impact-map.json`, `compatibility/upgrade-matrix.json`, and `references/12-versioning-known-caveats.md`.
2. Check the official Hermes Agent GitHub releases first and identify the current stable release/tag. Compare it with the recorded compatibility baseline and upgrade matrix.
3. Review every `critical` source in `maintenance/source-manifest.json`. Review `high` sources when release notes, changed docs, or repository changes indicate relevance. Use `medium` sources only when affected.
4. Detect factual changes to profiles/Bots, delegation/subagents, output schemas, Kanban, skills/context/SOUL, memory, tools/toolsets, execute_code, MCP, model/provider routing, Cron, security/sandboxing, checkpoints, plugins/hooks, observability, persistence, or deployment behavior.
5. For each distinct material or ambiguous change, create a machine-readable event under `research/change-events/YYYY-MM-DD-<slug>.json` conforming to `maintenance/change-event.schema.json`. Include the official source IDs, change types, release transition, evidence status, summary, and explicit capability IDs when a global source such as release notes affects named capabilities.
6. Run `python maintenance/impact_engine.py <event-file> --pretty` for every event before editing knowledge files.
7. Use the impact result as the default blast radius:
   - edit only `affected_files` unless verified evidence requires an additional file;
   - inspect affected `routing_rule_ids`;
   - run the recommended targeted regression case IDs during analysis;
   - mark `needs_revalidation` capabilities when evidence is ambiguous;
   - treat unknown source/capability IDs as at least major impact requiring review.
8. Aggregate all event results into `research/weekly-change-report-YYYY-MM-DD.md` containing: sources checked; old/new stable versions; event IDs; severity; factual deltas; breaking/deprecated behavior; docs-vs-release discrepancies; affected capabilities/files/routing rules; targeted regressions; confidence; unresolved questions; and review requirements.
9. If no material or ambiguous change exists, do not rewrite the knowledge base. Record the audit result only and leave the compatibility baseline unchanged.
10. If verified changes exist, update only the smallest affected canonical files. Update the research dossier only when the conceptual model changes.
11. Keep `compatibility/hermes-compatibility.json` synchronized with verified capability state. Never clear `needs_revalidation` without primary-source verification.
12. If a stable Hermes release changed, populate `compatibility/upgrade-matrix.json.next_upgrade`, update the smallest affected files, and use a branch/PR. After approved promotion, append the verified transition to `history` and move it into `current_baseline`.
13. Update `compatibility/primitive-routing.json` only when a verified change actually alters a canonical primitive-selection rule.
14. Increment semantic version and update `CHANGELOG.md` when canonical knowledge/control behavior changes.
15. Never silently convert documentation for `main` into claims about the pinned stable release. Label release-specific versus docs/current-main behavior.
16. Run all deterministic quality gates after edits:
    - `python tests/validate_skill.py`
    - `python tests/test_architecture_regressions.py`
    - `python tests/test_release_impact.py`
17. Do not promote an update if any gate fails.
18. Branch/PR review is mandatory for stable-release transitions, ambiguous evidence, unknown source/capability mappings, breaking/architecture changes, and security changes.
19. A small verified documentation-only correction may be committed directly only when the repository maintenance policy explicitly permits it and all gates pass.
20. Report a concise TL;DR containing: audit status, current stable Hermes version, whether the skill changed, new skill version if any, highest impact severity, affected capabilities, compatibility/upgrade state, files changed, all validation results, commit/PR details, and anything requiring human review.

## Safety / quality gates

- Official Hermes docs, GitHub releases/tags, and matching source code outrank secondary commentary.
- Do not remove a previous caveat merely because a newer page omits it; verify the underlying behavior.
- Preserve Git history and changelog traceability.
- Do not update unrelated user agent designs merely because the knowledge-base skill changed.
- Do not expose credentials or repository secrets in reports.
- Do not broaden the blast radius merely for convenience; explain every file changed outside the impact engine's recommended set.
