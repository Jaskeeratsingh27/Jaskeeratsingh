# Recovered Hermes runtime architecture

Source: Claude persistent memory. Exact machine identifiers, local paths, and private communication details were removed for public-repository safety.

## Distinguish two meanings of “Hermes”

1. **Hermes pipeline design** — the user's ideation/build/report workflow created in Claude/Cowork.
2. **Real Hermes desktop runtime** — the separately installed open-source Hermes agent application used as the intended 24/7 control plane.

Always resolve which meaning is active before changing architecture.

## Recovered production direction

- Hermes itself should handle production processing/orchestration; Claude/ChatGPT is primarily used to author, review, and improve agents rather than sit in the production execution path.
- Use an always-on controller/control-plane host for orchestration and queueing.
- Route heavy jobs to an optional higher-power worker only when needed.
- Keep the heavy worker wake/start decision human-controlled unless the user explicitly changes that policy.
- Project-specific messaging/control channels may enqueue work; execution still obeys project gates.
- Prefer file/state handoffs through the knowledge/workspace layer over hidden conversational state.
- API/model providers are runtime adapters. Verify current availability/cost/capability instead of freezing old provider assumptions into core agent logic.

## Historical Hermes pipeline behavior

A prior pipeline followed: context feed -> ideate -> approval -> sandboxed build/run -> report -> select winners -> handoff. It used a permanent idea ledger, deduplication, and a sandboxed runner. The original plugin bundle is not in this export, so treat this as recovered architecture, not source-code recovery.
