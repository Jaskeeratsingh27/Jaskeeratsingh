# Claude migration: claude-full-export_1.zip

Migration date: 2026-09-21

## Source integrity

- ZIP test: PASS.
- Archive entries: 116.
- Raw Claude projects/chats JSON SHA-256: `f1bd6342581792e47862c3116e646d31ff90fcd1d326504757fb30cfffc9e5cc`.
- That raw JSON is byte-identical to the source already processed in Batches 1 and 2.
- New material in this batch is the Claude persistent-memory export: 42 files including the combined export/readme.

## Why this batch matters

The memory layer contains durable requirements and operating summaries for agent systems whose Cowork/plugin bundles were not present in the web-account export. It recovers significantly more context for Anveshak, Smriti, Netra, Hermes, Kosha, Vartaa, the Skill/Agent Factory, Verdant, Rasoi, Vaani, Sutradhaar, and the GitHub-link triage concept.

The archive itself explicitly says the actual Cowork sessions and generated plugin bundles for several of these systems are **not** included. Therefore this migration distinguishes recovered requirements from authoritative source recovery.

## ChatGPT/Codex conversion

- Added `anveshak-research-cycle` as a dependency-gated orchestration skill because the project memory contains a concrete operating contract, commands, approval semantics, and invariants.
- Strengthened `secondbrain-curator` with recovered vault, Smriti, staging, approval, validation, and rollback semantics.
- Strengthened `youtube-insights-extractor` with Netra's coverage-first/tiered-output requirements.
- Strengthened `hermes-agent-creator` with the recovered Hermes control-plane direction and Skill/Agent Factory lifecycle.
- Preserved incomplete/built-but-missing systems as explicit recovery specifications rather than fabricated executable packages.

## Privacy

The raw memory contains personal/employment/family/location/local-path data. This repository is public. No raw memory file, combined memory export, personal profile, people file, salary/employer fact, exact home location, or exact local machine path is committed here. Only sanitized agent/project architecture is migrated.
