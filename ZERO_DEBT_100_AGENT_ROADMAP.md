# 🪖 ZERO-DEBT: 100 Sub-Agent Army Deployment Roadmap
**Project:** V-EdFinance  
**Date:** 2025-12-21  
**Objective:** Technical Debt Elimination + 70%+ Test Coverage  
**Strategy:** Wave-Based Orchestration (150-Agent ARMY pattern adapted)  
**Timeline:** 16-18 hours → 3-4 hours with 100 agents

---

## 📊 CURRENT STATE (Baseline Assessment)

### From Previous Threads Analysis:
- **PROJECT_STATUS.md**: Overall 60% complete, Backend 80%, Frontend 20%, Tests 30%
- **ARMY_DASHBOARD.md**: 150-agent deployment COMPLETED (Audit phase done ✅)
- **100_AGENT_ORCHESTRATION_PLAN.md**: 5-wave strategy defined (30% → 80% coverage)
- **MASTER_TESTING_PLAN.md**: Hybrid VPS + E2B testing architecture ready

### Test Coverage Snapshot:
```
Current: 71 spec files
Services: 41 total (30 tested = 73% coverage) ✅ GOOD
Controllers: 19 total (8 tested = 42% coverage) ❌ GAP
Overall Estimated: ~30%
Target: 70%+ (vitest.config.ts targets 80%)
```

### Blocked Issues (Beads):
1. **ved-hmi** (Tech Debt Epic) - IN_PROGRESS, blocked by ved-qh9 (RESOLVED ✅)
2. **ved-34x** (Wave 3: Advanced Tests) - blocked by ved-hmi
3. **ved-409** (Wave 4: Integration) - blocked by ved-hmi
4. **ved-28u** (Wave 5: E2E) - blocked by ved-hmi
5. **ved-0u2** (Frontend Auth) - blocked by ved-5ti

### Critical Insight from ARMY_DASHBOARD:
- **Previous 150-agent deployment**: 100% success rate on Audit phase
- **Pattern to reuse**: Port-based agent groups (8001-9075)
- **Lesson learned**: File lock management critical for parallel execution

---

## 🎯 100-AGENT DEPLOYMENT STRATEGY

### Architecture: Modified 5-Wave Model

```
Phase 0: Unblock Dependency Chain (1 agent)     ← URGENT
    ↓
Wave 1: Controller Unit Tests (20 agents)       ← Close coverage gap
    ↓
Wave 2: Service Test Hardening (15 agents)      ← Raise to 85%+
    ↓
Wave 3: Integration Test Expansion (30 agents)  ← Cross-module flows
    ↓
Wave 4: E2E Test Stabilization (25 agents)      ← Critical paths
    ↓
Wave 5: Quality Gates + Documentation (9 agents) ← Zero-debt verification
```

**Total: 100 agents** (vs 150 in previous deployment)

---

## 🚨 PHASE 0: DEPENDENCY UNBLOCK (1 Agent) ⏱️ 30 mins

### Agent U001: ved-hmi Blocker Resolution
**Priority:** 🔴 P0 (BLOCKS ALL SUBSEQUENT WORK)

#### Task:
```markdown
# Agent U001: Unblock ved-hmi Technical Debt Epic

## Objective
Remove ved-qh9 dependency from ved-hmi and validate technical debt status

## Steps
1. Verify ved-qh9 (401 fix) completion:
   - Check: tests/integration/behavior-flow.e2e-spec.ts passes
   - Validate: No 401 errors in test suite
   
2. Update ved-hmi in Beads:
   ```bash
   # Remove blocker dependency
   # (Manual: edit .beads/issues.jsonl or use bd CLI)
   
   # Update status
   bd update ved-hmi --status in_progress --note "Unblocked, starting 100-agent cleanup"
   ```

3. Create ved-hmi cleanup checklist:
   - Document remaining technical debt items
   - Estimate time for each (total: 4-6 hours with agent help)

## Success Criteria
- [ ] ved-qh9 confirmed CLOSED
- [ ] ved-hmi no longer blocked
- [ ] ved-34x, ved-409, ved-28u become READY
- [ ] Checklist created for Wave 1-5 alignment

## Output
File: `.agents/ved-hmi-checklist.md`
```

**Blocker for:** Waves 1-5 (all 99 subsequent agents)

---

## 🔥 WAVE 1: CONTROLLER TEST BLITZ (20 Agents) ⏱️ 2-3 hours

### Objective: Close 42% → 85% Controller Coverage Gap

**Current State:** 8/19 controllers tested  
**Target:** 19/19 controllers with ≥80% coverage  
**Missing:** 11 controller tests

### Group 1A: User & Auth Controllers (4 agents)
| Agent ID | Controller | Test File | Coverage Target | Priority |
|----------|------------|-----------|-----------------|----------|
| **W1-A01** | users-profile.controller.ts | users-profile.controller.spec.ts (NEW) | 80% | 🔴 P1 |
| **W1-A02** | behavior.controller.ts | behavior.controller.spec.ts (NEW) | 80% | 🔴 P1 |
| **W1-A03** | checklists.controller.ts | checklists.controller.spec.ts (NEW) | 75% | 🟡 P2 |
| **W1-A04** | storage.controller.ts | storage.controller.spec.ts (NEW) | 75% | 🟡 P2 |

### Group 1B: Feature Module Controllers (6 agents)
| Agent ID | Controller | Test File | Coverage Target | Priority |
|----------|------------|-----------|-----------------|----------|
| **W1-A05** | store.controller.ts | store.controller.spec.ts (NEW) | 75% | 🟡 P2 |
| **W1-A06** | simulation.controller.ts | simulation.controller.spec.ts (NEW) | 75% | 🔴 P1 |
| **W1-A07** | recommendation.controller.ts | recommendation.controller.spec.ts (NEW) | 70% | 🟡 P2 |
| **W1-A08** | leaderboard.controller.ts | leaderboard.controller.spec.ts (NEW) | 70% | 🟡 P2 |
| **W1-A09** | adaptive.controller.ts | adaptive.controller.spec.ts (NEW) | 70% | 🟢 P3 |
| **W1-A10** | config/ai.controller.ts | config/ai.controller.spec.ts (NEW) | 70% | 🟢 P3 |

### Group 1C: Debug & Admin Controllers (2 agents)
| Agent ID | Controller | Test File | Coverage Target | Priority |
|----------|------------|-----------|-----------------|----------|
| **W1-A11** | diagnostic.controller.ts | diagnostic.controller.spec.ts (ENHANCE) | 80% | 🔴 P1 |
| **W1-A12** | app.controller.ts | app.controller.spec.ts (ENHANCE existing) | 85% | 🟡 P2 |

### Group 1D: Existing Controller Enhancements (8 agents)
**Goal:** Raise coverage of 8 existing controller tests from ~60% → 90%+

| Agent ID | Controller | Current Coverage | Target | Priority |
|----------|------------|------------------|--------|----------|
| **W1-A13** | auth.controller.spec.ts | ~70% | 95% | 🔴 P1 |
| **W1-A14** | users.controller.spec.ts | ~65% | 90% | 🔴 P1 |
| **W1-A15** | courses.controller.spec.ts | ~60% | 90% | 🔴 P1 |
| **W1-A16** | social.controller.spec.ts | ~55% | 85% | 🟡 P2 |
| **W1-A17** | nudge.controller.spec.ts | ~50% | 85% | 🟡 P2 |
| **W1-A18** | analytics.controller.spec.ts | ~50% | 85% | 🟡 P2 |
| **W1-A19** | ai.controller.spec.ts | ~45% | 80% | 🟢 P3 |
| **W1-A20** | users.service.spec.ts | ~70% | 90% | 🔴 P1 |

### Task Template (Example: W1-A01)
```markdown
# Agent W1-A01: Test users-profile.controller.ts

## Objective
Create comprehensive unit tests for UsersProfileController

## Dependencies
- Read: apps/api/src/users/users-profile.controller.ts
- Pattern: apps/api/src/auth/auth.controller.spec.ts (existing example)
- Helpers: tests/setup.ts (PrismaService mock)

## Test Scenarios (Minimum 12)
- [ ] GET /users/:id/profile - Success (200)
- [ ] GET /users/:id/profile - Unauthorized (401)
- [ ] GET /users/:id/profile - Not found (404)
- [ ] PUT /users/:id/profile - Update full profile
- [ ] PUT /users/:id/profile - Partial update
- [ ] PUT /users/:id/profile - Validate JSONB preferences
- [ ] PUT /users/:id/profile - Preserve localization
- [ ] PATCH /users/:id/avatar - Upload avatar
- [ ] PATCH /users/:id/avatar - File size validation
- [ ] DELETE /users/:id/profile - Soft delete
- [ ] Role guard: Admin can view any profile
- [ ] Role guard: User can only view own profile

## Acceptance Criteria
✅ Coverage ≥80%  
✅ All edge cases covered (error paths)  
✅ Follows AAA pattern  
✅ No hardcoded values  
✅ Uses test helpers from setup.ts

## Verification
```bash
pnpm --filter api test users-profile.controller.spec.ts --coverage
```

## Output
- File: apps/api/src/users/users-profile.controller.spec.ts
- Report: .agents/wave1/W1-A01-coverage.json
```

### Success Criteria (Wave 1)
- [ ] All 20 agents complete successfully
- [ ] Controller coverage: 42% → 85%+
- [ ] Overall project coverage: 30% → 50%+
- [ ] Zero new lint errors
- [ ] Build passes: `pnpm --filter api build`

---

## 🔧 WAVE 2: SERVICE TEST HARDENING (15 Agents) ⏱️ 2-2.5 hours

### Objective: Raise Service Coverage 73% → 90%+ & Fill Critical Gaps

**Current State:** 30/41 services tested (73%)  
**Target:** 38/41 services with ≥85% coverage  
**Missing:** 3 critical services + 7 enhancements

### Group 2A: Missing Critical Services (3 agents)
| Agent ID | Service | Test File | Coverage Target | Priority |
|----------|---------|-----------|-----------------|----------|
| **W2-A01** | config/gemini.service.ts | config/gemini.service.spec.ts (NEW) | 80% | 🔴 P1 |
| **W2-A02** | app.service.ts | app.service.spec.ts (NEW) | 75% | 🟡 P2 |
| **W2-A03** | modules/ai/ai-context.service.ts | ai-context.service.spec.ts (NEW) | 70% | 🟡 P2 |

### Group 2B: Core Service Enhancements (7 agents)
**Goal:** Critical services from 70-80% → 90%+

| Agent ID | Service | Current | Target | Focus Areas |
|----------|---------|---------|--------|-------------|
| **W2-A04** | auth.service.spec.ts | 75% | 95% | Token refresh, password reset edge cases |
| **W2-A05** | courses.service.spec.ts | 70% | 90% | JSONB validation, slug generation errors |
| **W2-A06** | behavior.service.spec.ts | 65% | 90% | Event emission, concurrent logging |
| **W2-A07** | gamification.service.spec.ts | 80% | 95% | Point calculation edge cases |
| **W2-A08** | streak.service.spec.ts | 75% | 90% | Timezone handling, streak breaks |
| **W2-A09** | storage.service.spec.ts | 60% | 85% | Presigned URL generation, R2 errors |
| **W2-A10** | validation.service.spec.ts | 70% | 90% | Schema validation errors, JSONB edge cases |

### Group 2C: Guards & Middleware (5 agents)
**Goal:** Security layer coverage

| Agent ID | Component | Test File | Coverage Target | Priority |
|----------|-----------|-----------|-----------------|----------|
| **W2-A11** | auth/jwt-auth.guard.ts | jwt-auth.guard.spec.ts (NEW) | 90% | 🔴 P1 |
| **W2-A12** | auth/roles.guard.ts | roles.guard.spec.ts (ENHANCE) | 95% | 🔴 P1 |
| **W2-A13** | common/logging.interceptor.ts | logging.interceptor.spec.ts (NEW) | 80% | 🟡 P2 |
| **W2-A14** | common/transform.interceptor.ts | transform.interceptor.spec.ts (NEW) | 75% | 🟡 P2 |
| **W2-A15** | common/validation.pipe.ts | validation.pipe.spec.ts (NEW) | 85% | 🔴 P1 |

### Task Template (Example: W2-A01 Gemini Service)
```markdown
# Agent W2-A01: Test config/gemini.service.ts

## Objective
Create comprehensive tests for Gemini API integration service

## Test Scenarios (Minimum 15)
- [ ] generateText() - Success with valid prompt
- [ ] generateText() - Handle API rate limit (429)
- [ ] generateText() - Handle quota exceeded error
- [ ] generateText() - Retry logic on transient errors
- [ ] generateText() - Token counting accuracy
- [ ] generateText() - Context window overflow handling
- [ ] generateText() - Response parsing (JSON mode)
- [ ] generateText() - Safety filter triggers
- [ ] generateChat() - Multi-turn conversation
- [ ] generateChat() - System instruction handling
- [ ] embedText() - Embedding generation
- [ ] countTokens() - Accurate token estimation
- [ ] Error handling: Network timeout
- [ ] Error handling: Invalid API key
- [ ] Caching: Duplicate prompt detection

## Mocking Strategy
```typescript
// Mock @google/generative-ai
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn(),
      countTokens: jest.fn(),
    }),
  })),
}));
```

## Acceptance Criteria
✅ Coverage ≥80%  
✅ All API error codes handled  
✅ Retry logic validated  
✅ Token counting tested  
✅ No actual API calls in tests

## Verification
```bash
pnpm --filter api test gemini.service.spec.ts --coverage
```
```

### Success Criteria (Wave 2)
- [ ] All 15 agents complete
- [ ] Service coverage: 73% → 90%+
- [ ] Guards & middleware: 100% coverage
- [ ] Overall project coverage: 50% → 65%+
- [ ] Zero flaky tests

---

## 🔗 WAVE 3: INTEGRATION TEST EXPANSION (30 Agents) ⏱️ 3-4 hours

### Objective: Cross-Module Flow Testing & E2E-Spec Coverage

**Current State:** 5 integration spec files  
**Target:** 25+ integration tests covering all major API flows

### Group 3A: Auth & User Flows (6 agents)
| Agent ID | Integration Test | Endpoints Covered | Priority |
|----------|------------------|-------------------|----------|
| **W3-A01** | auth-flow.integration.spec.ts | Register → Login → Refresh → Logout | 🔴 P1 |
| **W3-A02** | user-profile.integration.spec.ts | Update profile → Upload avatar → Verify | 🔴 P1 |
| **W3-A03** | auth-rbac.integration.spec.ts | Role-based access control across endpoints | 🔴 P1 |
| **W3-A04** | password-reset.integration.spec.ts | Request reset → Verify token → Update password | 🟡 P2 |
| **W3-A05** | email-verification.integration.spec.ts | Send verification → Confirm email | 🟡 P2 |
| **W3-A06** | session-management.integration.spec.ts | Multi-device login, token invalidation | 🟢 P3 |

### Group 3B: Course & Learning Flows (6 agents)
| Agent ID | Integration Test | Flow | Priority |
|----------|------------------|------|----------|
| **W3-A07** | course-enrollment.integration.spec.ts | Browse → Enroll → Access lessons | 🔴 P1 |
| **W3-A08** | lesson-progress.integration.spec.ts | Start lesson → Track progress → Complete | 🔴 P1 |
| **W3-A09** | quiz-flow.integration.spec.ts | Submit quiz → Grade → Update progress | 🔴 P1 |
| **W3-A10** | course-localization.integration.spec.ts | Switch locale → Verify JSONB content | 🟡 P2 |
| **W3-A11** | adaptive-learning.integration.spec.ts | Difficulty adjustment based on performance | 🟡 P2 |
| **W3-A12** | certificate-generation.integration.spec.ts | Complete course → Generate certificate | 🟢 P3 |

### Group 3C: Gamification & Behavior (5 agents)
| Agent ID | Integration Test | Flow | Priority |
|----------|------------------|------|----------|
| **W3-A13** | streak-tracking.integration.spec.ts | Daily check-in → Streak increment → Break detection | 🔴 P1 |
| **W3-A14** | achievement-unlock.integration.spec.ts | Trigger condition → Unlock badge → Notify | 🟡 P2 |
| **W3-A15** | points-economy.integration.spec.ts | Earn points → Spend in store → Balance tracking | 🟡 P2 |
| **W3-A16** | leaderboard-update.integration.spec.ts | User action → Rank calculation → Realtime update | 🟡 P2 |
| **W3-A17** | checklist-completion.integration.spec.ts | Create → Progress → Complete → Reward | 🟢 P3 |

### Group 3D: AI & Nudge Flows (5 agents)
| Agent ID | Integration Test | Flow | Priority |
|----------|------------------|------|----------|
| **W3-A18** | ai-chat.integration.spec.ts | Send message → Gemini API → Response → Save thread | 🔴 P1 |
| **W3-A19** | recommendation.integration.spec.ts | Analyze behavior → Generate recommendations → Filter by locale | 🟡 P2 |
| **W3-A20** | nudge-trigger.integration.spec.ts | Event → Nudge calculation → Deliver notification | 🟡 P2 |
| **W3-A21** | social-proof.integration.spec.ts | Aggregate stats → Generate nudge → Personalize | 🟡 P2 |
| **W3-A22** | loss-aversion.integration.spec.ts | Streak at risk → Trigger nudge → User action | 🟢 P3 |

### Group 3E: Social & Community (4 agents)
| Agent ID | Integration Test | Flow | Priority |
|----------|------------------|------|----------|
| **W3-A23** | buddy-group.integration.spec.ts | Create group → Invite → Join → Post | 🟡 P2 |
| **W3-A24** | challenge.integration.spec.ts | Create challenge → Join → Progress → Winner | 🟡 P2 |
| **W3-A25** | social-feed.integration.spec.ts | Post → Like → Comment → WebSocket broadcast | 🟡 P2 |
| **W3-A26** | websocket-realtime.integration.spec.ts | Connect → Subscribe to rooms → Receive updates | 🔴 P1 |

### Group 3F: Simulation & Analytics (4 agents)
| Agent ID | Integration Test | Flow | Priority |
|----------|------------------|------|----------|
| **W3-A27** | market-simulation.integration.spec.ts | Create scenario → Execute → Track decisions | 🟡 P2 |
| **W3-A28** | portfolio-trading.integration.spec.ts | Buy/sell → Calculate profit → Update balance | 🟡 P2 |
| **W3-A29** | analytics-dashboard.integration.spec.ts | Aggregate behavior → Generate insights → Cache | 🟢 P3 |
| **W3-A30** | diagnostic-integrity.integration.spec.ts | Run health check → Verify JSONB schemas → Report | 🔴 P1 |

### Task Template (Example: W3-A01 Auth Flow)
```markdown
# Agent W3-A01: Integration Test - Auth Flow

## Objective
Test end-to-end authentication flow with database

## Test Scenario
```typescript
describe('Auth Flow Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  it('should complete full auth cycle', async () => {
    // 1. Register new user
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'test@example.com', password: 'Test123!' });
    
    expect(registerRes.status).toBe(201);
    const { accessToken, refreshToken } = registerRes.body;

    // 2. Login with credentials
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'Test123!' });
    
    expect(loginRes.status).toBe(200);

    // 3. Refresh access token
    const refreshRes = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken });
    
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.accessToken).toBeDefined();

    // 4. Logout (invalidate tokens)
    const logoutRes = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
    
    expect(logoutRes.status).toBe(200);

    // 5. Verify token invalidated
    const verifyRes = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${accessToken}`);
    
    expect(verifyRes.status).toBe(401);
  });
});
```

## Database Validation
- Check user created in DB
- Verify refresh token stored
- Confirm token deleted on logout

## Acceptance Criteria
✅ All 4 auth endpoints tested in sequence  
✅ Database state validated at each step  
✅ Error paths tested (invalid credentials, expired tokens)  
✅ No test pollution (cleanup after each test)

## Verification
```bash
pnpm --filter api test auth-flow.integration.spec.ts
```
```

### Success Criteria (Wave 3)
- [ ] All 30 integration tests complete
- [ ] P1 tests (12 suites) passing
- [ ] Database transactions tested
- [ ] Overall coverage: 65% → 75%+
- [ ] WebSocket stability verified

---

## 🎭 WAVE 4: E2E TEST STABILIZATION (25 Agents) ⏱️ 3-4 hours

### Objective: Critical User Journey Validation (Playwright)

**Current State:** E2E framework configured, minimal test coverage  
**Target:** 25+ E2E scenarios covering critical paths

### Group 4A: Authentication Journeys (5 agents)
| Agent ID | E2E Test | User Flow | Priority |
|----------|----------|-----------|----------|
| **W4-A01** | registration-onboarding.spec.ts | Register → Email verify → Onboarding wizard → Dashboard | 🔴 P1 |
| **W4-A02** | login-logout.spec.ts | Login → Access protected page → Logout → Redirect | 🔴 P1 |
| **W4-A03** | password-reset-e2e.spec.ts | Forgot password → Email link → Reset → Login | 🟡 P2 |
| **W4-A04** | multi-locale-auth.spec.ts | Switch to VI/EN/ZH → Register → Verify translations | 🟡 P2 |
| **W4-A05** | social-login.spec.ts | Google OAuth → Callback → Auto-register | 🟢 P3 |

### Group 4B: Course Learning Journeys (6 agents)
| Agent ID | E2E Test | User Flow | Priority |
|----------|----------|-----------|----------|
| **W4-A06** | course-discovery.spec.ts | Browse courses → Filter by level → View details | 🔴 P1 |
| **W4-A07** | course-enrollment-e2e.spec.ts | Enroll → Access first lesson → Track sidebar progress | 🔴 P1 |
| **W4-A08** | lesson-player.spec.ts | Play video → Mark complete → Auto-advance | 🔴 P1 |
| **W4-A09** | quiz-submission.spec.ts | Answer quiz → Submit → View results → Retry | 🟡 P2 |
| **W4-A10** | progress-tracking.spec.ts | Complete lessons → Check progress bar → Certificate | 🟡 P2 |
| **W4-A11** | adaptive-difficulty.spec.ts | Fail quiz → Get easier content → Pass quiz → Advance | 🟢 P3 |

### Group 4C: Gamification Journeys (5 agents)
| Agent ID | E2E Test | User Flow | Priority |
|----------|----------|-----------|----------|
| **W4-A12** | streak-maintenance.spec.ts | Daily check-in → See streak count → Break streak warning | 🟡 P2 |
| **W4-A13** | achievement-unlock-e2e.spec.ts | Complete task → See achievement popup → Badge collection | 🟡 P2 |
| **W4-A14** | leaderboard-view.spec.ts | View rankings → Filter by period → See own rank | 🟡 P2 |
| **W4-A15** | store-purchase.spec.ts | Browse items → Purchase with points → Confirm ownership | 🟢 P3 |
| **W4-A16** | checklist-workflow.spec.ts | Create checklist → Mark items → Complete → Reward | 🟢 P3 |

### Group 4D: AI & Social Journeys (5 agents)
| Agent ID | E2E Test | User Flow | Priority |
|----------|----------|-----------|----------|
| **W4-A17** | ai-chat-e2e.spec.ts | Open chat → Ask question in VI → Get AI response → Continue | 🔴 P1 |
| **W4-A18** | buddy-group-e2e.spec.ts | Create group → Invite friend → Post in feed → Like/comment | 🟡 P2 |
| **W4-A19** | challenge-participation.spec.ts | Join challenge → Complete tasks → Track progress → Win | 🟡 P2 |
| **W4-A20** | nudge-interaction.spec.ts | Receive nudge notification → Click → Take action → Dismiss | 🟡 P2 |
| **W4-A21** | social-feed-realtime.spec.ts | Post update → See in feed (WebSocket) → React to others | 🟢 P3 |

### Group 4E: Simulation & Admin (4 agents)
| Agent ID | E2E Test | User Flow | Priority |
|----------|----------|-----------|----------|
| **W4-A22** | market-simulation-e2e.spec.ts | Start scenario → Make decisions → See outcomes | 🟡 P2 |
| **W4-A23** | portfolio-management.spec.ts | Buy stocks → Monitor portfolio → Sell → Track P&L | 🟡 P2 |
| **W4-A24** | admin-dashboard.spec.ts | Login as admin → View analytics → Manage users | 🟢 P3 |
| **W4-A25** | error-recovery.spec.ts | Trigger 500 error → See error page → Report with ErrorId | 🟡 P2 |

### Task Template (Example: W4-A01 Registration)
```markdown
# Agent W4-A01: E2E Test - Registration & Onboarding

## Objective
Test complete new user registration journey with Playwright

## Test Scenario
```typescript
import { test, expect } from '@playwright/test';

test.describe('User Registration & Onboarding', () => {
  test('should complete full registration flow', async ({ page }) => {
    // 1. Navigate to registration page
    await page.goto('/en/auth/register');
    
    // 2. Fill registration form
    await page.fill('[name="email"]', 'newuser@test.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.fill('[name="confirmPassword"]', 'SecurePass123!');
    await page.check('[name="agreeToTerms"]');
    await page.click('button[type="submit"]');
    
    // 3. Verify email verification page
    await expect(page).toHaveURL('/en/auth/verify-email');
    await expect(page.locator('text=Check your email')).toBeVisible();
    
    // 4. Simulate email verification (use test token)
    const verifyToken = await page.evaluate(() => localStorage.getItem('testVerifyToken'));
    await page.goto(`/en/auth/verify?token=${verifyToken}`);
    
    // 5. Complete onboarding wizard
    await expect(page).toHaveURL('/en/onboarding');
    
    // Step 1: Profile info
    await page.fill('[name="displayName"]', 'Test User');
    await page.click('button:has-text("Next")');
    
    // Step 2: Learning preferences
    await page.check('[value="BEGINNER"]');
    await page.click('button:has-text("Next")');
    
    // Step 3: Financial goals
    await page.check('[value="SAVE_MONEY"]');
    await page.click('button:has-text("Finish")');
    
    // 6. Verify redirect to dashboard
    await expect(page).toHaveURL('/en/dashboard');
    await expect(page.locator('text=Welcome, Test User')).toBeVisible();
    
    // 7. Verify starter achievement unlocked
    await expect(page.locator('[data-testid="achievement-popup"]')).toBeVisible();
    await expect(page.locator('text=First Steps')).toBeVisible();
  });
  
  test('should show validation errors', async ({ page }) => {
    await page.goto('/en/auth/register');
    
    // Submit empty form
    await page.click('button[type="submit"]');
    
    // Verify error messages
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });
});
```

## Locale Testing
- Run same test in VI, EN, ZH
- Verify all UI strings translated

## Acceptance Criteria
✅ All 6 onboarding steps tested  
✅ Validation errors tested  
✅ Achievement popup verified  
✅ Multi-locale support tested  
✅ Screenshots captured for failures

## Verification
```bash
pnpm playwright test registration-onboarding.spec.ts
```
```

### Success Criteria (Wave 4)
- [ ] All 25 E2E tests passing
- [ ] P1 tests (8 scenarios) stable
- [ ] Multi-locale tested (VI/EN/ZH)
- [ ] Screenshots for failure debugging
- [ ] No flaky E2E tests

---

## ✅ WAVE 5: QUALITY GATES + DOCUMENTATION (9 Agents) ⏱️ 2-3 hours

### Objective: Final Validation & Zero-Debt Certification

### Group 5A: Quality Verification (4 agents)
| Agent ID | Task | Deliverable | Priority |
|----------|------|-------------|----------|
| **W5-A01** | Run full test suite with coverage | Coverage report ≥70% verified | 🔴 P1 |
| **W5-A02** | Check all quality gates | vitest.config.ts thresholds met | 🔴 P1 |
| **W5-A03** | Build verification | pnpm build succeeds (web + api) | 🔴 P1 |
| **W5-A04** | Beads health check | bd doctor + bd ready (0 blockers) | 🔴 P1 |

### Group 5B: Documentation Updates (5 agents)
| Agent ID | Task | File | Priority |
|----------|------|------|----------|
| **W5-A05** | Update test coverage report | TEST_COVERAGE_PLAN.md (final results) | 🔴 P1 |
| **W5-A06** | Create testing runbook | TESTING_RUNBOOK.md (step-by-step guide) | 🟡 P2 |
| **W5-A07** | Update AGENTS.md | Add test commands to daily workflow | 🟡 P2 |
| **W5-A08** | Generate coverage badges | README.md badges + HTML report | 🟡 P2 |
| **W5-A09** | Close ved-hmi | bd close ved-hmi --reason "100-agent cleanup complete" | 🔴 P1 |

### Task Template (Example: W5-A01 Coverage Verification)
```markdown
# Agent W5-A01: Final Coverage Verification

## Objective
Run complete test suite and verify ≥70% coverage achieved

## Steps
1. Clean previous coverage data:
   ```bash
   rm -rf apps/api/coverage
   ```

2. Run full test suite:
   ```bash
   pnpm test --coverage --run
   ```

3. Parse coverage report:
   ```bash
   node scripts/parse-coverage.js > .agents/wave5/final-coverage.json
   ```

4. Verify thresholds (from vitest.config.ts):
   - Lines: ≥70% (target: 80%)
   - Functions: ≥70% (target: 80%)
   - Branches: ≥65% (target: 75%)
   - Statements: ≥70% (target: 80%)

5. Generate HTML report:
   ```bash
   open apps/api/coverage/index.html
   ```

## Acceptance Criteria
✅ Coverage ≥70% (ALL metrics)  
✅ Zero failing tests  
✅ HTML report generated  
✅ Coverage JSON exported for documentation

## Output Files
- .agents/wave5/final-coverage.json
- apps/api/coverage/lcov-report/index.html
- .agents/wave5/coverage-summary.md
```

### Final Quality Gate Checklist
```markdown
## Zero-Debt Certification Criteria

### Test Coverage
- [ ] Overall: ≥70% (current: 30% → target: 70%+)
- [ ] Controllers: ≥85% (current: 42% → target: 85%+)
- [ ] Services: ≥90% (current: 73% → target: 90%+)
- [ ] Guards/Middleware: ≥95%

### Beads Issues
- [ ] ved-hmi: CLOSED ✅
- [ ] ved-34x: UNBLOCKED and READY
- [ ] ved-409: UNBLOCKED and READY
- [ ] ved-28u: UNBLOCKED and READY
- [ ] Zero P1 bugs in `bd ready`

### Build Quality
- [ ] `pnpm --filter api build` → SUCCESS
- [ ] `pnpm --filter web build` → SUCCESS
- [ ] `pnpm lint` → ZERO errors
- [ ] `bd doctor` → ALL GREEN

### Documentation
- [ ] TEST_COVERAGE_PLAN.md updated
- [ ] TESTING_RUNBOOK.md created
- [ ] Coverage badges in README.md
- [ ] AGENTS.md test commands added

### Integration Health
- [ ] All P1 integration tests passing (12 suites)
- [ ] All P1 E2E tests passing (8 scenarios)
- [ ] No flaky tests detected
- [ ] CI/CD pipeline GREEN
```

---

## ⚙️ ORCHESTRATION STRATEGY

### Execution Protocol

#### Pre-Flight Checklist
```bash
# 1. Sync Beads
bd sync

# 2. Create feature branch
git checkout -b feature/100-agent-zero-debt

# 3. Verify current state
pnpm test --run  # Baseline
git status        # Clean working tree

# 4. Create orchestration workspace
mkdir -p .agents/{wave1,wave2,wave3,wave4,wave5,logs}
```

#### Phase 0: Unblock (30 mins)
```bash
# Launch Agent U001
amp invoke Task \
  --prompt "$(cat .agents/phase0/U001-unblock-ved-hmi.md)" \
  --description "Unblock ved-hmi dependency chain" \
  --output .agents/logs/U001.log
```

**Gate:** Verify ved-hmi unblocked before proceeding

#### Wave 1-5: Orchestrated Deployment
```bash
for wave in {1..5}; do
  echo "🚀 Launching Wave $wave..."
  
  # Launch all agents in wave (parallel)
  cat .agents/wave$wave/agent-list.txt | while read agent; do
    amp invoke Task \
      --prompt "$(cat .agents/wave$wave/$agent.md)" \
      --description "Wave $wave - $agent" \
      --output .agents/logs/$agent.log &
  done
  
  # Wait for wave completion
  wait
  
  # Validation gate
  case $wave in
    1) pnpm --filter api build ;;
    2) pnpm test --run | grep "Coverage: " ;;
    3) pnpm test integration --run ;;
    4) pnpm playwright test --reporter=list ;;
    5) bd doctor && bd ready ;;
  esac
  
  echo "✅ Wave $wave complete"
done
```

### Resource Allocation

#### Token Budget
- **Avg tokens/agent:** 8,000 tokens
- **Total agents:** 100
- **Total tokens:** ~800,000 tokens
- **Estimated cost (Claude 3.5 Sonnet):** ~$12-24 USD

#### Time Allocation
| Phase | Agents | Duration | Parallel Execution |
|-------|--------|----------|--------------------|
| **Phase 0** | 1 | 30 mins | Serial |
| **Wave 1** | 20 | 2-3 hours | Full parallel |
| **Wave 2** | 15 | 2-2.5 hours | Full parallel |
| **Wave 3** | 30 | 3-4 hours | Full parallel (groups of 10) |
| **Wave 4** | 25 | 3-4 hours | Full parallel (groups of 8) |
| **Wave 5** | 9 | 2-3 hours | Serial (validation) |
| **TOTAL** | **100** | **12-16 hours sequential** | **3-4 hours parallel** |

### File Lock Management
```javascript
// scripts/acquire-lock.js
const lockfile = require('proper-lockfile');

async function acquireLock(filepath, agentId) {
  try {
    const release = await lockfile.lock(filepath, {
      retries: { retries: 10, minTimeout: 2000 },
      realpath: false,
    });
    console.log(`✅ ${agentId} locked ${filepath}`);
    return release;
  } catch (err) {
    console.error(`❌ ${agentId} failed to lock ${filepath}: ${err.message}`);
    // Exponential backoff
    await new Promise(r => setTimeout(r, Math.random() * 5000));
    return acquireLock(filepath, agentId); // Retry
  }
}

module.exports = { acquireLock };
```

---

## 📊 SUCCESS METRICS

### Coverage Progression (Projected)
```
Baseline:     30% (71 test files)
After Wave 1: 50% (+20 controller tests)
After Wave 2: 65% (+15 service enhancements)
After Wave 3: 75% (+30 integration tests)
After Wave 4: 78% (+25 E2E scenarios)
After Wave 5: 80%+ (final validation)
```

### KPI Dashboard
| Metric | Before | Target | Wave Responsible |
|--------|--------|--------|------------------|
| **Overall Coverage** | 30% | 70%+ | All |
| **Controller Coverage** | 42% | 85%+ | Wave 1 |
| **Service Coverage** | 73% | 90%+ | Wave 2 |
| **Integration Tests** | 5 files | 30 files | Wave 3 |
| **E2E Scenarios** | 3 tests | 25 tests | Wave 4 |
| **Blocked Issues** | 4 issues | 0 issues | Phase 0 + Wave 5 |
| **Technical Debt Epic** | In Progress | CLOSED | Wave 5 |

---

## 🚨 RISK MITIGATION

### High-Risk Areas
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Git merge conflicts** | High | Critical | File locks + sequential file edits |
| **Phase 0 failure** | Low | Critical | Manual verification + retry logic |
| **Flaky E2E tests** | Medium | High | Retry failed tests 3x, add explicit waits |
| **Agent misunderstanding** | Low | Medium | Detailed task templates with examples |

### Failure Recovery
```bash
# If Wave fails
scripts/retry-wave.sh $WAVE_NUMBER

# If Agent fails
scripts/retry-agent.sh $AGENT_ID

# If all fails
git checkout main  # Abandon attempt
bd sync            # Report issues discovered
```

---

## 📅 EXECUTION TIMELINE

### Day 1: Preparation (Manual - 1 hour)
- [ ] Review this roadmap
- [ ] Approve budget (~$25 USD)
- [ ] Create agent task files (.agents/wave{1-5}/*.md)
- [ ] Run `bd sync`
- [ ] Create feature branch

### Day 1-2: Execution (Automated - 3-4 hours)
```
00:00 - Phase 0 Start (Unblock ved-hmi)
00:30 - Phase 0 Complete → Wave 1 Start
02:30 - Wave 1 Complete → Wave 2 Start
05:00 - Wave 2 Complete → Wave 3 Start
09:00 - Wave 3 Complete → Wave 4 Start
13:00 - Wave 4 Complete → Wave 5 Start
16:00 - Wave 5 Complete → Final Validation
```

### Day 2: Post-Execution (Manual - 1 hour)
- [ ] Review coverage report
- [ ] Verify all quality gates
- [ ] Update documentation
- [ ] Close Beads issues
- [ ] Create PR + merge

---

## 📚 REFERENCES

### Context Files
- [PROJECT_STATUS.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/PROJECT_STATUS.md) - Baseline (60% complete)
- [ARMY_DASHBOARD.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/ARMY_DASHBOARD.md) - 150-agent pattern
- [100_AGENT_ORCHESTRATION_PLAN.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/100_AGENT_ORCHESTRATION_PLAN.md) - Original 5-wave plan
- [MASTER_TESTING_PLAN.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/MASTER_TESTING_PLAN.md) - Hybrid testing strategy
- [TECHNICAL_DEBT_ELIMINATION_PLAN.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/TECHNICAL_DEBT_ELIMINATION_PLAN.md) - Manual 16-hour plan

### Beads Integration
```bash
# Create Wave tasks
bd create "Phase 0: Unblock ved-hmi" -t task -p 1 --deps ved-hmi
bd create "Wave 1: Controller Tests (20 agents)" -t task -p 1 --deps ved-hmi
bd create "Wave 2: Service Hardening (15 agents)" -t task -p 1 --deps ved-hmi
bd create "Wave 3: Integration Tests (30 agents)" -t task -p 1 --deps ved-hmi
bd create "Wave 4: E2E Stabilization (25 agents)" -t task -p 1 --deps ved-hmi
bd create "Wave 5: Quality Gates (9 agents)" -t task -p 1 --deps ved-hmi
```

---

## ✅ FINAL PRE-LAUNCH CHECKLIST

### Approval Gates
- [ ] Roadmap reviewed and approved by user
- [ ] Budget approved (~$25 USD for 800k tokens)
- [ ] Timeline acceptable (3-4 hours execution + 2 hours manual)
- [ ] Risk assessment reviewed

### Technical Readiness
- [ ] Git working tree clean
- [ ] Beads synced (`bd sync`)
- [ ] Test suite baseline recorded
- [ ] Agent task files prepared
- [ ] Orchestration scripts tested

### Go/No-Go Decision
**✅ GO if:**
- All approval gates cleared
- No breaking changes in main branch
- Beads health green (`bd doctor`)

**🛑 NO-GO if:**
- Outstanding P0 bugs
- Main branch unstable
- Budget not approved

---

**Prepared by:** V-EdFinance Development Team  
**Date:** 2025-12-21  
**Status:** 🟡 AWAITING USER APPROVAL  
**Estimated Cost:** $12-24 USD  
**Estimated Time:** 3-4 hours (parallel execution)  
**Expected Outcome:** 30% → 70%+ coverage, Zero technical debt, All blockers resolved

🚀 **READY TO DEPLOY 100 SUB-AGENTS ON YOUR COMMAND**
