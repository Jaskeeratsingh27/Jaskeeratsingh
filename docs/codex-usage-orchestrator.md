# Usage-Efficient Codex Orchestrator

Version: 1.4.0

GitHub is the canonical source for the orchestration policy.

## Runtime architecture

Primary supervisor
-> Task Envelope
-> historical usage-intelligence gate
-> privacy-preserving telemetry start
-> cheap read-only discovery where needed
-> one standard writer
-> independent review when risk requires it
-> senior escalation only with evidence
-> targeted validation
-> measured checkpoint when available
-> telemetry finish
-> calibration history for future tasks

## Usage profiles

- economy: target <=3 percentage points, ceiling <=5.
- balanced: target <=5, ceiling <=10.
- quality-critical: target <=5, ceiling <=10 with stronger assurance.

If live usage is unavailable, proxy counters remain enforceable. Historical predictions never replace the proxy stop-loss.

## Usage Intelligence

After global sync:

```bash
node ~/.agents/skills/usage-efficient-orchestrator/scripts/usage-intelligence.mjs predict \
  --complexity MEDIUM --risk MEDIUM --profile balanced --json
```

With a real current remaining percentage:

```bash
node ~/.agents/skills/usage-efficient-orchestrator/scripts/usage-intelligence.mjs predict \
  --complexity MEDIUM --risk MEDIUM --profile balanced --baseline 60 --json
```

Historical analysis:

```bash
node ~/.agents/skills/usage-efficient-orchestrator/scripts/usage-intelligence.mjs analyze --days 56 --json
node ~/.agents/skills/usage-efficient-orchestrator/scripts/usage-intelligence.mjs backtest --days 56
```

The estimator uses measured tasks only, chooses the narrowest sufficiently populated historical cohort, and reports p25/median/p90 empirical bands.

Gate meanings:
- proxy_only
- proceed_with_proxy_guards
- proceed
- approval_required
- split_required
- plan_only

These are control decisions based on historical evidence, not guarantees of future account usage.

## Observability

Local ledger:

`~/.codex/orchestrator/telemetry/events.jsonl`

Prompts, source code, file contents, secrets, and raw tool output are excluded.

New telemetry events record the orchestrator version to support drift/calibration analysis.

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
- v1.4 usage intelligence and calibrated burn estimation
- v1.5 adaptive routing
- v1.6-v1.9 hardening/evaluations
- v2.0 closed-loop orchestrator
