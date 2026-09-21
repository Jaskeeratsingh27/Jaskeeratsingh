# Agent recovery catalog — Batch 3

| System | Evidence recovered | Completeness | Migration treatment |
|---|---|---:|---|
| Anveshak | Project-scoped operating memory + area summary | High behavior detail; runtime files absent | Added `anveshak-research-cycle` with hard dependency gate |
| Smriti | Persistent memory summary of shipped v0.1 behavior | Runtime/plugin absent | Merged durable write/stage/rollback semantics into `secondbrain-curator` |
| Netra | Persistent memory summary of shipped v0.1 behavior | Runtime/plugin absent | Merged coverage-first behavior into `youtube-insights-extractor` |
| Hermes pipeline/runtime | Persistent memory with historical pipeline + later control-plane direction | Executable plugin absent | Added recovered runtime reference to `hermes-agent-creator` |
| Skill/Agent Factory | Persistent memory summarizes completed long-form docs | Original docs absent | Merged lifecycle/quality bars into `hermes-agent-creator`; recovery spec retained |
| Kosha | Persistent memory says v0.1 shipped | Original bundle absent | Recovery spec only; reuse current GitHub skills until source is found |
| Vartaa | Persistent memory says v0.1 shipped | Original bundle/source registry absent | Recovery spec only |
| Darpan/Kasauti | Original design transcript + project memory | No final standalone package; replacement name unconfirmed | Preserve design and naming history; do not invent final skill |
| Vaani | Blueprint memory + legacy FMEA | No executable package | Blueprint/recovery spec only |
| Sutradhaar | Early blueprint memory | No executable package | Blueprint/recovery spec only |
| Verdant | Requirements memory | No executable package | Blueprint/recovery spec only |
| Rasoi | Requirements memory | No executable package | Blueprint/recovery spec only |
| Toqan transcript analyzer | Historical architecture memory | Platform-specific/currentness unknown | Preserve decomposition pattern; re-verify platform before build |
| Karkhana / Parikshak / Sthapati | Referenced elsewhere | No new authoritative source in Batch 3 | Still awaiting source artifacts |

## Evidence policy

“Built/shipped” in Claude memory is useful provenance, but it is not equivalent to possessing the original files. Reconstructed skills must say when they are reconstructed and remain replaceable by later authoritative bundles.
