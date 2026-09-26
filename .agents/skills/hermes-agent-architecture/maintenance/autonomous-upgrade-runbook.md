# Autonomous Hermes Upgrade Runbook

Status: CANONICAL TWO-STAGE UPGRADE LIFECYCLE

This runbook makes scheduled Hermes maintenance resumable, idempotent, approval-gated, and safe across chats. It does not promise that external services or upstream releases will never fail. Its guarantee is **fail closed**: never merge a partially validated or ambiguous upgrade.

## Goals

1. Weekly audits require no chat history.
2. A newly detected stable Hermes release can be fully analyzed and staged automatically.
3. The user receives one concise approval request only after the candidate upgrade is ready.
4. A simple affirmative reply in the same notification thread is sufficient approval.
5. A new chat can resume by finding the pending Hermes upgrade PR/proposal in GitHub.
6. Failed/ambiguous work stays off `main`.
7. Every semantic Hermes skill release updates the project handoff guide/manifest/history.
8. No duplicate branches/PRs are created for the same upstream target.
9. All unrelated concurrent GitHub work is preserved.

## State machine

```text
IDLE
 ↓
DETECTED
 ↓
PREPARING
 ↓
VALIDATING
 ├── blocker/ambiguity → BLOCKED
 ↓
READY_FOR_APPROVAL
 ↓ user approval
APPROVED
 ↓
FINAL_VALIDATION
 ├── failure → BLOCKED
 ↓
MERGE
 ↓
POST_MERGE_VERIFY
 ↓
COMPLETE
```

A newer stable Hermes release supersedes an older unmerged proposal. Never merge a proposal whose target is no longer the intended stable target without re-analysis.

## Stage A — scheduled preparation

### A0. Preflight and idempotency

Before writing anything:

1. Fetch current `main`, current skill `VERSION`, compatibility baseline, upgrade matrix, master-guide manifest, and open Hermes upgrade PRs.
2. Search for an existing branch/PR named for the target release. Resume it instead of creating a duplicate.
3. Record `baseline_main_sha` in the proposal.
4. Never force-push.
5. If `main` advances during preparation, compare/rebase the upgrade onto latest `main` and rerun validation.

### A1. Detect and verify

Use only official Hermes primary sources for the release/version decision.

- Verify the stable release/tag exists.
- Compare against `compatibility/upgrade-matrix.json.current_baseline`.
- Distinguish release behavior from current-main/docs behavior.
- If evidence is ambiguous or a source/capability is unknown, create a blocked proposal and stop. Do not guess.

### A2. Create the proposal branch

Branch convention:

`hermes-upgrade-<sanitized-upstream-tag>`

Proposal path on the branch:

`research/upgrade-proposals/<proposal-id>.json`

Create it against `maintenance/upgrade-proposal.schema.json`.

### A3. Perform the full candidate upgrade on the branch

Before asking the user for approval, stage the complete candidate when evidence is sufficient:

- update the smallest affected knowledge/reference files;
- update compatibility state and upgrade matrix;
- bump the Hermes architecture skill semantic version only when warranted;
- update `CHANGELOG.md`;
- update affected routing/contracts/tests when warranted;
- analyze consumer impact;
- update registered consumers only when a deterministic migration is clearly required and supported by evidence;
- if consumer migration is ambiguous, leave it blocked and report it rather than guessing;
- update audit, health, drift, change-event, impact, and consumer-impact evidence;
- update `research/PRODUCTION_READINESS.md` only if control/readiness semantics changed.

### A4. Project knowledge handoff is mandatory for semantic skill releases

Read and follow:

`.agents/skills/project-knowledge-handoff/SKILL.md`

When the Hermes architecture skill semantic version changes:

1. Update `docs/hermes-agent-architecture/MASTER_GUIDE.md`.
2. Increment the guide revision in `docs/hermes-agent-architecture/manifest.json`.
3. Set `project_version` to the new Hermes architecture skill version.
4. Create `docs/hermes-agent-architecture/history/MASTER_GUIDE_v<skill-version>.md`.
5. Set `source_commit` to the implementation commit that the guide documents.
6. Update current baseline/release/version history, automation flow, tests, file map, and limitations in the guide.
7. Derived DOCX/PDF exports are optional. Generate them only when artifact tooling is available and the source Markdown is current. If no current binary mirror is generated, set manifest `exports` to `[]`; never point the current manifest at a stale old-version export.
8. Preserve historical exports; do not overwrite them.
9. Run the project-knowledge-handoff guide validator.

This rule exists because v1.7 proved the skill could advance while the guide remained at v1.6.

### A5. Candidate validation

Run/verify all Hermes gates plus the handoff guide validation.

Hermes:
- structural/compatibility/history
- architecture regressions
- release-impact regressions
- health/drift regressions
- consumer-impact regressions
- consumer-dependency-drift regressions
- end-to-end hardening

Handoff:
- project-knowledge-handoff skill validation when its files changed
- Hermes `MASTER_GUIDE.md` + manifest validation

Use GitHub Actions results as the remote promotion evidence. Inspect individual job steps, not only the aggregate green badge.

### A6. Promotion decision before approval

Build the final promotion bundle with **no approval record**.

Expected safe state for an otherwise-ready stable release is usually `review_required`.

If state is `blocked`, do not ask for generic approval as if it could override the blocker. Report the exact blocker and what evidence/migration is needed.

If state is `review_required` only because of policy review, set proposal status `ready_for_approval`.

### A7. Approval notification

Notify the user only after the branch/PR is ready or genuinely blocked.

For ready proposals report:

- current → target upstream Hermes release;
- candidate skill version;
- severity;
- affected capabilities/consumers;
- migration summary;
- all validation results;
- PR;
- rollback baseline SHA;
- exact approval phrase.

Use:

`Approve Hermes <target-release>`

If the user replies an unambiguous **yes** in the same notification thread, treat it as approval for that proposal. In a different/new chat, require the explicit phrase or ask which pending proposal they mean.

## Stage B — approval continuation

Any chat can resume Stage B using GitHub alone.

### B0. Resolve the pending proposal

1. Search open PRs/branches for `hermes-upgrade-*`.
2. Read the proposal JSON.
3. Verify the target is still the intended stable release.
4. Verify the PR head and latest `main`; rebase safely if `main` advanced.
5. Never reuse approval for a materially changed or superseded proposal without surfacing the changed scope.

### B1. Record approval

Write:

`research/upgrade-proposals/<proposal-id>.approval.json`

conforming to `maintenance/approval-record.schema.json`.

Approval does **not** override:
- failed validation;
- ambiguous evidence;
- unknown source/capability coverage;
- critical/stale knowledge blockers;
- unresolved consumer dependency drift;
- unresolved high/critical consumer migrations.

### B2. Clear required consumer migrations

For blocking consumers:

- patch only the affected canonical consumer files;
- run their applicable tests/CI;
- record cleared consumer IDs only after migration verification;
- set `consumer_migrations_verified=true` only when every listed clearance is evidenced.

### B3. Final validation

Rerun every affected and full deterministic gate on the approved PR head.

Recompute:
- health;
- consumer drift;
- consumer impact;
- promotion gate with the approval record.

Merge only when:
- `knowledge_promotion.state == "allow"`;
- `ecosystem_compatibility.state == "cleared"`;
- all required GitHub Actions are successful;
- no newer upstream target superseded the proposal.

### B4. Merge and post-merge verification

Before merge record:
- pre-merge `main` SHA;
- approved PR head SHA.

Merge without force.

Then read back from `main`:
- skill `VERSION`;
- Hermes baseline/tag;
- upgrade matrix;
- master-guide manifest/project version;
- latest historical guide snapshot;
- affected consumer state;
- CI workflow files.

If read-back is inconsistent, stop and create a recovery change. Do not claim completion.

### B5. Rollback

Git history is the rollback anchor.

If a merged upgrade must be rolled back, create a normal recovery commit/PR restoring the pre-merge tree or the smallest known-good files. Never reset/force-push `main`.

## Retry policy

For transient GitHub/network/tool errors:
- retry at most 2 times when the operation is idempotent;
- refetch current state before retrying a write;
- never repeat a write blindly after an uncertain result;
- if state remains uncertain, stop and report the exact last verified SHA/PR/status.

## Concurrency policy

Before every write and immediately before merge:
- refetch `main`;
- compare with the branch base;
- preserve unrelated concurrent changes;
- rebase/reconstruct the candidate on latest `main`;
- rerun CI after rebase.

## What "standalone" means

The lifecycle is reconstructable from GitHub plus the scheduled task. It does not require the original development chat.

A fresh chat should be able to:
1. read the scheduler prompt/runbook;
2. find a pending proposal PR;
3. verify approval status;
4. resume the lifecycle safely.

## What cannot be guaranteed

No automation can guarantee zero errors from upstream outages, permission loss, API/tool changes, malformed external data, or unforeseen Hermes behavior. This system is designed to make those failures **visible, resumable, auditable, and non-destructive** rather than silently corrupting `main`.
