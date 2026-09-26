# reconcile-worker

Internal Edge Function invoked by a scheduled job.

Responsibilities:
- claim due PENDING/FAILED outbox rows,
- authenticate to Jira/GitHub,
- execute idempotent side effects,
- mark COMPLETE after provider acknowledgement,
- apply bounded retry/backoff for transient failures,
- move permanent/max-attempt failures to DEAD_LETTER,
- never treat provider events as human approval.

Invocation must use explicit service-to-service authentication. Do not expose this endpoint as an unauthenticated worker.
