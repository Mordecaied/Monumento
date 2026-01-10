# Monumento - Complete Refactor & Build Plan
**Timeline: 3-6 Months | Budget: $0-5k | Solo Developer**

---

## 🎯 **VISION**
Transform Monumento into a scalable, production-ready AI podcast platform supporting:
- Millions of concurrent users (B2C + B2B)
- User authentication & accounts
- Cloud video storage & streaming
- Mobile apps (iOS, Android, Web)
- Payment processing (with 80%+ margins)
- Enterprise features (team accounts, branding)

---

## 🚨 **CRITICAL ISSUES TO FIX**

### **Bug Fixes Required:**
1. ✅ **Voice mismatch** - Preview voice ≠ interview voice
2. ✅ **Video/transcript sync** - Replay out of sync
3. ✅ **Multiple file downloads** - Should be single bundled output
4. ✅ **Transcript editing** - Removing Q&A should remove video segment
5. ✅ **Segmented progress bar** - Visual Q&A segments like YouTube

### **Architecture Issues:**
1. ❌ API key exposed in client (security vulnerability)
2. ❌ No backend = no user accounts, no payments, no scale
3. ❌ localStorage (5MB limit) can't handle video storage
4. ❌ 435-line App.tsx = unmaintainable
5. ❌ No mobile apps

---

## 🏗️ **NEW ARCHITECTURE**

### **Tech Stack Decision:**

```
┌─────────────────────────────────────────────────────────┐
│                    RECOMMENDED STACK                     │
├─────────────────────────────────────────────────────────┤
│ FRONTEND                                                 │
│ • React Native (Expo) - iOS, Android, Web in one       │
│ • TypeScript                                             │
│ • Zustand (state management)                            │
│ • React Query (server state)                            │
│                                                          │
│ BACKEND (Your Java/Spring Expertise!)                   │
│ • Spring Boot 3.x (Java 21)                             │
│ • Spring Security + JWT                                  │
│ • PostgreSQL (users, sessions, metadata)                │
│ • Redis (caching, rate limiting)                        │
│                                                          │
│ STORAGE & MEDIA                                          │
│ • Cloudflare R2 (S3-compatible, $0/mo for 10GB)        │
│ • FFmpeg (video processing)                             │
│ • WebRTC (real-time streaming)                          │
│                                                          │
│ AI & EXTERNAL SERVICES                                   │
│ • Google Gemini API (server-side proxy)                 │
│ • OpenAI Whisper (backup transcription)                 │
│                                                          │
│ INFRASTRUCTURE (Bootstrapped Budget)                     │
│ • Railway.app - Backend hosting ($5/mo)                 │
│ • Vercel - Frontend hosting (Free tier)                 │
│ • Cloudflare R2 - Storage ($0-15/mo)                    │
│ • Neon.tech - PostgreSQL (Free tier)                    │
│                                                          │
│ PAYMENTS & AUTH                                          │
│ • Stripe (payment processing)                           │
│ • Clerk.com (auth) or custom JWT                        │
└─────────────────────────────────────────────────────────┘
```

### **Why Spring Boot Backend?**
- ✅ Leverages your Java experience
- ✅ Enterprise-grade, battle-tested
- ✅ Excellent for B2B customers
- ✅ Strong security & authentication
- ✅ Easy to scale with microservices later

---

## 📅 **6-MONTH DEVELOPMENT ROADMAP**

### **PHASE 1: Foundation (Weeks 1-4)**
**Goal: Set up core infrastructure + fix critical bugs**

#### Week 1-2: Backend Foundation
- [ ] Initialize Spring Boot project (Spring Initializr)
  - Spring Web, Spring Security, Spring Data JPA
  - PostgreSQL driver, Redis, Lombok
- [ ] Database schema design:
  ```sql
  users (id, email, password_hash, plan, created_at)
  sessions (id, user_id, vibe, mode, duration, status, created_at)
  transcripts (id, session_id, role, text, timestamp, word_timings)
  videos (id, session_id, storage_url, duration, size)
  ```
- [ ] User authentication (JWT tokens)
- [ ] Basic REST API endpoints
- [ ] Cloudflare R2 integration for video uploads

#### Week 3: Frontend Foundation
- [ ] Initialize Expo (React Native) project
- [ ] Set up Zustand state management
- [ ] Implement authentication flow (login/signup)
- [ ] Basic navigation structure (Home → Setup → Recording → History)

#### Week 4: Critical Bug Fixes (Current Codebase)
- [ ] **Bug #1: Voice mismatch**
  - Investigate `PREVIEW_VOICE_PARAMS` vs. `VOICE_MAPPING`
  - Ensure consistent voice config
- [ ] **Bug #2: Video/transcript sync**
  - Fix `syncLoop` in SessionDetail.tsx
  - Implement proper word-level timestamps
- [ ] **Bug #3: Multiple downloads**
  - Bundle video + metadata into single .zip file
  - Add download progress indicator

**Deliverable:** Working backend API + mobile app skeleton + fixed bugs

---

### **PHASE 2: Core Recording Features (Weeks 5-8)**
**Goal: Rebuild recording studio with cloud backend**

#### Week 5: Backend - Session Management
- [ ] POST /api/sessions (create session)
- [ ] POST /api/sessions/{id}/start (begin recording)
- [ ] POST /api/sessions/{id}/transcript (stream transcripts)
- [ ] POST /api/sessions/{id}/upload (video chunks)
- [ ] GET /api/sessions/{id} (retrieve session)

#### Week 6: Backend - Gemini Integration (Server-Side)
- [ ] Proxy Gemini API calls through Spring Boot
- [ ] Rate limiting per user (Redis)
- [ ] Cost tracking & quota enforcement
- [ ] Implement retry logic & error handling

#### Week 7: Frontend - Recording Studio Redesign
- [ ] Component architecture:
  ```
  RecordingStudio/
  ├── HostPanel.tsx
  ├── GuestPanel.tsx
  ├── TranscriptPanel.tsx
  └── ControlsPanel.tsx
  ```
- [ ] Implement `useRecordingSession` hook
- [ ] Real-time transcript display
- [ ] Volume visualizers (optimized with useTransition)

#### Week 8: Video Processing Pipeline
- [ ] FFmpeg integration (server-side)
- [ ] Side-by-side video composition
- [ ] Audio mixing (host + guest)
- [ ] Generate final MP4 output
- [ ] Upload to Cloudflare R2

**Deliverable:** End-to-end recording flow with cloud storage

---

### **PHASE 3: Video Editing & Playback (Weeks 9-12)**
**Goal: Implement transcript editing with video segment removal**

#### Week 9: Backend - Transcript Editing API
- [ ] PUT /api/sessions/{id}/transcript (update transcript)
- [ ] POST /api/sessions/{id}/reprocess (regenerate video)
- [ ] Implement FFmpeg video cutting logic
- [ ] Queue system for video processing (Redis)

#### Week 10: Frontend - Transcript Editor
- [ ] Drag-to-reorder transcript pairs
- [ ] Delete Q&A pairs with confirmation
- [ ] Real-time preview of changes
- [ ] Undo/redo functionality

#### Week 11: Video Player Redesign
- [ ] **Bug #4 Fix:** Sync transcript with video playback
- [ ] **Bug #5 Fix:** Segmented progress bar
  ```
  [■■■ Q1 ■■■][■■ A1 ■■][■■■■ Q2 ■■■■][■ A2 ■]
  ```
- [ ] Click segment to jump to timestamp
- [ ] Highlight active Q&A pair during playback

#### Week 12: Export & Sharing
- [ ] Generate single bundled output:
  ```
  monumento_session_123.zip
  ├── video.mp4
  ├── transcript.json
  ├── transcript.txt
  └── metadata.json
  ```
- [ ] Share link generation
- [ ] Embeddable player (iframe)

**Deliverable:** Full editing capabilities + polished playback

---

### **PHASE 4: Mobile App & Polish (Weeks 13-16)**
**Goal: Launch iOS/Android apps + production readiness**

#### Week 13: Mobile-Specific Features
- [ ] Camera/microphone permissions (iOS/Android)
- [ ] Background recording support
- [ ] Push notifications (session complete)
- [ ] Offline mode (cache recordings)

#### Week 14: Responsive Design
- [ ] Tablet layouts
- [ ] Dark mode
- [ ] Accessibility (screen readers, keyboard nav)
- [ ] Performance optimization (lazy loading, code splitting)

#### Week 15: Payment Integration
- [ ] Stripe setup (products, prices)
- [ ] Subscription management
- [ ] Usage-based billing (per-minute)
- [ ] Calculate costs:
  ```
  Gemini API: ~$0.05/min
  Storage: ~$0.01/GB
  Processing: ~$0.02/min
  Total cost: ~$0.08/min

  Pricing tiers (80% margin):
  - Express (5min): $2.50 (cost: $0.40)
  - Deep Dive (20min): $8.00 (cost: $1.60)
  - Legacy (60min): $24.00 (cost: $4.80)
  ```

#### Week 16: Testing & Bug Fixes
- [ ] End-to-end testing (Detox for mobile)
- [ ] Load testing (k6 or Artillery)
- [ ] Security audit
- [ ] Performance profiling

**Deliverable:** Production-ready mobile apps + payment processing

---

### **PHASE 5: B2B Features (Weeks 17-20)**
**Goal: Enterprise features for workplace use**

#### Week 17: Team Accounts
- [ ] Organization model (multi-user accounts)
- [ ] Role-based access control (admin, member, viewer)
- [ ] Team billing & invoice management

#### Week 18: White-Labeling
- [ ] Custom branding (logo, colors)
- [ ] Custom domain support
- [ ] Remove "Powered by Monumento" watermark

#### Week 19: Analytics & Reporting
- [ ] Dashboard (sessions created, watch time, engagement)
- [ ] Export reports (CSV, PDF)
- [ ] Webhook integrations (Zapier, Slack)

#### Week 20: Advanced Features
- [ ] Screen sharing during interviews
- [ ] Multi-guest support (3+ people)
- [ ] Live streaming to YouTube/Twitch
- [ ] AI-powered highlights & clips

**Deliverable:** Enterprise-ready B2B platform

---

### **PHASE 6: Launch & Scale (Weeks 21-24)**
**Goal: Go to market + handle growth**

#### Week 21: Marketing Site
- [ ] Landing page (Next.js)
- [ ] Demo videos
- [ ] Pricing page
- [ ] Blog (SEO content)

#### Week 22: Beta Testing
- [ ] Invite 100 beta users
- [ ] Collect feedback
- [ ] Fix critical issues
- [ ] Prepare for App Store submission

#### Week 23: App Store Launch
- [ ] Submit to Apple App Store
- [ ] Submit to Google Play Store
- [ ] Web app launch (Vercel)
- [ ] Press release & social media

#### Week 24: Scaling Infrastructure
- [ ] Set up monitoring (Sentry, Datadog)
- [ ] CDN configuration (Cloudflare)
- [ ] Database optimization (indexes, caching)
- [ ] Auto-scaling configuration

**Deliverable:** Public launch with 1,000+ users

---

## 💰 **COST BREAKDOWN (Months 1-6)**

### **Infrastructure Costs:**
```
Railway (Backend hosting)         $5/mo  × 6 = $30
Neon.tech (PostgreSQL)             $0/mo  × 6 = $0 (free tier)
Cloudflare R2 (Storage)           $15/mo × 6 = $90
Redis Cloud                        $0/mo  × 6 = $0 (free tier)
Vercel (Frontend)                  $0/mo  × 6 = $0 (free tier)
Clerk (Auth) - optional           $25/mo × 6 = $150
Stripe (Payment processing)        2.9% + $0.30 per transaction

Total Fixed Costs: $270 for 6 months
```

### **Variable Costs (Scales with Usage):**
```
Gemini API: ~$0.05/minute of interview
Storage: ~$0.015/GB/month
FFmpeg processing: ~$0.02/minute

Assumptions:
- 100 beta users
- 2 sessions/user/month
- Average 20 minutes/session

Monthly API costs: 100 × 2 × 20 × $0.05 = $200
Monthly storage: 100 × 2 × 0.5GB × $0.015 = $1.50

Total Variable: ~$1,200 for 6 months
```

### **One-Time Costs:**
```
Apple Developer Account          $99/year
Google Play Developer            $25 one-time
Domain name                      $12/year
SSL certificate                  $0 (Let's Encrypt)

Total One-Time: $136
```

### **GRAND TOTAL: ~$1,606 for 6 months**
**Well within $5k budget!**

---

## 🛠️ **IMMEDIATE NEXT STEPS (This Week)**

### **Option 1: Start Fresh (Recommended)**
1. Create new repo: `monumento-v2`
2. Initialize Spring Boot backend
3. Initialize Expo frontend
4. Keep current codebase as reference

### **Option 2: Fix Bugs First, Then Refactor**
1. Fix 5 critical bugs in current codebase
2. Get to "stable MVP" state
3. Then start parallel development of v2

### **My Recommendation:**
**Do BOTH in parallel:**
- Spend 20% time fixing critical bugs in current app
- Spend 80% time building v2 with proper architecture
- Use current app for user testing while building v2

---

## 🤔 **QUESTIONS FOR YOU:**

1. **Do you want me to start building the Spring Boot backend now?**
   - I can scaffold the entire project structure
   - Set up authentication, database, and core APIs
   - You can then add business logic

2. **Should we fix the 5 critical bugs first?**
   - This will make current app usable for demos
   - Helps validate product-market fit
   - Can be done in 1-2 weeks

3. **Do you want to keep React Web or switch to React Native?**
   - React Native = iOS + Android + Web in one codebase
   - More mobile-friendly
   - Slightly different development experience

4. **Are you comfortable with the tech stack?**
   - Spring Boot backend (your expertise)
   - React Native frontend (new for you)
   - PostgreSQL database
   - Cloudflare R2 storage

---

## 📚 **LEARNING RESOURCES**

Since you're new to React Native:
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Docs](https://docs.expo.dev/)
- [React Native School](https://www.reactnativeschool.com/) (free courses)

For Spring Boot + React integration:
- [Spring Boot + React](https://spring.io/guides/tutorials/react-and-spring-data-rest/)
- [Spring Security + JWT](https://www.bezkoder.com/spring-boot-jwt-authentication/)

---

## 🎯 **SUCCESS METRICS**

### **Month 3 Goals:**
- [ ] 100 beta users signed up
- [ ] 500+ sessions recorded
- [ ] <5% crash rate
- [ ] <3s app load time

### **Month 6 Goals:**
- [ ] 1,000+ active users
- [ ] 10,000+ sessions recorded
- [ ] <2% crash rate
- [ ] 90%+ customer satisfaction
- [ ] $5k+ MRR (Monthly Recurring Revenue)

---

## 🚀 **LET'S START!**

Tell me which approach you prefer:
1. **Start building Spring Boot backend now**
2. **Fix 5 critical bugs first**
3. **Do both in parallel**

I'm ready to start coding immediately! 💻
