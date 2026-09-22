# Knowledge Health and Drift

Version 1.3 adds historical audit intelligence so the knowledge base can become stale even when Hermes does not publish a new release.

## Why release checks are not enough

A stable release can remain unchanged while documentation, security guidance, provider behavior, or high-change architecture areas evolve. The knowledge base therefore tracks two independent dimensions:

1. **release compatibility** — what stable Hermes release the guidance targets;
2. **knowledge freshness** — how recently each capability was reverified against its primary sources.

## Capability freshness

Every capability in `compatibility/hermes-compatibility.json` has `last_verified_on`.

`compatibility/freshness-policy.json` converts the strictest source priority for that capability into a maximum verification age:

- critical: 14 days
- high: 28 days
- medium: 56 days
- low: 90 days

At 75% of the maximum age the capability becomes `due_soon`; after the maximum age it becomes `stale`.

The policy values are control parameters, not claims about Hermes itself. Change them only deliberately and keep regression tests aligned.

## Weekly audit history

Every scheduled audit creates a structured snapshot under:

`research/audits/YYYY-MM-DD.json`

The index at `research/audits/index.json` points to the latest snapshot and provides an append-only audit ledger.

Routine snapshots are operational evidence. They do **not** require a semantic skill version bump unless the knowledge/control logic itself changes.

## Health engine

Run:

```bash
python maintenance/health_engine.py --as-of YYYY-MM-DD
```

The engine reports:

- overall knowledge-health score
- health state: `healthy | watch | degraded | critical`
- per-capability priority, age, freshness, and score
- weekly-audit freshness
- drift signals

## Drift signals

Current deterministic drift signals include:

- `needs_revalidation`
- `pending_upgrade`
- `release_baseline_mismatch`
- `audit_stale`
- `critical_capability_stale`

These signals can cap the overall score so a high average cannot hide a serious control failure.

## Health score interpretation

- **healthy**: score >= 90
- **watch**: 75-89.9
- **degraded**: 50-74.9
- **critical**: below 50

The score is a maintenance-control indicator, not a probability that a factual claim is correct.

## Historical comparison

When a weekly audit completes:

1. append the new snapshot;
2. update the audit index;
3. update `last_verified_on` only for capabilities whose required sources were actually checked sufficiently to reverify them;
4. run the health engine using the audit date;
5. compare health/drift with the prior snapshot/report;
6. surface newly stale, newly recovered, or newly revalidation-required capabilities in the weekly TL;DR.
