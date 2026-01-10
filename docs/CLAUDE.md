# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Monumento** is an AI-powered podcast studio that records side-by-side video interviews between users and AI hosts powered by Google Gemini API. The current MVP is a React + TypeScript web app built with Vite, designed for eventual migration to a full-stack platform supporting millions of users.

**Critical Context:** This is an MVP in transition. The codebase has known architectural limitations documented in `REFACTOR_PLAN.md` and `BUG_ANALYSIS.md`. Read these files before making significant changes.

## Project Structure

**The project is now organized for full-stack development:**

```
Monumento_MVP_V1/
├── docs/                          # All documentation
│   ├── architecture/              # System design, database schema, API design
│   ├── BUG_ANALYSIS.md
│   ├── CLAUDE.md (this file)
│   ├── REFACTOR_PLAN.md
│   └── ...
├── frontend-web/                  # React web app (current MVP)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── types/
│   │   ├── config/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── frontend-mobile/               # React Native (future - Phase 3)
├── backend/                       # Spring Boot (future - Phase 2)
├── infrastructure/                # Docker, Kubernetes, Terraform
│   ├── docker/
│   ├── kubernetes/
│   └── terraform/
├── scripts/                       # Automation scripts
├── tests/                         # E2E & integration tests
│   ├── e2e/
│   ├── integration/
│   └── performance/
├── skills/                        # Custom Claude Code skills
│   └── ui-design.md              # Design principles & guidelines
├── .github/                       # CI/CD workflows
│   └── workflows/
├── .vscode/                       # IDE configuration
└── .env.example                   # Environment template
```

## Development Commands

### Frontend (Web)

```bash
# Navigate to frontend
cd frontend-web

# Install dependencies
npm install

# Run development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm preview
```

### Backend (Coming in Phase 2)

```bash
# Navigate to backend
cd backend

# Run Spring Boot app
./mvnw spring-boot:run

# Run tests
./mvnw test

# Build JAR
./mvnw clean package
```

### Infrastructure

```bash
# Start local development stack
docker-compose -f infrastructure/docker/docker-compose.yml up

# Deploy to Kubernetes
kubectl apply -f infrastructure/kubernetes/

# Initialize Terraform
cd infrastructure/terraform && terraform init
```

**Environment Setup:**
- Copy `.env.example` to `frontend-web/.env.local`
- Set `GEMINI_API_KEY` with your Google Gemini API key
- Note: API key is currently exposed in client bundle (known security issue for V2 backend)

## Architecture

### Current State (MVP)
- **Monolithic**: All state in `App.tsx` (435 lines, ~28 useState hooks)
- **Client-only**: No backend, uses localStorage for session history
- **Limitations**: Cannot scale beyond ~100 users, no auth, no payments, no cloud storage

### Core Data Flow

```
User → Setup (mode/vibe/tier selection)
     → Recording (Gemini Live API + MediaRecorder)
     → Production (video processing, ZIP bundling)
     → History (localStorage persistence)
     → Replay (SessionDetail with segmented playback)
```

### Key Components

**`App.tsx`** - Main application controller
- Manages all views: SETUP, COUNTDOWN, RECORDING, PRODUCING, HISTORY, SESSION_DETAIL
- Handles recording lifecycle: camera/mic access, Gemini session, MediaRecorder, volume analysis
- Critical functions:
  - `initiateInterview()` - Connects to Gemini Live API
  - `startStudioRecording()` - Sets up audio mixing and MediaRecorder
  - `finalizeSession()` - Creates ZIP bundle (video, transcript, metadata, README)

**Service Layer:**
- `services/geminiService.ts` - Gemini Live API integration with real-time audio streaming
  - Uses `@google/genai` SDK
  - Manages AudioContext for 16kHz input / 24kHz output
  - Streams PCM audio chunks to Gemini
  - **Key method**: `connect(systemInstruction, voiceName, stream, callbacks)`
- `services/audioService.ts` - Audio encoding utilities (PCM, base64, WAV headers)

**Recording Components:**
- `VirtualStudio.tsx` - Canvas-based video manipulation with background effects
- `DirectorControls.tsx` - Topic/photo/voice sample inputs for Director mode
- `SessionDetail.tsx` - Playback with word-level caption sync (estimated timing)

**State Management:**
- Current: Local useState in App.tsx (not scalable)
- Planned V2: Zustand for client state, React Query for server state

### Type System

All types defined in `types.ts`:
- `StudioVibe` - 5 AI host personalities (Historian, Celebrator, Journalist, Jester, Roast Master)
- `InterviewMode` - Auto-Pilot vs Director
- `Session` - Complete recording with messages, metadata, videoUrl (blob URL)
- `Message` - Transcript entry with `relativeOffset` (ms from recording start)

### Constants

`constants.tsx` contains:
- `SYSTEM_INSTRUCTIONS` - AI personality prompts per vibe
- `VOICE_MAPPING` - Maps vibes to Gemini voice names (Kore, Puck, Zephyr, Fenrir, Charon)
- `STUDIO_AVATARS` / `STUDIO_VIDEO_PREVIEWS` - Unsplash/Mixkit URLs (external dependencies)
- `PREVIEW_VOICE_PARAMS` - Browser TTS pitch/rate settings (causes voice mismatch bug)

## Known Issues & Technical Debt

### Critical Bugs (See BUG_ANALYSIS.md)

1. **Voice Mismatch** - Preview uses browser TTS, actual uses Gemini voices (partially fixed with disclaimer)
2. **Video/Transcript Sync** - Estimated word timing causes drift (requires OpenAI Whisper integration)
3. **Single Download** - Fixed: Now bundles video + transcript + metadata into ZIP
4. **Transcript Editing** - Designed but requires backend + FFmpeg pipeline
5. **Segmented Progress Bar** - Fully implemented and functional

### Security Issues

- **API Key Exposure**: `vite.config.ts` embeds `GEMINI_API_KEY` in client bundle (lines 14-15)
  - Anyone can extract the key from the built JavaScript
  - **V2 Fix**: Proxy all Gemini calls through Spring Boot backend

### Architecture Issues

- **No Backend**: Cannot support user accounts, payments, or cloud storage
- **localStorage Limit**: 5-10MB quota, cannot store videos after refresh
- **No Testing**: 0% test coverage, no test infrastructure
- **Tight Coupling**: Business logic mixed with UI components
- **Memory Leaks**: Partially fixed (volume loop cleanup added), but AudioContext cleanup incomplete

## Development Guidelines

### When Adding Features

1. **Check REFACTOR_PLAN.md** first - Feature may be scheduled for V2 with backend
2. **Read BUG_ANALYSIS.md** - Understand existing bugs before modifying related code
3. **Follow Type System** - All domain entities are in `types.ts`
4. **Avoid Growing App.tsx** - Already too large (435 lines), extract to components/hooks instead

### When Fixing Bugs

- Cross-reference with `BUG_ANALYSIS.md` for root cause analysis
- Bugs #2 and #4 require backend implementation (don't attempt client-only fixes)
- Test video recording end-to-end after changes (recording → production → replay)

### Code Patterns

**Gemini Integration:**
```typescript
const session = new GeminiSession();
await session.connect(systemInstruction, voiceName, mediaStream, {
  onTranscript: (text, isUser) => { /* handle transcript */ },
  onOpen: () => { /* connection ready */ },
  onError: (err) => { /* handle error */ }
});
```

**Recording Lifecycle:**
```typescript
1. navigator.mediaDevices.getUserMedia() - Get camera/mic
2. new GeminiSession().connect() - Start AI conversation
3. new MediaRecorder() - Record mixed audio/video
4. session.sendImageFrame() - Send video frames to Gemini
5. session.stop() + recorder.stop() - End recording
6. JSZip - Bundle output files
```

**Session Storage:**
```typescript
// Saved to localStorage (videoUrl removed due to size)
const session: Session = {
  id: timestamp,
  vibe, mode, duration,
  messages: Message[], // Full transcript
  createdAt: timestamp,
  videoUrl: undefined // Blob URL only exists in current session
};
```

### Testing Locally

1. Open http://localhost:3000
2. Select mode → Choose host/tier → Start interview
3. Test critical paths:
   - Voice preview (should show disclaimer)
   - Recording (3-2-1 countdown → conversation → wrap)
   - Download (should get single .zip file)
   - History → Replay (segmented progress bar should work)

## Future Architecture (V2)

**Read REFACTOR_PLAN.md for complete 6-month roadmap.**

Key changes planned:
- **Backend**: Spring Boot 3.x with PostgreSQL, Redis, JWT auth
- **Frontend**: React Native (Expo) for iOS + Android + Web
- **Storage**: Cloudflare R2 for videos, Whisper API for word timestamps
- **Infrastructure**: Railway (backend) + Vercel (frontend) + Neon (database)
- **Costs**: ~$1,600 for 6 months development + $50/month operating

## Documentation Files

- `README.md` - Quick start guide
- `REFACTOR_PLAN.md` - 6-month development roadmap (6,800+ words)
- `BUG_ANALYSIS.md` - Technical analysis of all 5 bugs with solutions
- `BUG_FIXES_COMPLETE.md` - Status of bug fixes applied
- `PROGRESS_REPORT.md` - Development session summary
- `DEMO_GUIDE.md` - Testing instructions for all features

## Project Preferences & Decisions

**Before making significant changes, ask the developer about:**

### Architecture Decisions
- **Backend approach**: Continue with current MVP or start V2 Spring Boot backend?
- **State management**: Keep useState or refactor to Zustand/Redux?
- **Testing strategy**: Add tests now or wait for V2 refactor?
- **Component extraction**: Break up App.tsx now or defer to V2?

### Feature Priorities
- **Which bugs to fix first**: Client-side fixes vs backend-dependent features?
- **New features**: Add to current codebase or plan for V2?
- **Mobile support**: Stay web-only or start React Native migration?
- **Payment integration**: Focus on core features first or add Stripe now?

### Technical Preferences
- **Code style**: Follow existing patterns or suggest improvements?
- **Type safety**: Strict TypeScript or allow `any` for MVP speed?
- **Error handling**: Comprehensive error boundaries or basic try-catch?
- **Documentation**: Update inline comments or maintain separate docs?

### Cost & Scale Decisions
- **Cloud services**: Use free tiers only or invest in paid services?
- **Video storage**: Keep localStorage or implement cloud storage?
- **API costs**: Optimize Gemini API usage or prioritize features?
- **Infrastructure**: Deploy now or finish local development first?

### Key Constraints
- **Timeline**: 3-6 months to full platform
- **Budget**: $0-5k for development + infrastructure
- **Team**: Solo developer (Java/Spring expertise, learning React Native)
- **Scale target**: Millions of concurrent users (requires complete backend)
- **Margins**: 80%+ profit on pricing tiers

## Important Notes

- This is a **bootstrapped project** ($0-5k budget) targeting millions of eventual users
- Developer is solo, Java/Spring background, new to React Native
- MVP works but is intentionally limited - focus is on proving product-market fit before full rebuild
- All external resources (Unsplash images, Mixkit videos) are hardcoded URLs - may break if services change
- MediaRecorder uses WebM codec - won't work on Safari/iOS (requires fallback in V2)

## Developer's Vision

**Market**: B2C + B2B (content creators, families, workplaces, training materials)

**Use Cases**:
1. Personal memories/reflections (yearly interviews with kids)
2. Content creation (podcasts without studio setup)
3. Corporate training (employee onboarding, message delivery)
4. Gifting (meaningful presents for friends/family)

**Success Metrics** (Month 6):
- 1,000+ active users
- 10,000+ sessions recorded
- $5k+ MRR (Monthly Recurring Revenue)
- <2% crash rate
- 90%+ customer satisfaction

## Developer's Stated Preferences (From Initial Session)

**These answers were provided during project setup and should guide future decisions:**

### Project Scope & Timeline
- **Target users**: Millions of concurrent users
- **Markets**: Both B2C and B2B
- **Pricing model**: $2.50 (5min), $8 (20min), $24 (60min) with 80%+ margins
- **Multi-tenancy**: Yes - companies can use for training/onboarding
- **Timeline**: 3-6 months, bootstrapped ($0-5k budget)

### Technical Direction
- **Backend**: Required - cannot achieve scale without it
- **Backend choice**: Spring Boot (leverages developer's Java expertise)
- **Authentication**: Yes - user accounts essential
- **Storage**: Cloud (local storage insufficient for video)
- **Mobile apps**: Critical - "will be huge part of this"

### Feature Priorities (All Selected)
1. Fix critical bugs (voice mismatch, sync issues)
2. Build backend + cloud storage infrastructure
3. Add video editing features (remove segments)
4. Mobile app development (React Native)

### Development Approach
- **Refactor strategy**: Complete rewrite (not gradual refactor)
- **Build sequence**: Fix bugs → Backend → Frontend → Mobile → B2B features
- **Priority**: Stabilize app first, then add features

### Current Issues Acknowledged
1. Voice preview doesn't match actual interview voice
2. Transcript/video sync drift in playback
3. Multiple files downloaded instead of single bundle
4. Cannot edit transcript to remove video segments
5. No visual segmentation in progress bar (later discovered working)

**Decision made**: Fix all bugs in sequence, then proceed with backend scaffold and architecture diagrams.

## Recommended Workflow for Future Sessions

### When Starting a New Session

1. **Ask Context Questions**:
   - "What's your current priority: bug fixes, new features, or backend work?"
   - "Are you ready to start the V2 refactor, or continue with MVP improvements?"
   - "Do you want to test the app first, or jump into coding?"
   - "Should I follow the existing MVP patterns or implement V2 architecture?"

2. **Check Documentation**:
   - Read `REFACTOR_PLAN.md` to understand roadmap status
   - Check `BUG_FIXES_COMPLETE.md` for which bugs are addressed
   - Review `PROGRESS_REPORT.md` for latest session outcomes

3. **Verify Requirements**:
   - Confirm budget constraints still apply ($0-5k)
   - Check if timeline has changed (originally 3-6 months)
   - Ask if priorities have shifted (mobile? backend? features?)

### When Developer Requests Changes

**Always ask first**:
- "Should this be part of the current MVP or planned for V2?"
- "Do you want me to update the documentation (REFACTOR_PLAN.md) to reflect this?"
- "This change might conflict with V2 architecture - should we proceed or defer?"

### When Bugs Are Reported

**Check against known issues**:
1. Search `BUG_ANALYSIS.md` first
2. If documented: Explain status and V2 solution
3. If new: Analyze and update documentation
4. Ask: "Should I fix this now or document for V2?"

### When Suggesting Improvements

**Frame in terms of**:
- Cost impact (developer is budget-conscious)
- Timeline impact (3-6 month constraint)
- V2 compatibility (avoid throwaway work)
- Solo developer feasibility (Java background, learning React Native)

### Before Major Refactoring

**Get explicit approval**:
- "This will take X hours and touch Y files - proceed?"
- "Should I refactor App.tsx now or wait for V2?"
- "Want me to add tests first or refactor then test?"
- "Extract to hooks/components or keep as-is until V2?"

## Custom Skills

The `/skills` directory contains Claude Code skills that define specific expertise and guidelines.

### UI Design Skill ([skills/ui-design.md](../skills/ui-design.md))

**When to use**: All UI/UX work, component design, visual refactoring

**Core Principles**:
1. **Typography** - Use interesting, brand-appropriate fonts (not generic sans-serif)
2. **Colour & Theme** - Commit to 2-3 dominant colours, use opacity variations
3. **Motion** - Use animation strategically with purpose (150-300ms, ease-out)
4. **Spatial Composition** - Break the grid, use asymmetry, overlap elements
5. **Background & Details** - Add depth with gradients, textures, decorative elements

**Monumento Design System**:
- **Primary**: Purple gradient (#8B5CF6 → #6366F1)
- **Secondary**: Orange (#F97316)
- **Neutrals**: Warm blacks (#0D0D0D), subtle whites (rgba(255,255,255,0.9))
- **Fonts**: Playfair Display (headlines), Inter (body)
- **Effects**: Glass morphism, glow effects, cinematic backgrounds

**Quality Checklist**:
- [ ] Typography uses interesting fonts
- [ ] Colour palette is cohesive
- [ ] Animations serve a purpose
- [ ] Layout breaks conventions intentionally
- [ ] Backgrounds have depth
- [ ] Visual hierarchy is clear
- [ ] Accessible (WCAG AA contrast)

Read the full skill document for implementation guidelines and examples.

---

**Last Updated:** 2026-01-07 (Post full-structure restructure)
