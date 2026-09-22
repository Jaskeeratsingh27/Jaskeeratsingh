# Usage-Efficient Codex Orchestrator

Version: 1.5.0

GitHub is the canonical source for the orchestration policy.

## Runtime architecture

Primary supervisor
-> Task Envelope
-> usage-intelligence budget gate
-> adaptive-routing shadow evaluation
-> privacy-preserving telemetry start
-> cheap read-only discovery where needed
-> one standard writer
-> independent review when risk requires it
-> senior escalation only with evidence
-> targeted validation
-> measured checkpoint when available
-> telemetry finish
-> calibration/routing history for future tasks

## Usage profiles

- economy: target <=3 percentage points, ceiling <=5.
- balanced: target <=5, ceiling <=10.
- quality-critical: target <=5, ceiling <=10 with stronger assurance.

If live usage is unavailable, proxy counters remain enforceable. Historical predictions never replace the proxy stop-loss.

## Usage Intelligence

```bash
node ~/.agents/skills/usage-efficient-orchestrator/scripts/usage-intelligence.mjs predict \
  --complexity MEDIUM --risk MEDIUM --profile balanced --json
```

The estimator uses measured tasks only, chooses the narrowest sufficiently populated historical cohort, and reports p25/median/p90 empirical bands.

## Adaptive Routing

v1.5 adds a second decision layer after the usage budget gate.

```bash
node ~/.agents/skills/usage-efficient-orchestrator/scripts/adaptive-routing.mjs recommend \
  --task-kind implementation \
  --complexity MEDIUM \
  --risk MEDIUM \
  --profile balanced \
  --json
```

Default mode is `shadow`.

The router:
- selects the canonical baseline route;
- compares known route templates inside the narrowest adequately sampled historical cohort;
- requires minimum task and measured-burn samples;
- requires success/validation quality floors;
- requires both absolute and relative p90 burn improvement;
- preserves HIGH-risk reviewer coverage;
- preserves CRITICAL/LARGE plan-only behavior;
- never proposes senior-specialist routes as cheaper initial routes;
- suppresses active adaptation on drift/weak calibration;
- requires explicit canonical approval before any active route replacement.

Example decisions:
- `candidate_lower_burn`
- `quality_floor`
- `risk_floor`
- `insufficient_data`
- `drift_suppressed`
- `manual_approval_required`

Historical route evidence is observational. A lower historical burn does not prove causal superiority.

## Shadow analysis

```bash
node ~/.agents/skills/usage-efficient-orchestrator/scripts/adaptive-routing.mjs shadow --days 56 --json
node ~/.agents/skills/usage-efficient-orchestrator/scripts/adaptive-routing.mjs analyze --days 56 --json
```

Shadow mode collects evidence without silently changing execution policy.

## Observability

Local ledger:

`~/.codex/orchestrator/telemetry/events.jsonl`

New v1.5 metadata includes:
- task_kind;
- baseline route;
- candidate route;
- decision mode;
- controlled routing decision;
- evidence sample count;
- estimated p90 savings.

Prompts, source code, file contents, secrets, raw tool output, and full paths remain excluded.

## Reliability

```bash
node scripts/orchestrator-qa.mjs
node scripts/orchestrator-status.mjs
node scripts/orchestrator-sync.mjs --dry-run
node scripts/orchestrator-sync.mjs
```

## Roadmap

- v1.0 foundation
- v1.1 control plane
- v1.2 reliability
- v1.3 observability
- v1.4 usage intelligence
- v1.5 adaptive routing
- v1.6-v1.9 final hardening/evaluations
- v2.0 closed-loop orchestrator
