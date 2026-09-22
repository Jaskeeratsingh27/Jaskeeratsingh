# Orchestrator v1.1.0 Validation Plan

Status: release candidate branch

## What this validation can prove

The deterministic validator checks:
- required policy/config/reference files exist;
- the v1.1.0 version is consistently declared;
- single-writer policy exists;
- configured proxy budgets exist;
- required logical capability roles exist;
- failure taxonomy is complete;
- structured handoff fields exist;
- scenario fixtures respect writer/risk/escalation invariants.

## What this validation cannot yet prove

It cannot prove:
- exact weekly percentage savings;
- real model routing accuracy under live Codex execution;
- predicted allowance consumption;
- real-world completion quality for every task class.

Those require the v1.3-v1.4 telemetry/feedback stages.

## Acceptance gate

v1.1.0 is acceptable for promotion only if:
1. deterministic validator passes 100%;
2. all 12 routing fixtures are internally consistent;
3. no shared-tree scenario permits >1 writer;
4. HIGH/CRITICAL risk cases preserve review/approval gates;
5. no permission/tooling failure is escalated merely by increasing model strength.

Run:

```bash
node scripts/validate-orchestrator.mjs
```
