# GitHub Jira Manager — Supabase Runtime

This directory is the deployable Supabase runtime for the GitHub Jira Manager control plane.

## Source-of-truth rule

- GitHub remains canonical for code, migrations, Edge Functions, tests, architecture, and release history.
- Supabase is runtime infrastructure only: Postgres durable state, Edge Functions, scheduling, logs, and secrets.
- Jira remains canonical for operational work status.

## Directory layout

```
supabase/
├── config.toml
├── .gitignore
├── functions/
│   ├── _shared/
│   │   └── README.md
│   ├── health/
│   │   └── index.ts
│   ├── github-webhook/
│   │   └── README.md
│   ├── jira-webhook/
│   │   └── README.md
│   └── reconcile-worker/
│       └── README.md
├── migrations/
│   └── README.md
├── schema/
│   └── control-plane.sql
├── tests/
│   └── README.md
└── docs/
    └── architecture.md
```

## Runtime design

GitHub/Jira webhook → Edge Function → Postgres durable event/outbox → reconciliation worker → Jira/GitHub APIs.

## Secrets

Never commit secrets. Production secrets belong in Supabase Edge Function Secrets:
- GITHUB_WEBHOOK_SECRET
- JIRA_WEBHOOK_SECRET
- JIRA_OAUTH_CLIENT_ID
- JIRA_OAUTH_CLIENT_SECRET
- JIRA_OAUTH_REFRESH_TOKEN
- GITHUB_APP_ID
- GITHUB_APP_INSTALLATION_ID
- GITHUB_APP_PRIVATE_KEY

## Migration discipline

Do not manually invent timestamped migration filenames. Use the Supabase CLI to create migration files when promoting a verified schema change into canonical migration history.

Until the remote project is visible to the ChatGPT connector, `schema/control-plane.sql` is the reviewed schema blueprint, not an applied migration.
