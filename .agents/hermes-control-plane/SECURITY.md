# Security

The controller source may be public. Runtime queue and result data must be private.

Never commit GitHub tokens, Hermes API keys, provider keys, OAuth tokens, or populated .env files.

Keep the Hermes API server bound to loopback unless a separate authenticated remote-access layer is intentionally designed. Hermes can invoke powerful terminal and file tools, so its bearer key is a security boundary.

v0.1 never auto-approves a gated tool call. waiting_for_approval is stopped and recorded as blocked_approval.

Hermes final output is written into the runtime result JSON, which is another reason the runtime repository must be private.
