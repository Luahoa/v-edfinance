# 🔴 BACKEND AUDIT - Priority Handoff Document
## Date: 2025-12-22 03:00 UTC+7

---

## 📊 Executive Summary

| Metric | Value | Status |
|--------|-------|--------|
| **API Build** | ✅ PASS | <1s |
| **Web Build** | ❌ FAIL | Next.js 16 bug |
| **Test Suite** | ❌ FAIL | >69s (threshold: 30s) |
| **Unit Tests** | ~150 PASS | Working |
| **Integration/E2E** | ~35 FAIL | Missing modules/DB |
| **Beads Health** | ✅ PASS | 30/30 |

---

## 🔴 BACKEND ISSUES - Priority Order

### P0 - Critical (Fix Immediately)

#### 1. Missing Backend Modules (Blocking Integration Tests)
```
❌ src/health/health.module          → disaster-recovery.integration.spec.ts
❌ src/websocket/websocket.module    → multi-device-sync.integration.spec.ts  
❌ src/audit/audit.module            → security-audit-trail.integration.spec.ts
❌ src/behavior-analytics/behavior-analytics.module → recommendation-refresh.integration.spec.ts
❌ src/social/social.module          → user-lifecycle.integration.spec.ts
❌ src/analytics/analytics.module    → admin-dashboard.integration.spec.ts
❌ ./nudge-scheduler.service         → nudge-scheduler.service.spec.ts
```

**Impact:** 7 integration test files completely blocked
**Beads Issue:** `ved-xyl` (P3 - should be upgraded to P0)

#### 2. Database Connection (PrismaClientInitializationError)
```
All E2E tests fail with: PrismaClientInitializationError
- test/massive-stress.e2e-spec.ts
- test/multi-market-stress.e2e-spec.ts
- test/persona-simulation.e2e-spec.ts
- test/admin-integrity.e2e-spec.ts
- test/behavioral-stress.e2e-spec.ts
```

**Root Cause:** No PostgreSQL connection for E2E tests
**Solution Options:**
1. Skip E2E in CI (mark as integration-only)
2. Add `test:db:start` before E2E runs
3. Use SQLite for testing

---

### P1 - High Priority (Fix This Session)

#### 3. Service Logic Errors (Assertion Failures)

| File | Error | Root Cause |
|------|-------|------------|
| `adaptive-difficulty.service.spec.ts` | `'STAY' !== 'REINFORCE'` | Logic bug when score=0 |
| `ai-cache.service.spec.ts` | `undefined !== object` | Cache hit not returning response |
| `moderation.service.spec.ts` | `InternalServerErrorException` | Strike system broken |
| `ab-testing.service.spec.ts` | `0.882 > 0.75` | Weight distribution wrong |
| `analytics.service.spec.ts` | `spy not called` | Aggregation logic missing |
| `heatmap.service.spec.ts` | `32.5 !== 65` | Scroll depth calculation |
| `metrics.service.spec.ts` | `undefined.length` | Empty cohort handling |
| `reports.service.spec.ts` | `3 !== 2` | Daily report count |
| `user-segmentation.service.spec.ts` | `activityCounts not iterable` | Type error |
| `nudge.controller.spec.ts` | `called 5 times !== 2` | Extra nudge calls |
| `reward.service.spec.ts` | `called 4 times !== 3` | Reward schedule bug |

#### 4. Controller Auth Issues

| File | Error | Fix |
|------|-------|-----|
| `behavior.controller.spec.ts` | Promise resolved instead of rejecting | Auth guard not working |
| `users.controller.spec.ts` | Not UnauthorizedException | Wrong error type |
| `storage.controller.spec.ts` | Duplicate key generation | Race condition |

---

### P2 - Medium Priority

#### 5. AI Module Integration
```
Error: Nest can't resolve dependencies of the AiService 
       (?, PrismaService, CACHE_MANAGER)
       - ConfigService at index [0] not available
```
**File:** `src/ai/ai.integration.spec.ts`

#### 6. Test Helper Issues
```
TypeError: Cannot read properties of undefined (reading 'close')
```
**File:** `test/example-usage.e2e-spec.ts`

---

## 📋 Open Beads Issues (Backend Related)

| ID | Priority | Title | Status |
|----|----------|-------|--------|
| `ved-8wc` | P1 | Optimize Test Suite - Split and parallelize | open |
| `ved-5oq` | P1 | Wave 2: Core Backend Services Hardening | open |
| `ved-xyl` | P3→P0 | Implement HealthModule, WebSocketModule, AuditModule | open |
| `ved-xt3` | P1 | Phase 1: Quality Gate & Zero-Debt Engineering | open |

---

## 🛠️ Recommended Fix Order

### Phase 1: Unblock Integration Tests (2-3 hours)
```bash
# 1. Create missing modules (stubs first, then implement)
ved-xyl: HealthModule, WebSocketModule, AuditModule, BehaviorAnalyticsModule

# 2. Fix module imports
src/health/health.module.ts
src/websocket/websocket.module.ts
src/audit/audit.module.ts
src/behavior-analytics/behavior-analytics.module.ts
src/analytics/analytics.module.ts (already exists - fix path)
src/social/social.module.ts (already exists - fix path)
```

### Phase 2: Fix Service Logic (3-4 hours)
```bash
# Priority order by failure count:
1. moderation.service.ts         # 6 failures - Strike system
2. analytics.service.ts          # 4 failures - Aggregation
3. ai-cache.service.ts           # 3 failures - Cache logic
4. adaptive-difficulty.service.ts # 1 failure - Score=0 edge case
5. ab-testing.service.ts         # 1 failure - Weight distribution
6. heatmap.service.ts            # 2 failures - Calculations
7. metrics.service.ts            # 1 failure - Empty cohort
8. reports.service.ts            # 2 failures - Report generation
9. user-segmentation.service.ts  # 1 failure - Iterable fix
10. nudge.controller.ts          # 1 failure - Call count
11. reward.service.ts            # 1 failure - Schedule
```

### Phase 3: Fix Controller Auth (1-2 hours)
```bash
1. behavior.controller.ts        # Auth guard rejection
2. users.controller.ts           # UnauthorizedException type
3. storage.controller.ts         # Race condition on key gen
```

---

## 🎯 Success Criteria

```bash
# After fixes, these commands should pass:
pnpm --filter api build          # ✅ Already passing
pnpm --filter api test           # Target: <30s, 0 failures
pnpm --filter api test:e2e       # Target: All pass with DB
```

---

## 📂 Key Files to Review

```
apps/api/
├── src/
│   ├── modules/
│   │   ├── analytics/
│   │   │   ├── analytics.service.ts        # P1: Aggregation logic
│   │   │   ├── heatmap.service.ts          # P2: Scroll calculation
│   │   │   ├── metrics.service.ts          # P2: Empty cohort
│   │   │   ├── reports.service.ts          # P2: Report count
│   │   │   └── user-segmentation.service.ts # P2: Iterable fix
│   │   ├── ai/
│   │   │   ├── ai-cache.service.ts         # P1: Cache hit logic
│   │   │   ├── moderation.service.ts       # P0: Strike system
│   │   │   └── adaptive-difficulty.service.ts # P1: Score=0
│   │   ├── nudge/
│   │   │   ├── nudge.controller.ts         # P2: Call count
│   │   │   ├── reward.service.ts           # P2: Schedule
│   │   │   └── nudge-scheduler.service.ts  # P0: MISSING!
│   │   └── ab-testing.service.ts           # P1: Weight distribution
│   ├── health/                             # P0: MISSING FOLDER!
│   ├── websocket/                          # P0: MISSING FOLDER!
│   ├── audit/                              # P0: MISSING FOLDER!
│   └── behavior-analytics/                 # P0: MISSING FOLDER!
└── test/
    └── integration/                        # All blocked by missing modules
```

---

## 🔧 Quick Start Commands for Next Agent

```bash
# 1. Session Start Protocol
git pull --rebase
.\beads.exe sync
.\beads.exe doctor
.\beads.exe update ved-xyl --status in_progress

# 2. Verify current state
pnpm --filter api build
pnpm --filter api test 2>&1 | findstr /C:"FAIL" | wc -l

# 3. Start fixing (order matters!)
# Step A: Create missing modules
# Step B: Fix service logic  
# Step C: Fix controllers

# 4. Session End Protocol
.\beads.exe sync
git add -A && git commit -m "fix: Backend service logic fixes (ved-xxx)"
git push
```

---

## 📊 Test Failure Categories

| Category | Count | Priority |
|----------|-------|----------|
| Missing Modules | 7 | P0 |
| Database/Prisma | 6 | P0 (E2E only) |
| Service Logic | 15 | P1 |
| Controller Auth | 3 | P1 |
| Type Errors | 5 | P2 |
| **TOTAL** | **~36** | - |

---

*Generated: 2025-12-22 03:00 UTC+7*
*Thread: T-019b426c-f36f-763f-b68c-9ceaa5291445*
