# Usage-Efficient Codex Orchestrator

Version: 1.3.0

GitHub is the canonical source for the orchestration policy.

## Runtime architecture

Primary supervisor
-> Task Envelope
-> privacy-preserving telemetry start
-> cheap read-only discovery where needed
-> one standard writer
-> independent review when risk requires it
-> senior escalation only with evidence
-> targeted validation
-> measured checkpoint when available
-> telemetry finish
-> compact report

## Usage profiles

- economy: target <=3 percentage points, ceiling <=5.
- balanced: target <=5, ceiling <=10.
- quality-critical: target <=5, ceiling <=10 with stronger assurance.

If live usage is unavailable, the system uses enforceable proxy counters and never fabricates a percentage.

## Observability

Local ledger:

`~/.codex/orchestrator/telemetry/events.jsonl`

The ledger stores structured metadata only. Prompts, source code, file contents, secrets, and raw tool output are intentionally excluded.

Useful commands after global sync:

```bash
node ~/.agents/skills/usage-efficient-orchestrator/scripts/telemetry.mjs report --days 7
node ~/.agents/skills/usage-efficient-orchestrator/scripts/telemetry.mjs export --days 7 --out /tmp/tokentrack-orchestrator.json
node ~/.agents/skills/usage-efficient-orchestrator/scripts/telemetry.mjs prune
```

Measured allowance burn is reported only for tasks that have real before/after remaining-percentage checkpoints.

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
- v2.0 closed-loop orchestrator
