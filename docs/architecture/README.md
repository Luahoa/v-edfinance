# System Architecture Overview

**V-EdFinance** uses a modern **monorepo architecture** with Next.js frontend and NestJS backend, deployed on VPS with Cloudflare CDN.

---

## Table of Contents

- [High-Level Architecture](#high-level-architecture)
- [Technology Stack](#technology-stack)
- [Detailed Architecture](#detailed-architecture)
- [Data Flow](#data-flow)
- [Deployment Architecture](#deployment-architecture)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare CDN/Pages                      │
│                  (Static Assets + Caching)                   │
└─────────────────────────┬───────────────────────────────────┘
                          │
              ┌───────────┴──────────┐
              │                      │
    ┌─────────▼────────┐   ┌────────▼─────────┐
    │   Next.js Web    │   │   NestJS API     │
    │   (Port 3000)    │◄──┤   (Port 3001)    │
    │   SSR + Client   │   │   REST API       │
    └──────────────────┘   └────────┬─────────┘
                                    │
                          ┌─────────▼──────────┐
                          │  PostgreSQL 16     │
                          │  + Prisma ORM      │
                          └────────────────────┘
```

---

## Technology Stack

### Frontend (`apps/web/`)
- **Framework**: Next.js 15.1.2 (App Router)
- **React**: 18.3.1
- **Styling**: Tailwind CSS 3.4 + shadcn/ui
- **State Management**: Zustand
- **i18n**: next-intl (vi/en/zh)
- **HTTP Client**: Fetch API

### Backend (`apps/api/`)
- **Framework**: NestJS 10
- **Runtime**: Node.js 18+
- **Database ORM**: Prisma 5.22
- **Validation**: class-validator + Zod
- **AI Integration**: Google Gemini Pro
- **Payments**: Stripe SDK

### Database
- **DBMS**: PostgreSQL 16
- **Migrations**: Prisma Migrate
- **Schema**: See [database.md](database.md)

### DevOps
- **Monorepo**: Turborepo + pnpm workspaces
- **Deployment**: VPS (backend) + Cloudflare Pages (frontend)
- **Monitoring**: Prometheus + Grafana
- **Logging**: Winston (backend), Sentry (frontend)

---

## Detailed Architecture

### 1. Frontend Architecture

See: [frontend.md](frontend.md)

**Key Features**:
- **App Router** with file-based routing
- **Server Components** (RSC) by default
- **Client Components** for interactivity
- **Atomic Design** component structure
- **Multi-language** support (vi/en/zh)

**Directory Structure**:
```
apps/web/src/
├── app/               # Next.js App Router pages
│   ├── [locale]/      # i18n routing
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── ...
├── components/        # React components
│   ├── atoms/         # Basic UI elements
│   ├── molecules/     # Composite components
│   └── organisms/     # Complex components
├── lib/               # Utilities & helpers
├── stores/            # Zustand state stores
└── i18n/              # Translation files
```

---

### 2. Backend Architecture

See: [backend.md](backend.md)

**Module Structure**:
```
apps/api/src/
├── modules/           # Feature modules
│   ├── auth/          # Authentication & JWT
│   ├── users/         # User management
│   ├── courses/       # Course management
│   ├── gamification/  # Achievements, XP, leaderboards
│   ├── ai-mentor/     # Google Gemini integration
│   ├── payments/      # Stripe integration
│   └── debug/         # Diagnostic tools
├── common/            # Shared utilities
│   ├── filters/       # Exception filters
│   ├── guards/        # Auth guards
│   ├── interceptors/  # Request/response interceptors
│   └── validators/    # JSONB schema validation
└── prisma/            # Prisma schema & migrations
```

**API Design**:
- **RESTful** endpoints
- **JWT authentication** (Bearer tokens)
- **RBAC** (Role-Based Access Control)
- **JSONB validation** for multi-language content
- **Error handling** with structured responses

---

### 3. Database Architecture

See: [database.md](database.md)

**Key Design Decisions**:
- **JSONB for i18n** content (avoid translation tables)
- **Soft deletes** for critical entities
- **Audit trails** (createdAt, updatedAt, deletedAt)
- **Normalized schema** with proper foreign keys

**Core Entities**:
- User, Profile, Role
- Course, Module, Lesson, Content
- Achievement, UserAchievement, XPLog
- Group, Post, Comment
- Payment, Subscription

---

### 4. Deployment Architecture

See: [deployment.md](deployment.md)

**Infrastructure**:
```
┌────────────────────────────────────────────────┐
│              Cloudflare Network                │
│  ┌──────────────┐        ┌─────────────────┐  │
│  │ CDN Caching  │        │ Pages (SSG)     │  │
│  └──────────────┘        └─────────────────┘  │
└──────────┬─────────────────────────────────────┘
           │
┌──────────▼────────────────────────────────────┐
│            VPS (Ubuntu 22.04)                 │
│  ┌────────────────┐  ┌──────────────────────┐ │
│  │  NestJS API    │  │  PostgreSQL 16       │ │
│  │  (PM2/Docker)  │  │  (Data + Backups)    │ │
│  └────────────────┘  └──────────────────────┘ │
│  ┌────────────────────────────────────────┐   │
│  │  Monitoring: Prometheus + Grafana      │   │
│  └────────────────────────────────────────┘   │
└───────────────────────────────────────────────┘
```

**Deployment Flow**:
1. **Frontend**: Auto-deploy to Cloudflare Pages on `git push main`
2. **Backend**: Manual deploy to VPS via SSH (with deploy scripts)
3. **Database**: Migrations run via `npx prisma migrate deploy`

---

## Data Flow

### User Request Flow (Authenticated)

```
1. User opens /courses → Next.js SSR
   ↓
2. Server Component fetches data from API (http://api:3001)
   ↓
3. NestJS API validates JWT token
   ↓
4. Prisma queries PostgreSQL
   ↓
5. Response → Next.js → Render HTML
   ↓
6. HTML sent to client (with hydration scripts)
   ↓
7. Client-side interactivity (React hydration)
```

### AI Mentor Flow

```
1. User sends question → POST /api/ai-mentor/ask
   ↓
2. NestJS validates request + user context
   ↓
3. Call Google Gemini API with:
   - User question
   - User profile (level, interests)
   - Course context
   ↓
4. Gemini generates personalized response
   ↓
5. Save interaction to BehaviorLog
   ↓
6. Return response to frontend
```

### Gamification Flow (Achievement Unlocked)

```
1. User completes lesson → POST /api/lessons/:id/complete
   ↓
2. NestJS marks lesson complete in DB
   ↓
3. Trigger achievement check (EventEmitter)
   ↓
4. GamificationService evaluates rules:
   - "Complete 10 lessons" → Check progress
   - If threshold met → Create UserAchievement
   ↓
5. Award XP → Update UserProfile.xp
   ↓
6. Emit WebSocket event (future):
   ws.emit('achievement-unlocked', { id, name })
   ↓
7. Frontend shows notification toast
```

---

## Security Architecture

**Authentication**:
- JWT tokens (access + refresh)
- Stored in httpOnly cookies (XSS protection)
- CSRF tokens for sensitive operations

**Authorization**:
- Role-Based Access Control (RBAC)
- Guards: `@Roles('admin', 'teacher')`
- Row-level security for user data

**Data Protection**:
- HTTPS only (enforced by Cloudflare)
- SQL injection prevention (Prisma parameterized queries)
- XSS prevention (React auto-escaping)
- Secrets in .env (never committed)

---

## Monitoring & Observability

**Metrics** (Prometheus):
- API response times
- Database query performance
- Error rates
- Active users

**Logs** (Winston):
- Structured JSON logs
- Log levels: error, warn, info, debug
- Rotation: daily, 14-day retention

**Alerts**:
- CPU/Memory > 80%
- Database connection pool exhausted
- Error rate > 5%

**Dashboard** (Grafana):
- System health overview
- User activity metrics
- Business KPIs (course completions, signups)

---

## Scalability Considerations

**Current (MVP)**:
- Single VPS instance
- PostgreSQL on same server
- Supports ~1000 concurrent users

**Future Scaling Path**:
1. **Horizontal scaling**: Add more API instances (load balancer)
2. **Database**: Move to managed PostgreSQL (RDS, Supabase)
3. **Caching**: Add Redis for sessions/leaderboards
4. **CDN**: Serve more assets via Cloudflare R2
5. **Search**: Add Elasticsearch for course search
6. **Real-time**: Separate WebSocket server cluster

---

## Performance Optimizations

**Frontend**:
- Image optimization (Next.js Image component)
- Code splitting (dynamic imports)
- Route prefetching (Next.js Link)
- Static Generation (SSG) for marketing pages

**Backend**:
- Database query optimization (indexes, EXPLAIN)
- Response caching (future: Redis)
- Connection pooling (Prisma)
- Pagination for large datasets

**Database**:
- Indexes on foreign keys
- Indexes on frequently queried fields (email, username)
- JSONB GIN indexes for i18n content

---

## Related Documentation

- [Frontend Architecture](frontend.md)
- [Backend Architecture](backend.md)
- [Database Schema](database.md)
- [Deployment Guide](deployment.md)
- [Main Architecture Doc](../../ARCHITECTURE.md)

---

**Last Updated**: 2026-01-05  
**Maintained by**: V-EdFinance Team
