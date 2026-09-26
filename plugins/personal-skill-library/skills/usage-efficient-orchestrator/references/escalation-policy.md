# Escalation Policy

## Ladder

0. direct cheap action
1. cheap_reader
2. standard_engineer
3. reviewer for independent verification
4. senior_specialist
5. architect higher reasoning only after explicit budget/risk justification

Start at the lowest capable level. Do not force every task through every level.

## Escalation requires a classified failure

Use `failure-taxonomy.md`.

Senior escalation is appropriate primarily for:
- implementation failure after the profile allows a retry;
- architecture/integration complexity identified with evidence;
- high-risk correctness ambiguity requiring stronger reasoning.

Senior escalation is not appropriate for:
- missing information;
- permissions;
- user approval;
- network/runtime outages;
- stale/flaky fixtures before validation.

## Mandatory user checkpoint

Return to the user before:
- any step that would exceed the selected profile target;
- economy-profile senior escalation;
- architect high/extra-high reasoning;
- CRITICAL-risk execution;
- a broad migration after discovery;
- another full-suite run beyond the profile limit;
- architecture/scope change outside the Task Envelope.

## Stop report

Use:
- Completed:
- Remaining:
- Failure class:
- Risk:
- Why stopped:
- Cheapest next action:
- Expected role:
- Validation status:
