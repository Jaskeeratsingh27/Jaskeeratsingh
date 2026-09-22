# Release Impact Engine

Version 1.2 adds a deterministic control layer between weekly research and knowledge-base edits.

## Purpose

A release note or documentation change should not immediately cause broad rewrites. The impact engine converts a verified or ambiguous change event into an explicit blast radius:

- severity
- review requirement
- affected capability IDs
- affected knowledge files
- affected primitive-routing rules
- targeted architecture regression cases
- capabilities that need revalidation
- unknown source/capability warnings

## Change event

Create a JSON event conforming to `maintenance/change-event.schema.json`.

Example:

```json
{
  "change_id": "2026-09-29-delegation",
  "observed_on": "2026-09-29",
  "source_ids": ["delegation", "releases"],
  "change_types": ["behavior"],
  "stable_release_changed": true,
  "from_release": "v0.21.3",
  "to_release": "v0.22.0",
  "evidence_status": "verified",
  "summary": "Delegation behavior changed in the new stable release."
}
```

Run:

```bash
python maintenance/impact_engine.py research/change-events/2026-09-29-delegation.json --pretty
```

## Severity model

- `info`: no meaningful knowledge change
- `patch`: verified documentation-only correction
- `minor`: verified behavior/deprecation or stable-version transition without known breaking architecture
- `major`: breaking/architectural change, ambiguous evidence, or an unmapped source/capability
- `critical`: security-impacting change

Every stable-release transition requires a branch/PR review even when classified `minor`.

## Impact map

`compatibility/impact-map.json` maps source areas and capabilities to:

- knowledge files
- primitive-routing rules
- architecture regression cases

The map must cover exactly the same capability IDs as `compatibility/hermes-compatibility.json`.

## Upgrade matrix

`compatibility/upgrade-matrix.json` records the currently verified baseline and future release transitions. It is not a prediction; it is an audit ledger.

When a new stable release is detected:

1. populate `next_upgrade` with the candidate
2. classify all material change events
3. aggregate affected capabilities and targeted regression cases
4. verify/update the smallest affected knowledge files
5. run deterministic tests
6. after promotion, append the transition to `history` and move the candidate into `current_baseline`

## Unknown-change rule

If Hermes introduces a source/subsystem not represented in the impact map, classification is at least `major` and review is mandatory. Do not silently treat unknown architecture as harmless.
