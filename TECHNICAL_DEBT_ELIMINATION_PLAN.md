# Technical Debt Elimination Plan
**Date Created:** 2025-12-21  
**Status:** IN PROGRESS  
**Goal:** Achieve Zero-Debt before E2E testing expansion

---

## 📊 Current State Analysis

### Test Coverage Statistics
- **Total Spec Files:** 71
- **Total Services:** 41
- **Total Controllers:** 19
- **Estimated Coverage:** ~30% (71 tests for 60+ testable units)
- **Target Coverage:** 70% minimum (vitest config targets 80%)

### Blocked Issues (5 Total)
Based on `.beads/issues.jsonl` analysis:

1. **ved-0u2** - Phase 2: Core Frontend & Authentication UI (blocked by ved-5ti)
2. **ved-33q** - Course Enrollment E2E (blocked by ved-qh9 - RESOLVED ✅)
3. **ved-4vl** - AI Chat E2E (blocked by ved-qh9 - RESOLVED ✅)
4. **ved-e6z** - Registration & Onboarding E2E (blocked by ved-qh9 - RESOLVED ✅)
5. **ved-hmi** - Technical Debt Cleanup (blocked by ved-qh9 - RESOLVED ✅)

**🎯 Dependency Chain:** 
- ved-qh9 (401 fix) → ved-hmi (Tech Debt) → ved-34x, ved-409, ved-28u (Test Waves)

**✅ CRITICAL FINDING:** `ved-qh9` is CLOSED but `ved-hmi` still marked as blocked. Need to unblock immediately.

---

## 🔴 Missing Test Coverage Analysis

### Controllers WITHOUT Tests (6 missing)
1. `users/users-profile.controller.ts` ❌
2. `storage/storage.controller.ts` ❌
3. `modules/store/store.controller.ts` ❌
4. `modules/simulation/simulation.controller.ts` ❌
5. `modules/recommendations/recommendation.controller.ts` ❌
6. `modules/leaderboard/leaderboard.controller.ts` ❌
7. `modules/debug/diagnostic.controller.ts` ❌ (has service test only)
8. `modules/adaptive/adaptive.controller.ts` ❌
9. `config/ai.controller.ts` ❌
10. `checklists/checklists.controller.ts` ❌
11. `behavior/behavior.controller.ts` ❌

**Coverage:** 8/19 controllers tested = **42%**

### Services WITHOUT Tests (Estimated 10-15 missing)
Critical gaps:
1. `config/gemini.service.ts` ❌
2. `app.service.ts` ❌
3. `users/users.service.ts` ✅ (HAS TEST)
4. Missing middleware/guard tests beyond `roles.guard.spec.ts`

**Coverage:** ~30/41 services tested = **73%** (SERVICE coverage is GOOD ✅)

---

## 📋 Zero-Debt Protocol Workflow

### Phase 1: Unblock Dependency Chain (1 hour)
**Status:** 🔴 URGENT

#### Tasks:
- [ ] **1.1** Verify ved-qh9 (401 fix) completion status
  - Check: E2E tests passing in `tests/integration/behavior-flow.e2e-spec.ts`
  - Command: `pnpm test behavior-flow`
  
- [ ] **1.2** Update ved-hmi dependency 
  ```bash
  # Remove ved-qh9 blocker from ved-hmi
  bd update ved-hmi --remove-dep ved-qh9
  bd update ved-hmi --status in_progress
  ```

- [ ] **1.3** Document ved-hmi remaining work
  - Create checklist of remaining technical debt items
  - Estimate: 4-6 hours

---

### Phase 2: Controller Test Coverage → 70% (6-8 hours)
**Priority:** HIGH  
**Target:** Add 11 missing controller tests

#### Batch 1: Core Features (3 hours)
- [ ] **2.1** `users-profile.controller.spec.ts` (30 min)
  - Profile CRUD operations
  - Role-based access control
  
- [ ] **2.2** `storage.controller.spec.ts` (45 min)
  - Upload/download flows
  - Presigned URL generation
  
- [ ] **2.3** `behavior.controller.spec.ts` (45 min)
  - Streak tracking endpoints
  - Investment profile CRUD

- [ ] **2.4** `checklists.controller.spec.ts` (30 min)
  - Checklist completion tracking

#### Batch 2: Feature Modules (3 hours)
- [ ] **2.5** `store.controller.spec.ts` (30 min)
  - Item purchase flow
  - Wallet integration
  
- [ ] **2.6** `simulation.controller.spec.ts` (45 min)
  - Scenario creation/execution
  - Decision submission

- [ ] **2.7** `recommendation.controller.spec.ts` (30 min)
  - Personalized content delivery
  
- [ ] **2.8** `leaderboard.controller.spec.ts` (30 min)
  - Ranking queries
  - Period filtering

#### Batch 3: Admin/Debug (2 hours)
- [ ] **2.9** `diagnostic.controller.spec.ts` (45 min)
  - Health check endpoints
  - Schema integrity verification
  
- [ ] **2.10** `adaptive.controller.spec.ts` (30 min)
  - Difficulty adjustment triggers
  
- [ ] **2.11** `ai.controller.spec.ts` (from `config/`) (45 min)
  - AI quota management
  - Provider switching

---

### Phase 3: Service Test Hardening (4 hours)
**Priority:** MEDIUM  
**Focus:** Fill service coverage gaps to maintain 73%+

#### Critical Services:
- [ ] **3.1** `gemini.service.spec.ts` (1.5 hours)
  - API call mocking
  - Token counting
  - Error handling (rate limits, quota)
  
- [ ] **3.2** `app.service.spec.ts` (30 min)
  - Basic health check logic

- [ ] **3.3** Guard/Middleware tests (2 hours)
  - `jwt-auth.guard.spec.ts`
  - `roles.guard.spec.ts` enhancement
  - Request validation middleware

---

### Phase 4: Integration Test Verification (3 hours)
**Priority:** HIGH  
**Goal:** Ensure existing integration tests are stable

#### Tasks:
- [ ] **4.1** Run full test suite with coverage
  ```bash
  pnpm test --coverage --run
  ```
  
- [ ] **4.2** Fix flaky tests
  - Check timeout issues (current: 30s/60s)
  - Stabilize DB mocks
  
- [ ] **4.3** Verify E2E pre-requisites
  - `behavior-flow.e2e-spec.ts` → ✅
  - `social.integration.spec.ts` → ✅
  - `nudge.integration.spec.ts` → ✅
  - `analytics.integration.spec.ts` → ✅
  - `ai.integration.spec.ts` → ✅

---

### Phase 5: Quality Gates (2 hours)
**Priority:** CRITICAL  
**Zero-Debt Criteria:**

- [ ] **5.1** Coverage thresholds met
  ```
  Lines:      ≥ 70% (target: 80%)
  Functions:  ≥ 70% (target: 80%)
  Branches:   ≥ 65% (target: 75%)
  Statements: ≥ 70% (target: 80%)
  ```

- [ ] **5.2** Build passes
  ```bash
  pnpm --filter api build
  pnpm --filter web build
  ```

- [ ] **5.3** Beads health check
  ```bash
  bd doctor
  bd ready
  ```
  - **Expected:** 0 blocked issues
  - **Expected:** 0 ready technical debt tasks

- [ ] **5.4** Update ved-hmi status
  ```bash
  bd close ved-hmi --reason "Achieved 70%+ coverage, all blockers resolved"
  ```

---

## 📅 Timeline & Resource Allocation

| Phase | Duration | Completion Criteria |
|-------|----------|-------------------|
| **Phase 1: Unblock** | 1 hour | ved-hmi unblocked, checklist created |
| **Phase 2: Controllers** | 6-8 hours | 11 controller tests added, coverage ≥60% |
| **Phase 3: Services** | 4 hours | Critical services tested, coverage ≥70% |
| **Phase 4: Integration** | 3 hours | All integration tests passing |
| **Phase 5: Quality Gates** | 2 hours | Coverage thresholds met, ved-hmi closed |
| **TOTAL** | **16-18 hours** | **Ready for E2E expansion** |

---

## 🚦 Go/No-Go Decision Point

### ✅ GO Criteria (proceed to E2E testing):
- [ ] Unit test coverage ≥ 70%
- [ ] All integration tests passing
- [ ] Zero blocked issues in `bd ready`
- [ ] ved-hmi closed
- [ ] Build passes with zero TypeScript errors

### 🛑 NO-GO Criteria (continue debt elimination):
- [ ] Coverage < 70%
- [ ] >3 failing tests
- [ ] Blocked issues remain
- [ ] Build fails

---

## 🎯 Success Metrics

**Before:**
- Coverage: ~30%
- Blocked issues: 5
- Test files: 71
- Technical debt epic: In Progress

**After:**
- Coverage: ≥70%
- Blocked issues: 0
- Test files: ~85+
- Technical debt epic: Closed

---

## 🔧 Tools & Commands Reference

### Testing
```bash
# Run all tests with coverage
pnpm test --coverage --run

# Run specific test file
pnpm test path/to/file.spec.ts

# Watch mode for development
pnpm test --watch
```

### Beads Management
```bash
# Check system health
bd doctor

# Find unblocked work
bd ready

# Update issue status
bd update <issue-id> --status <status>

# Close with reason
bd close <issue-id> --reason "Description of completion"

# Sync with git
bd sync
```

### Build Verification
```bash
# API build
pnpm --filter api build

# Web build  
pnpm --filter web build

# Lint check
pnpm --filter api lint
```

---

## 📝 Notes

- **Parallel Execution:** Controller tests (Batch 1-3) can be split across sub-agents if needed
- **Test Template:** Use existing patterns from `auth.controller.spec.ts` and `courses.controller.spec.ts`
- **Mocking Strategy:** Leverage existing `PrismaService` and `ConfigService` mocks from `tests/setup.ts`
- **Integration Priority:** Focus on business-critical flows (Auth → Courses → Social → AI)

---

**Last Updated:** 2025-12-21  
**Next Review:** After Phase 1 completion (ved-hmi unblocked)
