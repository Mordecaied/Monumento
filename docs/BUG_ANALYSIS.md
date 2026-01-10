# Monumento - Bug Analysis & Fixes

## Bug #1: Voice Mismatch ✅ FIXED (Partial)

### Root Cause:
- **Preview**: Uses browser `SpeechSynthesis` API with custom pitch/rate
- **Interview**: Uses Gemini native voices (Kore, Puck, Zephyr, Fenrir, Charon)
- Completely different voice engines!

### Fix Applied:
1. Improved voice selection logic to match gender
2. Added user-visible disclaimer about preview quality

### Complete Fix (Requires Backend):
```typescript
// Server endpoint to generate actual Gemini voice previews
POST /api/preview-voice
{
  "vibe": "The Historian",
  "text": "Sample preview text"
}

Response: {
  "audioUrl": "https://cdn.monumento.app/previews/historian_sample.mp3"
}
```

**Action Item for V2:** Pre-generate all 5 voice samples and cache in Cloudflare R2

---

## Bug #2: Video/Transcript Sync ⚠️ CRITICAL

### Root Cause:
The sync logic in `SessionDetail.tsx` (lines 74-122) uses **estimated timing** instead of actual word-level timestamps.

### Current Logic Issues:

```typescript
// Lines 108-119: Problem code
const sentenceIdx = Math.floor((timeInMsg / msgDuration) * sentences.length);
const words = sentence.trim().split(/\s+/);
const wordIdx = Math.floor((timeInSentence / sentenceDuration) * words.length);
```

**Problems:**
1. **Divides time equally** across all sentences (unrealistic)
2. **Assumes constant speech rate** (people speed up/slow down)
3. **No actual timestamps** from Gemini transcription
4. **Drift accumulates** over long interviews (60min = severely out of sync)

### Example of Drift:

```
Actual Speech:
[0-5s]  "Hello... (pause) ...welcome"
[5-8s]  "Today we'll talk about your life"

Current Estimate:
[0-3.3s] "Hello... (pause) ...welcome"    <-- Too fast!
[3.3-6.6s] "Today we'll talk about..."     <-- Wrong timing!
```

### Why This Happens:
Gemini's transcription API returns:
```json
{
  "outputTranscription": {
    "text": "Hello welcome to the studio"
    // ❌ NO WORD-LEVEL TIMESTAMPS!
  }
}
```

### Complete Fix (Requires Architecture Change):

#### **Option 1: Use Gemini's Timing Data (If Available)**
Check if Gemini 2.5 Flash API provides word-level timestamps:
```typescript
// Ideal response format (needs verification)
{
  "outputTranscription": {
    "text": "Hello welcome",
    "words": [
      { "word": "Hello", "startTime": 0.0, "endTime": 0.5 },
      { "word": "welcome", "startTime": 0.7, "endTime": 1.2 }
    ]
  }
}
```

#### **Option 2: Use Secondary Transcription Service**
Run parallel transcription with word-level timing:
```typescript
// Use OpenAI Whisper or Google Speech-to-Text
POST /api/transcribe-with-timing
{
  "audioChunks": [...],
  "includeWordTimestamps": true
}

Response: {
  "words": [
    { "word": "Hello", "start": 0.0, "end": 0.5, "confidence": 0.98 },
    { "word": "welcome", "start": 0.7, "end": 1.2, "confidence": 0.95 }
  ]
}
```

**Cost Comparison:**
- Whisper API: $0.006/minute (very cheap!)
- Google Speech-to-Text: $0.016/minute
- AWS Transcribe: $0.024/minute

#### **Option 3: Phoneme-Based Estimation (Complex)**
Use a phoneme dictionary to estimate word durations:
```typescript
const estimateWordDuration = (word: string) => {
  const phonemes = getPhonemes(word); // "hello" → ["h", "eh", "l", "ow"]
  const baseDuration = phonemes.length * 0.08; // ~80ms per phoneme
  return baseDuration;
};
```

### Recommended Solution for V2:

**Use Whisper API for word-level timestamps:**

1. During recording, save audio chunks
2. After recording ends, send audio to Whisper API
3. Merge Gemini transcript with Whisper timestamps
4. Store in database:

```sql
CREATE TABLE transcript_words (
  id SERIAL PRIMARY KEY,
  session_id UUID,
  word TEXT,
  start_time_ms INT,
  end_time_ms INT,
  speaker ENUM('host', 'guest'),
  confidence DECIMAL(3,2)
);
```

5. Frontend fetches word-level data for perfect sync:

```typescript
const syncLoop = () => {
  const curr = videoRef.current.currentTime * 1000;

  // Binary search for current word
  const currentWord = binarySearchWord(words, curr);

  setActiveSentence(currentWord.sentence);
  setReplayWordIdx(currentWord.indexInSentence);
};
```

### Temporary Improvement (Current Codebase):

Add better heuristics:
```typescript
// Adjust for speech patterns
const estimatedDuration = (text: string) => {
  const words = text.split(/\s+/);
  let duration = 0;

  words.forEach(word => {
    // Longer words take more time
    duration += Math.max(200, word.length * 80);

    // Add pause for punctuation
    if (word.match(/[.!?]$/)) duration += 300;
    if (word.match(/[,;]$/)) duration += 150;
  });

  return duration;
};
```

**Cost for V2:** ~$0.006/min × 20min = $0.12 per session (negligible)

---

## Bug #3: Multiple File Downloads 🔄 EASY FIX

### Current Behavior:
```typescript
// App.tsx lines 247-256
// Creates 2 separate download links
const vLink = document.createElement('a');
vLink.href = URL.createObjectURL(videoBlob);
vLink.download = `monumento_raw_footage_${sessionId}.webm`;
vLink.click(); // Download 1

const lLink = document.createElement('a');
lLink.href = URL.createObjectURL(new Blob([JSON.stringify(newSession, null, 2)]));
lLink.download = `monumento_metadata_${sessionId}.json`;
lLink.click(); // Download 2
```

### Fix: Bundle into ZIP

```typescript
import JSZip from 'jszip'; // Add to dependencies

const finalizeSession = async () => {
  const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
  const sessionId = Date.now().toString();

  // Create ZIP bundle
  const zip = new JSZip();
  zip.file(`video.webm`, videoBlob);
  zip.file(`metadata.json`, JSON.stringify(newSession, null, 2));
  zip.file(`transcript.txt`, generatePlainTextTranscript(messages));

  // Generate and download
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(zipBlob);
  link.download = `monumento_session_${sessionId}.zip`;
  link.click();
};
```

**Cost:** JSZip library = 0 bytes (client-side compression)

---

## Bug #4: Transcript Editing Removes Video Segments ⚠️ COMPLEX

### Current State:
- SessionDetail.tsx (line 114) has "Edit" button
- BUT no actual editing functionality implemented
- Video segments cannot be removed

### Required Implementation:

#### Frontend Changes:
```typescript
// SessionDetail.tsx
const [editMode, setEditMode] = useState(false);
const [editedPairs, setEditedPairs] = useState(pairs);

const deletePair = (index: number) => {
  // Remove from UI
  const updated = editedPairs.filter((_, i) => i !== index);
  setEditedPairs(updated);

  // Recalculate timestamps
  const recalculated = recalculateTimestamps(updated);

  // Send to backend for video re-processing
  reprocessVideo(session.id, recalculated);
};
```

#### Backend API (NEW - Requires Spring Boot):
```java
@PostMapping("/api/sessions/{id}/reprocess")
public ResponseEntity<Session> reprocessVideo(
  @PathVariable String id,
  @RequestBody List<TranscriptPair> pairs
) {
  // 1. Load original video from storage
  VideoFile original = storageService.getVideo(id);

  // 2. Calculate segments to keep
  List<VideoSegment> segments = pairs.stream()
    .map(pair -> new VideoSegment(pair.getStartTime(), pair.getEndTime()))
    .collect(Collectors.toList());

  // 3. Use FFmpeg to cut and concatenate
  String ffmpegCommand = buildFFmpegCommand(segments);
  VideoFile processed = ffmpegService.process(original, ffmpegCommand);

  // 4. Upload new version
  String newUrl = storageService.upload(processed);

  // 5. Update database
  sessionRepository.updateVideoUrl(id, newUrl);

  return ResponseEntity.ok(sessionRepository.findById(id));
}
```

#### FFmpeg Command Builder:
```java
private String buildFFmpegCommand(List<VideoSegment> segments) {
  StringBuilder cmd = new StringBuilder("ffmpeg ");

  // Input
  cmd.append("-i input.webm ");

  // Create filter complex for segments
  cmd.append("-filter_complex \"");
  for (int i = 0; i < segments.size(); i++) {
    VideoSegment seg = segments.get(i);
    cmd.append(String.format(
      "[0:v]trim=start=%.3f:end=%.3f,setpts=PTS-STARTPTS[v%d]; ",
      seg.startTime, seg.endTime, i
    ));
    cmd.append(String.format(
      "[0:a]atrim=start=%.3f:end=%.3f,asetpts=PTS-STARTPTS[a%d]; ",
      seg.startTime, seg.endTime, i
    ));
  }

  // Concatenate all segments
  for (int i = 0; i < segments.size(); i++) {
    cmd.append(String.format("[v%d][a%d]", i, i));
  }
  cmd.append(String.format("concat=n=%d:v=1:a=1[outv][outa]\" ", segments.size()));
  cmd.append("-map \"[outv]\" -map \"[outa]\" output.webm");

  return cmd.toString();
}
```

**Complexity:** HIGH - Requires full backend + video processing pipeline

---

## Bug #5: Segmented Progress Bar 📊 MEDIUM

### Current State:
Standard HTML5 video progress bar (no segments)

### Desired State (Like YouTube Chapters):
```
[■■■ Q1: "Tell me about..." ■■■][■■ A1 ■■][■■■■ Q2 ■■■■][■ A2 ■]
```

### Implementation:

```typescript
// SessionDetail.tsx
const SegmentedProgressBar = ({ pairs, currentTime, duration, onSeek }) => {
  return (
    <div className="relative w-full h-2 bg-white/10 rounded-full overflow-hidden">
      {pairs.map((pair, i) => {
        const startPercent = (pair.startTime / duration) * 100;
        const widthPercent = ((pair.endTime - pair.startTime) / duration) * 100;
        const isActive = currentTime >= pair.startTime && currentTime < pair.endTime;

        return (
          <div
            key={i}
            className={`absolute h-full cursor-pointer transition-all ${
              isActive ? 'bg-purple-500' : 'bg-purple-800/50'
            } hover:bg-purple-400`}
            style={{
              left: `${startPercent}%`,
              width: `${widthPercent}%`
            }}
            onClick={() => onSeek(pair.startTime)}
          >
            {/* Segment divider */}
            {i < pairs.length - 1 && (
              <div className="absolute right-0 top-0 w-px h-full bg-black/50" />
            )}

            {/* Hover tooltip */}
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/90 px-3 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {pair.type === 'q' ? 'Question' : 'Answer'}: {pair.preview}...
            </div>
          </div>
        );
      })}

      {/* Current playhead */}
      <div
        className="absolute top-0 h-full w-1 bg-white shadow-lg"
        style={{ left: `${(currentTime / duration) * 100}%` }}
      />
    </div>
  );
};
```

**Complexity:** MEDIUM - Pure frontend, no backend needed

---

## Priority for Immediate Fixes:

1. ✅ **Bug #1** - Fixed (partial)
2. ⏳ **Bug #3** - Easy, can fix now (add JSZip)
3. ⏳ **Bug #5** - Medium, can fix now (pure frontend)
4. ⚠️ **Bug #2** - Requires backend or Whisper integration
5. ⚠️ **Bug #4** - Requires full backend + FFmpeg

---

## Recommended Approach:

### Phase 1 (This Week):
- [x] Fix Bug #1 (voice preview disclaimer)
- [ ] Fix Bug #3 (bundle downloads)
- [ ] Fix Bug #5 (segmented progress bar)

### Phase 2 (After Backend is Built):
- [ ] Fix Bug #2 (integrate Whisper for word timestamps)
- [ ] Fix Bug #4 (video editing with FFmpeg)

---

## Estimated Costs for Complete Fixes:

| Bug | Solution | Monthly Cost (1000 users) |
|-----|----------|---------------------------|
| #1  | Pre-cache Gemini samples | $0 (one-time generation) |
| #2  | Whisper API timestamps | $12 ($0.006/min × 20min × 100 sessions) |
| #3  | JSZip library | $0 (client-side) |
| #4  | FFmpeg processing | $24 ($0.02/min × 20min × 60 edits) |
| #5  | Frontend only | $0 |

**Total: ~$36/month for 1000 active users**

With 80% margin on pricing, this is easily covered!
