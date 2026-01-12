# Phase 3: Video Composition Fix

**Status**: Planning
**Priority**: CRITICAL
**Created**: 2026-01-12

## Problem Statement

The mixed video recording is not properly compositing the host avatar and guest webcam feeds. This is a core functionality issue that prevents the product from delivering its primary value proposition - creating professional dual-perspective interview recordings.

## Current Behavior

Based on user feedback: "the mixed video is not mixing well"

The final recorded video (`.videoUrl` in sessions) should show:
- **During AI speaking**: Host avatar (static image + optional animated overlay)
- **During user speaking**: Guest webcam with virtual background removal

## Expected Behavior

The mixed video should seamlessly blend:
1. **Host Feed** (when AI is talking):
   - Static avatar image as base
   - Animated video overlay during speech (if avatar animation enabled)
   - Smooth transitions between speaking/listening states

2. **Guest Feed** (when user is talking):
   - User's webcam with background removal applied
   - Virtual studio background composited behind user
   - Proper aspect ratio and framing

3. **Smooth Transitions**:
   - Fade or cross-dissolve between host and guest views
   - No jarring cuts or visual glitches
   - Maintain consistent framing throughout

## Technical Context

### Current Recording Architecture

Located in [App.tsx:165-244](frontend-web/src/App.tsx#L165-L244):

```typescript
const setupRecording = async () => {
  // Line 169: getUserMedia for guest stream
  const guestStream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true }, video: { width: 1280, height: 720 }
  });

  // Line 231-233: Creates final mixed stream
  const finalStream = new MediaStream();
  guestStream.getVideoTracks().forEach(t => finalStream.addTrack(t));
  mixedDest.stream.getAudioTracks().forEach(t => finalStream.addTrack(t));

  // Line 235: Records finalStream
  const recorder = new MediaRecorder(finalStream, {
    mimeType: 'video/webm;codecs=vp8,opus'
  });
}
```

**Current Issue**: The finalStream only contains:
- Guest video tracks (webcam)
- Mixed audio tracks (host + guest audio)

**Missing**: The host avatar video is NOT being added to the final recording stream.

### What Needs Investigation

1. **Canvas Composition**: Should we use a Canvas element to composite host + guest feeds?
2. **MediaStream from Canvas**: Use `canvas.captureStream()` to create a mixed video track
3. **Timing Synchronization**: Ensure speaker switching matches the recorded video
4. **Active Speaker Detection**: Already implemented in [cameraSwitcher.ts](frontend-web/src/services/cameraSwitcher.ts)

## Proposed Solution

### Option A: Canvas-Based Composition (Recommended)

Create a hidden canvas that continuously renders:
- Host avatar (with animated overlay during AI speech)
- Guest webcam with background removal
- Use `cameraSwitcher` to determine which feed is dominant
- Capture canvas stream with `canvas.captureStream(30)` for smooth 30fps

**Pros**:
- Full control over composition
- Can add effects, transitions, overlays
- Works with existing speaker detection

**Cons**:
- Higher CPU usage
- More complex implementation

### Option B: Dual-Track Recording + Post-Processing

Record separate tracks:
- Track 1: Guest webcam
- Track 2: Host avatar video (from animated video elements)
- Metadata: Speaker timing info
- Backend service stitches tracks based on timing

**Pros**:
- Lower frontend CPU usage
- More flexibility in post-processing

**Cons**:
- Requires backend video processing
- Delayed final video delivery
- Infrastructure complexity

## Success Criteria

- [ ] Recorded video shows host avatar when AI speaks
- [ ] Recorded video shows guest webcam when user speaks
- [ ] Transitions between speakers are smooth (< 200ms)
- [ ] Video quality maintained at 720p minimum
- [ ] No audio/video sync issues
- [ ] Recording works on Chrome, Edge, Safari
- [ ] Canvas rendering doesn't cause frame drops

## User Stories

**US-015**: As a user, I want my recorded videos to show both me and the AI host clearly, so the final video looks like a professional interview.

**Acceptance Criteria**:
- When I play back a recorded session, I see the host avatar during AI questions
- When I play back a recorded session, I see myself during my responses
- The video quality is clear and professional
- Audio is perfectly synced with video
- Transitions don't have visual glitches

## Technical Tasks

### 1. Research & Investigation
- [ ] Analyze current recording flow in `setupRecording()`
- [ ] Test canvas composition performance
- [ ] Verify `captureStream()` browser compatibility
- [ ] Determine optimal canvas size (1280x720 or 1920x1080)

### 2. Canvas Compositor Implementation
- [ ] Create `VideoCompositor` service class
- [ ] Render host avatar to canvas during AI speech
- [ ] Render guest webcam to canvas during user speech
- [ ] Add smooth fade transitions
- [ ] Capture canvas stream at 30fps

### 3. Recording Integration
- [ ] Replace `finalStream` with canvas stream
- [ ] Maintain audio mixing (already working)
- [ ] Test recording quality and performance
- [ ] Verify video file size and codec

### 4. Testing
- [ ] Record 5-minute test session
- [ ] Verify speaker transitions
- [ ] Check audio/video sync
- [ ] Test on multiple browsers
- [ ] Load test with long sessions (30+ min)

## Dependencies

- Existing: `cameraSwitcher.ts` (speaker detection)
- Existing: `VirtualStudio.tsx` (guest webcam processing)
- Existing: Avatar images and animated videos in `constants.ts`
- New: Canvas compositor service

## Timeline Estimate

- Research & Design: 1 session
- Implementation: 2-3 sessions
- Testing & Refinement: 1 session

**Total**: ~4-5 focused work sessions

## Related Files

- `frontend-web/src/App.tsx` - Recording setup
- `frontend-web/src/services/cameraSwitcher.ts` - Speaker detection
- `frontend-web/src/components/VirtualStudio.tsx` - Guest webcam processing
- `frontend-web/src/config/constants.ts` - Avatar assets

## Notes

This is a **CRITICAL** bug fix that blocks shipping Phase 2. The product cannot deliver value without proper video composition. Should be prioritized immediately after current UI fixes are validated.

---

**Next Steps**: Begin research phase to determine optimal implementation approach (Option A vs Option B).
