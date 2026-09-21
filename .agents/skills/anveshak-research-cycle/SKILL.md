---
name: anveshak-research-cycle
description: Operate a gated research-to-Obsidian cycle that researches recent AI engineering and agent-architecture material, stages a small high-quality batch under the vault system area, waits for explicit checkbox approval, then integrates locally with rollback support. Use when the user asks for Anveshak, a recurring research-to-vault cycle, staged research notes, REVIEW.md approval, vault integration, rollback, or status. Verify the local Anveshak assets before claiming execution because the original runtime code was not present in the Claude export.
---

# Anveshak Research Cycle

Recovered from Claude persistent project memory. This is an **orchestration contract**, not a copy of the original runtime package: the export did not include `anveshak.py`, `RUNBOOK.md`, `config.json`, `sources.json`, or its state directory.

## Preflight

Before executing the historical local workflow, locate the active vault's `_System/anveshak/` directory and verify these assets exist:

- `RUNBOOK.md` — operating contract; read first;
- `anveshak.py` — local command entry point;
- `config.json` — includes the canonical tag vocabulary;
- `sources.json` — research lanes/source configuration;
- the expected state/staging directories.

If they are absent, stop execution and produce a reconstruction plan instead of claiming that Anveshak ran.

## Cycle

1. **Context first.** Run the local context operation before research so the cycle knows existing note titles, canonical tags, URLs already seen, lanes, and historical keep rates.
2. **Research.** Default recovered scope is recent **AI engineering and agent architecture** material. Prefer a high evidence bar over volume.
3. **Stage only.** Prepare roughly 3–5 candidate notes per cycle in the Anveshak system staging area. Staged notes must remain invisible to normal vault indexing until approved.
4. **Review gate.** Integration is blocked until the user explicitly ticks `- [x] **Add to vault**` in `REVIEW.md`. A scheduler may research and stage; it must not integrate.
5. **Integrate locally.** After approval, use a dry run when practical, then integrate through the local tool rather than hand-writing around its ledger/rollback controls.
6. **Verify.** Run status/index validation after integration and record the resulting batch/receipt.
7. **Rollback.** If integration is wrong, use the batch rollback path rather than manually undoing managed backlinks.

## Invariants

- Never write outside the Anveshak staging/system area before approval.
- Never invent a canonical tag. New tags require explicit approval.
- `connects_to` targets must be exact existing note titles; unresolved titles are not silently promoted into new notes.
- Preserve researcher-proposed connections separately from deterministic similarity/linking logic.
- Managed backlinks must remain reversible and isolated in their designated managed block.
- Do not hard-code the historical UTC cron into a new environment. Reconfirm local timezone and desired cadence when scheduling.

## Recovery mode

When the original runtime package is unavailable, produce: required files, schemas/interfaces, state transitions, approval semantics, tests, and a safe reconstruction order. Mark reconstructed components as reconstructed until compared against an authoritative original bundle.
