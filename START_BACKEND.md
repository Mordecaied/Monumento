# 🚀 How to Start the Spring Boot Backend

## Option 1: Use VS Code (Recommended)

### Prerequisites:
1. **Java Extension Pack** - Install from VS Code Extensions
2. **Spring Boot Extension Pack** - Install from VS Code Extensions

### Steps:
1. Open VS Code
2. Press `F5` or `Ctrl+Shift+D` (Run and Debug)
3. Select **"Backend: Spring Boot"** from dropdown
4. Click green play button ▶️

**OR** use **"Full Stack"** to start both frontend and backend together!

### What to Look For:
- Backend will start on **port 8080**
- Look for: `Started MonumentoApplication in X seconds`
- Check: http://localhost:8080/actuator/health should return `{"status":"UP"}`

---

## Option 2: Install Maven and Use Terminal

### Install Maven:
1. Download from: https://maven.apache.org/download.cgi
2. Extract to: `C:\Program Files\Apache\Maven`
3. Add to PATH:
   - Open System Properties → Environment Variables
   - Edit "Path"
   - Add: `C:\Program Files\Apache\Maven\bin`
4. Verify: Open new terminal, run `mvn -version`

### Run Backend:
```bash
cd c:/Users/motta/OneDrive/Desktop/Monumento_MVP_V1/backend
mvn spring-boot:run
```

---

## Option 3: Use Maven Wrapper (Quick Setup)

If you want to use Maven without installing it globally:

```bash
cd c:/Users/motta/OneDrive/Desktop/Monumento_MVP_V1/backend

# Download Maven Wrapper
curl -o mvnw https://raw.githubusercontent.com/takari/maven-wrapper/master/mvnw
curl -o mvnw.cmd https://raw.githubusercontent.com/takari/maven-wrapper/master/mvnw.cmd
mkdir .mvn\wrapper
curl -o .mvn/wrapper/maven-wrapper.jar https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar
curl -o .mvn/wrapper/maven-wrapper.properties https://raw.githubusercontent.com/takari/maven-wrapper/master/maven-wrapper.properties

# Then run:
./mvnw.cmd spring-boot:run
```

---

## Troubleshooting

### Backend Won't Start?

**Check Prerequisites:**
```bash
# Java installed?
java -version
# Should show: openjdk version "21.0.9"

# PostgreSQL running?
docker ps | grep postgres

# Redis running?
docker ps | grep redis
```

### Port 8080 Already in Use?
```bash
# Find what's using port 8080
netstat -ano | findstr :8080

# Kill the process (replace PID)
taskkill /PID <process-id> /F
```

### Database Connection Error?
```bash
# Verify PostgreSQL is accessible
docker exec -i monumento-postgres psql -U monumento_user -d monumento -c "SELECT 1;"
# Should return: 1
```

---

## After Backend Starts

1. ✅ Check health: http://localhost:8080/actuator/health
2. ✅ Go to frontend: http://localhost:3001
3. ✅ Create a new session with **"Animate Host Avatar"** enabled
4. ✅ Verify metadata saves:
   ```bash
   docker exec -i monumento-postgres psql -U monumento_user -d monumento -c "
   SELECT id, vibe, metadata->>'animateAvatar' as enabled
   FROM sessions
   ORDER BY created_at DESC
   LIMIT 1;"
   ```
5. ✅ Should show: `enabled = true` ✨

---

## Current Status

- ✅ Java 21 installed
- ✅ PostgreSQL running in Docker
- ✅ Redis running in Docker
- ✅ Frontend running on port 3001
- ⏸️ Backend needs to be started on port 8080
- ✅ VS Code launch.json configured

**Recommended**: Use VS Code's "Full Stack" configuration to start everything at once!
