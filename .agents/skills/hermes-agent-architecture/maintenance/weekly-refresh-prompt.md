# Weekly Hermes Architecture Refresh Prompt

Use this as the execution prompt for the scheduled maintenance job. The canonical GitHub repository is the source of truth; do not depend on the originating chat.

## Required contracts

Before doing anything, read:

- `maintenance/weekly-refresh-spec.md`
- `maintenance/autonomous-upgrade-runbook.md`
- `maintenance/source-manifest.json`
- `compatibility/hermes-compatibility.json`
- `compatibility/upgrade-matrix.json`
- `consumers/registry.json`
- `research/audits/index.json`
- `research/health/index.json`
- `research/consumer-drift/index.json`
- `docs/hermes-agent-architecture/manifest.json`
- `.agents/skills/project-knowledge-handoff/SKILL.md`

## Scheduler objective

Run the complete weekly Hermes audit and keep the repository's knowledge, health, consumer map, and project handoff package coherent.

### No-change / telemetry-only run

If there is no material or ambiguous Hermes change:

1. run consumer-dependency drift and knowledge-health checks;
2. review official critical sources according to the freshness policy;
3. append the audit/health/drift evidence;
4. do **not** bump the skill semantic version;
5. use a branch/PR for writes and verify CI before promotion;
6. do not rewrite the master guide merely because an audit occurred.

### New stable release or material semantic change

Follow `maintenance/autonomous-upgrade-runbook.md` Stage A.

The scheduler should prepare the complete upgrade candidate **before asking the user to approve**:

- verify official sources;
- classify release/change impact;
- patch the smallest justified Hermes knowledge/control files;
- assess/update affected registered consumers when migration is deterministic;
- update semantic version and CHANGELOG when warranted;
- update all audit/health/impact/drift evidence;
- run every Hermes deterministic gate;
- if the semantic skill version changed, run `project-knowledge-handoff` and update the stable master guide, manifest, and release snapshot;
- run Project Knowledge Handoff CI;
- rebase safely if `main` changed and rerun CI;
- open/reuse the deterministic target-release PR;
- leave the PR unmerged.

If the candidate is blocked by ambiguity, unknown coverage, failed tests, stale critical knowledge, unresolved dependency drift, or an unresolved high/critical consumer migration, report the blocker. Do not ask for a generic "yes" as though approval could override it.

If the candidate is otherwise fully ready and the promotion gate returns policy review only, mark the proposal `ready_for_approval` and notify the user with:

- baseline → target Hermes release;
- candidate skill version;
- impact severity;
- affected capabilities and consumers;
- migrations performed or still required;
- exact CI/validation status;
- PR link;
- pre-upgrade main SHA;
- exact approval phrase: `Approve Hermes <target-release>`.

An unambiguous "yes" in that same notification thread counts as approval for that proposal. In a different/new chat, require the explicit approval phrase or resolve which pending proposal is intended.

## After approval

When the user approves, follow `maintenance/autonomous-upgrade-runbook.md` Stage B in the current chat:

1. refetch the pending proposal/PR and latest `main`;
2. write the approval record;
3. finish/verify any required consumer migrations;
4. rerun all deterministic gates and both relevant GitHub Actions workflows;
5. recompute the promotion gate with approval;
6. merge only if knowledge promotion is `allow` and ecosystem compatibility is `cleared`;
7. read back the canonical files from `main`;
8. if read-back is inconsistent, stop and create a recovery change;
9. report the final merge SHA and verified current state.

## Safety rules

- Never force-push or reset `main`.
- Never merge a failed or ambiguous candidate.
- Never reuse approval for a materially changed/superseded proposal without surfacing the changed scope.
- Never let approval override validation/coverage/freshness/migration blockers.
- Never create duplicate target-release branches/PRs; resume existing work.
- Retry transient idempotent operations at most twice and refetch state before retrying a write.
- Preserve unrelated concurrent repository changes.
- Official Hermes sources outrank summaries and chat history.
- Normal scheduled operation should use regular ChatGPT + GitHub/web tools; do not invoke Work mode or Codex unless explicitly requested.
