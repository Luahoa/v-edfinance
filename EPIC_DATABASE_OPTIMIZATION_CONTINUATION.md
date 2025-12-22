# 🗄️ EPIC: Database Optimization & Analytics Continuation

**Epic ID:** `ved-db-opt`  
**Priority:** P1 - PRODUCTION READINESS  
**Timeline:** 4 weeks (Parallel with VPS Deployment)  
**Owner:** Backend + Data Engineering Team  
**Target:** <500ms p95 query time, production-grade database stack

---

## 🎯 Epic Vision

**Continue database optimization from Phase 2 → Production:**
- ✅ All Kysely analytics queries production-ready
- ✅ VPS performance validated with real data
- ✅ CI/CD automation for database changes
- ✅ Admin tools (NocoDB) for data inspection
- ✅ Comprehensive documentation

---

## 📊 Epic Metrics

| Metric | Current (Phase 2) | Target |
|--------|-------------------|--------|
| **Complex Query p95** | Expected 200-450ms | <500ms ✅ |
| **Leaderboard (cached)** | Expected <10ms | <10ms 🚀 |
| **Kysely Type Coverage** | 100% | 100% ✅ |
| **Test Coverage** | TBD | 80%+ |
| **CI/CD Automation** | 0% | 100% |
| **VPS Performance** | Not tested | Validated ✅ |

---

## 🗺️ Current State (Phase 2 Complete)

### ✅ Completed Work
**From:** [DATABASE_OPTIMIZATION_PHASE2_COMPLETE.md](docs/DATABASE_OPTIMIZATION_PHASE2_COMPLETE.md)

**Delivered:**
- ✅ **13 Kysely analytics queries** (type-safe, production-ready)
- ✅ **Redis caching** for leaderboard (5min TTL, ~30x performance boost)
- ✅ **Module integration** (KyselyModule + RedisCacheModule)
- ✅ **VPS test script** (`scripts/test-vps-analytics.ts`)
- ✅ **Deployment guide** (`docs/VPS_ANALYTICS_DEPLOYMENT.md`)

**Queries Implemented:**
```typescript
getDailyActiveUsers(days)           // DAU/MAU tracking
getMonthlyActiveUsers(months)       // Monthly metrics
getLearningFunnel(courseId?)        // Conversion funnel
getCohortRetention(weeks)           // Retention analysis
getLeaderboard(options)             // With Redis cache 🚀
getStudentBehaviorPattern(userId)   // AI personalization
getCourseCompletionByLevel()        // Difficulty analysis
getAtRiskStudents(options)          // Churn prediction
getCourseEngagementMetrics(id)      // Deep analytics
getTopCourses(limit)                // Popular courses
getGamificationEffectiveness()      // Points/streaks impact
```

### 🔄 Pending Work (Phase 3-4)
**From:** [DATABASE_OPTIMIZATION_ROADMAP.md](DATABASE_OPTIMIZATION_ROADMAP.md)

**Remaining Tasks:** 5 tasks (ved-hyv.14 → ved-hyv.18)

---

## 🏗️ Phase Breakdown

### Phase 3: VPS Performance Validation (Week 1)
**Goal:** Validate queries on production-like environment

#### Tasks:
- **ved-db-opt.1** - Deploy Analytics Code to VPS Staging (30 min) - P0
  - Git push to staging branch
  - Dokploy auto-deploy
  - Verify containers started
  
- **ved-db-opt.2** - Seed Realistic Data on VPS (40 min) - P0
  - Run `pnpm db:seed:demo` (200 users, 25 courses)
  - Verify BehaviorLog has 30 days of data
  - Check Redis connectivity
  
- **ved-db-opt.3** - Run VPS Performance Tests (60 min) - P1
  - Execute `pnpm ts-node scripts/test-vps-analytics.ts`
  - Measure p95 latency (<500ms target)
  - Validate cache hit rate (>50% target)
  - Document bottlenecks
  
- **ved-db-opt.4** - PostgreSQL Performance Tuning (90 min) - P1
  - Analyze slow query log
  - Adjust `shared_buffers`, `effective_cache_size`
  - Run `VACUUM ANALYZE` on large tables
  - Verify index usage with EXPLAIN ANALYZE
  
- **ved-db-opt.5** - Redis Cache Strategy Expansion (45 min) - P2
  - Cache top courses (10min TTL)
  - Cache course catalog (15min TTL)
  - Implement cache warming on deploy

---

### Phase 4: CI/CD Automation (Week 2)
**Goal:** Automate database tooling in development workflow

#### Tasks:
- **ved-db-opt.6** - GitHub Actions: Database Tools Workflow (90 min) - P0
  - **Trigger:** On pull request with `prisma/**` changes
  - **Jobs:**
    1. Generate ERD and comment on PR
    2. Run Kysely type-check
    3. Seed test database and run integration tests
    4. Benchmark queries (on main branch only)
  
- **ved-db-opt.7** - Pre-commit Hooks for Schema Changes (40 min) - P1
  - Husky hook: Detect `schema.prisma` changes
  - Auto-run: `npx prisma generate` + `npx prisma migrate dev`
  - Auto-regenerate Kysely types
  - Update ERD in `docs/erd.md`
  
- **ved-db-opt.8** - Package.json Scripts Consolidation (20 min) - P0
  - `db:generate` - Regenerate Prisma + Kysely types
  - `db:erd` - Generate ERD markdown
  - `db:seed:dev`, `db:seed:test`, `db:seed:demo`, `db:seed:benchmark`
  - `db:nocodb:up/down` - NocoDB management
  - `db:test-vps` - VPS performance test
  
- **ved-db-opt.9** - Migration Safety Checks (45 min) - P1
  - Pre-migration validation script
  - Check for breaking changes (column drops, type changes)
  - Staging migration dry-run requirement
  - Production migration approval workflow

---

### Phase 5: Admin Tools & Inspection (Week 3)
**Goal:** Non-developer data access and debugging

#### Tasks:
- **ved-db-opt.10** - NocoDB Production Setup (60 min) - P2
  - Docker Compose configuration
  - Connect to staging PostgreSQL (read-only)
  - Configure views for common queries
  - Access control: Admin-only
  
- **ved-db-opt.11** - NocoDB Security Hardening (40 min) - P2
  - Read-only database user for NocoDB
  - Disable data modification in production
  - Audit logging for all NocoDB access
  - IP whitelist (office/VPN only)
  
- **ved-db-opt.12** - Domain-Specific ERD Views (60 min) - P2
  - `docs/schema/erd-learning.md` - Course/Lesson/UserProgress
  - `docs/schema/erd-gamification.md` - Points/Achievements/Streaks
  - `docs/schema/erd-social.md` - BuddyGroups/Posts
  - `docs/schema/erd-analytics.md` - BehaviorLog focused
  
- **ved-db-opt.13** - Database Health Dashboard (45 min) - P2
  - Grafana dashboard for PostgreSQL
  - Metrics: Connection count, query latency, cache hit ratio
  - Slow query alerts (>1s)
  - Disk usage trends

---

### Phase 6: Testing & Documentation (Week 4)
**Goal:** Production-grade test coverage and documentation

#### Tasks:
- **ved-db-opt.14** - Integration Tests for Analytics Queries (90 min) - P1
  - Test setup: Seed test database
  - Test all 13 analytics queries
  - Assert response structure and types
  - Performance benchmarks (<500ms)
  
- **ved-db-opt.15** - Cache Invalidation Tests (60 min) - P2
  - Test Redis cache hit/miss scenarios
  - Test cache expiry (TTL)
  - Test cache warming on deploy
  - Test cache failure fallback
  
- **ved-db-opt.16** - Database Migration Testing (45 min) - P1
  - Test migration up/down
  - Test migration with production data size
  - Test migration rollback procedures
  - Document breaking change migration strategy
  
- **ved-db-opt.17** - Comprehensive Documentation (90 min) - P0
  - Analytics API reference
  - Query performance guide
  - Caching strategy documentation
  - Database troubleshooting runbook
  - NocoDB user guide
  
- **ved-db-opt.18** - Knowledge Transfer Session (60 min) - P2
  - Team walkthrough of Kysely queries
  - Demonstrate NocoDB usage
  - Review CI/CD automation
  - Q&A and feedback collection

---

## 🔄 Continuous Optimization

**Ongoing Tasks:**
- Weekly slow query review (pg_stat_statements)
- Monthly cache hit rate analysis
- Quarterly database vacuum and analyze
- Benchmark regression testing on main branch

---

## 📋 Handoff Context for Database Thread

### Current State Summary
```typescript
// Phase 2 Deliverables (COMPLETE)
✅ 13 production-ready Kysely analytics queries
✅ Redis caching (leaderboard: 5min TTL)
✅ AnalyticsModule with KyselyModule + RedisCacheModule
✅ VPS test script (scripts/test-vps-analytics.ts)
✅ Build passing (0 TypeScript errors)

// Immediate Next Steps
🎯 ved-db-opt.1: Deploy to VPS staging
🎯 ved-db-opt.2: Seed realistic data (200 users, 25 courses)
🎯 ved-db-opt.3: Run VPS performance tests
🎯 ved-db-opt.4: PostgreSQL tuning (if needed)
```

### Essential Files
**Already Created:**
- `apps/api/src/analytics/analytics.repository.ts` - 13 Kysely queries
- `apps/api/src/analytics/analytics.module.ts` - Module integration
- `apps/api/src/database/kysely.service.ts` - Kysely config
- `scripts/test-vps-analytics.ts` - VPS performance test
- `docs/VPS_ANALYTICS_DEPLOYMENT.md` - Deployment guide
- `docs/DATABASE_OPTIMIZATION_PHASE2_COMPLETE.md` - Phase 2 summary

**Pending Creation:**
- `.github/workflows/database-tools.yml` - CI/CD automation
- `docs/schema/erd-*.md` - Domain-specific ERDs
- `docs/ANALYTICS_API_REFERENCE.md` - Query documentation
- `docker-compose.nocodb.yml` - NocoDB setup
- `.husky/pre-commit` - Schema change hooks

### Performance Targets Recap

| Query Type | Target p95 | Expected (VPS) | Cache Strategy |
|------------|-----------|----------------|----------------|
| Simple (DAU, MAU) | <300ms | 150-250ms | None (fast enough) |
| Complex (Cohort, Funnel) | <500ms | 300-450ms | None (personalized) |
| Leaderboard | <100ms | <10ms (cached) | Redis 5min TTL |
| Top Courses | <200ms | 100-150ms | Redis 10min TTL (future) |

### VPS Test Execution Plan
```bash
# Step 1: Deploy code
git add apps/api/src/analytics/
git commit -m "feat: Kysely analytics with Redis caching"
git push origin staging

# Step 2: SSH to VPS
ssh root@103.54.153.248

# Step 3: Seed data
cd /root/v-edfinance/apps/api
pnpm db:seed:demo  # 200 users, 25 courses, 30 days logs

# Step 4: Verify data
POSTGRES_CONTAINER=$(docker ps --filter "ancestor=postgres:15-alpine" --format "{{.Names}}" | head -n 1)
docker exec $POSTGRES_CONTAINER psql -U postgres -d vedfinance_staging -c "SELECT COUNT(*) FROM \"BehaviorLog\";"

# Step 5: Run performance tests (from local machine)
cd c:/Users/luaho/Demo project/v-edfinance
pnpm ts-node scripts/test-vps-analytics.ts

# Expected Output:
# 📊 Performance Summary:
#    Average: ~200ms
#    P95: <500ms ✅
#    Cache Hit Rate: >0% (leaderboard)
```

### PostgreSQL Tuning Checklist (ved-db-opt.4)
```sql
-- Check current settings
SHOW shared_buffers;
SHOW effective_cache_size;
SHOW work_mem;

-- Recommended for 4GB RAM VPS
ALTER SYSTEM SET shared_buffers = '1GB';
ALTER SYSTEM SET effective_cache_size = '3GB';
ALTER SYSTEM SET work_mem = '16MB';
ALTER SYSTEM SET maintenance_work_mem = '256MB';
SELECT pg_reload_conf();

-- Verify indexes are being used
EXPLAIN ANALYZE 
SELECT DATE("timestamp"), COUNT(DISTINCT "userId") 
FROM "BehaviorLog" 
WHERE "timestamp" >= NOW() - INTERVAL '30 days' 
GROUP BY DATE("timestamp");

-- Expected: Index Scan on idx_behavior_log_user_timestamp
```

---

## 🚨 Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| VPS queries slower than local | 🟡 Medium | PostgreSQL tuning (ved-db-opt.4) |
| Cache not working on VPS | 🟡 Medium | Redis connectivity verification |
| Migration breaks staging DB | 🔴 High | Always backup before migration |
| NocoDB exposes sensitive data | 🔴 High | Read-only user + IP whitelist |
| CI/CD pipeline too slow | 🟢 Low | Cache dependencies, run tests in parallel |

---

## 📊 Dependencies

**Depends On:**
- VPS staging environment operational (ved-vps.6)
- Redis running on VPS (already done ✅)
- PostgreSQL with production data volume

**Blocks:**
- Production analytics features
- Investor dashboard metrics
- AI personalization engine (needs behavior patterns)

---

## 🎯 Quick Start for Database Thread

**First Session Commands:**
```bash
# 1. Review Phase 2 completion
cat docs/DATABASE_OPTIMIZATION_PHASE2_COMPLETE.md

# 2. Start ved-db-opt.1 (Deploy to VPS)
git add -A
git commit -m "feat: Deploy Kysely analytics to staging (ved-db-opt.1)"
git push origin staging

# 3. Monitor Dokploy deployment
# Open: http://103.54.153.248:3000

# 4. Once deployed, continue with ved-db-opt.2 (Seed data)
```

---

## ✅ Success Criteria

**Epic Complete When:**
```bash
✅ All queries validated on VPS (<500ms p95)
✅ CI/CD pipeline auto-generates ERD on schema changes
✅ Pre-commit hooks regenerate types automatically
✅ NocoDB accessible to admins (read-only)
✅ 80%+ test coverage for analytics queries
✅ Documentation complete (API reference + runbooks)
✅ Team trained on Kysely + NocoDB usage
```

---

**Created:** 2025-12-22  
**Next Review:** After Phase 3 completion  
**Estimated Completion:** 4 weeks (parallel with VPS epic)
