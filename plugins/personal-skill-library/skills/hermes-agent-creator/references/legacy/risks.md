# risks.md — known traps

> Things that have already bitten me or will. Check this before proposing a fix;
> several "obvious" solutions are already known-broken here.

## Environment

| Trap | Detail | Rule |
|---|---|---|
| **macOS arch mismatch** | Homebrew installed ARM64, machine is Intel i9 x86_64. Native builds fail — `cryptography` breaks on missing OpenSSL/pkg-config. | Assume x86_64 on macOS. Never give a plain `brew install` for anything with native extensions without an arch-specific wrapper. |
| **Home Assistant shares the 24/7 laptop** | Same machine as Hermes and the agents. | Agents never touch Home Assistant config, services, or ports. Hard scope lock. |
| **24/7 box is not internet-reachable** | By design. | Anything requiring an inbound webhook or public callback is out. Poll or use Telegram. |
| **Claude Pro allowance is finite** | Not an API plan. | Token cost is a design constraint in every proposal, not an afterthought. |

## Model and inference

| Trap | Detail | Rule |
|---|---|---|
| **Model alias drift** | `haiku`, `sonnet` follow the alias. Upgrades change behaviour weeks after setup worked. | Pin with a date comment. Re-run the golden set after any model change. |
| **Local model capability ceiling** | Gemma-class handles classification, tagging, variant generation. It does not handle multi-step judgment reliably. | Don't route architecture or final build to local. Don't route tagging to Claude. |
| **OmniRoute fallback masks failures** | Auto-fallback means a local-model outage silently becomes a paid call. | Log which provider actually served each call. Alert on unexpected paid calls. |
| **Gateway ≠ runtime** | Recurring category error. | See `glossary.md`. |

## Process

| Trap | Detail | Rule |
|---|---|---|
| **WIP overload** | 11 agents, most unfinished. Documented pattern, not a one-off. | Hard limit 2 in-flight. Claude enforces. |
| **Designing before shipping** | Full architecture before one working output. | Thin slice first. `time-to-first-output ≤ 1 session`. |
| **Unowned shared infrastructure** | Vault write path and approval gate live inside agents, no contracts, 5 dependents. | See `shared-infrastructure.md`. Extract before adding dependents. |
| **Silent overnight failure** | Unattended runs fail with no signal until a report doesn't arrive. | Every scheduled run emits a heartbeat, success or fail. Absence of report ≠ success. |
| **Never-pruned idea ledger** | Deliberate, but it's inventory. | Ledger may not feed the build queue unfiltered. Explicit selection only. |
| **Approval gate as bottleneck** | Overnight runs block on my approval. | Batch approvals. Timeout defaults to **deny**, never allow. |

## Publishing (Vaani-specific)

| Trap | Rule |
|---|---|
| Wrong/unreviewed video published under my name | Hard gate. No auto-publish in v1. See `fmea-vaani.md`. |
| Platform ToS on automated posting | Verify before building the adapter. `[unverified]` until checked. |
| Quota limits on upload APIs | Check before designing cadence, not after. |
| Copyrighted audio/footage in generated assets | Source allowlist only. No "find me music" step. |

## How to use this file

When proposing anything, scan for a matching trap. If one applies, say so and route
around it rather than rediscovering it. New traps get added here the day they're found,
with the date.
