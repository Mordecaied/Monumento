# System Design - Monumento V2

## Overview

Monumento is an AI-powered video podcast platform that enables users to create cinematic interview experiences with AI hosts. The platform is designed to scale to millions of concurrent users across web and mobile platforms.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  Web App (React)  │  Mobile App (React Native)  │  Admin Portal │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (Kong)                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Rate Limiting │ Auth │ CORS │ Logging │ Monitoring       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
            ▼                 ▼                 ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Auth Service    │  │  Core Service    │  │  Media Service   │
│  (Spring Boot)   │  │  (Spring Boot)   │  │  (Spring Boot)   │
│                  │  │                  │  │                  │
│  - JWT           │  │  - Sessions      │  │  - Video Proc    │
│  - OAuth         │  │  - Interviews    │  │  - Transcription │
│  - User Mgmt     │  │  - AI Control    │  │  - Storage       │
└──────────────────┘  └──────────────────┘  └──────────────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL   │   Redis Cache   │  Cloudflare R2  │  S3 Backup  │
│  (Primary DB) │   (Sessions)    │  (Video/Audio)  │  (Archives) │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                             │
├─────────────────────────────────────────────────────────────────┤
│  Google Gemini │ OpenAI Whisper │  Stripe  │  SendGrid  │ Sentry│
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Web:** React 19 + TypeScript + Vite
- **Mobile:** React Native (Expo)
- **State:** Context API + Local Storage
- **Styling:** Tailwind CSS
- **Video:** MediaRecorder API, WebRTC

### Backend
- **Framework:** Spring Boot 3.x (Java 21)
- **API:** RESTful + WebSocket
- **Auth:** JWT + OAuth 2.0
- **Database:** PostgreSQL 16
- **Cache:** Redis 7
- **Queue:** RabbitMQ (for async processing)

### Infrastructure
- **Cloud:** AWS / Google Cloud
- **CDN:** Cloudflare
- **Storage:** Cloudflare R2 (S3-compatible)
- **Container:** Docker + Kubernetes
- **CI/CD:** GitHub Actions
- **Monitoring:** Sentry + Grafana

### AI Services
- **Voice AI:** Google Gemini Live API (2.0 Flash)
- **Transcription:** OpenAI Whisper API
- **Video Processing:** FFmpeg

## Core Components

### 1. Authentication Service
**Responsibilities:**
- User registration & login
- JWT token generation & validation
- OAuth integration (Google, Apple)
- Password reset & email verification
- Role-based access control (RBAC)

**Endpoints:**
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/verify-email`

### 2. Core Service
**Responsibilities:**
- Session management (create, update, delete)
- Interview orchestration
- AI host configuration
- Director mode context handling
- Transcript generation

**Endpoints:**
- `POST /api/v1/sessions` - Create new session
- `GET /api/v1/sessions` - List user sessions
- `GET /api/v1/sessions/:id` - Get session details
- `PATCH /api/v1/sessions/:id` - Update session
- `DELETE /api/v1/sessions/:id` - Delete session
- `WS /api/v1/sessions/:id/interview` - WebSocket for live interview

### 3. Media Service
**Responsibilities:**
- Video upload & storage
- Transcription processing (Whisper)
- Video editing & trimming
- Thumbnail generation
- Download packaging (ZIP bundles)

**Endpoints:**
- `POST /api/v1/media/upload` - Upload video
- `POST /api/v1/media/:id/transcribe` - Trigger transcription
- `POST /api/v1/media/:id/edit` - Edit video (remove segments)
- `GET /api/v1/media/:id/download` - Download bundled ZIP

### 4. Payment Service (Future)
**Responsibilities:**
- Subscription management
- Stripe integration
- Invoice generation
- Usage tracking (for pricing tiers)

## Data Models

### User
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  subscription_tier VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Session
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  vibe VARCHAR(50) NOT NULL,
  mode VARCHAR(50) NOT NULL,
  duration_minutes INT NOT NULL,
  video_url TEXT,
  transcript_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Message
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  role VARCHAR(10) NOT NULL, -- 'ai' or 'user'
  text TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  relative_offset BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Scalability Strategy

### Horizontal Scaling
- **Load Balancer:** Distribute traffic across multiple backend instances
- **Stateless Services:** All services are stateless (session stored in Redis)
- **Database Replication:** Master-slave PostgreSQL setup
- **Cache Layer:** Redis for frequently accessed data

### Vertical Scaling
- **Database:** Scale PostgreSQL with connection pooling
- **Media Processing:** Dedicated worker nodes for FFmpeg tasks
- **AI Calls:** Rate limiting + queuing for Gemini/Whisper

### Cost Optimization
- **CDN:** Serve static assets via Cloudflare
- **Object Storage:** R2 ($0.015/GB vs S3 $0.023/GB)
- **Compute:** Kubernetes auto-scaling based on CPU/memory
- **Database:** Read replicas for analytics queries

## Security

### Authentication & Authorization
- JWT tokens (access + refresh)
- OAuth 2.0 for social login
- Rate limiting (100 req/min per user)
- API key rotation

### Data Protection
- Encryption at rest (AES-256)
- Encryption in transit (TLS 1.3)
- Signed video URLs (time-limited access)
- GDPR compliance (data deletion)

### API Security
- CORS whitelist
- Input validation & sanitization
- SQL injection prevention (prepared statements)
- XSS protection

## Monitoring & Observability

### Logging
- Centralized logging (ELK Stack)
- Log levels: ERROR, WARN, INFO, DEBUG
- Request tracing (correlation IDs)

### Metrics
- Application metrics (JVM, response times)
- Business metrics (sessions created, videos uploaded)
- Infrastructure metrics (CPU, memory, disk)

### Alerting
- Sentry for error tracking
- Slack notifications for critical issues
- PagerDuty for on-call incidents

## Deployment Architecture

### Environments
1. **Development:** Local Docker Compose
2. **Staging:** Kubernetes on GCP
3. **Production:** Multi-region Kubernetes on AWS

### CI/CD Pipeline
```
GitHub Push
    ↓
GitHub Actions (Build + Test)
    ↓
Docker Image Build
    ↓
Push to Container Registry
    ↓
Deploy to Staging (auto)
    ↓
Manual Approval
    ↓
Deploy to Production (blue-green)
```

## Future Enhancements

### Phase 3 (Mobile)
- React Native apps (iOS + Android)
- Native video recording
- Offline mode support
- Push notifications

### Phase 4 (AI Features)
- Multi-language support
- Voice cloning (user's own voice)
- AI-generated B-roll suggestions
- Automatic highlight reels

### Phase 5 (Social)
- Public profile pages
- Session sharing
- Collaborative interviews
- Community features

---

**Last Updated:** 2026-01-07
**Next Review:** Before Phase 2 (Backend) implementation
