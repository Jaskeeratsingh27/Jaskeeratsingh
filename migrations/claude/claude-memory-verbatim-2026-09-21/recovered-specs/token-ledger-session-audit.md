# Token Ledger / session-token-audit — recovered specification

Evidence level: verbatim Claude memory summary; original dashboard artifact and skill files absent.

## Purpose

Track model/session usage accurately enough to teach better usage habits, not merely display totals.

## Historical behavior recovered

- On-demand auditing was chosen over recurring scheduled audits because the audit itself could consume the allowance being protected.
- The audit skill read the current session/transcript for exact usage information available in that environment.
- The dashboard accumulated history plus an optimization playbook.
- Desired analysis included where usage went, model-choice coaching, prompt-level lessons, and budget/limit tracking.
- Accuracy/error avoidance was prioritized over rough estimates.

## Migration treatment

Preserve the product/UX intent, but do not assume ChatGPT or another runtime exposes the same token/usage telemetry Claude exposed historically. Any rebuild must use the active platform's supported usage APIs/settings/exports and label estimated values as estimates.
