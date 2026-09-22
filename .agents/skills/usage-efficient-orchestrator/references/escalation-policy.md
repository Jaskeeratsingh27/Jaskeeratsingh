# Escalation Policy

## Ladder

0. Luna low
1. Terra low
2. Terra medium
3. Terra high for bounded review/debugging
4. Sol medium
5. Primary Astra/Sol higher reasoning only after user approval when the turn is already expensive

Start at the lowest level appropriate to the task. Do not force every task through every level.

## Escalation requires evidence

Escalate only when at least one is true:
- the lower-cost worker reports a concrete capability/ambiguity blocker;
- two materially different low-cost implementation attempts failed;
- architecture spans multiple systems and cannot be safely decided locally;
- correctness/security risk justifies stronger reasoning;
- the user explicitly requests the higher tier.

Pass the failure summary and relevant evidence upward. Do not make the stronger model repeat discovery from zero.

## Mandatory user checkpoint

Return to the user before:
- a second major architecture attempt;
- Astra high/extra-high work;
- a broad migration after discovery;
- a second full-suite verification cycle;
- any continuation likely to push the turn beyond the 5% target;
- any plan expected to approach the 10% absolute ceiling.

## Stop report

Use:
- Completed:
- Remaining:
- Why stopped:
- Cheapest next action:
- Expected tier:
