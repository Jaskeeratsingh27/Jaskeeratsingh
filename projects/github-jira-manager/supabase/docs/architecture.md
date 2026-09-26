# Supabase runtime architecture

## Responsibilities

### GitHub
Canonical code, version history, CI, pull requests, architecture, migration files, and Edge Function source.

### Supabase
Runtime only:
- Postgres durability,
- Edge Functions,
- scheduled reconciliation/recovery,
- logs,
- secrets.

### Jira
Operational work state and human-readable execution history.

## Flow

```
GitHub / Jira
      |
      v
Edge webhook functions
      |
      v
gjm_events
      |
      v
deterministic reconciliation
      |
      v
gjm_outbox
      |
      v
scheduled reconcile-worker
      |
      +--> Jira API
      +--> GitHub API
      |
      v
gjm_audit_log
```

## Security boundaries

- External webhook functions are public only at the Supabase gateway layer and must authenticate provider signatures in code.
- Internal worker requires service-to-service authentication.
- Runtime tables are RLS-enabled and inaccessible to `anon`/`authenticated`.
- Provider secrets live in Supabase Edge Function Secrets, never GitHub source.
- GitHub/Jira events are evidence; they never substitute for explicit human approval.
