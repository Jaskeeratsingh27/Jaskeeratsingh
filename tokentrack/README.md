# TokenTrack

GitHub is the canonical source of truth for this dashboard.

## Architecture

- **Source:** this `tokentrack/` directory
- **Host:** Railway
- **Frontend:** `public/index.html`
- **API:** `server.js`
- **Live endpoint:** `GET /api/usage?days=30`
- **Health endpoint:** `GET /health`
- **Refresh policy:** browser refresh every 60 seconds, manual refresh, and refresh on tab focus
- **Server behavior:** no application sleep; restart policy is ALWAYS

## Required secret

Railway must have:

```
OPENAI_ADMIN_KEY=sk-admin-...
```

Do **not** commit the key to GitHub.

The OpenAI organization Usage and Costs APIs require an organization Admin API key. Once the variable is present, TokenTrack reads current usage directly from OpenAI; it does not rely on a static snapshot.

## Deployment

Railway is connected to:

- Repository: `Jaskeeratsingh27/Jaskeeratsingh`
- Branch: `main`
- Root directory: `/tokentrack`

Commits under this app can trigger a new deployment.

## Important scope

This dashboard tracks **OpenAI API organization usage** exposed by the OpenAI Usage/Costs APIs. It does not expose private ChatGPT Plus internal token accounting.
