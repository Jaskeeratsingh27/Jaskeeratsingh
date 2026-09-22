# Orchestrator v1.2.0 Reliability Validation

Status: release candidate branch `orchestrator-v1.2.0`

## Scope

v1.2 validates the reliability of the orchestration control plane itself.

The QA gate runs four suites:

1. structural/policy validation;
2. deterministic routing-policy evaluation;
3. security/sandbox/config validation;
4. release/version consistency validation.

## Reliability features under test

- canonical manifest and semantic version consistency;
- GitHub Actions CI;
- safe global status/drift detection;
- dry-run global sync;
- backup-before-replace behavior;
- refusal to silently overwrite an unrecognized existing global `[agents]` table;
- secret scanning;
- sandbox-mode invariants;
- max-concurrency safety;
- 24 routing/reliability scenarios;
- single-writer, risk, escalation, and test-conservation invariants.

## Accuracy boundary

Passing v1.2 means the deterministic reliability rules are internally consistent.

It does not yet prove real-world Work/Codex percentage savings or live model-routing success rates. Those require v1.3 observability and v1.4 usage-intelligence data.

## Acceptance

Do not promote unless:

```bash
node scripts/orchestrator-qa.mjs
```

returns all suites green and CI on the release-candidate PR is green.
