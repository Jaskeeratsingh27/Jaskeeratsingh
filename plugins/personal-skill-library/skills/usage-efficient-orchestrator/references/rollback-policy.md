# Rollback & Recovery Policy

## Last known good

The release-state file records an immutable last-known-good commit.

For this hardening candidate, the rollback target is the approved v1.5.0 main commit.

## Rules

- Do not use destructive `git reset --hard` automatically.
- Do not rewrite history automatically.
- Preserve unrelated concurrent repository work.
- Prefer a new revert/recovery branch or an explicit revert commit after user approval.
- If main advanced concurrently, reconcile/rebase the candidate and rerun the complete orchestrator QA suite before promotion.
- If telemetry is malformed, recover by ignoring invalid lines; do not delete the ledger automatically.
- If adaptive routing behaves unexpectedly, fail back to canonical baseline routing and shadow mode.
- If usage prediction fails, fail back to proxy budget controls.
- If any security/permission invariant fails, block promotion or active routing.

## Recovery order

1. Disable active/canary routing.
2. Return to canonical baseline route templates.
3. Fall back from predictions to proxy budget controls if needed.
4. Preserve telemetry for diagnosis unless it contains sensitive data.
5. Restore code using the immutable last-known-good commit only after explicit repository rollback approval.
6. Rerun unified QA and CI before treating recovery as complete.
