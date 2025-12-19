# 🧪 Test Coverage Implementation Plan

**Project:** V-EdFinance  
**Date Created:** 2025-12-19  
**Current Coverage:** ~30% (7 test files)  
**Target Coverage:** 80%+ (Industry Standard)  
**Timeline:** 3 weeks

---

## 📋 Executive Summary

This document outlines a systematic approach to achieve **80%+ test coverage** for V-EdFinance, prioritizing critical paths and high-risk components. The plan follows the **Testing Pyramid** principle: many unit tests, fewer integration tests, and selective E2E tests.

---

## 🎯 Testing Strategy

### Testing Pyramid

```
         /\
        /E2E\          ← 5-10 critical user flows
       /------\
      /  API   \       ← 20-30 endpoint tests
     /----------\
    / Unit Tests \     ← 100+ service/utility tests
   /--------------\
```

### Coverage Targets

| Test Level | Target Coverage | Purpose |
|------------|----------------|---------|
| **Unit Tests** | 80%+ | Individual functions, services, utilities |
| **Integration Tests** | 60%+ | API endpoints, database operations |
| **E2E Tests** | Critical paths | User workflows (login → course → progress) |

---

## 🔍 Current State Analysis

### Existing Tests ✅
1. `apps/api/src/auth/auth.controller.spec.ts`
2. `apps/api/src/auth/auth.service.spec.ts`
3. `apps/api/src/behavior/streak.service.spec.ts`
4. `apps/api/src/checklists/checklists.service.spec.ts`
5. `apps/api/src/common/gamification.service.spec.ts`
6. `apps/api/src/users/users.service.spec.ts`
7. `apps/api/src/app.controller.spec.ts`

### Coverage Gaps 🔴
**Missing Tests for ~23 services** across 17 modules:
- Adaptive learning
- Analytics (8 files)
- Debug/diagnostics
- Leaderboard
- Nudge engine (4 files)
- Recommendations
- Simulation
- Social features (4 files)
- Store
- Courses (5 files)
- Storage (2 files)
- AI integration (3 files)

---

## 📅 Implementation Roadmap

### Week 1: Foundation & Core Services (Priority 1)

#### Day 1-2: Setup & Infrastructure
**Goal:** Configure testing tools and establish patterns

**Tasks:**
- [ ] Configure Jest coverage reporting
- [ ] Setup code coverage badges
- [ ] Create test helper utilities
- [ ] Setup test database (Docker)
- [ ] Create mock data generators

**Commands:**
```bash
# Install coverage tools
pnpm add -D @types/jest jest-coverage-badges

# Update package.json
"test:coverage": "jest --coverage"
"test:watch": "jest --watch"

# Run coverage report
pnpm --filter api test:coverage
```

**Deliverables:**
- `jest.config.js` with coverage thresholds
- `tests/helpers/` directory with utilities
- `tests/mocks/` directory with fixtures

#### Day 3-4: Core Service Tests
**Goal:** Test authentication & user management

**Priority Files:**
1. ✅ `auth.service.spec.ts` (EXISTS - Review & Enhance)
2. ✅ `users.service.spec.ts` (EXISTS - Review & Enhance)
3. 🆕 `courses/courses.service.spec.ts` (NEW)
4. 🆕 `courses/courses.controller.spec.ts` (NEW)

**Test Scenarios:**
```typescript
// courses.service.spec.ts
describe('CoursesService', () => {
  describe('create', () => {
    it('should create course with localized content');
    it('should validate JSONB structure');
    it('should generate unique slug');
    it('should throw on duplicate slug');
  });

  describe('findAll', () => {
    it('should return published courses only');
    it('should filter by level');
    it('should return localized content');
  });
});
```

**Success Criteria:**
- [ ] Auth module: 90%+ coverage
- [ ] Users module: 85%+ coverage
- [ ] Courses module: 80%+ coverage

#### Day 5: Gamification & Behavioral Tests
**Goal:** Test gamification and behavioral tracking

**Priority Files:**
1. ✅ `gamification.service.spec.ts` (EXISTS - Enhance)
2. ✅ `streak.service.spec.ts` (EXISTS - Enhance)
3. 🆕 `behavior/behavior-log.service.spec.ts` (NEW)

**Test Scenarios:**
```typescript
// behavior-log.service.spec.ts
describe('BehaviorLogService', () => {
  it('should log user events with JSONB payload');
  it('should aggregate events by session');
  it('should handle high-volume event streams');
  it('should respect privacy settings');
});
```

**Success Criteria:**
- [ ] Gamification: 85%+ coverage
- [ ] Behavior tracking: 80%+ coverage

---

### Week 2: Integration Tests & Advanced Modules (Priority 2)

#### Day 6-7: API Integration Tests
**Goal:** Test REST endpoints end-to-end

**Setup:**
```bash
# Install supertest
pnpm add -D supertest @types/supertest

# Create integration test structure
mkdir -p apps/api/test/integration
```

**Priority Endpoints:**
1. **Auth Endpoints**
   - `POST /api/auth/register`
   - `POST /api/auth/login`
   - `POST /api/auth/refresh`
   - `POST /api/auth/logout`

2. **Course Endpoints**
   - `GET /api/courses` (with pagination)
   - `GET /api/courses/:id`
   - `POST /api/courses` (admin only)
   - `PATCH /api/courses/:id`

3. **Progress Endpoints**
   - `POST /api/progress/:lessonId`
   - `GET /api/progress/user/:userId`

**Example Test:**
```typescript
// test/integration/courses.e2e-spec.ts
describe('Courses API (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    // Setup test app
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login and get token
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });
    
    authToken = response.body.accessToken;
  });

  it('GET /api/courses should return paginated courses', () => {
    return request(app.getHttpServer())
      .get('/api/courses?page=1&limit=10')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toBeInstanceOf(Array);
        expect(res.body.pagination).toBeDefined();
      });
  });

  it('GET /api/courses/:id should return localized content', () => {
    return request(app.getHttpServer())
      .get('/api/courses/course-uuid')
      .set('Accept-Language', 'vi')
      .expect(200)
      .expect((res) => {
        expect(res.body.title).toBeDefined();
        expect(typeof res.body.title).toBe('string'); // Should be localized
      });
  });
});
```

**Success Criteria:**
- [ ] Auth endpoints: All scenarios covered
- [ ] Courses endpoints: CRUD + pagination tested
- [ ] Progress tracking: Create & retrieve tested

#### Day 8-9: Advanced Module Tests
**Goal:** Test AI, analytics, and behavioral modules

**Priority Files:**
1. 🆕 `ai/ai.service.spec.ts`
2. 🆕 `analytics/analytics.service.spec.ts`
3. 🆕 `nudge/nudge.service.spec.ts`
4. 🆕 `recommendations/recommendations.service.spec.ts`

**AI Service Test Example:**
```typescript
// ai/ai.service.spec.ts
describe('AiService', () => {
  let service: AiService;
  let mockGeminiClient: jest.Mocked<any>;

  beforeEach(() => {
    mockGeminiClient = {
      generateContent: jest.fn(),
    };
    service = new AiService(mockGeminiClient);
  });

  describe('generateResponse', () => {
    it('should call Gemini with correct locale', async () => {
      mockGeminiClient.generateContent.mockResolvedValue({
        text: 'Response in Vietnamese',
      });

      const result = await service.generateResponse({
        query: 'Explain RSI',
        locale: 'vi',
        context: { module: 'Trading 101' },
      });

      expect(mockGeminiClient.generateContent).toHaveBeenCalledWith(
        expect.objectContaining({ locale: 'vi' })
      );
      expect(result).toContain('Response');
    });

    it('should handle API errors gracefully', async () => {
      mockGeminiClient.generateContent.mockRejectedValue(
        new Error('API Limit')
      );

      await expect(
        service.generateResponse({ query: 'Test', locale: 'en' })
      ).rejects.toThrow('API Limit');
    });

    it('should cache responses to reduce costs', async () => {
      // Mock cache service
      // Test caching logic
    });
  });
});
```

**Success Criteria:**
- [ ] AI service: 75%+ coverage (with mocks)
- [ ] Analytics: 70%+ coverage
- [ ] Nudge engine: 70%+ coverage

#### Day 10: Social & Simulation Tests
**Goal:** Test social features and financial simulations

**Priority Files:**
1. 🆕 `social/buddy-groups.service.spec.ts`
2. 🆕 `simulation/simulation.service.spec.ts`
3. 🆕 `leaderboard/leaderboard.service.spec.ts`

**Success Criteria:**
- [ ] Social features: 70%+ coverage
- [ ] Simulation engine: 75%+ coverage
- [ ] Leaderboard: 80%+ coverage

---

### Week 3: E2E Tests & Polish (Priority 3)

#### Day 11-12: Critical User Flows (E2E)
**Goal:** Test complete user journeys with Playwright

**Setup:**
```bash
# Playwright already configured
cd apps/web
pnpm exec playwright install
```

**Priority User Flows:**

**Flow 1: Registration & Onboarding**
```typescript
// tests/e2e/auth/registration.spec.ts
import { test, expect } from '@playwright/test';

test.describe('User Registration Flow', () => {
  test('should register new student and complete onboarding', async ({ page }) => {
    // Navigate to register page
    await page.goto('http://localhost:3000/vi/register');

    // Fill registration form
    await page.fill('[name="email"]', 'newuser@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.fill('[name="confirmPassword"]', 'SecurePass123!');
    await page.click('[type="submit"]');

    // Verify redirect to onboarding
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h1')).toContainText('Chào mừng'); // Vietnamese

    // Complete investment profile
    await page.click('[data-testid="risk-score-slider"]');
    await page.selectOption('[name="knowledgeLevel"]', 'BEGINNER');
    await page.click('[data-testid="save-profile"]');

    // Verify dashboard loads
    await expect(page.locator('[data-testid="user-points"]')).toBeVisible();
  });
});
```

**Flow 2: Course Enrollment & Progress**
```typescript
// tests/e2e/courses/enrollment.spec.ts
test.describe('Course Enrollment Flow', () => {
  test('should enroll in course and track progress', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/vi/login');
    await page.fill('[name="email"]', 'student@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('[type="submit"]');

    // Browse courses
    await page.goto('http://localhost:3000/vi/courses');
    await expect(page.locator('[data-testid="course-card"]')).toHaveCount(3, { timeout: 5000 });

    // Click first course
    await page.click('[data-testid="course-card"]:first-child');

    // Verify course details in Vietnamese
    await expect(page.locator('h1')).toContainText('Tài chính');

    // Start first lesson
    await page.click('[data-testid="start-lesson-btn"]');

    // Verify lesson player loads
    await expect(page.locator('video')).toBeVisible();

    // Simulate watching video
    await page.waitForTimeout(5000);

    // Mark as complete
    await page.click('[data-testid="complete-lesson-btn"]');

    // Verify progress updated
    await expect(page.locator('[data-testid="progress-bar"]')).toHaveAttribute(
      'aria-valuenow',
      '25'
    );
  });
});
```

**Flow 3: AI Chat Interaction**
```typescript
// tests/e2e/ai/chat.spec.ts
test.describe('AI Chat Flow', () => {
  test('should interact with AI tutor in Vietnamese', async ({ page }) => {
    // Login and navigate to chat
    await loginAsStudent(page);
    await page.goto('http://localhost:3000/vi/dashboard/chat');

    // Send question
    await page.fill('[data-testid="chat-input"]', 'Tại sao RSI lại quan trọng?');
    await page.click('[data-testid="send-btn"]');

    // Wait for AI response
    await expect(page.locator('[data-testid="message"]:last-child')).toContainText(
      'RSI',
      { timeout: 10000 }
    );

    // Verify response is in Vietnamese
    await expect(page.locator('[data-testid="message"]:last-child')).not.toContainText(
      'Sorry, I don\'t know'
    );
  });
});
```

**Flow 4: Gamification & Streaks**
```typescript
// tests/e2e/gamification/streak.spec.ts
test.describe('Streak Tracking Flow', () => {
  test('should update streak on daily login', async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('http://localhost:3000/vi/dashboard');

    // Check current streak
    const streakBefore = await page.locator('[data-testid="streak-count"]').textContent();

    // Complete a daily task
    await page.click('[data-testid="daily-checklist-item"]:first-child');
    await page.waitForTimeout(1000);

    // Verify streak updated (if first action today)
    // Note: This might need API mocking for consistent testing
  });
});
```

**Flow 5: Social Buddy Groups**
```typescript
// tests/e2e/social/buddy-groups.spec.ts
test.describe('Buddy Group Flow', () => {
  test('should create and join buddy group', async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('http://localhost:3000/vi/dashboard/social');

    // Create new group
    await page.click('[data-testid="create-group-btn"]');
    await page.fill('[name="groupName"]', 'Study Group 1');
    await page.selectOption('[name="groupType"]', 'LEARNING');
    await page.click('[data-testid="submit-group"]');

    // Verify group created
    await expect(page.locator('[data-testid="group-name"]')).toContainText('Study Group 1');

    // Invite friend (mock)
    await page.click('[data-testid="invite-btn"]');
    // ... test invite flow
  });
});
```

**Success Criteria:**
- [ ] All 5 critical flows pass
- [ ] Tests run in CI/CD pipeline
- [ ] Screenshots captured on failure

#### Day 13-14: Performance & Load Tests
**Goal:** Ensure API can handle expected load

**Setup:**
```bash
# Install k6 for load testing
choco install k6  # Windows
```

**Load Test Script:**
```javascript
// tests/load/api-stress.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp-up to 50 users
    { duration: '1m', target: 100 },  // Sustain 100 users
    { duration: '30s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],   // Error rate < 1%
  },
};

const BASE_URL = 'http://localhost:3001';

export default function () {
  // Login
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, {
    email: 'test@example.com',
    password: 'password123',
  });

  check(loginRes, {
    'login successful': (r) => r.status === 200,
  });

  const token = loginRes.json('accessToken');

  // Get courses
  const coursesRes = http.get(`${BASE_URL}/api/courses`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  check(coursesRes, {
    'courses loaded': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < 300,
  });

  sleep(1);
}
```

**Run Load Test:**
```bash
k6 run tests/load/api-stress.js
```

**Success Criteria:**
- [ ] API handles 100 concurrent users
- [ ] P95 response time < 500ms
- [ ] Error rate < 1%

#### Day 15: Documentation & CI/CD Integration
**Goal:** Document testing process and automate in CI/CD

**Tasks:**
1. **Update Documentation**
   - [ ] Update this file with results
   - [ ] Create testing runbook
   - [ ] Document test data setup

2. **CI/CD Integration**
```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm --filter api test:coverage
      - uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
    steps:
      - uses: actions/checkout@v3
      - run: pnpm --filter api test:e2e

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm --filter web playwright test
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

3. **Coverage Badges**
```markdown
# README.md
![Coverage](https://img.shields.io/codecov/c/github/yourusername/v-edfinance)
![Tests](https://github.com/yourusername/v-edfinance/workflows/Tests/badge.svg)
```

**Success Criteria:**
- [ ] All tests run in CI/CD
- [ ] Coverage reports published
- [ ] Failed tests block merges

---

## 📊 Success Metrics

### Coverage Targets

| Module | Current | Target | Priority |
|--------|---------|--------|----------|
| **auth** | 60% | 90% | 🔴 High |
| **users** | 50% | 85% | 🔴 High |
| **courses** | 0% | 80% | 🔴 High |
| **gamification** | 40% | 85% | 🟡 Medium |
| **behavior** | 30% | 75% | 🟡 Medium |
| **ai** | 0% | 75% | 🟡 Medium |
| **analytics** | 0% | 70% | 🟢 Low |
| **social** | 0% | 70% | 🟢 Low |
| **simulation** | 0% | 70% | 🟢 Low |

### Quality Gates

Before merging to `main`:
- ✅ Unit test coverage ≥ 80%
- ✅ Integration tests pass
- ✅ E2E critical flows pass
- ✅ No security vulnerabilities
- ✅ Linting passes

---

## 🛠️ Testing Tools & Libraries

### Unit & Integration Testing
```json
{
  "jest": "^29.0.0",
  "@nestjs/testing": "^10.0.0",
  "supertest": "^6.3.0",
  "@types/supertest": "^2.0.12"
}
```

### E2E Testing
```json
{
  "@playwright/test": "^1.40.0"
}
```

### Load Testing
- **k6** - Load testing (installed globally)

### Coverage Reporting
```json
{
  "jest-coverage-badges": "^1.1.2",
  "codecov": "^3.8.3"
}
```

---

## 📝 Testing Best Practices

### Unit Tests
1. **AAA Pattern:** Arrange → Act → Assert
2. **One Assertion Per Test:** Focus on single behavior
3. **Mock External Dependencies:** Isolate unit under test
4. **Descriptive Names:** `it('should create course with localized content')`

### Integration Tests
1. **Use Test Database:** Separate from dev/prod
2. **Clean State:** Reset DB between tests
3. **Realistic Scenarios:** Test actual API contracts
4. **Test Error Cases:** Not just happy paths

### E2E Tests
1. **Test User Perspective:** Real browser interactions
2. **Data Independence:** Each test creates own data
3. **Visual Regression:** Screenshot failed tests
4. **Retry Flaky Tests:** Handle network delays

---

## 🚀 Quick Start Commands

```bash
# Unit tests
pnpm --filter api test
pnpm --filter api test:watch
pnpm --filter api test:coverage

# Integration tests
pnpm --filter api test:e2e

# E2E tests
pnpm --filter web playwright test
pnpm --filter web playwright test --ui  # Interactive mode

# Load tests
k6 run tests/load/api-stress.js

# Generate coverage report
pnpm --filter api test:coverage
# Open: apps/api/coverage/lcov-report/index.html
```

---

## 📞 Support

### Issues & Questions
- Create issue in GitHub with `[TEST]` prefix
- Tag with `testing` label
- Reference this document

### Review Process
- Weekly test coverage review
- Monthly test strategy retrospective

---

**Prepared by:** QA Team  
**Date:** 2025-12-19  
**Next Review:** 2026-01-09 (3 weeks)  
**Target Completion:** 2026-01-09

---

## ✅ Checklist

Use this checklist to track progress:

### Week 1: Foundation
- [ ] Configure Jest coverage
- [ ] Create test helpers
- [ ] Setup test database
- [ ] Auth module: 90%+
- [ ] Users module: 85%+
- [ ] Courses module: 80%+
- [ ] Gamification: 85%+

### Week 2: Integration
- [ ] Install supertest
- [ ] Auth endpoints tested
- [ ] Courses endpoints tested
- [ ] AI service: 75%+
- [ ] Analytics: 70%+
- [ ] Social features: 70%+

### Week 3: E2E & Polish
- [ ] Registration flow tested
- [ ] Course enrollment tested
- [ ] AI chat tested
- [ ] Gamification tested
- [ ] Social features tested
- [ ] Load tests passing
- [ ] CI/CD integrated
- [ ] Documentation updated

### Final Verification
- [ ] Overall coverage ≥ 80%
- [ ] All critical flows passing
- [ ] CI/CD pipeline green
- [ ] Coverage badges added
- [ ] Team trained on testing
