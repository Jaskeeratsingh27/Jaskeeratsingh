# Model and Provider Routing

Hermes distinguishes the main model from auxiliary model slots used for side tasks such as compression, vision, web summarization, approvals, MCP routing, title generation, and skill search.

## Role-based model selection

For a multi-agent system, select models per profile/task rather than forcing one frontier model everywhere. Examples:

- orchestrator/architect: strongest reasoning where coordination errors are expensive
- researcher: strong retrieval/synthesis, moderate cost
- implementation worker: coding-specialized model
- QA/reviewer: independent model when useful
- routine formatter/release helper: fast inexpensive model

## Fallbacks

Hermes supports credential pools and cross-provider fallback chains. Treat fallback as resilience, not silent arbitrary rerouting. Explicitly configure which providers/models may be used.

Fallback can increase token cost because model/provider prompt caches may not carry across routes. Include this in budget design for long sessions.

## Auxiliary routing

Pin cheap/fast auxiliary models where quality requirements permit. This is often a better optimization target than weakening the main orchestrator.

## OpenRouter routing

When OpenRouter is used, Hermes can pass provider-routing preferences such as price ordering, allow/deny lists, and provider order. Nous Portal routing is centrally managed and does not accept the same caller-supplied provider-routing object.

## Production manifest

For every role record:

- primary provider/model
- reasoning effort
- fallback chain
- auxiliary overrides
- maximum expected context/turn budget
- conditions that require escalation to a stronger model
