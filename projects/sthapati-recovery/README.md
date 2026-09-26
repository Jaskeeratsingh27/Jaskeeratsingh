# Sthapati authoritative-source recovery

Jira: `SCRUM-6` epic, `SCRUM-7` structural recovery, `SCRUM-8` held-out behavioral validation.

This branch is the **reviewable recovery patchset and provenance record** for the authoritative ZIP supplied on 2026-09-25. It contains the files changed or added by recovery plus the key method file used by QA. The complete patched package is preserved as a separate recovery ZIP for deployment.

The withheld 17-test acceptance pack is deliberately **not committed** to this public repository; only its SHA-256 fingerprint is recorded in `RECOVERY_MANIFEST.json`.

Run the public patchset checks with:

```bash
python projects/sthapati-recovery/tests/validate_public_recovery.py
```

The stronger local recovery validator was run against the complete patched package **and the private withheld pack** before this branch was opened: **47 PASS / 0 WARN / 0 FAIL**. Behavioral readiness is not claimed until `SCRUM-8` runs the 17 held-out tests in fresh isolated sessions.

## Recovery patchset

- `source/README.md`
- `source/SETUP.md`
- `source/instructions/STHAPATI-INSTRUCTIONS.md`
- `source/knowledge/brief.md`
- `source/knowledge/build-method.md` (unchanged reference method used by QA)
- `source/knowledge/project-anatomy.md`
- `source/knowledge/research-discipline.md`
- `source/knowledge/run-ledger.md`
- `source/knowledge/sources.md`

`RECOVERY_REPORT.md` and `RECOVERY_MANIFEST.json` record every changed/unchanged file and the original/recovered hashes.
