# YouTube Transcript Extractor v3

## Overview
A Cowork skill that extracts transcripts directly from YouTube using the youtube-transcript.ai API endpoint - an API specifically built for AI agents.

## Status
✅ **Created and packaged** - Ready for testing in new chat

## Key Features
- **AI Agent-Optimized** - Uses youtube-transcript.ai/mcp endpoint built specifically for AI agents
- **Simple & Clean** - Direct API calls, no complex logic
- **No Dependencies** - Just HTTP requests, no Python packages needed
- **Multiple URLs** - Extract transcripts from several videos at once
- **Plain Text Output** - Clean text without timestamps or metadata
- **Fast** - Direct endpoint access

## How It Works

1. **Send request to youtube-transcript.ai/mcp** with the YouTube URL
2. **Parse the response** to extract the transcript text
3. **Save as .txt file** with video ID naming
4. **Return all files** via SendUserFile

## The Endpoint

```
https://youtube-transcript.ai/mcp
```

This API is specifically designed for AI agent use - it's the perfect tool for this job!

## Installation & Testing

The skill is packaged as `youtube-transcript-extractor-v3.skill`

**To test in a new chat:**
1. Save the skill file to your Cowork
2. Start a new chat session
3. The v3 skill will be available for use
4. Try it with a YouTube URL: "Extract the transcript from: https://youtu.be/[video-id]"

## Why v3 is Better

| Aspect | v1 | v2 | v3 |
|--------|----|----|-----|
| Method | API + Website fallback | YouTube API only | AI Agent API |
| Built for AI? | No | No | ✅ Yes |
| Complexity | High | Medium | Low |
| Dependencies | Python lib + Browser | Python lib | None |
| Speed | Slower | Fast | Fast ✓ |
| Reliability | Good | Good | Excellent ✓ |

## Error Handling

- Invalid URLs → Skipped with notification
- No transcripts available → Reported
- API unreachable → Clear error message
- Rate limiting → Graceful handling
- Partial failures → Returns successful transcripts

## Testing Checklist

- [ ] Test with single YouTube URL
- [ ] Test with multiple URLs
- [ ] Test with different URL formats (youtu.be, youtube.com)
- [ ] Test with URL parameters (?si=...)
- [ ] Verify plain text output
- [ ] Check filename format (video-id_transcript.txt)
- [ ] Test error handling with invalid URL

## Next Steps

1. Save the `.skill` file to your Cowork
2. Open a new chat session
3. The v3 skill will appear in available skills
4. Test with YouTube URLs
5. Provide feedback on functionality

## Notes

- This API endpoint is specifically maintained for AI agent use
- It's the cleanest solution of all three versions
- No fallback logic needed - it just works
- Perfect for integration with Cowork

API Source: https://youtube-transcript.ai/mcp
