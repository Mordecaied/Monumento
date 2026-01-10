# Avatar Animation Feature - Testing Guide

## ✅ Setup Complete!

The SadTalker avatar animation feature is now ready to test. Here's what's been implemented:

### Database Setup ✓
- ✅ V3 Migration: Added `summary` and `summary_generated_at` to sessions table
- ✅ V4 Migration: Added `metadata` JSONB column to messages table
- ✅ Flyway schema history updated
- ✅ Indexes created for performance

### Backend Setup ✓
- ✅ `AvatarAnimationService.java` created
- ✅ HuggingFace API key configured (see `.env` file)
- ✅ Configuration in `application.yml` updated
- ✅ Message entity supports metadata for animated video URLs

### Frontend Setup ✓
- ✅ Beautiful "Animate Host Avatar" toggle in session setup
- ✅ Setting saved to session metadata
- ✅ UI shows AI-Powered and Free badges
- ✅ Displays processing time estimate (+2-3 min)

---

## 🧪 How to Test

### Step 1: Start the Backend

You'll need to compile and run the Spring Boot backend. Since Maven isn't in your PATH, you have a few options:

**Option A: Use your IDE (Recommended)**
1. Open the project in IntelliJ IDEA or Eclipse
2. Right-click on `MonumentoApplication.java`
3. Select "Run" or "Debug"

**Option B: Use Docker (if Dockerfile is configured)**
```bash
cd /c/Users/motta/OneDrive/Desktop/Monumento_MVP_V1/backend
docker build -t monumento-backend .
docker run -p 8080:8080 --env-file .env --network monumento-network monumento-backend
```

**Option C: Install Maven and build**
```bash
# Download and install Maven from https://maven.apache.org/download.cgi
# Then run:
cd /c/Users/motta/OneDrive/Desktop/Monumento_MVP_V1/backend
mvn spring-boot:run
```

### Step 2: Verify Backend is Running

Check that the backend started successfully:
```bash
curl http://localhost:8080/actuator/health
# Should return: {"status":"UP"}
```

### Step 3: Test the Frontend Feature

1. Open browser to: http://localhost:3001
2. Log in or sign up
3. Click "Create New Session"
4. Select a host vibe (e.g., "Charismatic", "Empathetic")
5. Select a pricing tier (e.g., "Express - 5 mins")
6. **Look for the new "03 • Avatar Enhancement" section**
7. **Click the "Animate Host Avatar" checkbox** - it should:
   - Turn blue when enabled
   - Show "AI-Powered" badge
   - Show "Enabled" green badge
   - Display "+2-3 min processing" time
   - Display "Free (Powered by HuggingFace)"

### Step 4: Create a Test Session

1. With "Animate Host Avatar" ENABLED, click "Enter Production Studio"
2. Allow camera/microphone access
3. Record a short 30-second test conversation
4. End the session

### Step 5: Verify Metadata Was Saved

Check the database to verify the setting was saved:

```bash
docker exec -i monumento-postgres psql -U monumento_user -d monumento -c "
SELECT
  id,
  vibe,
  metadata->>'animateAvatar' as animate_enabled,
  created_at
FROM sessions
ORDER BY created_at DESC
LIMIT 1;
"
```

Expected output:
```
id       | vibe        | animate_enabled | created_at
---------|-------------|-----------------|------------------
<uuid>   | charismatic | true            | 2026-01-07...
```

### Step 6: Check Backend Logs

Look for the AvatarAnimationService log messages:

```bash
# If backend is running in terminal, you'll see:
# "Avatar animation not enabled for session: <id>" (if disabled)
# OR
# "Starting avatar animation generation for session: <id>" (if enabled)
# "Found X host messages to animate" (if enabled)
```

---

## 🎬 What Happens Next (Not Yet Implemented)

Currently, the system will:
1. ✅ Show the UI toggle
2. ✅ Save the setting to session metadata
3. ✅ Detect the setting in the backend service
4. ✅ Log that animation is enabled
5. ⏸️ **TODO:** Extract audio segments for each host message
6. ⏸️ **TODO:** Call SadTalker API to generate animated videos
7. ⏸️ **TODO:** Store video URLs in message metadata
8. ⏸️ **TODO:** Display animated videos in cinematic replay

---

## 📊 Database Verification Commands

### Check if sessions table has summary columns:
```bash
docker exec -i monumento-postgres psql -U monumento_user -d monumento -c "
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'sessions'
AND column_name IN ('summary', 'summary_generated_at');
"
```

### Check if messages table has metadata column:
```bash
docker exec -i monumento-postgres psql -U monumento_user -d monumento -c "
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'messages'
AND column_name = 'metadata';
"
```

### View all sessions with animation setting:
```bash
docker exec -i monumento-postgres psql -U monumento_user -d monumento -c "
SELECT
  id,
  vibe,
  mode,
  duration_minutes,
  metadata->>'animateAvatar' as animation_enabled,
  created_at
FROM sessions
ORDER BY created_at DESC
LIMIT 10;
"
```

---

## 🐛 Troubleshooting

**Frontend doesn't show the toggle:**
- Clear browser cache and refresh
- Check browser console for errors
- Verify frontend is running on port 3001

**Backend won't start:**
- Check if PostgreSQL is running: `docker ps | grep postgres`
- Check if Redis is running: `docker ps | grep redis`
- Verify `.env` file exists with correct settings
- Check backend logs for errors

**Metadata not saving:**
- Verify backend received the request: check logs
- Run database verification commands above
- Check network tab in browser DevTools

**"Backend not running" error:**
- Start the backend using one of the methods in Step 1
- Verify port 8080 is not already in use: `netstat -an | grep 8080`

---

## 🎯 Success Criteria

You'll know the feature is working when:
1. ✅ The "Animate Host Avatar" toggle appears in session setup
2. ✅ Clicking the toggle shows visual feedback (blue highlight, badges)
3. ✅ Creating a session saves `metadata.animateAvatar = true` to database
4. ✅ Backend logs show: "Starting avatar animation generation for session: <id>"
5. ✅ Backend logs show: "Found X host messages to animate"

---

## 📝 Next Steps

To complete the full workflow, we need to implement:

1. **Audio Extraction** - Separate host audio segments from the recording
2. **SadTalker API Integration** - Complete the API call to generate videos
3. **Storage** - Upload generated videos to cloud storage (R2/S3)
4. **Frontend Display** - Update SessionDetail to show animated videos
5. **Progress Tracking** - Show "Generating avatars..." status during processing

Would you like me to implement any of these next steps?
