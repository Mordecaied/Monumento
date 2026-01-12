# Content Sharing Testing Guide

## Quick Start

This folder should contain sample files for testing all content types. Add files here for comprehensive testing.

## Required Test Files

### Images (✅ Priority)
1. **sample-chart.png** - Chart/diagram (landscape)
2. **sample-photo.jpg** - Regular photo (4:3 or 16:9)
3. **sample-wide.png** - Ultra-wide image (21:9 or wider)
4. **sample-tall.jpg** - Tall/portrait image (9:16)
5. **sample-large.jpg** - Large file size (>2MB) to test scaling

### Documents (✅ Priority)
1. **sample.pdf** - Multi-page PDF (3-5 pages)
2. **sample-single.pdf** - Single page PDF
3. **sample.docx** - Word document
4. **sample.pptx** - PowerPoint presentation

### Videos (✅ Priority)
1. **sample-video.mp4** - Short video clip (10-30 seconds, H.264 codec)
2. **sample-wide.mp4** - Wide aspect ratio video (21:9)
3. **sample-vertical.mp4** - Vertical/portrait video (9:16)

### Audio (Optional)
1. **sample-audio.mp3** - Audio file (30-60 seconds)
2. **sample-podcast.mp3** - Longer audio clip (2-3 minutes)

## How to Create Test Files

### Using Windows Screenshots/Screen Recording:
1. **Images**: Use Snipping Tool (Win+Shift+S) to capture charts, calendars, diagrams
2. **PDFs**: Print any document to PDF
3. **Videos**: Use Xbox Game Bar (Win+G) to record screen

### Where to Find Free Test Content:
- **Images**: Unsplash.com, Pexels.com
- **PDFs**: Any document saved as PDF
- **Videos**: Sample videos from phone camera or screen recordings

## Testing Checklist

### Image Testing
- [ ] Image displays centered and fully visible
- [ ] No parts of image are cut off
- [ ] Image scales down if too large
- [ ] PiP windows don't overlap content
- [ ] Close button is visible and clickable

### Document Testing
- [ ] PDF opens in iframe viewer
- [ ] Can scroll through multi-page PDFs
- [ ] Single page PDF displays correctly
- [ ] Non-PDF documents show download button
- [ ] Downloaded files open correctly

### Video Testing
- [ ] Video plays automatically when shared
- [ ] Video controls (play/pause/seek) work
- [ ] Video fits within viewport (85% max)
- [ ] Audio syncs with video
- [ ] PiP windows don't overlap video player

### Layout Testing
- [ ] PiP windows positioned top-right
- [ ] Host window above guest window
- [ ] Both PiP windows below Close button
- [ ] Content centered in available space
- [ ] Nothing extends beyond screen edges

## Expected Behavior

### Content Display Sizes
- **Images**: Max 100% of viewport minus padding (auto-scaled)
- **Videos**: Max 85% of viewport with minimum controls visibility
- **PDFs**: 85% of viewport width and height
- **Audio/Documents**: Centered card with fixed max-width

### PiP Window Placement
- **Position**: Top-right corner
- **Host**: 8rem from top, 2rem from right
- **Guest**: Below host with proper spacing
- **Size**: 12rem x 12rem (192px x 192px)

## Common Issues

### Image Cut Off
- **Cause**: Image too large for viewport
- **Fix**: Images now auto-scale with max-w-full max-h-full

### Video Not Playing
- **Cause**: Codec not supported or autoplay blocked
- **Fix**: Use H.264 codec MP4 files, includes controls

### PiP Overlapping Content
- **Cause**: Content extends into PiP area
- **Fix**: Content constrained to left 85% of screen

## File Size Limits

For smooth performance:
- Images: < 5MB
- Documents: < 10MB
- Videos: < 50MB
- Audio: < 10MB

## Test Scenarios

### Scenario 1: Basketball Practice Plan
Upload the U12 Girls Practice Plan image and verify:
- Full practice plan visible
- Drill diagrams readable
- Timeline sections clear
- PiP windows don't cover any drills

### Scenario 2: Calendar Review
Upload a large calendar image and verify:
- All months visible
- Text readable at scaled size
- Colors maintain quality
- No cropping on edges

### Scenario 3: Video Playback
Upload a screen recording and verify:
- Video loads and plays
- Controls accessible
- Audio plays clearly
- Can seek through timeline

---

**Last Updated**: 2026-01-12
**Test Status**: Ready for comprehensive testing
