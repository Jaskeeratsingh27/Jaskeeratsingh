# Recovered SecondBrain vault contract

Source: Claude persistent project memory in Batch 3. Exact local machine paths and personal memory were intentionally removed for public-repository safety.

## Structure

The primary vault uses PARA-style folders:

- `00-Inbox` — unsorted capture
- `01-Areas` — ongoing responsibilities
- `02-Projects` — goal-oriented work with end states
- `03-Resources` — durable reference material
- `04-Archive` — completed/inactive material
- `90-Meta` — generated/system metadata, hubs, templates
- `Templates/` — boilerplate
- `_System/` — local automation state/staging; excluded from normal content scans when configured that way

## Canonical tag vocabulary recovered from project memory

`meta`, `second-brain`, `ai`, `agents`, `tools`, `resource`, `area`, `project`, `daily`

Treat this as historical known vocabulary, not proof of the current vault state. Read the live index before asserting that a tag or note still exists. Do not invent near-duplicate tags when a canonical tag already fits.

## Generated-content rule

Auto-generated hub/MOC notes must not be hand-edited when they are marked as generated. Regenerate them through the local `secondbrain` tool or current equivalent. Historical project memory names these generated hubs/MOCs explicitly: `Second Brain System`, `AI Agents`, `Graphify`, `secondbrain`, `meta Hub`, `ai Hub`, and `second-brain Hub`. Treat those names as historical evidence, not proof they still exist in the live vault.

Historical entry/reference notes called out by the project memory were `Start Here.md`, `Graphify.md`, `AI Agents.md`, and `secondbrain.md`. Verify the live vault/index before linking to them.

## Integration rule

The historical local tool regenerates graph data, hubs, the agent index, and a health/validation report after notes are integrated. Project memory says the old Claude Project also used a device-bound periodic vault refresh to regenerate and stage an updated `agent_index.json`. Treat that schedule as historical only; re-confirm cadence/timezone before recreating it. The actual parser/index files were not included in this export, so verify the active local toolchain before execution.

## Resume-oriented note quality

Durable notes should make the current state and next action obvious enough that work can be resumed later without reconstructing the entire conversation.
