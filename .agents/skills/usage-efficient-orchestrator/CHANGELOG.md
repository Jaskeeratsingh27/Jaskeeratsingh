# Changelog

## 1.2.0 - 2026-09-21

Reliability release candidate.

- Added a unified QA runner for orchestrator releases.
- Added GitHub Actions CI for orchestrator policy/config changes.
- Added canonical manifest and version consistency checks.
- Added global install drift detection.
- Added safe one-command global sync with dry-run and backups.
- Added high-confidence secret scanning and sandbox/config safety checks.
- Expanded routing/reliability scenario coverage from 12 to 24 cases.
- Added deterministic routing-policy evaluation.
- Added release-consistency validation.
- Added reliability documentation and release report requirements.

## 1.1.0 - 2026-09-21

Control-plane hardening release.

- Added mandatory structured Task Envelope.
- Added budget profiles: economy, balanced, quality-critical.
- Added enforceable proxy counters for sessions without live usage data.
- Added risk classification independent of task complexity.
- Added single-writer rule for shared working trees.
- Added capability-role registry so policy is separated from model names.
- Added failure taxonomy to prevent unnecessary model escalation.
- Added structured worker handoff contract.
- Added deterministic validation suite and routing scenarios.
- Added approval-first branch workflow for medium/large orchestrator changes.

## 1.0.0 - 2026-09-21

Initial version-controlled release of the usage-efficient Codex orchestration policy.
