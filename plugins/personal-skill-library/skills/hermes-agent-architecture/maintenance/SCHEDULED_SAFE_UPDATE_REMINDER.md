# Scheduled Hermes Safe Update Reminder Contract

This file is the canonical recurring safe-update reminder when invoked by the GPT Git Scheduler.

## Reminder lifecycle

Before updating Hermes:

1. Create and verify a backup first.
2. Preferred native option: use `hermes update --backup` so Hermes creates its pre-update snapshot/full backup before updating.
3. Or run `hermes backup` separately if an independent backup is preferred.

Alternative manual PowerShell backup:

```powershell
$stamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$dest = "D:\Hermes-Backups\$stamp"
New-Item -ItemType Directory -Path $dest -Force | Out-Null
robocopy "C:\hermes" $dest /E /COPY:DAT /DCOPY:T /R:2 /W:2 /XJ
Write-Host "Backup: $dest"
```

After backup succeeds:

- update Hermes safely;
- run a smoke test of important Hermes workflows/skills;
- keep the pre-update backup for at least 7 days.

On a later weekly reminder:

- if at least 7 days have passed since the update;
- and Hermes has been stable;
- and important workflows still work normally;

then remind the user that the associated pre-update backup can be deleted.

If there have been errors, regressions, or uncertainty, keep the backup.

Never delete any backup automatically. Ask/remind the user first.
