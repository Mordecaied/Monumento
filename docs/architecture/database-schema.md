# Database Schema - Monumento

## Entity Relationship Diagram

```
┌──────────────┐
│    users     │
├──────────────┤
│ id (PK)      │
│ email        │◄─────┐
│ password     │      │
│ full_name    │      │
│ avatar_url   │      │
│ tier         │      │
│ created_at   │      │
└──────────────┘      │
                      │
                      │ 1:N
                      │
┌──────────────┐      │
│   sessions   │      │
├──────────────┤      │
│ id (PK)      │      │
│ user_id (FK) ├──────┘
│ vibe         │
│ mode         │◄─────┐
│ duration     │      │
│ video_url    │      │
│ created_at   │      │
└──────────────┘      │
                      │ 1:N
                      │
┌──────────────┐      │
│   messages   │      │
├──────────────┤      │
│ id (PK)      │      │
│ session_id   ├──────┘
│ role         │
│ text         │
│ timestamp    │
│ offset_ms    │
└──────────────┘
```

## Tables

### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  subscription_tier VARCHAR(50) DEFAULT 'free',
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tier ON users(subscription_tier);
```

### sessions
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vibe VARCHAR(50) NOT NULL, -- 'The Historian', 'The Celebrator', etc.
  mode VARCHAR(50) NOT NULL, -- 'Auto-Pilot', 'Director Mode'
  duration_minutes INT NOT NULL,
  video_url TEXT,
  transcript_url TEXT,
  thumbnail_url TEXT,
  metadata JSONB, -- Director context, photos, topics
  status VARCHAR(50) DEFAULT 'draft', -- draft, recording, processing, completed
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX idx_sessions_status ON sessions(status);
```

### messages
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role VARCHAR(10) NOT NULL CHECK (role IN ('ai', 'user')),
  text TEXT NOT NULL,
  timestamp BIGINT NOT NULL, -- Unix timestamp ms
  relative_offset BIGINT NOT NULL, -- ms from session start
  audio_url TEXT, -- Future: individual audio segments
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);
```

### subscriptions (Future)
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  tier VARCHAR(50) NOT NULL, -- 'express', 'deep-dive', 'legacy'
  status VARCHAR(50) NOT NULL, -- active, canceled, past_due
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

### media_files (Future)
```sql
CREATE TABLE media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  file_type VARCHAR(50) NOT NULL, -- 'video', 'audio', 'transcript', 'thumbnail'
  storage_url TEXT NOT NULL,
  cdn_url TEXT,
  file_size_bytes BIGINT,
  duration_seconds INT,
  mime_type VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_media_files_session_id ON media_files(session_id);
CREATE INDEX idx_media_files_type ON media_files(file_type);
```

## Sample Data

### users
```sql
INSERT INTO users (email, password_hash, full_name, subscription_tier) VALUES
('john@example.com', '$2a$10$...', 'John Doe', 'legacy'),
('jane@example.com', '$2a$10$...', 'Jane Smith', 'free');
```

### sessions
```sql
INSERT INTO sessions (user_id, vibe, mode, duration_minutes, status) VALUES
('user-uuid-here', 'The Historian', 'Auto-Pilot', 20, 'completed');
```

### messages
```sql
INSERT INTO messages (session_id, role, text, timestamp, relative_offset) VALUES
('session-uuid', 'ai', 'Welcome! Tell me about your childhood.', 1704067200000, 0),
('session-uuid', 'user', 'I grew up in New York...', 1704067205000, 5000);
```

## Queries

### Get User's Recent Sessions
```sql
SELECT s.*,
       COUNT(m.id) as message_count,
       MIN(m.timestamp) as first_message_at,
       MAX(m.timestamp) as last_message_at
FROM sessions s
LEFT JOIN messages m ON s.id = m.session_id
WHERE s.user_id = $1
  AND s.deleted_at IS NULL
GROUP BY s.id
ORDER BY s.created_at DESC
LIMIT 10;
```

### Get Session with Messages
```sql
SELECT s.*,
       json_agg(
         json_build_object(
           'id', m.id,
           'role', m.role,
           'text', m.text,
           'timestamp', m.timestamp,
           'offset', m.relative_offset
         ) ORDER BY m.timestamp ASC
       ) as messages
FROM sessions s
LEFT JOIN messages m ON s.id = m.session_id
WHERE s.id = $1
GROUP BY s.id;
```

### Get User Stats
```sql
SELECT
  u.id,
  u.email,
  u.subscription_tier,
  COUNT(s.id) as total_sessions,
  SUM(s.duration_minutes) as total_duration_minutes,
  MAX(s.created_at) as last_session_at
FROM users u
LEFT JOIN sessions s ON u.id = s.user_id
WHERE u.id = $1
GROUP BY u.id;
```

## Migrations Strategy

Using **Flyway** for database versioning:

```
backend/src/main/resources/db/migration/
├── V1__create_users_table.sql
├── V2__create_sessions_table.sql
├── V3__create_messages_table.sql
├── V4__add_subscription_tier_to_users.sql
└── V5__create_subscriptions_table.sql
```

## Performance Optimization

### Indexes
- Primary keys (UUID with btree)
- Foreign keys
- Frequently queried columns (email, created_at)
- JSONB GIN indexes for metadata search

### Partitioning
- Partition `messages` table by month (future)
- Archive old sessions to separate table (>1 year old)

### Caching
- Cache user profiles in Redis (TTL: 1 hour)
- Cache session metadata (TTL: 5 minutes)
- Invalidate on updates

---

**Last Updated:** 2026-01-07
