# Changelog

## 1.8.0 — 2026-09-25

- Added a canonical two-stage autonomous Hermes upgrade lifecycle: scheduled preparation followed by explicit approval-gated promotion.
- Added machine-readable upgrade-proposal and approval-record schemas so pending upgrades can be resumed safely from any chat using GitHub alone.
- Extended the promotion gate so explicit approval can satisfy policy-review requirements but can never override failed validation, ambiguity, unknown coverage, stale/critical health, registry drift, or unresolved consumer migrations.
- Added verified consumer-clearance semantics for high/critical downstream migrations.
- Expanded end-to-end hardening scenarios to cover approved stable upgrades and security upgrades with/without verified consumer clearance.
- Made project-knowledge-handoff mandatory for every semantic Hermes architecture skill release.
- Added idempotent branch/PR conventions, retry limits, concurrency/rebase rules, superseded-release handling, post-merge read-back verification, and non-destructive rollback guidance.
- Established that scheduled maintenance should prepare a fully validated candidate PR before asking for approval, minimizing the user action to one approval decision when no blockers remain.
- Corrected the previously observed continuity defect where v1.7.0 advanced the skill while the canonical master guide remained at v1.6.0.


## 1.7.0 — 2026-09-22

- Promoted the verified stable Hermes baseline from v0.21.3 (`v2026.9.14`) to v0.21.4 (`v2026.9.21`).
- Recorded v0.21.4 gateway/Profile/Bot deployment ownership: host-wide gateway singleton/rendezvous behavior and Desktop attachment to the running host backend.
- Documented profile-scoped `skills.auto_load`, bounded MCP discovery concurrency, session-search time bounds, state-database journal-mode operations, CLI `--format stream-json`, and gateway unauthorized-DM `decline`.
- Reverified the canonical Profile, Bot, delegation, structured-output, Kanban, skills/context/SOUL, memory, tools/MCP, execute_code, model-routing, Cron, security/checkpoint, plugin/hook, observability, persistence, and deployment guidance against official primary sources.
- Preserved release-vs-current-doc distinctions because v0.21.4 is a patch roll-up and upstream defers full curated notes for the release window to v0.22.0.
- Added the 2026-09-22 audit, change-event, consumer-impact, consumer-drift, and health evidence for the stable-release promotion.
- Updated date-sensitive health/hardening regression fixtures to the new verified baseline date.

## 1.6.0 — 2026-09-21

- Added a deterministic promotion gate that separates canonical knowledge-promotion status from downstream ecosystem-compatibility status.
- Added explicit `allow`, `review_required`, and `blocked` decision semantics with concrete blockers/review reasons.
- Added nine end-to-end hardening simulations covering clean operation, stable Hermes upgrade, critical security change, ambiguous documentation, unknown subsystem, stale audits, consumer-registry drift, CI failure, and successful recovery.
- Added a seventh GitHub CI gate for end-to-end hardening.
- Added final promotion/recovery guidance and a production-readiness report.
- Corrected maintenance-spec documentation drift left from earlier versions, including obsolete v1.3/4-gate labels after the system had reached six gates.
- Updated weekly maintenance to compute a final promotion bundle after audit, impact, consumer, health, dependency-drift, and validation work.
- Established the post-v1.6 policy: stop speculative architecture expansion and make future semantic versions evidence-driven.


## 1.5.0 — 2026-09-21

- Added evidence assertions to every active Hermes consumer in the canonical registry.
- Added conservative capability/candidate detection rules for active canonical skills.
- Added deterministic consumer dependency drift detection for candidate unregistered consumers, undeclared Hermes capability use, missing registered evidence, and declared capabilities without surviving evidence.
- Added append-only consumer-drift history with a clean v1.5 baseline snapshot.
- Baseline drift analysis found and corrected a missing `memory` dependency for the Hermes adaptation of `kaizen-orchestrator`.
- Added synthetic and canonical zero-drift regression tests.
- Added a sixth GitHub CI gate for consumer dependency drift.
- Updated weekly maintenance to scan repository-side dependency drift even when Hermes itself has not changed.
- Established a no-auto-register/no-auto-remove policy: text evidence creates review findings, not automatic production dependency mutations.

## 1.4.0 — 2026-09-21

- Added an explicit registry of active canonical repository consumers that depend on Hermes capabilities.
- Seeded evidence-backed consumer mappings for `hermes-agent-creator` and the Hermes adaptation of `kaizen-orchestrator`.
- Added deterministic consumer-impact analysis that maps affected Hermes capabilities to real downstream skills/projects and their canonical paths.
- Added review actions: advisory, targeted review, compatibility review, and migration review.
- Added blocking consumer-compatibility clearance for major/critical impacts affecting high/critical consumers.
- Added consumer-registry schema and structural validation that rejects missing paths, unknown capability IDs, duplicate consumers, and archived/mirror paths as active canonical dependencies.
- Added consumer-impact regression fixtures covering delegation, Kanban, Cron, security, and unknown-subsystem coverage gaps.
- Added a fifth GitHub CI gate for consumer-impact regressions.
- Updated weekly maintenance to run consumer-impact analysis after Hermes release-impact classification and report downstream migration/review work without silently editing unrelated consumers.

## 1.3.0 — 2026-09-21

- Added per-capability verification dates and source-priority freshness thresholds.
- Added deterministic knowledge-health scoring and drift detection.
- Added weekly audit snapshot schema plus append-only audit-history index.
- Added historical knowledge-health reports and health-history index.
- Added drift signals for unresolved revalidation, pending upgrades, release-baseline mismatch, stale audits, and stale critical capabilities.
- Added health/drift regression fixtures covering time aging and control-plane drift.
- Expanded structural validation to cross-check freshness policy, verification dates, audit history, health history, and new control files.
- Added a fourth GitHub CI gate for knowledge-health and drift regressions.
- Updated weekly maintenance so every audit records history and health even when no Hermes knowledge changes.
- Established that routine audit/health telemetry does not by itself require a semantic skill version bump.

## 1.2.0 — 2026-09-21

- Added deterministic release-impact classification, capability blast-radius mapping, stable-release upgrade tracking, structured change events, targeted regression selection, and release-impact CI.

## 1.1.0 — 2026-09-21

- Added machine-readable compatibility state, primitive-routing decisions, architecture regressions, and dedicated GitHub CI.

## 1.0.0 — 2026-09-21

- Initial Hermes Agent architecture knowledge-base skill with primary-source research, templates, maintenance contract, and deterministic structural validation.
