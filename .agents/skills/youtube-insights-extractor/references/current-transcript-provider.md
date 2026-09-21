# Current transcript-provider note

Verified during migration on 2026-09-21 against the provider's current documentation.

The legacy v3 file used `https://youtube-transcript.ai/mcp` as the direct transcript flow. The provider now documents a simpler keyless HTTP transcript endpoint:

`https://youtube-transcript.ai/transcript/{VIDEO_ID}.txt`

The response is Markdown/text with metadata and timestamps. A `?lang=<code>` query parameter can request a language. The provider also documents an MCP server, but the migrated skill should prefer the simple transcript URL when all that is required is transcript retrieval.

Because this is an external service, verify the provider's current documentation again if the endpoint fails or if the workflow is used for sustained/high-volume production.
