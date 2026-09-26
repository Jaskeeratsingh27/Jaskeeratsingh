# jira-webhook

Public Edge Function with `verify_jwt = false`; Jira HMAC is verified inside the function.

For V1.4/V1.5, Jira inbound events are audit-only to prevent feedback loops. They may later be used for explicit reconciliation triggers once loop-prevention rules are proven.
