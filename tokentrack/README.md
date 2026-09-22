# TokenTrack v4

GitHub is the canonical source of truth for TokenTrack.

## Production architecture

**Production runtime:** Railway  
**Repository:** `Jaskeeratsingh27/Jaskeeratsingh`  
**Project root:** `/tokentrack`  
**Public domain:** `https://tokentrack-production.up.railway.app/`  
**Persistent volume:** `/data`  
**Health check:** `GET /health`

Railway runs `server.js` continuously with the OpenAI Admin API key stored only as a Railway secret.

The repository also contains `worker.js` and `wrangler.jsonc` from an experimental Cloudflare migration path. They are **not the current production runtime** and should not be treated as the source of live deployment behavior.

## What TokenTrack tracks

TokenTrack has two explicitly separated sources:

1. **ChatGPT subscription usage**
   - OpenAI does not expose personal ChatGPT Plus usage through the organization Usage API.
   - TokenTrack records user-entered checkpoints from the ChatGPT usage screen.
   - Checkpoints are local by default.
   - Optional cross-device sync encrypts checkpoint data in the browser with AES-GCM before storing ciphertext on the Railway volume.

2. **OpenAI API organization usage**
   - Uses the OpenAI organization Usage and Costs APIs.
   - Tracks tokens, requests, caching, models, projects, API keys/users where available, service tier, batch mode, resources, cost, forecasts, anomalies and FinOps signals.

These sources must not be interpreted as interchangeable.

## Runtime services

- `GET /api/analytics?days=30` — aggregated API analytics
- `GET /api/usage?days=30` — compatibility usage endpoint
- `GET /api/export` — CSV exports
- `GET /api/server-monitor` — persistent background-monitor state
- `PUT /api/server-monitor` — monitor rule changes; locked unless dashboard authentication is enabled
- `GET|PUT|DELETE /api/chatgpt-sync` — encrypted checkpoint blob sync
- background API monitor — every 5 minutes by default
- PWA service worker — caches only the static app shell, never `/api/*` or `/health`

## Required Railway secret

```
OPENAI_ADMIN_KEY=sk-admin-...
```

Never commit the Admin key to GitHub or place it in frontend code.

## Optional security setting

The production URL is public unless this Railway variable is configured:

```
DASHBOARD_PASSWORD=<a strong password>
```

When configured, Basic Auth protects the dashboard and API routes. `/health` remains unauthenticated so Railway can perform health checks.

When the password is not configured:
- read-only dashboard/API telemetry remains reachable by anyone with the URL
- encrypted ChatGPT sync still requires its independent sync authorization secret
- server-side background-monitor configuration mutations are locked

## Persistence and recovery

Railway volume `/data` stores:
- encrypted ChatGPT sync blobs under `/data/chatgpt-sync`
- background API monitor state in `/data/api-monitor.json`

The dashboard also provides:
- encrypted device sync
- ChatGPT checkpoint JSON export/import
- full local recovery-kit export/import

The recovery kit deliberately excludes the OpenAI Admin key and encrypted-sync key.

## Release QA

Every production deployment should run:

```
npm test
```

The QA gate validates:
- browser JavaScript syntax
- service-worker syntax
- PWA manifest JSON
- DOM references used by the frontend
- required production files
- obvious OpenAI secret leakage into public files
- server hardening markers

Railway is configured to run this test as a pre-deploy command.

## Deployment settings

- root directory: `/tokentrack`
- start command: `npm start`
- pre-deploy command: `npm test`
- health check: `/health`
- health timeout: 120 seconds
- sleeping: disabled
- restart policy: ALWAYS
- watch path: `/tokentrack/**`
- persistent volume: `/data`

## Version

TokenTrack v4.0.0 is the completed v4 release. New feature work should be planned as a separate v5 roadmap rather than continuing the v4 phase sequence.
