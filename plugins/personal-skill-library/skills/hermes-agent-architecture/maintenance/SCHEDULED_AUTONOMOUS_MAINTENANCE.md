# Scheduled Hermes Autonomous Maintenance Contract

This file is the canonical scheduled execution wrapper for Hermes maintenance when invoked by the GPT Git Scheduler.

Use normal ChatGPT chat tools plus connected GitHub/web access; do not use Work mode or Codex.

## Canonical inputs

Before acting, read:

- `.agents/skills/hermes-agent-architecture/maintenance/weekly-refresh-prompt.md`
- `.agents/skills/hermes-agent-architecture/maintenance/autonomous-upgrade-runbook.md`
- `.agents/skills/hermes-agent-architecture/maintenance/source-manifest.json`
- `.agents/skills/hermes-agent-architecture/compatibility/hermes-compatibility.json`
- `.agents/skills/hermes-agent-architecture/compatibility/upgrade-matrix.json`
- `docs/hermes-agent-architecture/manifest.json`
- `.agents/skills/project-knowledge-handoff/SKILL.md`

Treat those repository files as the maintenance contract, not chat history.

## Weekly audit

Always check:

- consumer dependency drift;
- knowledge freshness/health;
- official Hermes stable releases/tags;
- relevant primary sources.

Preserve release-vs-current-doc distinctions and record audit, health, and drift evidence.

## No material semantic change

If no material or ambiguous Hermes change exists:

- do not bump the semantic skill version;
- do not rewrite the master guide merely to create activity;
- use a safe branch/PR for any audit-history writes;
- verify CI;
- report a concise audit summary.

## Material change or stable release

If a new stable Hermes release or material semantic change exists, follow `autonomous-upgrade-runbook.md` Stage A end-to-end.

Requirements include:

- reuse an existing deterministic target-release branch/PR if present;
- never create a duplicate;
- verify official sources;
- classify release/consumer impact;
- patch the smallest justified canonical Hermes files;
- perform deterministic downstream consumer migrations when evidence is sufficient;
- update VERSION, CHANGELOG, compatibility, upgrade state, audit/health/impact/drift evidence when warranted;
- run all seven Hermes deterministic gates.

If the Hermes architecture skill semantic version changes, `project-knowledge-handoff` is mandatory:

- update `docs/hermes-agent-architecture/MASTER_GUIDE.md`;
- increment manifest guide revision/project version;
- create matching `history/MASTER_GUIDE_v<skill-version>.md`;
- validate guide/manifest;
- never leave a stale binary export marked current.

## Concurrency and safety

Before every write and immediately before any prospective merge:

- refetch current `main`;
- preserve unrelated concurrent changes;
- rebase/reconstruct safely;
- never force-push.

Keep the personal-skill-library mirror byte-identical with canonical `.agents/skills` and verify the repository-wide skill-library validator when relevant.

Never merge a stable-release/material semantic upgrade automatically.

If blocked by validation failure, ambiguity, unknown source/capability coverage, stale/critical knowledge, dependency drift, or unresolved high/critical consumer migration:

- leave the candidate unmerged;
- report the exact blocker.

If policy review is the only remaining gate:

- leave the PR ready for approval;
- notify the user with baseline -> target Hermes version, candidate skill version, severity, affected capabilities/consumers, migration summary, exact CI results, PR, rollback baseline SHA;
- include the exact phrase `Approve Hermes <target-release>`.

An unambiguous yes in that same notification thread may be treated as approval for that exact proposal; a fresh chat must resolve the pending proposal explicitly.

## After explicit approval

Resume Stage B from GitHub alone:

- write the durable approval record;
- finish and verify required consumer migrations;
- rerun affected/full gates and both Hermes/Handoff CI;
- recompute approval-aware promotion gate;
- merge only when knowledge promotion is `allow` and ecosystem compatibility is `cleared`;
- read back canonical `main` state.

If read-back is inconsistent, stop and create a non-destructive recovery change rather than claiming success.

Retry transient idempotent operations at most twice and refetch state before retrying uncertain writes.

Never reset or force-push `main`; Git history is the rollback anchor.

## Runtime reminder

After a verified GitHub upgrade completes, explicitly state whether the user's actual Hermes runtime installation may also need upgrading.

Do not claim the local Windows Hermes installation was updated unless a connected local-execution environment actually performed and verified it.

If a local runtime update is needed, hand off to the separate safe-update lifecycle:
- verified backup first;
- Hermes update;
- smoke-test important workflows/skills;
- retain pre-update backup for at least 7 days;
- never delete backup automatically.

Keep GitHub knowledge/control maintenance and physical runtime updating as separate verified states.
