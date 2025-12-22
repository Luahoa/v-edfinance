# 🐝 V-EdFinance Testing Plan - Swarm Framework

**Project:** V-EdFinance  
**Strategy:** Parallel testing với Swarm Framework  
**Timeline:** 2-3 days (thay vì 3 tuần)  
**Current Coverage:** ~30% (93 test files)  
**Target Coverage:** 80%+  
**Approach:** Smart automation, không cần 1000 agents

---

## 📊 Current Status Analysis

### ✅ Existing Tests (93 files)
**Modules có test coverage tốt:**
- ✅ **Auth:** auth.service.spec.ts, auth.controller.spec.ts, jwt.strategy.spec.ts, guards
- ✅ **Analytics:** 17 test files (analytics.service, predictive, mentor, simulation-bot, heatmap, etc.)
- ✅ **Social:** 10 test files (social.service, gateway, challenges, friends, chat, etc.)
- ✅ **Nudge:** 10 test files (nudge-engine, loss-aversion, social-proof, framing, etc.)
- ✅ **AI:** 8 test files (ai.service, persona-analysis, moderation, ai-cache, etc.)
- ✅ **Simulation:** 4 test files (simulation.service, scenario-generator, market-simulation)
- ✅ **Users, Storage, Common, Behavior:** Đầy đủ

### 🔴 Coverage Gaps
**Modules thiếu hoặc coverage thấp:**
1. **Courses:** Chỉ có 2 files (courses.service.spec.ts, courses.controller.spec.ts)
2. **Database:** Chỉ có database-architect.agent.spec.ts, thiếu DrizzleService, KyselyService
3. **Websocket:** Chưa có test cho real-time features
4. **Integration Tests:** Thiếu E2E tests cho critical flows
5. **Triple-ORM Strategy:** Chưa test performance của Prisma + Drizzle + Kysely

---

## 🎯 Testing Strategy - Swarm Approach

### Phase 1: Setup & Foundation (4 hours)
**Không cần agent**, manual setup:
```bash
# 1. Configure coverage reporting
cd apps/api
cat >> jest.config.js << EOF
module.exports = {
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80
    }
  }
}
EOF

# 2. Setup test database
docker-compose -f docker-compose.test.yml up -d

# 3. Create test helpers
mkdir -p apps/api/src/test-utils/factories
```

---

### Phase 2: Parallel Unit Testing (1 day)
**Sử dụng Swarm Framework với 5 specialized agents**

#### Swarm Configuration: `test-unit-swarm.yml`
```yaml
version: 2
name: V-EdFinance Unit Testing Team

agents:
  orchestrator:
    model: claude-sonnet-4
    role: "Test orchestration lead - coordinates all testing efforts"
    tools: [Read, Write, Bash, Grep]
    delegates_to: [service_tester, controller_tester, db_tester, integration_tester]
    hooks:
      on_user_message:
        - run: "pnpm --filter api test --listTests"
          append_output_to_context: true
    
  service_tester:
    model: claude-sonnet-4
    role: "Service layer test specialist - writes comprehensive service tests"
    description: |
      Expert in NestJS service testing. Focuses on:
      - Business logic validation
      - Dependency injection mocking
      - Error handling scenarios
      - JSONB structure validation
    tools: [Read, Write, Edit, Bash]
    
  controller_tester:
    model: claude-sonnet-4
    role: "Controller test specialist - API endpoint testing"
    description: |
      Expert in NestJS controller testing. Focuses on:
      - HTTP request/response validation
      - Auth guards testing
      - DTO validation
      - Localization (vi/en/zh)
    tools: [Read, Write, Edit, Bash]
    
  db_tester:
    model: claude-sonnet-4
    role: "Database test specialist - Triple-ORM strategy expert"
    description: |
      Expert in Prisma + Drizzle + Kysely testing. Focuses on:
      - Prisma migration tests
      - Drizzle query performance tests
      - Kysely analytics query tests
      - Database transaction handling
    tools: [Read, Write, Edit, Bash]
    hooks:
      on_pre_response:
        - run: "docker exec postgres-test psql -U postgres -c 'SELECT pg_stat_reset();'"
          # Reset DB stats before each test run
    
  integration_tester:
    model: claude-sonnet-4
    role: "Integration test specialist - E2E API testing"
    description: |
      Expert in supertest integration testing. Focuses on:
      - REST API endpoint testing
      - Authentication flow testing
      - Multi-module integration scenarios
    tools: [Read, Write, Edit, Bash]
```

#### Execution Plan
```bash
# Install Swarm CLI
gem install swarm_cli

# Run Unit Testing Swarm
swarm run test-unit-swarm.yml -p "
Execute comprehensive unit testing for V-EdFinance:

Priority 1 (CRITICAL - Fintech Compliance):
- Complete auth module coverage to 90%+
- Test payment-related services (if exists)
- Validate JSONB schema enforcement

Priority 2 (CORE BUSINESS):
- Courses module: 80%+ coverage
- Gamification: 85%+ coverage  
- AI service: 75%+ coverage (mock Gemini API)

Priority 3 (DATABASE):
- Test Triple-ORM strategy
- DrizzleService performance tests
- KyselyService analytics query tests
- Database transaction rollback tests

Priority 4 (INTEGRATION):
- Auth endpoints (register, login, refresh, logout)
- Course endpoints (CRUD + pagination)
- AI chat endpoints

Context: Read TEST_COVERAGE_PLAN.md and AGENTS.md for project details.
"
```

---

### Phase 3: E2E Testing (6 hours)
**Sử dụng Swarm cho Playwright tests**

#### Swarm Configuration: `test-e2e-swarm.yml`
```yaml
version: 2
name: V-EdFinance E2E Testing Team

agents:
  e2e_orchestrator:
    model: claude-sonnet-4
    role: "E2E test coordinator - manages user flow testing"
    tools: [Read, Write, Bash]
    delegates_to: [auth_flow_tester, course_flow_tester, ai_chat_tester, social_tester]
    
  auth_flow_tester:
    model: claude-sonnet-4
    role: "Authentication flow tester"
    description: |
      Tests critical auth flows:
      - Registration → Onboarding → Dashboard
      - Login → Remember me → Logout
      - Password reset flow
      - Multi-locale support (vi/en/zh)
    tools: [Read, Write, Edit, Bash]
    
  course_flow_tester:
    model: claude-sonnet-4
    role: "Course enrollment and progress tester"
    description: |
      Tests learning flows:
      - Browse courses → Enroll → Watch lesson → Track progress
      - Quiz completion → Certificate earning
      - Adaptive difficulty adjustment
    tools: [Read, Write, Edit, Bash]
    
  ai_chat_tester:
    model: claude-sonnet-4
    role: "AI chat interaction tester"
    description: |
      Tests AI features:
      - Ask question in Vietnamese → Get localized response
      - Multi-turn conversation context
      - AI moderation (block inappropriate content)
    tools: [Read, Write, Edit, Bash]
    
  social_tester:
    model: claude-sonnet-4
    role: "Social features tester"
    description: |
      Tests social interactions:
      - Create buddy group → Invite friends → Start challenge
      - Share progress on feed
      - Real-time notifications (WebSocket)
    tools: [Read, Write, Edit, Bash]
```

#### Critical User Flows (5 flows)
```bash
swarm run test-e2e-swarm.yml -p "
Create Playwright E2E tests for 5 critical user flows:

Flow 1: Registration & Onboarding
- Navigate to /vi/register
- Fill form (email, password, confirmPassword)
- Complete investment profile (risk score, knowledge level)
- Verify dashboard loads with user points

Flow 2: Course Enrollment & Progress
- Login as student
- Browse courses (verify localized content in Vietnamese)
- Click course → Start lesson → Watch video
- Mark as complete → Verify progress bar updates

Flow 3: AI Chat Interaction
- Navigate to /vi/dashboard/chat
- Send question in Vietnamese: 'Tại sao RSI lại quan trọng?'
- Verify AI response in Vietnamese
- Test multi-turn conversation

Flow 4: Gamification & Streaks
- Daily login → Check current streak
- Complete daily checklist item
- Verify streak updated
- Earn achievement badge

Flow 5: Social Buddy Groups
- Navigate to /vi/dashboard/social
- Create new buddy group (name, type)
- Invite friend (mock)
- Verify group appears in list

Success Criteria:
- All flows pass on first try
- Average test duration < 30 seconds per flow
- Screenshots captured on failure
- Tests run in CI/CD (GitHub Actions)

Context: apps/web is Next.js 15 with next-intl for i18n.
"
```

---

### Phase 4: Performance Testing (4 hours)
**Load testing cho critical endpoints**

#### Swarm Configuration: `test-performance-swarm.yml`
```yaml
version: 2
name: V-EdFinance Performance Testing Team

agents:
  perf_orchestrator:
    model: claude-sonnet-4
    role: "Performance test coordinator"
    tools: [Read, Write, Bash]
    delegates_to: [db_perf_tester, api_perf_tester, stress_tester]
    
  db_perf_tester:
    model: claude-sonnet-4
    role: "Database performance tester - Triple-ORM expert"
    description: |
      Benchmarks database performance:
      - Prisma migration speed
      - Drizzle read performance (target: 65% faster than Prisma)
      - Kysely analytics query performance
      - BehaviorLog bulk insert (10k records)
    tools: [Read, Write, Bash]
    hooks:
      on_pre_response:
        - run: "docker exec postgres-test psql -U postgres -c 'SELECT * FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;'"
          append_output_to_context: true
    
  api_perf_tester:
    model: claude-sonnet-4
    role: "API performance tester"
    description: |
      Tests API response times:
      - GET /api/courses (P95 < 200ms)
      - POST /api/auth/login (P95 < 150ms)
      - GET /api/analytics/dashboard (P95 < 500ms)
    tools: [Read, Write, Bash]
    
  stress_tester:
    model: claude-sonnet-4
    role: "Load testing specialist - k6 expert"
    description: |
      Simulates production load:
      - 100 concurrent users
      - Sustained 1000 requests/minute
      - Error rate < 1%
      - P95 response time < 500ms
    tools: [Read, Write, Bash]
```

#### Load Test Execution
```bash
swarm run test-performance-swarm.yml -p "
Create comprehensive performance tests:

1. Database Performance Benchmarks
- Use scripts/tests/database-benchmark.ts
- Test Drizzle vs Prisma read performance (should be 65% faster)
- Bulk insert 10k BehaviorLog records
- Measure Kysely analytics query time

2. API Load Tests (k6)
- Create k6 script: tests/load/api-stress.js
- Simulate 100 concurrent users
- Test critical endpoints:
  * POST /api/auth/login
  * GET /api/courses?page=1&limit=10
  * POST /api/ai/chat
  * GET /api/analytics/dashboard
- Thresholds:
  * P95 < 500ms
  * Error rate < 1%
  * Sustained 1000 req/min

3. Real-Time Performance (WebSocket)
- Test 50 concurrent WebSocket connections
- Broadcast message latency < 100ms
- Test buddy group chat (10 users)

Success Criteria:
- All benchmarks meet targets
- Load tests pass with 100 concurrent users
- Database queries optimized (pg_stat_statements analysis)
- Performance report generated

Context: VPS deployment at http://103.54.153.248:3001 (API Staging)
"
```

---

## 📋 Detailed Task Breakdown

### Swarm Team Roles & Responsibilities

| Agent Role | Modules | Expected Output | Success Metric |
|------------|---------|-----------------|----------------|
| **service_tester** | Auth, Users, Courses, Gamification, Behavior | 20+ service test files | 80%+ coverage per module |
| **controller_tester** | All controllers | 15+ controller test files | 75%+ coverage |
| **db_tester** | Database, Prisma, Drizzle, Kysely | 5 database test files + benchmarks | Performance targets met |
| **integration_tester** | API endpoints | 10 E2E spec files (supertest) | All P1 endpoints tested |
| **e2e_orchestrator** | Critical user flows | 5 Playwright tests | All flows pass |
| **perf_orchestrator** | Performance testing | Load test scripts + reports | P95 < 500ms, error < 1% |

---

## 🚀 Execution Timeline

### Day 1: Setup + Unit Testing (8 hours)
```
Hour 0-2:   Manual setup (test DB, coverage config, test helpers)
Hour 2-8:   Run test-unit-swarm.yml
            - Parallel execution: 4 agents work simultaneously
            - service_tester: Writes 20 service tests
            - controller_tester: Writes 15 controller tests
            - db_tester: Creates Triple-ORM benchmark tests
            - integration_tester: Tests critical API endpoints
```

### Day 2: E2E + Performance Testing (8 hours)
```
Hour 0-4:   Run test-e2e-swarm.yml
            - auth_flow_tester: Registration + Login flows
            - course_flow_tester: Enrollment + Progress flows
            - ai_chat_tester: AI chat interactions
            - social_tester: Buddy groups + challenges

Hour 4-8:   Run test-performance-swarm.yml
            - db_perf_tester: Database benchmarks
            - api_perf_tester: API response time tests
            - stress_tester: k6 load tests (100 concurrent users)
```

### Day 3: Polish + Documentation (4 hours)
```
Hour 0-2:   Review test results
            - Aggregate coverage reports
            - Fix failing tests
            - Optimize slow tests

Hour 2-4:   Documentation + CI/CD integration
            - Update TEST_COVERAGE_PLAN.md with results
            - Create testing runbook
            - Configure GitHub Actions workflow
            - Generate coverage badges
```

**Total Time:** 2.5 days (vs 3 weeks manual)

---

## 💰 Cost Estimation

### Swarm Framework Costs
**Assumptions:**
- Claude Sonnet 4: $3 per million input tokens, $15 per million output tokens
- Average task: 10,000 input tokens, 5,000 output tokens

**Per-Agent Cost:**
- Input: 10,000 tokens × $3/1M = $0.03
- Output: 5,000 tokens × $15/1M = $0.075
- **Total per task:** ~$0.10

**Total Project Cost:**
- Day 1 (Unit Testing): 4 agents × 20 tasks = 80 tasks × $0.10 = **$8**
- Day 2 (E2E + Perf): 4 agents × 10 tasks = 40 tasks × $0.10 = **$4**
- **Total:** ~**$12 USD**

**ROI Comparison:**
- Manual: 3 weeks × 8 hours/day × $50/hour = $6,000
- Swarm: 2.5 days × 2 hours review × $50/hour + $12 AI = **$262**
- **Savings:** $5,738 (96% cost reduction)

---

## 📊 Success Metrics & Quality Gates

### Coverage Targets
| Module | Current | Target | Agent Responsible |
|--------|---------|--------|-------------------|
| **Auth** | 60% | 90% | service_tester + controller_tester |
| **Users** | 50% | 85% | service_tester |
| **Courses** | ~30% | 80% | service_tester + controller_tester |
| **Gamification** | 40% | 85% | service_tester |
| **AI** | ~50% | 75% | service_tester (mock Gemini) |
| **Analytics** | ~70% | 75% | service_tester |
| **Database** | 20% | 80% | db_tester (Triple-ORM) |
| **Social** | ~60% | 70% | service_tester |
| **Overall** | **30%** | **80%+** | **All agents** |

### Quality Gates (Must Pass Before Merge)
```bash
# Gate 1: Unit Tests
✅ Overall coverage ≥ 80%
✅ No module below 70% coverage
✅ All service tests pass
✅ No linting errors

# Gate 2: Integration Tests
✅ All P1 API endpoints tested
✅ Auth flow complete (register, login, refresh, logout)
✅ Database transactions tested (rollback on error)

# Gate 3: E2E Tests
✅ All 5 critical flows pass
✅ Multi-locale support verified (vi/en/zh)
✅ Screenshots captured on failure

# Gate 4: Performance Tests
✅ API handles 100 concurrent users
✅ P95 response time < 500ms
✅ Error rate < 1%
✅ Drizzle 65% faster than Prisma (verified)

# Gate 5: CI/CD Integration
✅ GitHub Actions workflow configured
✅ Tests run on every PR
✅ Coverage badges added to README
✅ Failed tests block merge
```

---

## 🛠️ Commands Reference

### Swarm Execution
```bash
# Install Swarm CLI
gem install swarm_cli

# Run Unit Testing Swarm
swarm run test-unit-swarm.yml

# Run E2E Testing Swarm  
swarm run test-e2e-swarm.yml

# Run Performance Testing Swarm
swarm run test-performance-swarm.yml

# Interactive mode (REPL)
swarm run test-unit-swarm.yml --interactive
```

### Manual Testing (Fallback)
```bash
# Unit tests
pnpm --filter api test
pnpm --filter api test:coverage

# Integration tests
pnpm --filter api test:e2e

# E2E tests
pnpm --filter web playwright test
pnpm --filter web playwright test --ui  # Interactive mode

# Performance tests
cd scripts/tests/vegeta && run-stress-test.bat
k6 run tests/load/api-stress.js

# Database benchmarks
pnpm ts-node scripts/tests/database-benchmark.ts
```

### Coverage Reporting
```bash
# Generate coverage report
pnpm --filter api test:coverage

# Open HTML report
start apps/api/coverage/lcov-report/index.html  # Windows
open apps/api/coverage/lcov-report/index.html   # Mac/Linux

# Upload to Codecov (CI/CD)
bash <(curl -s https://codecov.io/bash)
```

---

## 🔍 Testing Best Practices (For Agents)

### 1. Unit Test Pattern (AAA)
```typescript
describe('CoursesService', () => {
  let service: CoursesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    // ARRANGE
    const module = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
  });

  it('should create course with localized content', async () => {
    // ARRANGE
    const createDto = {
      title: { vi: 'Tài chính cơ bản', en: 'Finance 101', zh: '基础金融' },
      level: 'BEGINNER',
    };

    // ACT
    const result = await service.create(createDto);

    // ASSERT
    expect(result.slug).toBe('finance-101');
    expect(result.title).toEqual(createDto.title);
  });
});
```

### 2. Integration Test Pattern
```typescript
describe('Auth API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Create test app
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('POST /auth/login should return JWT token', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(200)
      .expect((res) => {
        expect(res.body.accessToken).toBeDefined();
        expect(res.body.refreshToken).toBeDefined();
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

### 3. E2E Test Pattern (Playwright)
```typescript
import { test, expect } from '@playwright/test';

test.describe('Course Enrollment Flow', () => {
  test('should enroll in course and track progress', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/vi/login');
    await page.fill('[name="email"]', 'student@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('[type="submit"]');

    // Browse courses
    await page.goto('http://localhost:3000/vi/courses');
    await expect(page.locator('[data-testid="course-card"]')).toHaveCount(3);

    // Enroll in first course
    await page.click('[data-testid="course-card"]:first-child');
    await page.click('[data-testid="enroll-btn"]');

    // Verify enrollment
    await expect(page.locator('[data-testid="enrolled-badge"]')).toBeVisible();
  });
});
```

### 4. Performance Test Pattern (k6)
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp-up
    { duration: '1m', target: 100 },  // Sustain
    { duration: '30s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% < 500ms
    http_req_failed: ['rate<0.01'],   // Error < 1%
  },
};

export default function () {
  // Login
  const loginRes = http.post('http://localhost:3001/api/auth/login', {
    email: 'test@example.com',
    password: 'password123',
  });

  check(loginRes, {
    'login successful': (r) => r.status === 200,
  });

  const token = loginRes.json('accessToken');

  // Get courses
  const coursesRes = http.get('http://localhost:3001/api/courses', {
    headers: { Authorization: `Bearer ${token}` },
  });

  check(coursesRes, {
    'courses loaded': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < 300,
  });

  sleep(1);
}
```

---

## 📚 Documentation Deliverables

### 1. Testing Runbook
Create: `docs/TESTING_RUNBOOK.md`
```markdown
# Testing Runbook

## Quick Start
1. Start test database: `docker-compose -f docker-compose.test.yml up -d`
2. Run unit tests: `pnpm --filter api test`
3. Run E2E tests: `pnpm --filter web playwright test`

## Troubleshooting
- Database connection error → Check Docker container
- Test timeout → Increase timeout in jest.config.js
- Flaky E2E tests → Add explicit waits in Playwright
```

### 2. Coverage Report
Update: `TEST_COVERAGE_PLAN.md`
```markdown
## Final Results (After Swarm Execution)

| Module | Coverage | Status |
|--------|----------|--------|
| Auth | 92% | ✅ PASS |
| Users | 87% | ✅ PASS |
| Courses | 83% | ✅ PASS |
| ... | ... | ... |
| **Overall** | **82%** | ✅ PASS |
```

### 3. CI/CD Integration
Update: `.github/workflows/test.yml`
```yaml
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

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pnpm install
      - run: pnpm --filter web playwright test
```

---

## ✅ Final Checklist

### Pre-Execution
- [ ] Install Swarm CLI: `gem install swarm_cli`
- [ ] Configure test database: `docker-compose -f docker-compose.test.yml up -d`
- [ ] Create Swarm YAML files: test-unit-swarm.yml, test-e2e-swarm.yml, test-performance-swarm.yml
- [ ] Review TEST_COVERAGE_PLAN.md and AGENTS.md

### Execution
- [ ] Day 1: Run `swarm run test-unit-swarm.yml`
- [ ] Day 2: Run `swarm run test-e2e-swarm.yml`
- [ ] Day 2: Run `swarm run test-performance-swarm.yml`
- [ ] Day 3: Review results and fix failures

### Post-Execution
- [ ] Overall coverage ≥ 80%
- [ ] All quality gates pass
- [ ] CI/CD pipeline configured
- [ ] Coverage badges added to README
- [ ] Testing runbook created
- [ ] Update Beads issues: `bd close ved-hmi --reason "Test coverage complete: 30% → 82%"`
- [ ] Create PR: `feature/swarm-testing` → `main`

---

## 🎯 Success Definition

**Test coverage achieved:** ≥80% (target met)  
**Timeline:** 2.5 days (vs 3 weeks manual)  
**Cost:** ~$12 AI + $262 human review = **$274 total**  
**Quality:** All critical flows tested, performance benchmarks met  
**Automation:** Fully integrated in CI/CD pipeline  

---

**Prepared by:** V-EdFinance Development Team  
**Date:** 2025-12-23  
**Framework:** Swarm SDK (Ruby gem)  
**Estimated Cost:** $12 USD (AI) + 2.5 days review  
**Expected Outcome:** 30% → 80%+ test coverage with smart automation

🚀 **Ready to execute - No 1000 agents needed!**
