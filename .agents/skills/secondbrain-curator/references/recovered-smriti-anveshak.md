# Recovered Smriti + Anveshak behavior

Source: Claude persistent memory summaries; the original plugin bundles were not included.

## Smriti behavior recovered

Smriti was the vault-write specialist. Its durable behavior was:

- scan the live vault before choosing folders, tags, frontmatter, or wikilinks;
- create atomic permanent notes plus hub/MOC structure when appropriate;
- keep literature/source notes distinct from permanent synthesis;
- enrich with research and citations by default when useful;
- stage changes before integration;
- require explicit user approval before integrating a prepared batch;
- use managed backlink blocks, receipts, and rollback so automated edits are reversible.

These behaviors now strengthen `secondbrain-curator`; they do not prove that the missing Smriti plugin code has been recovered.

## Anveshak relationship

Anveshak is the research-to-vault producer. It stages candidate notes under the system area and relies on a hard review gate before integration. Its local runtime remains external to this repository unless recovered later. Use the dedicated `anveshak-research-cycle` skill for that workflow.

## Shared write-path principle

One component should own actual vault integration semantics. Research agents should emit staged artifacts into that contract rather than each inventing their own direct-write behavior.
