# 🧪 Avatar Animation Feature - Quick Test Guide

## ⚠️ IMPORTANT: Clear Browser Cache First!

The frontend code was just updated to fix the metadata bug. You MUST refresh to get the new code:

**Windows/Linux:** `Ctrl + Shift + R`
**Mac:** `Cmd + Shift + R`

Or:
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

---

## 📝 Test Steps

### Step 1: Open the App
```
http://localhost:3001
```

### Step 2: Create a New Session

1. Click "Create New Session" or similar
2. **Select a host vibe** (e.g., "The Historian", "Charismatic")
3. **Select a pricing tier** (e.g., "Express - 5 mins")
4. **Look for "03 • Avatar Enhancement" section**
5. **Click the "Animate Host Avatar" checkbox** ✅
   - It should turn BLUE
   - Shows "AI-Powered" badge
   - Shows "Enabled" green badge
   - Shows "+2-3 min processing"

### Step 3: Record a Short Test Session

1. Click "Enter Production Studio"
2. Allow camera/microphone
3. Say something (even 10 seconds is fine)
4. Have a brief conversation with the AI host
5. Click "End Session" or similar

### Step 4: Verify Metadata Saved

Run this command in PowerShell:

```powershell
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
LIMIT 3;"
```

**Expected Output:**
```
id                  | vibe          | mode       | duration_minutes | animation_enabled | created_at
--------------------|---------------|------------|------------------|-------------------|------------------
<new-uuid>          | The Historian | AUTO_PILOT | 5                | true              | 2026-01-07 ...
ec0a8090-5e8b...    | The Historian | ...        | ...              | (null)            | <earlier time>
```

The TOP row should show `animation_enabled = true`! ✅

---

## 🔍 Troubleshooting

### ❌ Still shows NULL?

**Check 1: Is the toggle actually enabled?**
- Open browser DevTools (F12)
- Go to Console tab
- Create a new session with toggle ON
- Before clicking "Enter Production Studio", type in console:
  ```javascript
  // This will show you the current state
  console.log('Animation enabled:', /* check component state */);
  ```

**Check 2: Is the request sending metadata?**
- Open DevTools → Network tab
- Filter for "sessions"
- Create a new session with toggle ON
- Click on the POST request to `/api/v1/sessions`
- Check "Payload" or "Request" tab
- Should see:
  ```json
  {
    "vibe": "The Historian",
    "mode": "AUTO_PILOT",
    "durationMinutes": 5,
    "metadata": {
      "animateAvatar": true
    }
  }
  ```

**Check 3: Did you hard refresh?**
- The browser may still be using cached JavaScript
- Clear ALL browser cache
- Or use Incognito/Private mode

**Check 4: Is the backend running with the new code?**
- If you manually restarted the backend, make sure it compiled the new code
- Check backend logs for any errors

---

## ✅ Success Criteria

You'll know it's working when:

1. ✅ The toggle shows in the UI with blue highlight when enabled
2. ✅ Database shows `metadata->>'animateAvatar' = 'true'`
3. ✅ Backend logs show (if backend is running):
   ```
   "Starting avatar animation generation for session: <uuid>"
   "Found X host messages to animate"
   ```

---

## 🎬 What Happens Next?

Once metadata saves correctly:

### Current Behavior:
- ✅ Setting is saved
- ✅ Backend detects it
- ✅ Logs show detection
- ⏸️ No actual videos generated yet (API not connected)

### When API is Connected:
- Generate animated videos
- Store URLs in `messages.metadata`
- Display in cinematic replay

---

## 🐛 If It Still Doesn't Work

Let me know and I'll:
1. Check the actual network request being sent
2. Add console logging to debug
3. Verify the backend is receiving the data correctly

---

## 📊 Check All Sessions

See all sessions and their animation settings:

```powershell
docker exec -i monumento-postgres psql -U monumento_user -d monumento -c "
SELECT
  id,
  vibe,
  CASE
    WHEN metadata->>'animateAvatar' = 'true' THEN '✓ ENABLED'
    WHEN metadata IS NULL THEN '✗ No metadata'
    ELSE '✗ Disabled'
  END as animation_status,
  created_at
FROM sessions
ORDER BY created_at DESC
LIMIT 10;"
```

---

## 🎯 Quick Visual Check

The easiest way to verify is just to look at the UI:

1. Go to session setup
2. Is there a "03 • Avatar Enhancement" section? ✅
3. Does it have a checkbox? ✅
4. When you click it, does it turn blue? ✅
5. Does it show badges? ✅

If YES to all → Feature is working!
If NO to any → Browser cache issue, hard refresh needed

---

## 💡 Pro Tip

Want to see the feature in action immediately without waiting for the full API integration?

I can add a "mock mode" that:
1. Shows a sample animated video URL in the database
2. Displays it in the cinematic replay
3. Lets you see exactly what the final feature will look like

This would take ~15 minutes to implement and would give you a perfect preview of the end result!

Would you like me to create this demo mode?
