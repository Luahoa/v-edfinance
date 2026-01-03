# 🚀 THREAD HANDOFF: Database Speed Optimization

**Date:** 2024-12-22
**Priority:** 🔴 P1 - Database Performance
**Focus:** Phase 3-4 CI/CD + Query Optimization

---

## 📋 AGENT ONBOARDING (Copy-Paste)

```bash
# === BẮT ĐẦU SESSION ===
git pull --rebase
.\beads.exe sync
.\beads.exe doctor
.\beads.exe prime
.\beads.exe ready
```

---

## ✅ COMPLETED (Phase 1-2)

| Phase | Status | Details |
|-------|--------|---------|
| Phase 1: Seed Factories | ✅ Done | 4 factories: user, course, behavior, gamification |
| Phase 2: Kysely Analytics | ✅ Done | 9 queries: DAU, MAU, Cohort, Funnel, Leaderboard |

**Key Files Created:**
- `apps/api/prisma/seeds/factories/*.factory.ts` - Data factories
- `apps/api/prisma/seeds/index.ts` - Seed orchestrator
- `apps/api/src/database/kysely.module.ts` - Kysely integration
- `apps/api/src/modules/analytics/analytics.repository.ts` - 9 complex queries

---

## 🎯 DATABASE SPEED TASKS (This Thread)

### Task 1: ved-kzt - Pre-commit Hooks for Schema Changes (P3 → Upgrade P1)
**Goal:** Auto-regenerate ERD + Kysely types when schema.prisma changes

```bash
.\beads.exe update ved-kzt --status in_progress
```

**Implementation:**
```bash
# Install husky
pnpm add -D husky lint-staged

# Setup hooks
npx husky init
```

**Hook Script (.husky/pre-commit):**
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Check if schema.prisma changed
if git diff --cached --name-only | grep -q "schema.prisma"; then
  echo "🔄 Prisma schema changed - regenerating..."
  cd apps/api && npx prisma generate
  git add docs/erd.md src/database/types.ts src/database/enums.ts
fi
```

---

### Task 2: Create GitHub Actions Workflow (New Task)
**Goal:** CI/CD for database tools

**Create:** `.github/workflows/database-tools.yml`
```yaml
name: Database Tools CI

on:
  push:
    paths:
      - 'apps/api/prisma/**'
  pull_request:
    paths:
      - 'apps/api/prisma/**'

jobs:
  erd-generation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: cd apps/api && npx prisma generate
      - uses: actions/upload-artifact@v4
        with:
          name: erd-docs
          path: apps/api/docs/erd.md

  kysely-type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
      - run: pnpm install
      - run: cd apps/api && npx prisma generate
      - run: cd apps/api && npx tsc --noEmit -p tsconfig.json
```

---

### Task 3: Add Performance Indexes (New Task - P1)
**Goal:** Optimize heavy queries with composite indexes

**Migration SQL:**
```sql
-- apps/api/prisma/migrations/xxx_add_performance_indexes/migration.sql

-- BehaviorLog: Heavy reads for analytics
CREATE INDEX idx_behavior_user_timestamp 
  ON "BehaviorLog"("userId", "timestamp" DESC);
CREATE INDEX idx_behavior_session 
  ON "BehaviorLog"("sessionId", "eventType");
CREATE INDEX idx_behavior_event_time 
  ON "BehaviorLog"("eventType", "timestamp" DESC);

-- UserProgress: Funnel queries
CREATE INDEX idx_progress_user_status 
  ON "UserProgress"("userId", "status");
CREATE INDEX idx_progress_course_status 
  ON "UserProgress"("courseId", "status");

-- Leaderboard optimization
CREATE INDEX idx_user_points 
  ON "User"(points DESC) WHERE role = 'STUDENT';

-- Course queries
CREATE INDEX idx_course_level_status 
  ON "Course"(level, "isPublished");
```

**Command:**
```bash
cd apps/api && npx prisma migrate dev --name add_performance_indexes
```

---

### Task 4: Redis Caching for Leaderboard (New Task - P1)
**Goal:** Cache leaderboard results (5 min TTL)

**Files to Create:**
1. `apps/api/src/cache/redis.module.ts`
2. `apps/api/src/cache/redis.service.ts`
3. Update `analytics.repository.ts` with caching

**Implementation Pattern:**
```typescript
// redis.service.ts
@Injectable()
export class RedisService {
  async getOrSet<T>(key: string, ttlSeconds: number, factory: () => Promise<T>): Promise<T> {
    const cached = await this.client.get(key);
    if (cached) return JSON.parse(cached);
    
    const result = await factory();
    await this.client.setex(key, ttlSeconds, JSON.stringify(result));
    return result;
  }
}

// In analytics.repository.ts
async getLeaderboard(limit: number) {
  return this.redis.getOrSet(`leaderboard:${limit}`, 300, async () => {
    // Existing Kysely query
  });
}
```

---

### Task 5: ved-3ro - NocoDB Setup (P3)
**Goal:** Admin UI for database management

```bash
.\beads.exe update ved-3ro --status in_progress
docker-compose -f docker-compose.nocodb.yml up -d
# Access: http://localhost:8080
```

---

## 📊 ALL OPEN ISSUES BY PRIORITY

### 🔴 P1 - Critical (10 tasks)
| ID | Task | Module | Recommended |
|----|------|--------|-------------|
| ved-iu3 | Account Lockout After Failed Login | AUTH | ⭐ Quick Win |
| ved-ltl | Password Strength Validation | AUTH | ⭐ Quick Win |
| ved-23r | JWT Blacklist for Logout | AUTH | Medium |
| ved-11h | Transaction Rollback on Token Failure | AUTH | Medium |
| ved-c6i | Invalidate Sessions After Password Change | USERS | Medium |
| ved-7mn | Prevent Progress Tampering | COURSES | Medium |
| ved-mja | Authorization for Lesson Access | COURSES | Medium |
| ved-87h | Validate Course Ownership Before Updates | COURSES | Medium |
| ved-3fw | Configure Cloudflare R2 bucket | INFRA | Infrastructure |
| ved-s3c | Get Google AI Gemini API key | INFRA | Infrastructure |

### 🟡 P1 - Epics/Large (4 epics)
| ID | Epic | Sub-tasks |
|----|------|-----------|
| ved-fxx | E2E Testing Stabilization | ved-e6z, ved-33q, ved-iqp |
| ved-409 | Wave 4: Integration Tests | 25 agents |
| ved-28u | Wave 5: E2E + Polish | 10 agents |
| ved-xt3 | Phase 1: Quality Gate | Zero-Debt |

### 🟠 P2 - Medium (10 tasks)
| ID | Task | Module |
|----|------|--------|
| ved-akk | Fix TypeScript errors in test files | TESTS |
| ved-f6p | Fix Next.js web build i18n config | WEB |
| ved-bh7 | Add Request Correlation IDs | GLOBAL |
| ved-4fm | Add Price and Slug Validation | COURSES |
| ved-d8j | Extract Magic Numbers to Config | AUTH |
| ved-vkr | Timing-Safe Error Messages | AUTH |
| ved-sm0.3 | Systematic Error Analysis | TESTS |
| ved-c9f | Create tests for friends system | TESTS |
| ved-4vl | Implement AI Chat E2E Flow | E2E |
| ved-7w1 | Audit ARCHITECTURE.md | DOCS |

### 🟢 P3 - Low (2 tasks)
| ID | Task | Status |
|----|------|--------|
| ved-kzt | Pre-commit hooks for schema | **DO THIS** |
| ved-3ro | Setup NocoDB | **DO THIS** |

---

## 🛠️ INSTALLED TOOLS

| Tool | Package | Status |
|------|---------|--------|
| Kysely | `kysely@0.28.9` | ✅ Integrated |
| prisma-kysely | `2.2.1` | ✅ Auto-gen types |
| Snaplet Copycat | `@snaplet/copycat@6.0.0` | ✅ Factories |
| ERD Generator | `prisma-erd-generator` | ✅ Configured |
| NocoDB | Docker | ⏳ Pending setup |

---

## 📁 KEY FILE LOCATIONS

```
apps/api/
├── prisma/
│   ├── schema.prisma              # Main schema
│   ├── seeds/
│   │   ├── index.ts               # ✅ Orchestrator
│   │   └── factories/             # ✅ Data factories
├── src/
│   ├── database/
│   │   ├── kysely.module.ts       # ✅ Connection
│   │   ├── kysely.service.ts      # ✅ Injectable
│   │   └── types.ts               # ✅ Auto-generated
│   └── modules/analytics/
│       └── analytics.repository.ts # ✅ 9 Kysely queries
docs/
└── DATABASE_TOOLS_INTEGRATION_PLAN.md  # Full roadmap
```

---

## ⚡ QUICK COMMANDS

```bash
# Database Tools
cd apps/api && npx prisma generate          # Regenerate types
cd apps/api && npx ts-node prisma/seeds/index.ts dev    # Seed data
cd apps/api && npx prisma migrate dev --name xxx        # New migration

# NocoDB
docker-compose -f docker-compose.nocodb.yml up -d
# Access: http://localhost:8080

# Beads
.\beads.exe ready                           # Available work
.\beads.exe update ved-xxx --status in_progress
.\beads.exe close ved-xxx --reason "Done: description"
.\beads.exe sync
```

---

## 📝 SESSION END PROTOCOL

```bash
# === KẾT THÚC SESSION ===
.\beads.exe sync
git add -A && git commit -m "feat(db): add performance indexes and CI workflow"
git push                                    # MANDATORY
git status                                  # Must show "up to date"
```

---

## 🎯 RECOMMENDED EXECUTION ORDER

1. **ved-kzt** - Pre-commit hooks (15 min)
2. **New: GitHub Actions workflow** (30 min)
3. **New: Performance indexes migration** (20 min)
4. **New: Redis caching** (45 min) - Optional
5. **ved-3ro** - NocoDB setup (10 min)

**Total Estimated Time:** ~2 hours

---

*Created: 2024-12-22 | Focus: Database Speed Optimization*
