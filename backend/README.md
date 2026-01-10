# Monumento Backend - Spring Boot API

**AI-Powered Video Podcast Platform - Backend Service**

---

## Overview

This is the Spring Boot backend for Monumento, providing:
- **RESTful API** for user management, sessions, and media
- **JWT Authentication** for secure access
- **PostgreSQL Database** with Flyway migrations
- **Redis Caching** for session management
- **Cloud Storage Integration** (Cloudflare R2 / AWS S3)
- **WebSocket Support** for real-time interview sessions

---

## Tech Stack

- **Java 21** - Modern Java with latest features
- **Spring Boot 3.2.1** - Framework
- **Spring Security** - JWT authentication & authorization
- **Spring Data JPA** - Database ORM
- **PostgreSQL 16** - Primary database
- **Redis 7** - Caching layer
- **Flyway** - Database migrations
- **Lombok** - Reduce boilerplate code
- **Maven** - Build tool

---

## Project Structure

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/monumento/
│   │   │   ├── config/          # Configuration classes
│   │   │   ├── controller/      # REST controllers
│   │   │   ├── service/         # Business logic
│   │   │   ├── repository/      # Data access layer
│   │   │   ├── model/           # JPA entities
│   │   │   ├── dto/             # Data transfer objects
│   │   │   ├── security/        # JWT & security
│   │   │   └── exception/       # Custom exceptions
│   │   └── resources/
│   │       ├── application.yml           # Main config
│   │       ├── application-dev.yml       # Dev profile
│   │       ├── application-prod.yml      # Production profile
│   │       └── db/migration/             # Flyway SQL scripts
│   └── test/                    # Unit & integration tests
├── pom.xml                      # Maven dependencies
└── README.md                    # This file
```

---

## Prerequisites

- **Java 21+** - [Download](https://adoptium.net/)
- **Maven 3.9+** - [Download](https://maven.apache.org/download.cgi)
- **PostgreSQL 16+** - [Download](https://www.postgresql.org/download/)
- **Redis 7+** (Optional for dev) - [Download](https://redis.io/download)

---

## Quick Start

### 1. Clone & Navigate
```bash
cd backend
```

### 2. Set Up Database
```bash
# Create PostgreSQL database
psql -U postgres
CREATE DATABASE monumento;
CREATE USER monumento_user WITH PASSWORD 'changeme';
GRANT ALL PRIVILEGES ON DATABASE monumento TO monumento_user;
\q
```

### 3. Configure Environment
Create `.env` file in `backend/` directory:
```bash
# Copy from root .env.example
cp ../.env.example .env
```

Edit `.env` with your values:
```bash
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=monumento
DATABASE_USERNAME=monumento_user
DATABASE_PASSWORD=changeme

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your-very-long-secret-key-minimum-32-characters-for-production-use

GEMINI_API_KEY=your_gemini_api_key
```

### 4. Run Application
```bash
# Using Maven wrapper
./mvnw spring-boot:run

# Or with profile
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

### 5. Verify Running
```bash
curl http://localhost:8080/actuator/health
```

Expected response:
```json
{"status":"UP"}
```

---

## Development

### Build
```bash
# Clean & build
./mvnw clean package

# Skip tests
./mvnw clean package -DskipTests
```

### Run Tests
```bash
# All tests
./mvnw test

# Specific test
./mvnw test -Dtest=UserServiceTest
```

### Database Migrations
```bash
# Migrations run automatically on startup
# Manually check status:
./mvnw flyway:info

# Manually migrate:
./mvnw flyway:migrate

# Rollback (BE CAREFUL):
./mvnw flyway:undo
```

### Code Formatting
```bash
# Format code
./mvnw spotless:apply

# Check formatting
./mvnw spotless:check
```

---

## API Endpoints

### Authentication
```
POST   /api/v1/auth/register      - Register new user
POST   /api/v1/auth/login         - Login (returns JWT)
POST   /api/v1/auth/refresh       - Refresh access token
POST   /api/v1/auth/logout        - Logout
```

### Users
```
GET    /api/v1/users/me           - Get current user
PATCH  /api/v1/users/me           - Update current user
DELETE /api/v1/users/me           - Delete account
```

### Sessions
```
GET    /api/v1/sessions           - List user sessions
POST   /api/v1/sessions           - Create new session
GET    /api/v1/sessions/:id       - Get session details
PATCH  /api/v1/sessions/:id       - Update session
DELETE /api/v1/sessions/:id       - Delete session
```

### Media
```
POST   /api/v1/media/upload       - Upload video
GET    /api/v1/media/:id/download - Download session ZIP
POST   /api/v1/media/:id/transcribe - Trigger Whisper transcription
```

---

## Configuration

### Application Profiles

**dev** - Development (verbose logging, auto-reload)
```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

**prod** - Production (optimized, minimal logging)
```bash
java -jar -Dspring.profiles.active=prod target/monumento-backend-1.0.0-SNAPSHOT.jar
```

### Environment Variables

See [.env.example](../.env.example) for complete list.

Key variables:
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - JWT signing key (256+ bits)
- `GEMINI_API_KEY` - Google Gemini API
- `OPENAI_API_KEY` - OpenAI Whisper API
- `R2_*` - Cloudflare R2 storage credentials

---

## Docker

### Build Image
```bash
docker build -t monumento-backend .
```

### Run Container
```bash
docker run -d \
  -p 8080:8080 \
  --env-file .env \
  --name monumento-api \
  monumento-backend
```

### Docker Compose (with PostgreSQL + Redis)
```bash
cd ../infrastructure/docker
docker-compose up -d
```

---

## Database Schema

### Tables

**users**
- Primary user accounts
- Email + password authentication
- Subscription tier tracking

**sessions**
- Video podcast sessions
- Links to user
- Stores vibe, mode, duration
- Metadata in JSONB

**messages**
- Transcript entries
- Q&A pairs from interviews
- Timestamps for sync

See [docs/architecture/database-schema.md](../docs/architecture/database-schema.md) for full ERD.

---

## Security

### Authentication Flow
1. User registers/logs in → Receives JWT access token + refresh token
2. Client includes `Authorization: Bearer <token>` in requests
3. Token expires after 24 hours
4. Refresh token valid for 7 days

### Password Security
- Passwords hashed with BCrypt (strength 12)
- Minimum 8 characters enforced
- Never stored in plaintext

### API Security
- Rate limiting: 100 requests/minute per user
- CORS whitelist (configurable)
- SQL injection prevention (JPA parameterized queries)
- XSS protection via content security policy

---

## Deployment

### Production Checklist

- [ ] Set strong `JWT_SECRET` (256+ bits)
- [ ] Configure production database (AWS RDS, Neon, etc.)
- [ ] Set up Redis cluster
- [ ] Configure Cloudflare R2 or S3
- [ ] Enable HTTPS/TLS
- [ ] Set up monitoring (Sentry, Datadog)
- [ ] Configure log aggregation
- [ ] Set up automated backups
- [ ] Review CORS allowed origins
- [ ] Enable rate limiting
- [ ] Test rollback procedure

### Deployment Platforms

**Recommended:**
- **Railway** - $5/month, auto-deploy from GitHub
- **Render** - Free tier available, easy setup
- **Fly.io** - Edge deployment, global latency

**Enterprise:**
- **AWS ECS/EKS** - Full control, scalable
- **Google Cloud Run** - Serverless, auto-scale
- **Azure Container Apps** - Integrated with Azure services

---

## Monitoring & Logging

### Health Check
```bash
curl http://localhost:8080/actuator/health
```

### Logs
```bash
# View logs (Docker)
docker logs -f monumento-api

# View logs (file)
tail -f logs/monumento.log
```

### Metrics
Spring Boot Actuator provides:
- `/actuator/health` - Health status
- `/actuator/metrics` - Application metrics
- `/actuator/prometheus` - Prometheus metrics (for Grafana)

---

## Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Test connection
psql -h localhost -U monumento_user -d monumento

# Check credentials in .env
```

### Port Already in Use
```bash
# Find process using port 8080
lsof -i :8080  # macOS/Linux
netstat -ano | findstr :8080  # Windows

# Kill process or change port in application.yml
```

### Flyway Migration Failed
```bash
# Check migration status
./mvnw flyway:info

# Repair (if migrations out of sync)
./mvnw flyway:repair

# Clean (DANGEROUS - drops all data)
./mvnw flyway:clean
```

---

## Testing

### Run Tests
```bash
# All tests
./mvnw test

# Integration tests only
./mvnw verify -P integration-tests

# With coverage report
./mvnw test jacoco:report
```

### Test Coverage
View report: `target/site/jacoco/index.html`

---

## Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Write tests for new functionality
3. Ensure all tests pass: `./mvnw test`
4. Commit with descriptive message
5. Push and create pull request

---

## Next Steps

### Phase 2 (Current) - Backend Development
- ✅ Project scaffolding
- ✅ Database schema & migrations
- ✅ Entity models & repositories
- ⏳ JWT authentication implementation
- ⏳ Service layer with business logic
- ⏳ REST controllers
- ⏳ Integration with Gemini API
- ⏳ Cloud storage (R2/S3)

### Phase 3 - Advanced Features
- OpenAI Whisper transcription
- WebSocket for real-time interviews
- Video editing (FFmpeg integration)
- Stripe payment processing
- Email notifications
- Admin dashboard

---

## Resources

- [Spring Boot Docs](https://docs.spring.io/spring-boot/docs/current/reference/html/)
- [Spring Security JWT](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html)
- [Flyway Migrations](https://flywaydb.org/documentation/)
- [Architecture Docs](../docs/architecture/system-design.md)
- [Database Schema](../docs/architecture/database-schema.md)

---

**Questions?** Check [docs/CLAUDE.md](../docs/CLAUDE.md) for full project context.
