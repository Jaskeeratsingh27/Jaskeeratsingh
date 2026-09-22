# Usage-Efficient Orchestrator v1.2.0 - Reliability Report

Date: 2026-09-21
Branch: orchestrator-v1.2.0
PR: #2
Status: Release candidate awaiting user approval

## TL;DR

- v1.1.0 was promoted to main after approval.
- v1.2.0 Reliability is implemented on an isolated release branch.
- Repository-state validation: **119/119 deterministic checks passed**.
- Routing/reliability scenarios: **24/24 valid**.
- High-confidence secret scan: **30 orchestrator-managed files scanned, 0 hits**.
- Shared-tree writer safety, risk gates, escalation rules, drift/sync behavior, sandbox modes, release consistency, and CI configuration all passed deterministic inspection.
- GitHub Actions workflow is present, but a runtime Actions result was not surfaced through the connector for this PR/commit, so CI runtime execution is **not yet independently confirmed**.

## v1.2 features

- Unified QA runner: `node scripts/orchestrator-qa.mjs`
- GitHub Actions CI workflow
- Canonical manifest/version registry
- Global drift/status detector
- Safe global sync with `--dry-run`
- Backup-before-replace behavior
- Refusal to silently overwrite an unrecognized existing global `[agents]` table
- Security scanner for high-confidence credentials
- Sandbox/config safety validation
- Release/version consistency checks
- Routing suite expanded from 12 to 24 scenarios
- Deterministic policy evaluator
- Reliability-gated release process

## Validation summary

### Structural/release
25/25 passed.

### Routing-policy scenarios
68/68 invariant checks passed across 24 scenarios.

### Reliability/security static checks
26/26 passed after direct inspection of the dry-run guard.

### Secret scan
30 files scanned, 0 high-confidence credential hits.

Total deterministic repository-state checks: **119/119 passed**.

## Accuracy boundary

This release validates reliability and policy consistency. It does not yet prove:
- exact weekly Work/Codex percentage savings;
- live model-routing success rate;
- predicted task burn accuracy;
- measured cost/performance improvements.

Those require v1.3 Observability and v1.4 Usage Intelligence.

## Known limitation before promotion

The new GitHub Actions workflow is committed to the v1.2 branch, but no PR-triggered run/status was returned by the available GitHub connector for the latest commit. The workflow definition itself passed static validation. Runtime CI should be treated as unconfirmed until GitHub surfaces a run.

## Recommendation

v1.2.0 is ready for user review. Do not merge PR #2 until the user approves.
