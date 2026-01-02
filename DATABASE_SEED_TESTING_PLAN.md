# 📊 Database Seed Testing Plan

**Date:** 2025-12-23  
**Status:** READY FOR EXECUTION  
**Priority:** 🔴 P1 - Critical Infrastructure

---

## 📌 Tổng Quan AI Agent Tools

### 🤖 Core AI Agents

| Agent | Location | Purpose | Status |
|-------|----------|---------|--------|
| **Database Architect Agent** | [apps/api/src/database/database-architect.agent.ts](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/src/database/database-architect.agent.ts) | Autonomous query optimization via RAG + Heuristics | ✅ Active |
| **AI Service (Gemini)** | [apps/api/src/ai/ai.service.ts](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/src/ai/ai.service.ts) | Chat threads, rate limiting, token management | ✅ Active |
| **Vanna Service** | [apps/api/src/modules/ai/vanna.service.ts](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/src/modules/ai/vanna.service.ts) | AI-driven SQL generation | ✅ Active |

### 🛠️ Orchestration Frameworks

| Framework | Location | Purpose |
|-----------|----------|---------|
| **Amphitheatre** | [.agents/skills/amphitheatre-agent-framework.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/.agents/skills/amphitheatre-agent-framework.md) | Multi-agent DevOps orchestration |
| **Beads Protocol** | [docs/BEADS_MULTI_AGENT_PROTOCOL.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/docs/BEADS_MULTI_AGENT_PROTOCOL.md) | Multi-agent sync coordination |
| **Swarm SDK** | [temp_skills/swarm/swarm-main/lib/swarm_sdk.rb](file:///c:/Users/luaho/Demo%20project/v-edfinance/temp_skills/swarm/swarm-main/lib/swarm_sdk.rb) | Ruby-based agent orchestration |

### 📦 Deployment Configs

| Config | Path | Purpose |
|--------|------|---------|
| **AI Agent Docker** | [docker-compose.ai-agent.yml](file:///c:/Users/luaho/Demo%20project/v-edfinance/docker-compose.ai-agent.yml) | Database Architect containerization |
| **100-Agent Roadmap** | [ZERO_DEBT_100_AGENT_ROADMAP.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/ZERO_DEBT_100_AGENT_ROADMAP.md) | 5-wave agent deployment strategy |

---

## 🌱 Database Seed Architecture

### Current Seed System

| Component | File | Purpose |
|-----------|------|---------|
| **Main Seed** | [apps/api/prisma/seed.ts](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/prisma/seed.ts) | Basic seed (1 admin, 1 student, 1 course) |
| **Orchestrator** | [apps/api/prisma/seeds/index.ts](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/prisma/seeds/index.ts) | Multi-scenario runner |
| **Snaplet Config** | [apps/api/seed.config.ts](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/seed.config.ts) | Snaplet adapter config |

### 4 Seed Scenarios

| Scenario | Scale | Purpose | File |
|----------|-------|---------|------|
| **dev** | 50 users, 10 courses, 7 days logs | Local development | [dev.seed.ts](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/prisma/seeds/scenarios/dev.seed.ts) |
| **test** | 20 users, 5 courses, minimal data | CI/CD testing | [test.seed.ts](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/prisma/seeds/scenarios/test.seed.ts) |
| **demo** | 200 users, 25 courses, 30 days logs | Staging/Demo | [demo.seed.ts](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/prisma/seeds/scenarios/demo.seed.ts) |
| **benchmark** | 10k users, 100 courses, 90 days logs | Performance testing | [benchmark.seed.ts](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/prisma/seeds/scenarios/benchmark.seed.ts) |

### Factory Modules

| Factory | Purpose | Data Generated |
|---------|---------|----------------|
| **user.factory** | User generation | Email, roles, metadata, locales |
| **course.factory** | Course & lesson generation | Multi-lingual titles, descriptions, lessons |
| **behavior.factory** | Behavior log generation | User activities, timestamps, JSONB payloads |
| **gamification.factory** | Gamification data | Streaks, achievements, buddy groups/challenges |

---

## 🧪 Testing Plan

### Phase 1: Seed Validation (P0)

#### T1.1: Basic Seed Integrity
```bash
# Run basic seed
pnpm --filter api exec npx prisma migrate reset --force
pnpm --filter api exec ts-node prisma/seed.ts

# Verify data
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"User\";"  # Expect: 2 (admin + student)
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Course\";" # Expect: 1
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"UserChecklist\";" # Expect: 1
```

**Expected:**
- ✅ Admin user created (admin@v-edfinance.com)
- ✅ Student user created (student@example.com)
- ✅ Course with 2 lessons created
- ✅ SystemSettings created

**Success Criteria:** All counts match expected values, no errors.

---

#### T1.2: Dev Scenario Validation
```bash
# Run dev seed
pnpm --filter api exec npx ts-node prisma/seeds/index.ts dev

# Verify scale
psql $DATABASE_URL -c "SELECT role, COUNT(*) FROM \"User\" GROUP BY role;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Course\";"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"BehaviorLog\";"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"BuddyGroup\";"
```

**Expected:**
- ✅ 50 users across roles (STUDENT majority, some ADMIN/INSTRUCTOR)
- ✅ 10 courses with 5-12 lessons each
- ✅ 7 days of behavior logs (~350 entries)
- ✅ 5 buddy groups with challenges

**Success Criteria:** Counts within ±10% tolerance, JSONB fields valid JSON.

---

#### T1.3: JSONB Schema Validation
```bash
# Check JSONB structure integrity
psql $DATABASE_URL << 'SQL'
-- Verify Course titles
SELECT slug, title->'vi' as title_vi, title->'en' as title_en, title->'zh' as title_zh
FROM "Course" LIMIT 5;

-- Verify User metadata
SELECT email, metadata->>'displayName' as display_name
FROM "User" WHERE role = 'STUDENT' LIMIT 5;

-- Verify Lesson content
SELECT title->'vi' as title, type, published
FROM "Lesson" WHERE published = true LIMIT 5;
SQL
```

**Expected:**
- ✅ All JSONB fields contain valid `{vi, en, zh}` keys
- ✅ No NULL values in required locales
- ✅ displayName present in User metadata

**Success Criteria:** No NULL violations, all 3 locales present in i18n fields.

---

### Phase 2: Triple-ORM Data Verification (P0)

#### T2.1: Prisma Read Verification
```typescript
// Test in apps/api/src/database/database.service.spec.ts
describe('Seeded Data - Prisma', () => {
  it('should read seeded users via Prisma', async () => {
    const users = await prisma.user.findMany({ take: 10 });
    expect(users).toHaveLength(10);
    expect(users[0]).toHaveProperty('email');
    expect(users[0]).toHaveProperty('metadata');
  });

  it('should read seeded courses via Prisma', async () => {
    const courses = await prisma.course.findMany({ include: { lessons: true } });
    expect(courses.length).toBeGreaterThan(0);
    expect(courses[0].lessons.length).toBeGreaterThan(0);
  });
});
```

---

#### T2.2: Drizzle Read Verification
```typescript
// Test Drizzle ORM reads from seeded data
describe('Seeded Data - Drizzle', () => {
  it('should read seeded behavior logs via Drizzle', async () => {
    const db = drizzle(process.env.DATABASE_URL);
    const logs = await db.select().from(behaviorLog).limit(10);
    expect(logs).toHaveLength(10);
    expect(logs[0]).toHaveProperty('action');
  });

  it('should handle JSONB fields correctly', async () => {
    const courses = await db.select().from(course).limit(5);
    courses.forEach(c => {
      expect(c.title).toHaveProperty('vi');
      expect(c.title).toHaveProperty('en');
    });
  });
});
```

---

#### T2.3: Kysely Analytics Verification
```typescript
// Test complex analytics on seeded data
describe('Seeded Data - Kysely', () => {
  it('should aggregate behavior logs by action', async () => {
    const kyselyService = new KyselyService(process.env.DATABASE_URL);
    const stats = await kyselyService.db
      .selectFrom('BehaviorLog')
      .select(['action', sql<number>`COUNT(*)`.as('count')])
      .groupBy('action')
      .execute();

    expect(stats.length).toBeGreaterThan(0);
    expect(stats[0].count).toBeGreaterThan(0);
  });

  it('should join users and courses for analytics', async () => {
    const enrollments = await kyselyService.db
      .selectFrom('CourseProgress')
      .innerJoin('User', 'User.id', 'CourseProgress.userId')
      .select(['User.email', 'CourseProgress.progress'])
      .limit(10)
      .execute();

    expect(enrollments).toBeDefined();
  });
});
```

---

### Phase 3: AI Agent Data Requirements (P1)

#### T3.1: Database Architect Agent Data
```bash
# Seed data for Database Architect Agent testing
# Agent requires query patterns in pg_stat_statements

# Enable pg_stat_statements (if not enabled)
psql $DATABASE_URL << 'SQL'
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Generate synthetic query load
SELECT * FROM "User" WHERE email LIKE '%example%' LIMIT 100;
SELECT * FROM "Course" ORDER BY "createdAt" DESC LIMIT 50;
SELECT COUNT(*) FROM "BehaviorLog";
SQL

# Run agent analysis
curl -X POST http://localhost:3001/api/database/architect/analyze
```

**Verification:**
```typescript
describe('Database Architect Agent - Seeded Data', () => {
  it('should analyze seeded query patterns', async () => {
    const agent = new DatabaseArchitectAgent(/* services */);
    const patterns = await agent.analyzeQueryPatterns();
    expect(patterns.length).toBeGreaterThan(0);
  });

  it('should generate recommendations for seeded queries', async () => {
    const recommendations = await agent.generateRecommendations();
    expect(recommendations).toContainEqual(
      expect.objectContaining({
        source: expect.stringMatching(/rag|heuristic|generic/),
        confidence: expect.any(Number),
      })
    );
  });
});
```

---

#### T3.2: AI Chat Service Data
```typescript
// Verify AI Service can read seeded data for chat context
describe('AI Service - Seeded Data', () => {
  it('should retrieve user context from seeded data', async () => {
    const aiService = new AiService(/* deps */);
    const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
    
    const context = await aiService.getUserContext(student.id);
    expect(context).toHaveProperty('enrolledCourses');
    expect(context).toHaveProperty('recentActivity');
  });

  it('should generate scenario-based responses', async () => {
    const response = await aiService.chat({
      userId: studentId,
      message: 'Show my progress',
    });
    expect(response).toContain('progress');
  });
});
```

---

### Phase 4: Benchmark & Performance (P2)

#### T4.1: Benchmark Seed Performance
```bash
# Measure seed execution time
time pnpm --filter api exec npx ts-node prisma/seeds/index.ts benchmark

# Expected: < 5 minutes for 10k users
```

**Success Criteria:**
- ✅ Completes in < 5 minutes
- ✅ No memory leaks (monitor with `docker stats`)
- ✅ Database size < 2GB

---

#### T4.2: Database Architect Agent Performance on Benchmark Data
```bash
# Run agent analysis on large dataset
curl -X POST http://localhost:3001/api/database/architect/analyze

# Expected: < 2 minutes for 10k users, 90 days logs
```

**Success Criteria:**
- ✅ Analysis completes < 2 minutes
- ✅ Generates ≥10 recommendations
- ✅ Confidence scores accurate

---

## 🔧 Testing Execution Commands

### Quick Test Suite
```bash
# 1. Reset DB and run basic seed
pnpm --filter api exec npx prisma migrate reset --force
pnpm --filter api exec ts-node prisma/seed.ts

# 2. Run dev scenario
pnpm --filter api exec npx ts-node prisma/seeds/index.ts dev

# 3. Verify with tests
pnpm --filter api test database.service.spec.ts
pnpm --filter api test database-architect.agent.spec.ts
pnpm --filter api test ai.service.spec.ts

# 4. Manual verification
psql $DATABASE_URL -c "SELECT table_name, n_live_tup FROM pg_stat_user_tables WHERE schemaname = 'public';"
```

### Full Scenario Testing
```bash
# Test all 4 scenarios
for scenario in dev test demo benchmark; do
  echo "Testing $scenario scenario..."
  pnpm --filter api exec npx prisma migrate reset --force
  pnpm --filter api exec npx ts-node prisma/seeds/index.ts $scenario
  pnpm --filter api test
done
```

---

## 📋 Acceptance Criteria

### Phase 1: Seed Validation
- [ ] Basic seed creates 2 users, 1 course, 1 checklist, 1 system setting
- [ ] Dev scenario creates 50 users, 10 courses, 7 days logs
- [ ] All JSONB fields contain valid `{vi, en, zh}` structure
- [ ] No NULL violations in required fields

### Phase 2: Triple-ORM Verification
- [ ] Prisma reads seeded data correctly (users, courses)
- [ ] Drizzle reads seeded behavior logs correctly
- [ ] Kysely analytics queries work on seeded data

### Phase 3: AI Agent Requirements
- [ ] Database Architect Agent analyzes seeded query patterns
- [ ] AI Service retrieves user context from seeded data
- [ ] Vanna Service generates SQL queries based on seeded schema

### Phase 4: Performance
- [ ] Benchmark seed completes < 5 minutes (10k users)
- [ ] Database size < 2GB after benchmark seed
- [ ] Agent analysis completes < 2 minutes on benchmark data

---

## 🚀 Next Steps

1. **Execute Phase 1** (T1.1 → T1.3)
2. **Fix any seed data issues** found during validation
3. **Execute Phase 2** (Triple-ORM verification)
4. **Execute Phase 3** (AI Agent integration)
5. **Execute Phase 4** (Benchmark testing)
6. **Document results** in completion report

---

## 🔗 Related Docs

- [PRISMA_DRIZZLE_HYBRID_STRATEGY.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/docs/PRISMA_DRIZZLE_HYBRID_STRATEGY.md)
- [AI_DB_ARCHITECT_TASKS.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/docs/AI_DB_ARCHITECT_TASKS.md)
- [DATABASE_OPTIMIZATION_QUICK_START.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/DATABASE_OPTIMIZATION_QUICK_START.md)
