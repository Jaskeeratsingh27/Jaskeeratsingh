# Versioning and Known Caveats

## Baseline

Research performed 2026-09-22. Latest stable GitHub release verified: Hermes Agent v0.21.4, tag `v2026.9.21`, released 2026-09-21.

The v0.21.4 release is explicitly a patch roll-up of the development window since v0.21.3. Upstream defers the full curated notes for that window to v0.22.0. The release itself calls out gateway/Desktop ownership, CLI stream-JSON output, skill auto-loading, unauthorized-DM decline behavior, MCP discovery concurrency, session-search changes, journal-mode management, and broad profile/multiplex, Cron, Kanban, Desktop, and state-database fixes.

This reinforces the production rule: distinguish the pinned stable tag from documentation/current-main behavior, and revalidate version-sensitive claims at each stable transition.

## Fast-moving interfaces

Hermes is developing rapidly. Higher-risk compatibility surfaces include:

- delegation nesting/config semantics
- Kanban worker lifecycle and review gates
- profile/gateway multiplexing
- state database behavior
- model/provider routing
- MCP auth/SDK/discovery behavior
- plugin/hook payloads
- desktop/Bot Mode integration

## Production policy

1. Pin release or commit.
2. Record the docs snapshot/research date.
3. Test generated configuration against that target.
4. Keep a compatibility matrix for providers/models/toolsets.
5. Upgrade in a branch/staging environment.
6. Re-run workflow, security, persistence, and contract tests before promotion.

## Source-of-truth hierarchy

For implementation questions prefer, in order:

1. code/tag being deployed
2. official release notes for that tag
3. official Hermes documentation
4. upstream issue/PR discussions for unresolved edge cases
5. third-party commentary only for supplementary context
