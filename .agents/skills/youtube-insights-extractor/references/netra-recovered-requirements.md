# Netra recovered requirements

Source: Claude persistent memory summary. The original `netra.plugin` bundle and `netra.py` pipeline were not included in the export, so this is a recovered behavior contract rather than the original implementation.

## Purpose

Given a YouTube URL, create a coverage-first derivative that can replace watching the video for troubleshooting/how-to/research use.

## Durable requirements

- Transcript accuracy and coverage take priority over visual extraction.
- Nothing materially relevant in the transcript should disappear merely to shorten the summary.
- Tier output: TL;DR -> complete walkthrough -> collapsible/full transcript when the requested format supports it.
- Preserve timestamps/deep links when transcript timing is available.
- Optional local visual enrichment may use `yt-dlp`/`ffmpeg` or equivalent only when the active environment provides them.
- Degrade cleanly to transcript-only mode when visual tooling is unavailable.
- For long material, split work across bounded stages/agents rather than one unconstrained prompt.
- Run a coverage audit before calling a condensed artifact complete.

## Coverage audit

For each transcript segment or topic block, classify it as represented, intentionally omitted as non-substantive repetition, or unresolved. Any unresolved substantive segment blocks a “complete replacement” claim.

## Provenance

Keep video URL/ID and timestamps tied to extracted claims so a reader can verify or jump back to source context.
