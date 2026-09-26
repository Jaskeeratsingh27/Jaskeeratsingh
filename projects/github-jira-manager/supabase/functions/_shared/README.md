# Shared function modules

This folder will contain dependency-pinned, reusable modules shared by the Edge Functions.

Planned modules:
- `crypto.ts` — constant-time webhook HMAC validation.
- `db.ts` — privileged Supabase client factory.
- `reconciliation.ts` — deterministic GitHub-event → Jira-state rules.
- `providers.ts` — Jira OAuth/GitHub App API clients.
- `types.ts` — runtime event/outbox/evidence contracts.

Provider SDK dependencies must be version-pinned before production deployment.
