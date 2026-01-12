# Phase 3 Implementation Plan: Canvas-Based Video Composition

**Approach**: Option A - Real-time Canvas Composition
**Agent**: Ralph (Autonomous)
**Status**: Ready to Execute
**Created**: 2026-01-12

## Executive Summary

Implement a canvas-based video compositor that renders host avatar and guest webcam feeds in real-time based on active speaker detection, then captures the composed canvas as the final recording stream.

## Implementation Strategy

### Core Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    VideoCompositor Service                   │
├─────────────────────────────────────────────────────────────┤
│  Inputs:                                                     │
│  - Guest webcam stream (from getUserMedia)                  │
│  - Host avatar image + animated video                        │
│  - Active speaker signal (from CameraSwitcher)              │
│                                                              │
│  Processing:                                                 │
│  - Render to 1280x720 canvas at 30fps                      │
│  - Fade transitions between speakers (200ms)                │
│  - Apply VirtualStudio background for guest                 │
│                                                              │
│  Output:                                                     │
│  - MediaStream from canvas.captureStream(30)                │
└─────────────────────────────────────────────────────────────┘
```

## Detailed Implementation Tasks

### Task 1: Create VideoCompositor Service

**File**: `frontend-web/src/services/videoCompositor.ts`

**Responsibilities**:
- Create and manage canvas element (1280x720)
- Render loop at 30fps using `requestAnimationFrame`
- Handle speaker switching with fade transitions
- Capture and return MediaStream

**Key Methods**:
```typescript
class VideoCompositor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private guestVideo: HTMLVideoElement;
  private hostImage: HTMLImageElement;
  private hostAnimatedVideo?: HTMLVideoElement;
  private activeSpeaker: 'host' | 'guest' = 'guest';
  private fadeProgress: number = 1; // 0-1

  constructor(
    guestStream: MediaStream,
    hostAvatarUrl: string,
    hostAnimatedVideoUrl?: string
  ) { /* ... */ }

  start(): MediaStream {
    // Create canvas and capture stream
    // Start render loop
    return this.canvas.captureStream(30);
  }

  setActiveSpeaker(speaker: 'host' | 'guest'): void {
    // Trigger fade transition
  }

  private renderFrame(): void {
    // Clear canvas
    // Render based on activeSpeaker with fadeProgress
    // requestAnimationFrame(this.renderFrame)
  }

  dispose(): void {
    // Cleanup resources
  }
}
```

**Integration Points**:
- Guest stream: from `navigator.mediaDevices.getUserMedia()`
- Host assets: from `STUDIO_AVATARS` and `STUDIO_VIDEO_PREVIEWS`
- Speaker detection: from `cameraSwitcher.getActiveSpeaker()`

### Task 2: Integrate with Recording Setup

**File**: `frontend-web/src/App.tsx`

**Changes in `setupRecording()` function** (lines 165-244):

**Current Flow**:
```typescript
// Line 169: Get guest webcam
const guestStream = await getUserMedia(...);

// Line 231-233: Create final stream (BROKEN)
const finalStream = new MediaStream();
guestStream.getVideoTracks().forEach(t => finalStream.addTrack(t));
mixedDest.stream.getAudioTracks().forEach(t => finalStream.addTrack(t));

// Line 235: Record (only records guest webcam!)
const recorder = new MediaRecorder(finalStream, {...});
```

**New Flow**:
```typescript
// 1. Get guest webcam
const guestStream = await getUserMedia(...);

// 2. Create VideoCompositor
const compositor = new VideoCompositor(
  guestStream,
  STUDIO_AVATARS[vibe],
  animateAvatar ? STUDIO_VIDEO_PREVIEWS[vibe] : undefined
);
compositorRef.current = compositor; // Store for cleanup

// 3. Get composed video stream
const composedVideoStream = compositor.start();

// 4. Create final stream with composed video + mixed audio
const finalStream = new MediaStream();
composedVideoStream.getVideoTracks().forEach(t => finalStream.addTrack(t));
mixedDest.stream.getAudioTracks().forEach(t => finalStream.addTrack(t));

// 5. Record the properly composed stream
const recorder = new MediaRecorder(finalStream, {
  mimeType: 'video/webm;codecs=vp8,opus'
});
```

**Additional Changes**:
- Add `compositorRef` ref at top of App component
- Update compositor speaker state when `cameraSwitcher` detects changes
- Dispose compositor in `handleEndSession()`

### Task 3: Connect Speaker Detection

**Changes in speaker detection logic** (around line 155-163):

```typescript
// In volumeLoop function
const speakerResult = cameraSwitcherRef.current.processVolumes(
  hostVol, guestVol, Date.now()
);

// NEW: Update compositor when speaker changes
if (speakerResult.activeSpeaker !== activeSpeaker) {
  setActiveSpeaker(speakerResult.activeSpeaker);

  // Update compositor
  if (compositorRef.current) {
    compositorRef.current.setActiveSpeaker(
      speakerResult.activeSpeaker === 'HOST' ? 'host' : 'guest'
    );
  }
}
```

### Task 4: Render Logic Details

**Guest View Rendering**:
```typescript
private renderGuestView(): void {
  // If VirtualStudio is handling background removal,
  // we need to get that processed canvas
  // Option 1: VirtualStudio exposes its composite canvas
  // Option 2: We recreate background removal here (duplicate work)

  // For Phase 3, let's use the simpler approach:
  // Draw the raw guest video and accept no background removal in recording
  // OR integrate with VirtualStudio's canvas output

  this.ctx.drawImage(
    this.guestVideo,
    0, 0,
    this.canvas.width,
    this.canvas.height
  );
}
```

**Host View Rendering**:
```typescript
private renderHostView(): void {
  // Draw static avatar
  this.ctx.drawImage(
    this.hostImage,
    0, 0,
    this.canvas.width,
    this.canvas.height
  );

  // If animated video and host is talking, overlay it
  if (this.hostAnimatedVideo && this.isHostTalking) {
    this.ctx.globalAlpha = 0.3; // Semi-transparent overlay
    this.ctx.drawImage(
      this.hostAnimatedVideo,
      0, 0,
      this.canvas.width,
      this.canvas.height
    );
    this.ctx.globalAlpha = 1.0;
  }
}
```

**Fade Transition**:
```typescript
private renderFrame(): void {
  // Update fade progress
  if (this.fadeProgress < 1) {
    this.fadeProgress = Math.min(1, this.fadeProgress + 0.05); // ~200ms
  }

  // Render both views
  if (this.activeSpeaker === 'guest') {
    this.renderGuestView();
    if (this.fadeProgress < 1) {
      // Fade in guest, fade out host
      this.ctx.globalAlpha = 1 - this.fadeProgress;
      this.renderHostView();
      this.ctx.globalAlpha = 1;
    }
  } else {
    this.renderHostView();
    if (this.fadeProgress < 1) {
      // Fade in host, fade out guest
      this.ctx.globalAlpha = 1 - this.fadeProgress;
      this.renderGuestView();
      this.ctx.globalAlpha = 1;
    }
  }

  requestAnimationFrame(() => this.renderFrame());
}
```

## Critical Considerations

### 1. VirtualStudio Integration Challenge

**Problem**: VirtualStudio component uses TensorFlow.js to remove background from guest webcam. We need that processed output in our compositor.

**Solutions**:
- **Option A.1**: Have VirtualStudio expose its composite canvas via ref/callback
- **Option A.2**: Move background removal into VideoCompositor (more complex)
- **Option A.3**: For Phase 3, record raw webcam without background removal (simplest)

**Recommendation**: Start with **Option A.3** to get basic composition working, then enhance with background removal in a follow-up.

### 2. Performance Considerations

- Canvas rendering at 30fps + background removal = CPU intensive
- Monitor performance on lower-end devices
- Consider reducing canvas resolution if needed (720p → 480p)

### 3. Aspect Ratio Consistency

- Canvas: 1280x720 (16:9)
- Guest webcam: may vary, use `object-fit: cover` logic
- Host avatar images: pre-sized to 16:9

## File Structure

```
frontend-web/src/
├── services/
│   ├── videoCompositor.ts       [NEW] - Main compositor class
│   ├── cameraSwitcher.ts         [MODIFY] - Already exists
│   └── geminiService.ts          [NO CHANGE]
├── components/
│   └── VirtualStudio.tsx         [CONSIDER] - May need to expose canvas
└── App.tsx                       [MODIFY] - Integrate compositor
```

## Testing Strategy

### Phase 1: Compositor Isolated Testing
1. Create simple test page with compositor
2. Verify canvas renders correctly
3. Test speaker switching
4. Verify captureStream() works

### Phase 2: Integration Testing
1. Record 2-minute test session
2. Verify host avatar appears during AI speech
3. Verify guest webcam appears during user speech
4. Check audio/video sync
5. Validate file size and quality

### Phase 3: Cross-Browser Testing
- Chrome (primary)
- Edge
- Safari (if applicable)

## Success Metrics

- ✅ Recorded video shows host avatar when AI speaks
- ✅ Recorded video shows guest webcam when user speaks
- ✅ Transitions are smooth (< 200ms)
- ✅ No audio/video desync
- ✅ 30fps maintained throughout
- ✅ File size < 50MB for 5min recording

## Rollback Plan

If compositor causes issues:
1. Revert to current recording (guest-only video)
2. Add "Video Composition: Beta" flag in settings
3. Let users opt-in to new compositor

## Ralph Execution Instructions

**Ralph**, please implement Phase 3 using the following approach:

### Step 1: Create VideoCompositor Service
- Create `frontend-web/src/services/videoCompositor.ts`
- Implement the class structure outlined above
- Start with **Option A.3** (no background removal for now)
- Focus on clean speaker switching with fade transitions

### Step 2: Integrate with App.tsx
- Add `compositorRef` ref
- Modify `setupRecording()` to use VideoCompositor
- Connect speaker detection to compositor
- Add cleanup in `handleEndSession()`

### Step 3: Test and Validate
- Create a test recording
- Verify compositor output quality
- Check for any performance issues
- Validate audio/video sync

### Step 4: Commit and Document
- Commit changes with clear messages
- Update PHASE_3_PRD.md with "COMPLETED" status
- Note any issues or follow-up items

**Begin implementation autonomously. Report progress and any blockers.**

---

**Ready to Execute**: YES ✅
**Estimated Implementation Time**: 2-3 hours
**Priority**: CRITICAL - Blocks Phase 2 ship
