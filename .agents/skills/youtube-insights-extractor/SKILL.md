---
name: youtube-insights-extractor
description: Extract transcripts from public YouTube videos and turn them into structured insights, summaries, research notes, or Obsidian-ready atomic notes. Use when the user provides one or more YouTube URLs and asks for transcripts, key ideas, actionable insights, note extraction, or knowledge-base ingestion. Prefer the current keyless transcript endpoint documented in references and degrade transparently when captions/transcripts are unavailable.
---

# YouTube Insights Extractor

Migrated from the Claude `Youtube Insights Extractor` project. The three Cowork-era transcript variants are preserved as legacy references; they are not the active implementation contract.

## Transcript acquisition

1. Parse the 11-character YouTube video ID from supported YouTube URL forms.
2. Read `references/current-transcript-provider.md` and use the currently documented transcript route when external HTTP access is available.
3. For multiple videos, process independently so one failure does not discard successful transcripts.
4. Preserve source URL/video ID and enough metadata to trace every insight back to its video.
5. If the external endpoint is unavailable, report that failure instead of inventing transcript text. Use another lawful transcript source/tool only when the active environment actually provides it.

## Insight extraction

- Distinguish direct claims from your interpretation.
- For knowledge-base use, prefer atomic claims and source links over long generic summaries.
- When writing Obsidian notes, preserve genuine source traceability and avoid fabricating links to vault notes not supplied in context.

## Output

Return the transcript or requested derivative (summary, insights, atomic notes, action items), plus source traceability and any acquisition failures. Create files only when the user requests a file deliverable or the active workflow requires one.
