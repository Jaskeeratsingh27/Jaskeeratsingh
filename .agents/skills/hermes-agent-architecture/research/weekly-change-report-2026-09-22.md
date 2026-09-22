# Hermes Weekly Change Report — 2026-09-22

## Audit result

- Previous stable baseline: Hermes Agent v0.21.3 (`v2026.9.14`)
- Verified stable baseline: Hermes Agent v0.21.4 (`v2026.9.21`)
- Skill promotion: v1.6.0 -> v1.7.0
- Highest impact severity: minor
- Evidence status: verified
- Breaking/deprecated behavior found: none in the checked stable release notes and current official documentation
- Release-vs-main caveat: v0.21.4 is a patch roll-up; upstream defers full curated notes for this development window to v0.22.0.

## Sources checked

All source IDs in `maintenance/source-manifest.json` were checked: `releases`, `features-overview`, `profiles`, `profile-distributions`, `bot-mode`, `skills`, `context-files`, `memory`, `memory-providers`, `honcho`, `delegation`, `kanban`, `kanban-worker-lanes`, `tools`, `tools-reference`, `code-execution`, `mcp`, `cron`, `security`, `checkpoints`, `models`, `fallback-providers`, `provider-routing`, `observer-hooks`, and `plugins`.

## Verified factual deltas

1. Host-wide gateway singleton/rendezvous behavior; Desktop attaches to the running host backend instead of spawning a second backend.
2. Profile-scoped `skills.auto_load` pins selected skills into every new session prompt.
3. MCP discovery concurrency is bounded by default and configurable with `mcp.discovery_concurrency`.
4. `session_search` supports `after`/`before` bounds; the release also records an OR-relaxed recall retry.
5. Hermes adds explicit state-database journal-mode management through `hermes sessions set-journal-mode`.
6. CLI `--format stream-json` provides structured JSONL output; this is separate from delegated `output_schema`.
7. Gateway authorization supports `unauthorized_dm_behavior: decline`.
8. The release includes broad Profile/multiplex, Cron, Kanban, Desktop, and `state.db` fixes without a verified breaking change to the skill's core primitive-selection model.

## Knowledge blast radius

Updated only the canonical files needed to represent the verified deltas and baseline. The impact engine also identifies architecture-map/checklist/templates as related blast-radius files, but their existing rules remain correct, so they were intentionally not rewritten.

## Consumer impact

- `hermes-agent-creator`: compatibility review recommended; non-blocking for this minor release.
- `kaizen-orchestrator`: targeted review recommended for Profile/memory/tools-MCP dependencies; non-blocking.
- No downstream consumer files were automatically rewritten.
- Consumer dependency drift: none detected in the promoted branch state.

## Validation and promotion decision

Required gates:
- structural: passed
- architecture: passed
- release impact: passed
- health/drift: passed
- consumer impact: passed
- consumer dependency drift: passed
- end-to-end hardening: passed

Knowledge health after promotion: 100.0 / healthy; 13 fresh capabilities; 0 stale; 0 due soon; 0 unresolved revalidation; 0 drift signals.

The deterministic promotion model classifies a stable-release transition as review-required even when validation passes. The user explicitly approved promotion on 2026-09-22. Ecosystem review recommendations remain non-blocking because no blocking consumer IDs were produced.

## Confidence and unresolved questions

Confidence: high for the promoted v0.21.4 facts above because they are supported by the official stable release and current official Hermes documentation.

Residual watch item: upstream says the complete curated notes for the v0.21.3-to-v0.21.4 window will ship with v0.22.0. The next weekly audit should compare those curated notes against this promotion and open a new change event if they expose additional material semantics.
