# 🚀 Database Optimization Roadmap

**Epic:** `ved-hyv` - Database Speed Optimization & Tools Integration  
**Timeline:** 5 weeks  
**Priority:** P1 Critical  
**Target:** <500ms p95 query time, 100% Kysely type coverage

---

## 📊 Epic Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 18 tasks |
| P1 Critical | 13 tasks |
| P2 Medium | 5 tasks |
| Total Estimate | ~10.5 hours |
| Dependencies | ved-kzt (pre-commit), ved-3ro (NocoDB) |

---

## 🎯 Phase 1: Foundation (Week 1) - 6 tasks

### Quick Win: Fix Build Blockers
- **ved-hyv.7** - Fix 5 Kysely type errors (60 min) 🔴 **START HERE**
  - `analytics.repository.ts:72, 91, 341, 350`
  - `benchmark.seed.ts:197`
  - Labels: `build-blocker`

### Data Infrastructure
- **ved-hyv.1** - Create Prisma seed directory structure (20 min)
- **ved-hyv.2** - Implement user.factory.ts with Vietnamese names (45 min)
- **ved-hyv.3** - Implement course.factory.ts for financial education (45 min)
- **ved-hyv.4** - Implement behavior.factory.ts for time-series data (40 min)
- **ved-hyv.5** - Create seed scenarios (dev, test, demo, benchmark) (60 min)

### Performance Foundation
- **ved-hyv.6** - Add composite indexes for BehaviorLog & UserProgress (30 min)
  - Already partially done per handoff report
  - Indexes: `(userId, createdAt)`, `(eventType, userId)`, `(courseId, userId)`

---

## 🏗️ Phase 2: Kysely Analytics (Week 2-3) - 7 tasks

### Repository Setup
- **ved-hyv.8** - Create AnalyticsRepository with Kysely (45 min)
  - Type-safe query builder with KyselyService injection

### Core Analytics Queries
- **ved-hyv.9** - getDailyActiveUsers() (40 min)
  - DAU/MAU tracking for investor dashboard
  
- **ved-hyv.10** - getCohortRetention() (60 min)
  - Weekly retention by signup cohort
  - Funnel analysis for growth metrics
  
- **ved-hyv.12** - getLearningFunnel() (50 min)
  - Signup → Enrollment → Lesson Start → Completion
  - Conversion rate tracking

### Advanced Analytics
- **ved-hyv.13** - getStudentBehaviorPattern() (70 min)
  - Learning time patterns
  - Content preferences for AI personalization
  - Difficulty analysis for LLM input

### Gamification & Caching
- **ved-hyv.11** - getLeaderboard() with Redis caching (30 min)
  - 5-min TTL Redis cache
  - Already partially implemented

---

## 🔄 Phase 3: CI/CD Integration (Week 4) - 3 tasks

### Automation
- **ved-hyv.14** - Setup GitHub Actions database-tools.yml (50 min)
  - ERD generation on PR
  - Seed test data in CI
  - Kysely type-check
  - Benchmark on main branch

- **ved-hyv.15** - Configure pre-commit hooks (20 min)
  - Depends on: `ved-kzt` (already completed)
  - Auto-regenerate on schema.prisma changes
  - Update ERD and Kysely types

- **ved-hyv.18** - Add package.json scripts (15 min)
  - `db:seed:dev`, `db:seed:test`, `db:seed:demo`, `db:seed:benchmark`
  - `db:nocodb:up/down`

---

## 🌍 Phase 4: Polish (Week 5) - 2 tasks

### Admin Tools & Documentation
- **ved-hyv.16** - Setup NocoDB with production-safe configuration (40 min) - P2
  - Depends on: `ved-3ro` (Docker Desktop required)
  - Read-only mode for staging
  - Audit logging for production

- **ved-hyv.17** - Generate domain-specific ERD views (45 min) - P2
  - `erd-learning.md` (Course, Lesson, UserProgress, User)
  - `erd-gamification.md` (Achievement, Streak, BuddyGroup)
  - `erd-analytics.md` (BehaviorLog, User, UserProgress)

---

## 🎯 Recommended Execution Order

### Week 1 Sprint (Day 1-2)
```bash
# 1. Fix build blockers FIRST (Zero-Debt Protocol)
.\beads.exe update ved-hyv.7 --status in_progress
# Fix Kysely errors → pnpm --filter api build

# 2. Setup data infrastructure
ved-hyv.1 → ved-hyv.2 → ved-hyv.3 → ved-hyv.4 → ved-hyv.5

# 3. Add performance indexes
ved-hyv.6
```

### Week 2-3 Sprint (Analytics)
```bash
# 1. Repository setup
ved-hyv.8

# 2. Implement queries (parallel if possible)
ved-hyv.9 (DAU) | ved-hyv.10 (Cohort) | ved-hyv.12 (Funnel)

# 3. Advanced features
ved-hyv.11 (Leaderboard cache)
ved-hyv.13 (AI behavior patterns)
```

### Week 4 Sprint (CI/CD)
```bash
ved-hyv.18 → ved-hyv.15 → ved-hyv.14
```

### Week 5 Sprint (Polish)
```bash
ved-hyv.16 → ved-hyv.17
```

---

## 📈 Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Build Errors | 5 Kysely errors | 0 ✅ |
| ERD Generation Time | Manual | <10s automated |
| Seed Time (dev) | N/A | <30s |
| Seed Time (benchmark 10k) | N/A | <5min |
| Kysely Type Coverage | Partial | 100% |
| Complex Query p95 | Unknown | <500ms |
| Redis Cache Hit Rate | 0% | >80% |

---

## 🔗 Dependencies & Blockers

| Task | Depends On | Status |
|------|------------|--------|
| ved-hyv.7 | None | ✅ Ready |
| ved-hyv.15 | ved-kzt (pre-commit hooks) | ✅ Completed |
| ved-hyv.16 | ved-3ro (NocoDB setup) | ⏳ Blocked (Docker Desktop) |

---

## 🛠️ Quick Start Commands

```bash
# Start Week 1 Sprint
.\beads.exe update ved-hyv.7 --status in_progress
cd apps/api
code src/analytics/analytics.repository.ts

# After fixing errors
pnpm --filter api build  # Must pass
.\beads.exe close ved-hyv.7 --reason "Fixed all 5 Kysely type errors, builds green"
.\beads.exe sync
```

---

## 📋 Environment Configuration Matrix

| Tool | Development | Testing/CI | Staging | Production |
|------|-------------|------------|---------|------------|
| **ERD Generator** | ✅ On-demand | ✅ CI artifact | ✅ Doc site | ❌ N/A |
| **Prisma Seeds** | ✅ Full seed | ✅ Minimal seed | ✅ Demo seed | ❌ Never |
| **NocoDB** | ✅ Full access | ❌ N/A | ✅ Read-only | ⚠️ Read-only + audit |
| **Kysely** | ✅ Debug logging | ✅ No logging | ✅ Metrics only | ✅ Metrics + slow query alerts |
| **Redis Cache** | ✅ Optional | ❌ Disabled | ✅ 5-min TTL | ✅ Optimized TTL |

---

## 🔥 Critical Path Tasks (Must Complete First)

1. **ved-hyv.7** - Fix Kysely errors (Build blocker)
2. **ved-hyv.1** - Setup seed structure (Foundation for all data tasks)
3. **ved-hyv.6** - Add indexes (Performance foundation)
4. **ved-hyv.8** - Create AnalyticsRepository (Required for all queries)

---

*Created: 2025-12-22 14:15*  
*Next Review: After Week 1 Sprint*  
*Owner: Database Optimization Team*
