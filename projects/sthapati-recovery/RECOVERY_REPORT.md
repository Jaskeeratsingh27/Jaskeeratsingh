# Sthapati Recovery Report — 2026-09-25

## Outcome

Structural recovery: **PASS**  
Behavioral readiness: **NOT YET CLAIMED**  
Held-out test pack: **17 tests remain pending in fresh isolated sessions**

## Provenance

- Uploaded authoritative ZIP SHA-256: `edce29356f83cdcf3da0579a4b2eb687505730dbf01ec552fe188a05fd421f09`
- Uploaded ZIP size: 50794 bytes
- Withheld test-pack SHA-256: `c6f18305760448851a60702fc6b42a374137730731712c8d83d26fae50ebb7e7`
- The withheld test pack remains under `do-not-upload/` and must not be loaded into Sthapati project knowledge.

## Deterministic validation

`python validate_recovery.py`

- PASS: 47
- WARN: 0
- FAIL: 0
- Recovered instruction block: 747 words by `wc -w`
- Expected knowledge files: 12
- Held-out tests detected: 17
- Required blocker tests detected: T4, T5, T6, T7, T15, T16

## Evidence-backed recovery changes

1. Added `knowledge/brief.md` to satisfy Sthapati's own brief gate and make scope/trigger/non-goals explicit.
2. Added `knowledge/sources.md` so external claims have dated source ownership and a claim map.
3. Recovered `instructions/STHAPATI-INSTRUCTIONS.md` to 747 words while preserving trigger, build/improve/verify/iterate modes, hard stops, QA, ledger and output contracts.
4. Refreshed Claude Projects/RAG/file-limit language in `knowledge/project-anatomy.md` against current first-party documentation.
5. Reclassified the 2026-09-20 Claude/Drive connector write semantics in `knowledge/run-ledger.md` as historical evidence pending deployment round-trip re-verification.
6. Updated `README.md` and `SETUP.md` to the 12-file recovered structure and accurate recovery state.
7. Removed a stale RAG/free-plan conflict example from `knowledge/research-discipline.md` after current documentation resolved that old conflict.

## Changed/added files

- `README.md` — modified
- `SETUP.md` — modified
- `instructions/STHAPATI-INSTRUCTIONS.md` — modified
- `knowledge/brief.md` — added
- `knowledge/project-anatomy.md` — modified
- `knowledge/research-discipline.md` — modified
- `knowledge/run-ledger.md` — modified
- `knowledge/sources.md` — added

## Deliberately not completed here

The 17 behavioral tests require fresh isolated model sessions. Static review in the same recovery chat would contaminate the held-out evaluation and is not accepted as behavioral evidence. Jira task `SCRUM-8` tracks that separate gate.
