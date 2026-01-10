# 🎬 Monumento - Demo Guide
**How to Test All the Bug Fixes**

---

## 🌐 **Open the App**

The dev server is running at: **http://localhost:3000**

Open this in your browser to begin testing!

---

## ✅ **Bug Fix #1: Voice Mismatch**

### What Was Fixed:
- Better voice selection for previews
- Added disclaimer about preview accuracy

### How to Test:

1. **Start at the homepage**
   - Click "Auto-Pilot" or "Director" mode

2. **Look for the blue info banner** (NEW!)
   - You should see: *"Voice previews are approximate. Actual interview voices will be higher quality..."*
   - This sets proper expectations for users

3. **Select a Studio Host**
   - Hover over any host avatar
   - Click the "Voice Test" button
   - Listen to the preview voice

4. **Notice:**
   - Voice now attempts to match the gender from config
   - On Windows: Will use David (male) or Zira (female) voices
   - On Mac: Will use Alex (male) or Samantha (female) voices
   - Still not perfect, but better than before!

### **What You'll See:**
```
┌────────────────────────────────────────────────┐
│  ℹ️  Voice previews are approximate. Actual   │
│     interview voices will be higher quality    │
│     and match your host's personality.         │
└────────────────────────────────────────────────┘
```

### **Long-term Fix:**
Once backend is built, we'll pre-record actual Gemini voice samples for each host!

---

## ✅ **Bug Fix #3: Single ZIP Download**

### What Was Fixed:
- Changed from 2 separate files to 1 bundled ZIP

### How to Test:

1. **Create a test recording:**
   - Select any mode & host
   - Choose "Express" (5 min) tier
   - Click "Enter Production Studio"
   - Allow camera/mic permissions

2. **Start interview:**
   - Wait for countdown (3... 2... 1... ACTION!)
   - Say a few sentences when prompted
   - Click "Wrap Session"

3. **Wait for production:**
   - Progress bar shows packaging process
   - New step appears: "Packaging files..."

4. **Check your Downloads folder:**
   - Look for: `monumento_session_[timestamp].zip`
   - Should be ONE file, not two!

### **Unzip the file to see:**
```
monumento_session_123456789.zip
├── video.webm          (Your full recording)
├── transcript.txt      (Timestamped plain text)
├── metadata.json       (Session data)
└── README.md           (Session details & info)
```

### **Before vs After:**

**Before (Bug):**
- `monumento_raw_footage_123456789.webm`
- `monumento_metadata_123456789.json`
- User has to manage 2 files separately
- No transcript file
- No documentation

**After (Fixed):**
- `monumento_session_123456789.zip` (one clean file!)
- Includes 4 files inside:
  - Video, transcript (NEW!), metadata, README (NEW!)
- Professional archiving format
- Compressed (smaller size)

---

## ✅ **Bug Fix #5: Segmented Progress Bar**

### What Was Fixed:
This was already implemented perfectly! We just verified it works.

### How to Test:

1. **Go to History** (after creating a session):
   - Click "Archives" button on homepage

2. **Select a session:**
   - Click any session card
   - Click "Cinematic Replay" button

3. **Watch the segmented progress bar:**

### **Features to Test:**

#### 1. **Visual Segments**
```
[■■■■■ Q1 ■■■■■] [■■ A1 ■■] [■■■■ Q2 ■■■■] [■ A2 ■]
```
- Each Q&A pair is a separate segment
- Different widths based on duration
- Green progress bar fills within each segment

#### 2. **Hover Tooltips**
- Hover over any segment
- Popup appears showing:
  - Segment number
  - Time range (e.g., "0s - 15s")
  - Preview text of the question/answer

#### 3. **Click to Jump**
- Click any segment
- Video jumps to that timestamp
- Instant navigation through your interview!

#### 4. **Active Segment Indicator**
- Top of active segment glows
- "Segment X of Y" shows at bottom
- Progress bar fills in real-time

#### 5. **Current Time Display**
```
┌─────────────────────────────────────────┐
│ 45s / 300s Total Duration               │
│ • Broadcast Feed (Host)                 │
│ Segment 3 of 12                         │
└─────────────────────────────────────────┘
```

### **Compare to YouTube:**
This is exactly like YouTube's chapter markers!
- Professional design
- Smooth animations
- Intuitive UX
- Hover previews

---

## 📸 **Screenshots to Look For:**

### 1. **Homepage - New Disclaimer:**
![Disclaimer Banner](mockup: Blue info banner above host selection)

### 2. **Production Step:**
![Packaging Step](mockup: Progress bar showing "Packaging files...")

### 3. **Segmented Progress Bar:**
![Segments](mockup: Colored bars with hover tooltips)

---

## 🐛 **Bugs #2 & #4 - Not Fixed Yet**

### Bug #2: Video/Transcript Sync
**Status:** Requires backend + Whisper API

**What You'll Notice:**
- During replay, words may not sync perfectly
- Especially noticeable in longer sessions
- This is expected until we integrate Whisper

**How to Test the Issue:**
1. Record a 5-minute session
2. Watch the replay
3. Notice: Captions drift slightly from audio
4. This will be fixed in Phase 2 with word-level timestamps

### Bug #4: Transcript Editing
**Status:** Requires backend + FFmpeg

**What You'll Notice:**
- "Edit Script" button exists
- But clicking it doesn't actually edit anything
- Removing Q&A pairs doesn't regenerate video

**How to Test the Issue:**
1. Open any session
2. Click "Edit Script"
3. Select Q&A pairs (checkboxes appear)
4. Click "Remove Selected"
5. Nothing happens (expected)
6. Will be implemented in Phase 2

---

## 🎯 **Additional Features to Test:**

### **Photo Upload (NEW!):**
1. Select "Director" mode
2. Scroll to "Context Photos (Optional)"
3. Click "Add Photos"
4. Upload 1-3 images
5. See them in a grid
6. Hover to see delete button

### **Error Handling (NEW!):**
1. Try to break something (close camera permission, etc.)
2. Instead of white screen crash
3. You should see a nice error page:
```
┌─────────────────────────────────┐
│  ⚠️  Something Went Wrong      │
│                                 │
│  [Error message]                │
│                                 │
│  [ Try Again ]  [ Reload Page ] │
└─────────────────────────────────┘
```

---

## 💡 **Pro Tips:**

### **Test the Full Flow:**
1. Homepage → Select Mode
2. Choose Host & Tier
3. (Director mode) Add topics/photos
4. Start Interview
5. Have short conversation
6. Wrap Session
7. Download ZIP
8. Open History
9. Replay with segments
10. Test navigation

### **Test Edge Cases:**
- Cancel during countdown
- Deny camera permission
- Record very short session (30 sec)
- Record longer session (2-3 min)
- Upload many photos
- Add many topics

### **Performance Check:**
- Does UI feel responsive?
- Any lag during recording?
- Smooth progress bar animations?
- Fast segment switching?

---

## 📊 **What to Report:**

If you find issues, note:
1. What were you doing?
2. What did you expect to happen?
3. What actually happened?
4. Any error messages?
5. Browser & OS version

---

## 🚀 **Next Steps After Demo:**

Once you've tested and are satisfied:

### **Option A: Take a Break**
- Review all the documentation
- Think about your product vision
- Come back fresh for backend work

### **Option B: Continue Building**
- I'll scaffold the Spring Boot backend
- Complete project structure
- Database schema
- Auth & APIs
- Docker config

### **Option C: Visualize Architecture**
- Create system diagrams
- Database ERD
- API flow charts
- Deployment architecture

---

## 📝 **Testing Checklist:**

- [ ] See voice preview disclaimer
- [ ] Test voice preview on different hosts
- [ ] Complete full recording session
- [ ] Download bundled ZIP file
- [ ] Verify ZIP contains 4 files
- [ ] Open transcript.txt and verify format
- [ ] Open README.md and verify info
- [ ] Test segmented progress bar
- [ ] Hover over segments (see tooltips)
- [ ] Click to jump between segments
- [ ] Upload photos (Director mode)
- [ ] Delete photos
- [ ] Test error handling
- [ ] Check console for errors (F12)

---

## 🎉 **Expected Results:**

All features should work smoothly:
- ✅ No console errors
- ✅ Smooth animations
- ✅ Responsive UI
- ✅ Clean downloads
- ✅ Professional look & feel

**Enjoy exploring your improvements!** 🚀

---

**Questions?** Open your browser to http://localhost:3000 and start testing! Report any issues you find.
