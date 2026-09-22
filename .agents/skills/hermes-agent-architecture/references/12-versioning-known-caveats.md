# Versioning and Known Caveats

## Baseline

Research performed 2026-09-21. Latest stable GitHub release found: Hermes Agent v0.21.3, tag `v2026.9.14`, released 2026-09-14.

The release notes state that v0.21.3 is a patch roll-up and that fuller curated notes for the window are intended for v0.22.0. This reinforces the need to validate features against a pinned version rather than assuming every current-doc detail is in the stable tag.

## Fast-moving interfaces

Hermes is developing rapidly. Higher-risk compatibility surfaces include:

- delegation nesting/config semantics
- Kanban worker lifecycle and review gates
- profile/gateway multiplexing
- state database behavior
- model/provider routing
- MCP auth/SDK behavior
- plugin/hook payloads
- desktop/Bot Mode integration

## Production policy

1. Pin release or commit.
2. Record the docs snapshot/research date.
3. Test generated configuration against that target.
4. Keep a compatibility matrix for providers/models/toolsets.
5. Upgrade in a branch/staging environment.
6. Re-run workflow, security, and contract tests before promotion.

## Source-of-truth hierarchy

For implementation questions prefer, in order:

1. code/tag being deployed
2. official release notes for that tag
3. official Hermes documentation
4. upstream issue/PR discussions for unresolved edge cases
5. third-party commentary only for supplementary context
