# Weekly Hermes Architecture Refresh Prompt

Use this as the execution prompt for the scheduled maintenance job. The canonical copy of the skill is the GitHub repository version; do not treat chat history as source of truth.

## Prompt

Audit the canonical `hermes-agent-architecture` skill against current official Hermes Agent primary sources and append historical health evidence for this audit.

1. Read the current skill, `VERSION`, `CHANGELOG.md`, `maintenance/source-manifest.json`, `compatibility/hermes-compatibility.json`, `compatibility/primitive-routing.json`, `compatibility/impact-map.json`, `compatibility/upgrade-matrix.json`, `compatibility/freshness-policy.json`, `consumers/registry.json`, `research/audits/index.json`, `research/health/index.json`, and `references/12-versioning-known-caveats.md`.
2. Check the official Hermes Agent GitHub releases first and identify the current stable release/tag. Compare it with the compatibility baseline, upgrade matrix, and latest audit snapshot.
3. Review every `critical` source in `maintenance/source-manifest.json`. Review `high` sources when release notes, changed docs, or repository changes indicate relevance. Use `medium` sources when affected or when their capability is due/stale under the freshness policy.
4. Before deciding the audit scope, run `python maintenance/health_engine.py --as-of YYYY-MM-DD` using the audit date. Use its stale/due-soon capability list to prioritize reverification.
5. Detect factual changes to profiles/Bots, delegation/subagents, output schemas, Kanban, skills/context/SOUL, memory, tools/toolsets, execute_code, MCP, model/provider routing, Cron, security/sandboxing, checkpoints, plugins/hooks, observability, persistence, or deployment behavior.
6. For each distinct material or ambiguous change, create a machine-readable event under `research/change-events/YYYY-MM-DD-<slug>.json` conforming to `maintenance/change-event.schema.json`.
7. Run `python maintenance/impact_engine.py <event-file> --pretty` for every event before editing knowledge files.
8. Save each impact-engine result as `research/change-events/YYYY-MM-DD-<slug>.impact.json`, then run `python maintenance/consumer_impact.py <impact-result.json> --pretty` and save it as `research/consumer-impact/YYYY-MM-DD-<slug>.json`.
9. Use the impact result as the default knowledge blast radius and the consumer-impact result as the downstream blast radius. Edit only affected knowledge files unless verified evidence requires an additional file; do not automatically edit downstream consumers.
10. Update a capability's `last_verified_on` only if the audit actually checked enough of its required primary sources to reverify the claim. Do not refresh dates merely because the weekly job ran.
11. Aggregate event and consumer-impact results into `research/weekly-change-report-YYYY-MM-DD.md` containing sources checked, old/new versions, event IDs, severity, factual deltas, affected capabilities/files/routing rules, targeted regressions, affected consumer IDs/paths, recommended consumer actions, consumer compatibility blockers, confidence, unresolved questions, and review requirements.
12. Create `research/audits/YYYY-MM-DD.json` conforming to `maintenance/audit-snapshot.schema.json`. Record the observed stable Hermes release/tag, all source IDs actually checked, event IDs, highest severity, per-capability verification result, deterministic-validation results, and notes.
13. Append that snapshot to `research/audits/index.json` and move `latest_audit_date/latest_snapshot` to the new snapshot.
14. If no material or ambiguous change exists, do not rewrite canonical knowledge and do not bump `VERSION`; still commit the audit snapshot/history update.
15. If verified changes exist, update only the smallest affected canonical files. Update the research dossier only when the conceptual model changes.
16. Keep `compatibility/hermes-compatibility.json` synchronized with verified capability state. Never clear `needs_revalidation` without primary-source verification.
17. If a stable Hermes release changed, populate `compatibility/upgrade-matrix.json.next_upgrade`, use a branch/PR, and do not promote automatically. After approved promotion, append the verified transition to `history` and move it into `current_baseline`.
18. Update `compatibility/primitive-routing.json` only when a verified change actually alters a canonical primitive-selection rule.
19. Increment semantic version and update `CHANGELOG.md` only when canonical knowledge or maintenance/control logic changes. Routine audit/health telemetry alone does not require a version bump.
20. Run all deterministic gates after edits/history updates:
    - `python tests/validate_skill.py`
    - `python tests/test_architecture_regressions.py`
    - `python tests/test_release_impact.py`
    - `python tests/test_health_drift.py`
    - `python tests/test_consumer_impact.py`
21. Run `python maintenance/health_engine.py --as-of YYYY-MM-DD --output research/health/YYYY-MM-DD.json` after the final compatibility/audit state is written.
22. Append the generated health report to `research/health/index.json` and move `latest_health_date/latest_report` to the new report.
23. Compare the new health result with the previous health report and explicitly report:
    - overall health score/state change
    - newly stale capabilities
    - newly due-soon capabilities
    - recovered/reverified capabilities
    - new/resolved drift signals
24. Run `python tests/validate_skill.py` again after writing the audit and health indexes so history consistency is verified.
25. Do not promote a semantic update if any gate fails.
26. Branch/PR review is mandatory for stable-release transitions, ambiguous evidence, unknown source/capability mappings, breaking/architecture changes, and security changes.
27. A small verified documentation-only correction may be committed directly only when repository maintenance policy explicitly permits it and all gates pass.
28. Report a concise TL;DR containing: audit status, current stable Hermes version, semantic skill version, whether canonical knowledge changed, highest impact severity, health score/state and delta, stale/due/recovered capabilities, drift signals, compatibility/upgrade state, affected consumers and required review/migration actions, consumer compatibility blockers, files changed, validation results, commit/PR details, and anything requiring human review.

## Safety / quality gates

- Official Hermes docs, GitHub releases/tags, and matching source code outrank secondary commentary.
- Do not remove a previous caveat merely because a newer page omits it; verify the underlying behavior.
- Preserve Git history, audit history, health history, and changelog traceability.
- Do not update unrelated user agent designs merely because the knowledge-base skill changed.
- Do not expose credentials or repository secrets in reports.
- Do not broaden the blast radius merely for convenience.
- Do not refresh capability verification dates without actual reverification evidence.
- Do not infer active consumers from archived migrations, mirrors, or keyword matches; use the explicit consumer registry.
- Do not modify downstream consumer artifacts as part of the knowledge refresh unless a separate reviewed migration is explicitly authorized.
