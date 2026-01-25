# 🔧 PHẦN 2: CHÚNG TA THAY ĐỔI NHƯ THẾ NÀO?

> Execution Plan sử dụng Agentic Toolkit + Better-T-Stack

---

## 📋 Tổng quan Execution Strategy

### Architecture: Mayor + Polecats Pattern (Gastown)

```
┌─────────────────────────────────────────────────────────────────┐
│                    THE MAYOR (Orchestrator)                      │
│  - Owns execution plan                                           │
│  - Assigns tracks to Polecats                                    │
│  - Monitors progress via beads_viewer                            │
│  - Resolves conflicts via mcp_agent_mail                         │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ POLECAT ALPHA   │ │ POLECAT BETA    │ │ POLECAT GAMMA   │
│ Track 1: Hono   │ │ Track 2: tRPC   │ │ Track 3: Auth   │
│ File scope:     │ │ File scope:     │ │ File scope:     │
│ apps/api/hono/* │ │ apps/api/trpc/* │ │ apps/api/auth/* │
└─────────────────┘ └─────────────────┘ └─────────────────┘
          │                   │                   │
          └───────────────────┼───────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SAFETY LAYER                                  │
│  destructive_command_guard: Block rm -rf, git reset --hard       │
│  mcp_agent_mail: File reservations prevent conflicts             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Phase 1: Foundation Setup (Week 1)

### Epic: ved-bts-foundation

**Goal**: Setup Better-T-Stack skeleton + install Agentic Toolkit

### Track 1.1: Install Agentic Toolkit

**Files**: Root level scripts, configs

```bash
# Beads to create
ved-bts-1a: Install MCP Agent Mail server
ved-bts-1b: Build beads_viewer (bv.exe)
ved-bts-1c: Install destructive_command_guard
ved-bts-1d: Setup meta_skill MCP server
ved-bts-1e: Configure gastown (Mayor setup)
```

**Execution**:
```bash
# 1. MCP Agent Mail
cd mcp_agent_mail
curl -fsSL "https://raw.githubusercontent.com/Dicklesworthstone/mcp_agent_mail/main/scripts/install.sh" | bash -s -- --yes

# 2. Beads Viewer
cd beads_viewer
go build -o ../bv.exe ./cmd/bv

# 3. DCG
cd destructive_command_guard
cargo install --path .

# 4. Meta Skill
cd meta_skill
cargo install --path .

# 5. Gastown (Mayor setup)
cd gastown
go build -o ../gt.exe .
```

### Track 1.2: Create Better-T-Stack Skeleton

**Files**: `apps/server/` (NEW), `packages/api/` (NEW)

```bash
# Beads to create
ved-bts-2a: Create apps/server/ directory structure
ved-bts-2b: Setup Hono server entry point
ved-bts-2c: Create packages/api/ for tRPC router
ved-bts-2d: Configure Drizzle schema migration
ved-bts-2e: Setup better-auth skeleton
```

**File Structure**:
```
apps/
├── web/                    # Keep existing Next.js
├── api/                    # Keep existing NestJS (deprecation path)
└── server/                 # NEW: Better-T-Stack backend
    ├── src/
    │   ├── index.ts        # Hono entry point
    │   ├── lib/
    │   │   ├── db.ts       # Drizzle connection
    │   │   └── auth.ts     # better-auth setup
    │   ├── routes/
    │   │   ├── auth.ts     # Auth endpoints
    │   │   └── _app.ts     # tRPC router mount
    │   └── trpc/
    │       ├── router.ts   # Root router
    │       ├── context.ts  # tRPC context
    │       └── routers/
    │           ├── user.ts
    │           ├── course.ts
    │           └── ...
    ├── drizzle/
    │   ├── schema.ts       # Drizzle schema (migrate from Prisma)
    │   └── migrations/
    └── package.json

packages/
└── api/                    # NEW: Shared tRPC types
    ├── src/
    │   ├── index.ts        # Export router type
    │   └── client.ts       # tRPC client factory
    └── package.json
```

### Track 1.3: Drizzle Schema Migration

**Files**: `apps/server/drizzle/schema.ts`

```bash
# Beads to create
ved-bts-3a: Convert User model to Drizzle
ved-bts-3b: Convert Course/Lesson models
ved-bts-3c: Convert BehaviorLog model
ved-bts-3d: Convert Gamification models
ved-bts-3e: Generate Drizzle migrations
```

**Strategy**: Prisma → Drizzle conversion

```typescript
// BEFORE: prisma/schema.prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      Role     @default(USER)
  createdAt DateTime @default(now())
}

// AFTER: apps/server/drizzle/schema.ts
import { pgTable, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['USER', 'ADMIN', 'INSTRUCTOR']);

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: text('email').unique().notNull(),
  name: text('name'),
  role: roleEnum('role').default('USER').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

---

## 🔄 Phase 2: Core Migration (Week 2)

### Epic: ved-bts-core

**Goal**: Migrate auth + core APIs to Better-T-Stack

### Track 2.1: better-auth Setup

**Files**: `apps/server/src/lib/auth.ts`

```bash
# Beads
ved-bts-4a: Configure better-auth with Drizzle
ved-bts-4b: Add email/password provider
ved-bts-4c: Add Google OAuth provider
ved-bts-4d: Setup session management
ved-bts-4e: Create auth middleware for Hono
```

```typescript
// apps/server/src/lib/auth.ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});
```

### Track 2.2: tRPC Router Setup

**Files**: `apps/server/src/trpc/`, `packages/api/`

```bash
# Beads
ved-bts-5a: Create tRPC context with session
ved-bts-5b: Setup root router
ved-bts-5c: Create user router (profile, settings)
ved-bts-5d: Create course router (list, detail, progress)
ved-bts-5e: Integrate tRPC with Hono
```

```typescript
// apps/server/src/trpc/router.ts
import { router, publicProcedure, protectedProcedure } from './trpc';
import { userRouter } from './routers/user';
import { courseRouter } from './routers/course';

export const appRouter = router({
  user: userRouter,
  course: courseRouter,
  // ... more routers
});

export type AppRouter = typeof appRouter;
```

```typescript
// packages/api/src/client.ts
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../apps/server/src/trpc/router';

export const api = createTRPCReact<AppRouter>();
```

### Track 2.3: Frontend tRPC Integration

**Files**: `apps/web/src/lib/trpc.ts`, `apps/web/src/app/providers.tsx`

```bash
# Beads
ved-bts-6a: Setup tRPC client in Next.js
ved-bts-6b: Create TRPCProvider
ved-bts-6c: Replace REST calls with tRPC (auth)
ved-bts-6d: Replace REST calls with tRPC (courses)
ved-bts-6e: Replace REST calls with tRPC (user)
```

---

## 🔁 Phase 3: Feature Migration (Week 3)

### Epic: ved-bts-features

**Goal**: Migrate all NestJS modules to tRPC routers

### Migration Matrix

| NestJS Module | tRPC Router | Priority | Complexity |
|---------------|-------------|----------|------------|
| AuthModule | userRouter.auth | P0 | HIGH |
| UsersModule | userRouter | P0 | MEDIUM |
| CoursesModule | courseRouter | P0 | HIGH |
| LessonsModule | lessonRouter | P1 | MEDIUM |
| SimulationModule | simulationRouter | P1 | HIGH |
| GamificationModule | gamificationRouter | P1 | MEDIUM |
| SocialModule | socialRouter | P2 | MEDIUM |
| AIModule | aiRouter | P2 | HIGH |
| PaymentsModule | paymentsRouter | P2 | HIGH |
| NotificationsModule | notificationRouter | P3 | LOW |
| StorageModule | storageRouter | P3 | LOW |
| AnalyticsModule | analyticsRouter | P3 | MEDIUM |

### Parallel Execution Plan (Gastown)

```
Mayor spawns 5 Polecats:

POLECAT-1: userRouter + courseRouter
POLECAT-2: lessonRouter + simulationRouter  
POLECAT-3: gamificationRouter + socialRouter
POLECAT-4: aiRouter + paymentsRouter
POLECAT-5: notificationRouter + storageRouter + analyticsRouter

File Reservations (via MCP Agent Mail):
- POLECAT-1: apps/server/src/trpc/routers/user.ts, course.ts
- POLECAT-2: apps/server/src/trpc/routers/lesson.ts, simulation.ts
- POLECAT-3: apps/server/src/trpc/routers/gamification.ts, social.ts
- POLECAT-4: apps/server/src/trpc/routers/ai.ts, payments.ts
- POLECAT-5: apps/server/src/trpc/routers/notification.ts, storage.ts, analytics.ts
```

---

## 🧹 Phase 4: Cleanup & Deploy (Week 4)

### Epic: ved-bts-deploy

**Goal**: Remove NestJS, deploy to Edge

### Track 4.1: Deprecate NestJS

```bash
# Beads
ved-bts-7a: Remove apps/api/ (after verification)
ved-bts-7b: Update turbo.json build targets
ved-bts-7c: Update docker-compose files
ved-bts-7d: Update CI/CD workflows
ved-bts-7e: Update AGENTS.md documentation
```

### Track 4.2: Edge Deployment

```bash
# Beads
ved-bts-8a: Configure Cloudflare Workers for Hono
ved-bts-8b: Setup D1 database (edge SQLite)
ved-bts-8c: Configure environment variables
ved-bts-8d: Setup staging deployment
ved-bts-8e: Production deployment + smoke tests
```

---

## 🛠️ Agentic Toolkit Usage During Migration

### 1. MCP Agent Mail: Coordination

```python
# Each Polecat registers before starting
ensure_project(project_key="/path/to/v-edfinance")
register_agent(project_key, program="claude", model="opus-4")

# Reserve files exclusively
file_reservation_paths(
    project_key="/path/to/v-edfinance",
    agent_name="POLECAT-1",
    paths=["apps/server/src/trpc/routers/user.ts"],
    ttl_seconds=3600,
    exclusive=True,
    reason="ved-bts-5c: Create user router"
)

# Communicate with thread_id = bead ID
send_message(
    project_key="/path/to/v-edfinance",
    from_agent="POLECAT-1",
    to_agent="Mayor",
    subject="[ved-bts-5c] User router complete",
    body="Implemented profile, settings, preferences endpoints",
    thread_id="ved-bts-5c"
)
```

### 2. Beads Viewer: Task Triage

```bash
# Mayor uses bv to plan parallel tracks
bv --robot-triage | jq '.recommendations[:5]'

# Get execution plan with parallel tracks
bv --robot-plan | jq '.plan.tracks'

# Check for dependency cycles
bv --robot-insights | jq '.Cycles'
```

### 3. Gastown: Multi-Agent Orchestration

```bash
# Initialize town
gt init ~/gt

# Add v-edfinance as a rig
gt rig add v-edfinance /path/to/v-edfinance

# Create convoy for Phase 2
gt convoy create "Core Migration" ved-bts-4a ved-bts-4b ved-bts-4c --notify

# Assign to Polecats
gt sling ved-bts-4a POLECAT-1
gt sling ved-bts-4b POLECAT-2

# Monitor progress
gt convoy list
gt agents
```

### 4. DCG: Safety

```bash
# DCG automatically blocks dangerous commands
# If an agent tries: git reset --hard
# DCG blocks and logs the attempt

# To explain why blocked
dcg explain "git reset --hard HEAD~5"
```

### 5. Meta Skill: Skill Management

```bash
# Index project skills
ms index

# Search for relevant skills
ms search "tRPC migration" --robot

# Load skill with token budget
ms load trpc-best-practices --pack 2000
```

---

## 📊 Progress Tracking

### Beads Dashboard

```bash
# Daily standup
bd ready --json | jq 'length'  # Count ready tasks
bv --robot-triage | jq '.quick_ref'

# Weekly review
bv --robot-insights | jq '.project_health'
bv --robot-diff --diff-since "7 days ago"
```

### Quality Gates

```bash
# After each track completion
pnpm --filter server build
pnpm --filter server test
pnpm --filter web build

# Full quality gate
scripts/quality-gate-ultra-fast.bat
```

---

## 🎯 Success Criteria

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Cold start | 3-5s | <200ms | ✅ |
| Bundle size | 50MB | <2MB | ✅ |
| Type coverage | 85% | 100% | ✅ |
| API type safety | Partial | End-to-end | ✅ |
| Edge deployment | ❌ | ✅ | ✅ |
| Agent parallelism | 2 | 20+ | ✅ |

---

## Tiếp theo?

Tạo beads tasks và bắt đầu Phase 1: Foundation Setup
