# Observability, Hooks, and Policy Enforcement

Hermes exposes observer/plugin hooks around session, turn, API-request, tool, approval, and subagent lifecycle events.

## Correlation model

Important correlation fields include:

- `session_id`
- `task_id`
- `turn_id`
- `api_request_id`
- `api_call_count`
- `tool_call_id`
- parent/child session IDs
- parent/child subagent IDs
- parent turn ID

Use explicit IDs rather than parsing composite strings.

## Recommended trace hierarchy

```text
workflow / kanban task
  -> profile/session
     -> turn
        -> provider API request(s)
        -> tool call(s)
        -> delegated child session(s)
```

Record model/provider, duration, token usage, tool status, retries, schema validity, terminal outcome, verification result, and cost where available.

## Observer vs enforcement

Pure observer callbacks should be fail-open and must not become required business logic. Behavior-changing hooks such as pre-tool blocking/modification are a different policy surface and should be tested as enforcement code.

## Guardrail examples

Use hooks/plugins to enforce:

- denied commands/tools
- token/cost thresholds
- data-loss-prevention checks
- required metadata
- trace export
- policy logging
- anomaly alerts

Do not implement critical enforcement solely as natural-language instructions inside SOUL/AGENTS.
