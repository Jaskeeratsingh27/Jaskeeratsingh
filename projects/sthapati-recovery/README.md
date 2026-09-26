# Sthapati authoritative-source recovery

Jira: `SCRUM-6` epic, `SCRUM-7` structural recovery, `SCRUM-8` held-out behavioral validation.

`source/` is the recovered deployable Sthapati package. The withheld 17-test acceptance pack is deliberately **not committed** to this public repository; its SHA-256 fingerprint is recorded in `RECOVERY_MANIFEST.json`.

Run the public structural checks with:

```bash
python projects/sthapati-recovery/tests/validate_public_recovery.py
```

The stronger local recovery validator was run against the private withheld pack before this branch was created: 47 PASS / 0 WARN / 0 FAIL. Behavioral readiness is not claimed until `SCRUM-8` runs the 17 held-out tests in fresh isolated sessions.
