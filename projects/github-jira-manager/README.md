# GitHub Jira Manager — V1.5 RC1

Version: 1.5.0-rc1

## What it is

One system with two views:

1. **Project Knowledge Dashboard** — a simple, non-technical view of each project: what it is, status, progress, current focus, blocker, next step, and links.
2. **Engineering Control Plane** — policy-controlled automation that turns GitHub CI/QA events into durable, auditable Jira operations.

## Runtime

GitHub Actions → short-lived GitHub OIDC → Supabase Edge Function → Postgres event/evidence/outbox → scheduled worker → Jira API.

The dashboard reads only curated project summaries and activity from the same runtime state.

## V1.5 additions

- Supabase hosted runtime in ca-central-1.
- Postgres event, evidence, outbox, audit, project-summary, activity, and runtime-config tables.
- RLS/deny-by-default client access for control-plane tables.
- Secretless GitHub Actions → Supabase authentication using GitHub OIDC.
- Separate CI and QA jobs.
- Idempotent GitHub event ingestion.
- Durable Jira outbox with bounded exponential retry and dead-letter behavior.
- pg_cron + pg_net scheduled worker.
- Human-readable live project dashboard.
- GitHub remains canonical for code/config/tests; Supabase is runtime only.

## Approval model

- External events never self-approve a merge.
- A Jira Done transition is queued only after successful CI + QA plus a human merge event.
- Agents do not merge their own PRs.
- Destructive/production-sensitive operations remain human-gated.

## Current live gate

GitHub/Supabase infrastructure is deployed. The worker intentionally refuses to claim work until these Supabase Edge Function secrets exist:

- JIRA_BASE_URL
- JIRA_EMAIL
- JIRA_API_TOKEN

That credential gate prevents queued work from being consumed or dead-lettered before Jira authentication is configured.

## Cost model

The deployed control plane is rules/code, not an AI model. Normal GitHub → Supabase → Jira execution does not consume ChatGPT usage. Platform free-tier quotas still apply.
