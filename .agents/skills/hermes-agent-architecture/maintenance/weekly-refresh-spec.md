# Weekly Hermes Knowledge Refresh Specification

Status: ACTIVE MAINTENANCE CONTRACT. The canonical skill has an external ChatGPT scheduled audit every Tuesday at 02:00 America/Winnipeg.

## Objective

Keep the Hermes Agent architecture knowledge base synchronized with official releases/documentation while preserving historical evidence of what was checked, how fresh each capability is, and whether the knowledge base is drifting.

## Cadence

Weekly. The external scheduler runs Tuesday at 02:00 America/Winnipeg using regular ChatGPT chat with web/GitHub access rather than Work/Codex unless the user explicitly changes that policy.

## Primary sources

Use `maintenance/source-manifest.json` as the machine-readable source inventory and `references/13-source-index.md` as the human-readable index.

## v1.3 control flow

```text
prior health + freshness state
        ↓
official-source audit
        ↓
structured change event(s)
        ↓
release-impact engine
        ↓
smallest justified patch
        ↓
capability revalidation dates/status
        ↓
historical audit snapshot
        ↓
knowledge-health engine
        ↓
health-history snapshot
        ↓
4 deterministic CI gates
        ↓
reviewed promotion when required
```

## Historical audit policy

Every weekly run creates an audit snapshot under `research/audits/YYYY-MM-DD.json` and updates `research/audits/index.json`, even when no Hermes knowledge changed.

The snapshot records:

- observed Hermes release/tag
- source IDs actually checked
- change-event IDs
- highest severity
- per-capability status and reverification date
- deterministic validation status
- notes

Audit snapshots are operating evidence and do not by themselves require a semantic version bump.

## Freshness policy

Each capability has `last_verified_on`. The strictest priority among its primary sources determines its maximum verification age through `compatibility/freshness-policy.json`.

Current control thresholds:

- critical source capability: 14 days
- high: 28 days
- medium: 56 days
- low: 90 days
- due-soon begins at 75% of maximum age

A scheduled audit should prioritize due-soon and stale capabilities.

## Health and drift

After the audit and any canonical edits, run `maintenance/health_engine.py` and persist the report under `research/health/YYYY-MM-DD.json`. Update `research/health/index.json`.

The health model combines:

- capability verification status
- capability freshness
- source criticality weighting
- weekly-audit freshness
- unresolved revalidation
- pending upgrade state
- observed-release vs compatibility-baseline drift

Health states:

- `healthy`: >= 90
- `watch`: 75–89.9
- `degraded`: 50–74.9
- `critical`: < 50

The score is a maintenance-control metric, not a factual-accuracy probability.

## Semantic version policy

Bump the skill version only when:

- canonical Hermes knowledge changes materially;
- architecture/control logic changes;
- contracts, routing rules, schemas, or maintenance semantics change.

Do **not** bump the semantic version solely for routine weekly audit snapshots, health reports, or verification-date refreshes.

## Release-impact workflow

For material/ambiguous changes:

1. create a change event;
2. run `maintenance/impact_engine.py`;
3. use `compatibility/impact-map.json` to compute blast radius;
4. patch only justified files;
5. update compatibility/upgrade state;
6. run targeted analysis plus full deterministic CI.

## Required deterministic gates

- structural/compatibility/history validation
- architecture regression validation
- release-impact regression validation
- health/drift regression validation

## Promotion policy

Branch/PR review is mandatory for:

- every stable-release transition
- every major/critical impact
- ambiguous evidence
- unknown source/capability mappings
- breaking/architecture changes
- security changes

## Acceptance criteria

A weekly refresh is complete only if:

- source checks are recorded;
- material/ambiguous changes have structured change events;
- impact classification was performed before canonical edits;
- capability verification dates reflect actual reverification;
- an audit snapshot was appended;
- a health report was appended;
- health/drift delta was reported;
- compatibility and upgrade state reflect verified knowledge;
- all four deterministic validation suites pass;
- required GitHub review/promotion rules were followed.
