# TokenTrack

GitHub is the canonical source of truth for this dashboard.

## Cloudflare runtime

TokenTrack has been migrated from an always-running Railway Node server to a Cloudflare Worker with static assets.

- **Repository:** `Jaskeeratsingh27/Jaskeeratsingh`
- **Cloudflare project root:** `tokentrack`
- **Frontend:** `public/`
- **Worker:** `worker.js`
- **Configuration:** `wrangler.jsonc`
- **Health:** `GET /health`
- **Analytics:** `GET /api/analytics?days=30`
- **Usage:** `GET /api/usage?days=30`
- **CSV export:** `GET /api/export`
- **Background monitor:** `GET /api/server-monitor`

The old `server.js` remains as Railway/reference code. Cloudflare does not run it.

## Required secret

In Cloudflare, add this under **Variables and Secrets** as a secret:

```
OPENAI_ADMIN_KEY=sk-admin-...
```

Do not commit the key to GitHub.

Optional variables:

```
DASHBOARD_PASSWORD=<password>
CACHE_TTL_MS=30000
```

## Optional persistent KV

TokenTrack v4 previously stored encrypted checkpoint sync and background-monitor state on Railway's persistent filesystem.

Cloudflare Workers do not provide that filesystem, so the Worker now supports one Cloudflare KV binding named:

```
TOKENTRACK_KV
```

If you add that KV binding:
- encrypted ChatGPT checkpoint sync is persistent
- background monitor rules/events are persistent

Without the binding:
- the OpenAI usage dashboard still works
- the background monitor can run but its state is ephemeral
- encrypted cross-device checkpoint sync returns a setup message instead of writing to disk

## Automatic monitoring

`wrangler.jsonc` configures a Cloudflare Cron Trigger every 5 minutes. This replaces Railway's always-running interval loop.

## Cloudflare deployment

For Git deployment, use:

```
Root directory: tokentrack
```

The Worker serves the files in `public/` through Cloudflare's static-assets binding and executes API routes serverlessly.

## Scope

TokenTrack tracks **OpenAI API organization usage** exposed by OpenAI's Usage/Costs APIs. It does not expose private ChatGPT Plus internal token accounting.
