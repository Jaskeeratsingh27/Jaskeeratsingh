---
name: youtube-insights-extractor
description: Extract transcripts from public YouTube videos and turn them into structured insights, summaries, coverage-audited walkthroughs, research notes, interactive-document content, or Obsidian-ready atomic notes. Use when the user provides YouTube URLs and asks for transcripts, key ideas, troubleshooting steps, action items, Netra-style “watch it for me” output, or knowledge-base ingestion. Prefer the current transcript route documented in references and degrade transparently when captions or local visual tooling are unavailable.
---

# YouTube Insights Extractor

Migrated from the Claude `Youtube Insights Extractor` project and strengthened with recovered Netra requirements from Batch 3. The Cowork-era transcript variants are preserved as legacy references; they are not the active implementation contract.

## Read first

- `references/current-transcript-provider.md`
- `references/netra-recovered-requirements.md`

## Transcript acquisition

1. Parse the YouTube video ID from supported URL forms.
2. Use the currently documented transcript route when external HTTP access is available.
3. For multiple videos, process independently so one failure does not discard successful transcripts.
4. Preserve source URL/video ID and enough metadata/timestamps to trace every insight back to its video.
5. If acquisition fails, report the failure instead of inventing transcript text. Use another lawful source/tool only when the active environment actually provides it.

## Netra / coverage-first mode

When the user asks to avoid watching the video, requests Netra, or needs a troubleshooting/how-to replacement:

- prioritize transcript completeness over aggressive compression;
- structure output as TL;DR -> full walkthrough -> transcript/source traceability;
- preserve timestamp deep links where possible;
- optionally enrich with local frame extraction only when local tooling is genuinely available;
- run the coverage audit in `netra-recovered-requirements.md` before claiming the derivative is complete.

## Insight extraction

- Distinguish direct claims from interpretation.
- For knowledge-base use, prefer atomic claims and source links over generic prose summaries.
- When writing Obsidian notes, preserve genuine source traceability and avoid fabricating vault links.

## Output

Return the requested derivative plus source traceability, acquisition/coverage limitations, and any unresolved segments. Create files or interactive HTML only when the user requests that deliverable or the active workflow requires it.
