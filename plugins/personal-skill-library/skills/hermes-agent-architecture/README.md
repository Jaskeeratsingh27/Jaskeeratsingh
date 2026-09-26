# Hermes Agent Architecture Knowledge Skill

A production-oriented Hermes knowledge-base skill for designing persistent agents, subagents, workflows, instructions, contracts, tool boundaries, automation, security, observability, release compatibility, and knowledge freshness.

## Invocation

When installed in Hermes, invoke with:

`/hermes-agent-architecture <request>`

## Baseline

Research date: 2026-09-22.  
Latest stable release verified: Hermes Agent v0.21.4 (`v2026.9.21`).

## v1.7 Hermes v0.21.4 stable promotion

v1.7 is the first evidence-driven post-hardening knowledge update. It promotes Hermes Agent v0.21.4 (`v2026.9.21`) as the verified stable baseline and records targeted operational changes without altering the core primitive-selection model:

- host-wide gateway singleton/rendezvous behavior and Desktop attachment to the running host backend
- profile-scoped skill auto-loading for every new session
- bounded MCP discovery concurrency
- session-search time bounds and state-database journal-mode operations
- CLI `--format stream-json` programmatic JSONL output
- gateway unauthorized-DM `decline` behavior

The core guidance for Profiles, delegation, Kanban, model/provider routing, Cron, sandboxing, hooks/plugins, and observability remains structurally compatible after primary-source reverification.

## v1.6 final hardening and promotion-control layer

v1.6 is the final planned architecture-improvement release. It composes the earlier control layers into one end-to-end promotion/recovery model:

- `maintenance/promotion_gate.py` — deterministic final knowledge-promotion and ecosystem-compatibility decision.
- `tests/hardening-scenarios.json` — realistic upgrade/failure/recovery scenarios.
- `tests/test_end_to_end_hardening.py` — full control-chain simulation across release impact, consumer impact, health, drift, validation, and recovery.
- `references/18-promotion-recovery.md` — final promotion and recovery policy.
- `research/PRODUCTION_READINESS.md` — production-readiness scope, invariants, and post-v1.6 policy.

After v1.6, new semantic versions should be driven by real Hermes changes, weekly-audit defects, security requirements, or actual consumer needs—not by speculative architecture expansion.

## v1.5 consumer dependency drift layer

v1.5 protects the v1.4 consumer registry from becoming stale:

- `consumers/detection-rules.json` — high-confidence candidate and capability evidence rules.
- `evidence_assertions` on each registered consumer — explicit proof anchors for declared dependencies.
- `maintenance/consumer_drift.py` — detects new candidate consumers, undeclared capability use, and missing registered evidence.
- `research/consumer-drift/` — append-only weekly dependency-drift history.
- `tests/test_consumer_drift.py` — canonical zero-drift plus synthetic drift regressions.
- `references/17-consumer-dependency-drift.md` — operating and review policy.

The detector never auto-registers or auto-removes a consumer. It raises a review finding so registry changes remain evidence-backed.

## v1.4 consumer-impact layer

v1.4 adds downstream dependency intelligence on top of the v1.3 health/drift layer:

- `consumers/registry.json` — explicit active canonical Hermes consumers.
- `maintenance/consumer-registry.schema.json` — registry contract.
- `maintenance/consumer_impact.py` — maps affected Hermes capabilities to real consumers.
- `tests/consumer-impact-cases.json` and `tests/test_consumer_impact.py` — deterministic downstream-impact regressions.
- `references/16-consumer-impact.md` — registration, review, and migration policy.

The initial active registry contains `hermes-agent-creator` and the Hermes-specific adaptation in `kaizen-orchestrator`. Historical migrations and `.claude` mirrors are deliberately excluded from live dependency alerts.

Consumer impact does not automatically rewrite downstream agents. It produces explicit advisory, targeted-review, compatibility-review, or migration-review work and can block compatibility clearance for high-criticality consumers.

## v1.3 historical health and drift layer

v1.3 adds continuous knowledge-quality monitoring on top of the v1.2 release-impact engine:

- `compatibility/freshness-policy.json` — age thresholds by primary-source criticality.
- per-capability `last_verified_on` fields in the compatibility manifest.
- `maintenance/audit-snapshot.schema.json` — structured weekly audit history contract.
- `maintenance/health_engine.py` — deterministic capability freshness, audit freshness, health scoring, and drift signals.
- `research/audits/` — append-only weekly audit snapshots.
- `research/health/` — historical knowledge-health reports.
- `tests/health-drift-cases.json` and `tests/test_health_drift.py` — deterministic aging/drift regressions.
- `references/15-knowledge-health-drift.md` — maintenance model and interpretation.

Current policy revalidation ages are:

- critical sources: 14 days
- high: 28 days
- medium: 56 days
- low: 90 days

These are maintenance-control thresholds, not Hermes product claims.

## Health states

The deterministic health engine reports:

- `healthy`: score >= 90
- `watch`: 75–89.9
- `degraded`: 50–74.9
- `critical`: below 50

The score combines capability freshness/status and audit cadence, with safety caps for serious drift conditions such as unresolved revalidation, pending upgrades, stale audits, stale critical capabilities, or release-baseline mismatch.

## Maintenance

- Source inventory: `maintenance/source-manifest.json`
- Weekly audit contract: `maintenance/weekly-refresh-spec.md`
- Weekly execution prompt: `maintenance/weekly-refresh-prompt.md`
- Release impact: `python maintenance/impact_engine.py <event.json> --pretty`
- Knowledge health: `python maintenance/health_engine.py --as-of YYYY-MM-DD`

Canonical promotion gates:

```bash
python tests/validate_skill.py
python tests/test_architecture_regressions.py
python tests/test_release_impact.py
python tests/test_health_drift.py
python tests/test_consumer_impact.py
python tests/test_consumer_drift.py
python tests/test_end_to_end_hardening.py
```

Routine audit and health snapshots are historical operating evidence and can be committed without bumping the semantic skill version. Semantic version changes are reserved for knowledge or control-logic changes.
