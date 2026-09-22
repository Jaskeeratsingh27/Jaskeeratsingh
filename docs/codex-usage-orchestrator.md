# Usage-Efficient Codex Orchestrator

Version: 1.2.0

This repository contains the canonical, version-controlled Codex architecture for conserving Work/Codex allowance while preserving engineering quality.

## Architecture

Primary supervisor (for example Astra at Light/Low)
-> cheap read-only discovery
-> standard implementation
-> independent review when risk requires it
-> senior escalation only when evidence justifies it
-> primary supervisor integrates and enforces budget/risk gates

## Reliability model

GitHub is the canonical source of truth. Global Codex files are runtime mirrors.

Before promotion:

```bash
node scripts/orchestrator-qa.mjs
```

Check installed/global drift:

```bash
node scripts/orchestrator-status.mjs
```

Preview a global update:

```bash
node scripts/orchestrator-sync.mjs --dry-run
```

Apply a global update:

```bash
node scripts/orchestrator-sync.mjs
```

The sync process backs up managed files and will not silently overwrite an unrecognized existing global `[agents]` configuration.

## Usage budget model

The default balanced profile targets <=5 percentage points of weekly allowance and never intentionally plans >10 percentage points in a single turn.

This is an account-side target, not a guaranteed meter when live usage is unavailable. Proxy counters are the enforceable fallback.

## Version control

Orchestrator versions are built on isolated version branches, validated, reviewed, and only promoted after explicit approval.

Release progression:
- v1.0 foundation
- v1.1 control plane
- v1.2 reliability
- v1.3 observability
- v1.4 usage intelligence
- v1.5 adaptive routing
- v2.0 closed-loop orchestrator
