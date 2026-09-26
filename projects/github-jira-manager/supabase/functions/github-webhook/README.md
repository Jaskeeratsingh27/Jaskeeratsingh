# github-webhook

Public Edge Function with `verify_jwt = false` because GitHub does not send Supabase credentials.

The function must:
1. Read the original request body.
2. Validate `X-Hub-Signature-256` using `GITHUB_WEBHOOK_SECRET`.
3. Require `X-GitHub-Delivery` and `X-GitHub-Event`.
4. Normalize supported PR/workflow events.
5. Persist provider delivery ID + payload hash before reconciliation.
6. Reject conflicting delivery-ID reuse.
7. Write deterministic outbox operations transactionally.
8. Return 2xx quickly; never wait for downstream Jira/GitHub side effects.
