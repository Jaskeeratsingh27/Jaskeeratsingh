# Memory and Session Context

## Built-in memory

Hermes' built-in curated memory is deliberately bounded. Documentation on the research date specifies `MEMORY.md` for agent notes and `USER.md` for user-profile information, both injected at session start.

Do not use built-in memory as a large architecture knowledge base. Put large Hermes knowledge in a skill/reference corpus and keep memory for small persistent facts/preferences.

## Profile isolation

Memory belongs to a profile. Multiple persistent agents should have separate profile homes. If multiple agents need shared memory, use an external/shared memory provider designed for that use case rather than pointing multiple writers at one Hermes home.

## Honcho and memory providers

Hermes supports memory providers such as Honcho for deeper server-side user modeling, semantic search, conclusions, and multi-agent peer isolation. Treat this as an optional personalization/context layer, not the workflow control plane.

## Session search

Historical session retrieval is a separate concern from curated memory. Use session search for retrieving prior discussions/evidence; use memory for compact persistent facts; use Git/artifacts/KB files for durable engineering truth.
