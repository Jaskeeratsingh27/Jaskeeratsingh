# Runtime map for the migrated Hermes Agent Creator

The legacy references were written around a mixed Claude Code / Hermes / OmniRoute environment. Preserve their architectural intent, but interpret runtime-specific statements through this map.

| Legacy concept | Migrated interpretation |
|---|---|
| Claude Project custom instructions | A reusable skill/project instruction set, stored canonically in GitHub |
| Claude Code agent/subagent | A bounded worker in the runtime actually executing the system; do not assume a specific subagent primitive exists |
| Cowork | Use ChatGPT Work when browser/computer/file execution is needed; otherwise use normal chat or Codex as appropriate |
| Paid Claude for hard stages | Use the strongest available model only where the stage benefits from it; use local/lower-cost models for volume when the user's stack supports that |
| Claude-specific tool names | Replace with behavior-level requirements and bind to tools at runtime |
| Project memory | Explicit files/contracts/ledgers remain canonical; conversational memory is supplementary, not a project database |

## Current non-negotiables retained

- A real agent has scoped instructions, an explicit tool allowlist, an intentional model/tier choice, typed input/output contracts, and a failure path.
- Deterministic work belongs in scripts/tools, not unconstrained model output.
- Irreversible actions require a human approval gate and an FMEA appropriate to the risk.
- Outputs are validated after generation; model confidence is not validation.
- WIP limit remains two in-flight agents unless the user explicitly changes that policy.
- Ten clean golden-set runs plus a tested failure path and control plan are the historical Done gate; treat it as a project quality standard, not proof that existing agents already passed it.
