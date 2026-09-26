# YouTube Transcript Extractor v2

## Overview
A Cowork skill that extracts transcripts directly from YouTube using the official YouTube API only. No fallbacks or alternative methods.

## Status
✅ **Created and packaged** - Ready for testing in new chat

## Key Features
- **YouTube Official API Only** - Uses `youtube-transcript-api` Python library
- **Direct API Access** - No web scraping, no third-party services
- **Multiple URL Support** - Extract transcripts from several videos at once
- **Plain Text Output** - No timestamps or metadata
- **Handles Various URL Formats** - youtu.be, youtube.com with parameters
- **Transparent Error Handling** - Clear reporting when transcripts unavailable

## How It Works

1. **Parse YouTube URLs** - Extracts video IDs from various URL formats
2. **Fetch via Official API** - Uses `youtube-transcript-api` library to get transcripts
3. **Clean Output** - Removes timestamps, combines text entries
4. **Save as .txt** - Creates file per video with video ID naming scheme
5. **Return to User** - Delivers all transcript files via SendUserFile

## Installation & Testing

The skill is packaged as `youtube-transcript-extractor-v2.skill`

**To test in a new chat:**
1. Save the skill file to your Cowork
2. Start a new chat session
3. The skill will be available for use
4. Try it with a YouTube URL: "Extract the transcript from: https://youtu.be/[video-id]"

## Requirements

- Python with `youtube-transcript-api` library
- Valid YouTube URLs with available transcripts
- Network access to YouTube (not through restrictive proxies that block YouTube)

## Error Cases Handled

- Invalid URL format → Skipped with notification
- Video has no transcripts → Reported, processing continues
- Invalid video ID → Skipped
- API errors → Reported with details
- Multiple videos partially processed → Returns successful ones, reports failures

## Differences from v1

**v2 (Current):**
- ✅ YouTube Official API ONLY
- ✅ Direct, clean implementation
- ✅ No fallback mechanisms
- ✅ Best for open networks
- ✅ Fastest when API available

**v1 (Hybrid):**
- YouTube API with Tactiq.io fallback
- More complex logic
- Works in restricted networks
- Extra processing overhead

## File Structure
- `youtube-transcript-extractor-v2.skill` - Packaged skill file
- Can be imported and tested in new Cowork chat sessions

## Notes for Testing

- Test with public videos that have captions enabled
- Try both official and auto-generated captions
- Test with multiple URLs to verify batch processing
- Check that output files are plain text without timestamps
- Verify filename format uses video ID correctly

## Next Steps

1. Save the `.skill` file to your Cowork
2. Open a new chat session
3. The skill will appear in available skills
4. Test with YouTube URLs
5. Provide feedback on functionality
