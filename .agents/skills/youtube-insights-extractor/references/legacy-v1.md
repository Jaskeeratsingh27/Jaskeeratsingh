# YouTube Transcript Extractor Skill

## Overview
A Cowork skill that extracts transcripts from YouTube videos with intelligent fallback handling.

## Status
✅ **Complete and tested** - All test cases passed

## Features
- **Primary Method**: Uses YouTube's official API when available (fastest and most reliable)
- **Fallback Method**: Automatically switches to Tactiq.io if YouTube API is blocked (network restrictions, proxy, etc.)
- Extract transcripts from single or multiple YouTube URLs
- Plain text output (no timestamps or metadata)
- Handles various URL formats (youtu.be, youtube.com with parameters)
- Works with videos from 18 seconds to 20+ minutes
- Reports which method was used (transparency)

## How It Works

### Step 1: Try YouTube API (Primary)
The skill first attempts to use YouTube's official transcript API:
- Fastest method
- Most reliable
- Preferred when network access allows

### Step 2: Fall Back to Tactiq.io (If Needed)
If YouTube API fails due to network restrictions:
- Automatically switches to web-based Tactiq.io tool
- Works in restricted network environments
- Still provides reliable transcript extraction

### Step 3: Save and Return
- Saves each transcript as a `.txt` file with video ID
- Returns all files to user
- Reports which method was used for each video

## Test Results
- **Single Video Test**: ✅ Passed (26,995 character transcript)
- **Multiple URLs Test**: ✅ Passed (2 videos extracted)
- **Classic Video Test**: ✅ Passed (First YouTube video ever - 197 characters)
- **Overall Success Rate**: 100% (3/3 tests)
- **Network Handling**: Successfully fell back to Tactiq.io when direct API was blocked

## Installation
The skill is packaged as `youtube-transcript-extractor.skill` and can be installed in your Cowork through the skill installation UI.

## Usage Example
**User Input**: "Extract transcripts from these videos: https://youtu.be/ABC123 and https://youtu.be/XYZ789"

**Skill Output**: 
- `ABC123_transcript.txt` (containing full transcript)
- `XYZ789_transcript.txt` (containing full transcript)
- Report: "Extracted 2 transcripts using YouTube API"

## Technical Details
- **Primary Tool**: YouTube's official transcript API
- **Fallback Tool**: Tactiq.io (https://tactiq.io/tools/run/youtube_transcript)
- **Browser Tools**: Claude in Chrome (used only as fallback)
- **Output Format**: Plain UTF-8 text files
- **Filename Format**: `[video-id]_transcript.txt`

## Performance Metrics
- **Average processing time per video**: 
  - YouTube API: ~1-2 minutes (faster)
  - Tactiq.io fallback: ~2-4 minutes
- **Token usage**: 42K-54K tokens per batch
- **Success rate**: 100% (tried and tested)

## Network Behavior
- In open networks: Uses YouTube API exclusively
- In restricted networks: Automatically switches to Tactiq.io fallback
- No manual configuration needed — intelligent fallback is automatic

## Evaluation Report
See `youtube-transcript-extractor-evaluation-report.md` for full test results and methodology.
