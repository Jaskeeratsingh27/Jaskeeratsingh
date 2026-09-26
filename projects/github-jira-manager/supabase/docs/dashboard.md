# Project Knowledge Dashboard

## Purpose

Give a non-technical answer to five questions for every tracked project:

1. What is this?
2. What is happening now?
3. What changed recently?
4. Is anything blocked?
5. What happens next?

## Live URL

https://ayihitekwwrwgkbzontm.supabase.co/functions/v1/dashboard

## Truth model

- GitHub: canonical code/version history.
- Jira: operational work/status.
- Supabase: curated runtime summary + recent activity.
- Dashboard: read-only presentation of curated Supabase data.

The dashboard intentionally does not expose raw event payloads, secrets, provider tokens, or internal outbox contents.

## Adding a project

Insert/upsert one row in `gjm_projects` with:
- project_key
- name
- plain-language summary
- status
- version
- progress_percent
- current_focus
- next_step
- blocker (optional)
- GitHub/Jira/runtime links

Activity belongs in `gjm_project_activity`, with a stable `dedupe_key` when generated automatically.
