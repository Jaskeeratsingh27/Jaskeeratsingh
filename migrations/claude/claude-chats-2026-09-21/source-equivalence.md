# Batch 2 source equivalence

| Check | Batch 1 | Batch 2 | Result |
|---|---|---|---|
| Projects | 10 | 10 | Match |
| Conversations | 12 | 12 | Match |
| Raw JSON SHA-256 | `f1bd6342581792e47862c3116e646d31ff90fcd1d326504757fb30cfffc9e5cc` | `f1bd6342581792e47862c3116e646d31ff90fcd1d326504757fb30cfffc9e5cc` | Exact match |
| Shared substantive knowledge files | 29 | 29 | 29/29 byte-identical |
| Final reusable skill payload | 4 skills | No new payload | Reuse Batch 1 |

## Why the ZIP hashes differ

The two ZIP packages use different folder organization and generated Markdown metadata. Batch 2 nests project-associated conversations inside their project folders and uses `raw/claude-projects-and-chats.json`; Batch 1 used a flatter chat view and `raw-export.json`. The untouched raw JSON bytes are identical.

## Migration rule

When later migration batches contain the same authoritative source bytes, do not create duplicate skills. Record only genuinely new provenance, relationships, or authoritative artifacts.
