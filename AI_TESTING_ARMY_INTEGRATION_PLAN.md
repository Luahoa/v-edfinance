# 🤖 AI Testing Army - 4 Agent Integration Plan

**Date:** 2025-12-23  
**Epic:** Deploy 4 AI Testing Agents for 100% Coverage  
**Mission:** Unit Tests + E2E Tests + Coverage + CI/CD Automation  
**Status:** 🚀 Ready to Deploy

---

## 🎯 The Four Agents

### 1. **TestPilot** - Unit Test Generator (GitHub Next)
**Role:** 🧪 Auto-generate unit tests for JavaScript/TypeScript functions  
**Tech:** TypeScript, LLM-powered, Mocha  
**Status:** ⚠️ Archived (use TestPilot2: https://github.com/neu-se/testpilot2)

**Capabilities:**
- Generates unit tests from function signatures
- Uses LLM (OpenAI Codex/GPT-4) for test logic
- Mines examples from documentation
- Self-refines failing tests
- No training/examples needed

**Use Case for V-EdFinance:**
- Generate tests for utility functions (formatters, validators)
- Generate tests for services (UserService, BudgetService)
- Generate tests for helpers (date utils, currency utils)

**Installation:**
```bash
cd temp_skills/testpilot
npm install
npm run build

# Set environment variables
export TESTPILOT_LLM_API_ENDPOINT='https://api.openai.com/v1/engines/gpt-4/completions'
export TESTPILOT_LLM_AUTH_HEADERS='{"Authorization": "Bearer YOUR_API_KEY"}'

# Generate tests for a package
node benchmark/run.js --outputDir ./reports --package c:/Users/luaho/Demo\ project/v-edfinance/apps/api
```

**Pros:**
- Automated unit test generation
- Works with existing TypeScript code
- Uses Mocha (already in our stack)

**Cons:**
- Archived project (recommend TestPilot2)
- Requires OpenAI API access
- May need refinement

**Integration Complexity:** 🟡 MEDIUM (Archived, use TestPilot2)

---

### 2. **QA-use (Browser-use)** - E2E Test Platform
**Role:** 🎭 Production-ready E2E testing platform with UI  
**Tech:** Next.js 15, TypeScript, Drizzle ORM, PostgreSQL, Docker  
**Status:** ✅ Production-Ready

**Capabilities:**
- Natural language test cases
- AI-powered browser automation (BrowserUse API)
- Test suite management UI
- Scheduled testing (hourly/daily/weekly)
- Email notifications (Resend API)
- PostgreSQL test history
- Docker deployment

**Use Case for V-EdFinance:**
- E2E tests for user flows (signup, login, course enrollment)
- Regression testing (scheduled hourly)
- Smoke tests (run before deployment)
- Cross-browser testing
- Visual regression testing

**Installation:**
```bash
cd temp_skills/qa-use
cp .env.example .env

# Edit .env:
# BROWSER_USE_API_KEY=your_key_here (get from https://cloud.browser-use.com/billing)
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/qa_use
# RESEND_API_KEY=your_resend_key (optional)

# Start with Docker
docker compose up -d

# Access UI: http://localhost:3000
```

**Pros:**
- Same tech stack (Next.js, Drizzle, PostgreSQL)
- Production-ready UI
- Automated scheduling
- Email alerts
- Natural language tests

**Cons:**
- Requires BrowserUse API subscription (~$20-50/month)
- Additional database needed

**Integration Complexity:** 🟢 LOW (Same stack!)

---

### 3. **e2e-test-agent** - Natural Language E2E Framework
**Role:** 🗣️ LLM-powered natural language E2E tests  
**Tech:** TypeScript, LangChain, Playwright MCP, OpenAI  
**Status:** ✅ NPM Package Ready

**Capabilities:**
- Write tests in plain English (.test files)
- LLM interprets test steps (GPT-4o, Claude, Gemini)
- Playwright MCP server integration
- Self-healing tests (adapts to UI changes)
- Programmatic API for CI/CD

**Use Case for V-EdFinance:**
- Quick E2E tests for critical flows
- Lightweight testing (no UI overhead)
- CI/CD integration
- Regression tests
- User journey testing

**Installation:**
```bash
# Add to monorepo
pnpm add e2e-test-agent --filter web

# Create .env
echo 'MODEL_NAME="gpt-4o"' >> .env
echo 'API_KEY="your_openai_key"' >> .env
echo 'BASE_URL="https://api.openai.com/v1"' >> .env
echo 'TESTS_DIR="./tests/e2e"' >> .env

# Create test file: tests/e2e/1.test
# Content: "open localhost:3002, click signup, verify form visible"

# Run tests
npx tsx run-e2e-tests.ts
```

**Pros:**
- TypeScript (same language)
- Playwright integration (already in stack)
- Natural language (easy to write)
- Self-healing
- OpenAI/Claude/Gemini support

**Cons:**
- Requires LLM API (~$15-30/month)
- May need prompt tuning

**Integration Complexity:** 🟢 LOW (Perfect fit!)

---

### 4. **Arbigent** - Cross-Platform AI Testing Framework
**Role:** 🌐 Scenario-based testing with AI agents  
**Tech:** Kotlin, Gradle, Multi-platform (Android/iOS/Web/TV)  
**Status:** ✅ Open Source + CLI

**Capabilities:**
- Scenario decomposition (complex tasks → small scenarios)
- Dependency chains (login → search → checkout)
- UI + Code interface
- MCP (Model Context Protocol) support
- Maestro YAML integration
- Test sharding (parallel execution)
- Cross-platform (Android/iOS/Web/TV)

**Use Case for V-EdFinance:**
- Complex user journeys (multi-step flows)
- Future mobile app testing (Android/iOS)
- Scenario-based testing (login → create budget → share)
- Parallel test execution (GitHub Actions sharding)

**Installation:**
```bash
# Option 1: Homebrew (macOS/Linux)
brew tap takahirom/homebrew-repo
brew install takahirom/repo/arbigent

# Option 2: Build from source (Windows)
cd temp_skills/arbigent
./gradlew installDist
./arbigent-cli/build/install/arbigent/bin/arbigent --help

# Create project YAML (UI or manual)
# Run tests
arbigent run --project-file tests/arbigent-project.yml --ai-type openai --openai-api-key YOUR_KEY
```

**Pros:**
- Scenario decomposition (scalable)
- Cross-platform (future-proof)
- Test sharding (fast parallel tests)
- Open source (free)
- MCP support (extensible)

**Cons:**
- Kotlin/Gradle (different stack)
- Learning curve for YAML format
- Requires Gradle setup

**Integration Complexity:** 🟡 MEDIUM (Different stack, powerful)

---

## 🏗️ Architecture - The Testing Army

```
┌─────────────────────────────────────────────────────────────────┐
│                    V-EDFINANCE APPLICATION                       │
│                   (Next.js + NestJS + PostgreSQL)                │
└────────────┬─────────────────────────────────────┬──────────────┘
             │                                     │
             │                                     │
    ┌────────▼─────────┐                  ┌───────▼──────────┐
    │  UNIT TESTS      │                  │   E2E TESTS      │
    │                  │                  │                  │
    │  🤖 TestPilot    │                  │  🎭 QA-use       │
    │  Generate tests  │                  │  Platform UI     │
    │  for services    │                  │  Scheduling      │
    │  & utilities     │                  │  Monitoring      │
    │                  │                  │                  │
    │  Coverage: 90%+  │                  │  🗣️ e2e-agent    │
    │                  │                  │  Natural lang    │
    │                  │                  │  CI/CD friendly  │
    │                  │                  │                  │
    │                  │                  │  🌐 Arbigent     │
    │                  │                  │  Scenarios       │
    │                  │                  │  Sharding        │
    └──────────────────┘                  └──────────────────┘
             │                                     │
             │                                     │
             └─────────────┬───────────────────────┘
                           │
                  ┌────────▼─────────┐
                  │   CI/CD PIPELINE │
                  │   GitHub Actions │
                  │   Quality Gates  │
                  └──────────────────┘
```

---

## 📋 Comprehensive Integration Plan

### **Phase 0: Setup (Day 1) - 4 hours**

#### Task 1: API Keys & Infrastructure
```bash
# Get API keys
# 1. BrowserUse API: https://cloud.browser-use.com/billing
# 2. OpenAI API: https://platform.openai.com/api-keys
# 3. Resend API: https://resend.com/api-keys (optional)

# Store in .env
cp .env.example .env.testing
```

#### Task 2: Install All 4 Tools
```bash
# 1. TestPilot (or TestPilot2)
cd temp_skills/testpilot
npm install && npm run build

# 2. QA-use
cd temp_skills/qa-use
docker compose up -d

# 3. e2e-test-agent
pnpm add e2e-test-agent --filter web

# 4. Arbigent
cd temp_skills/arbigent
./gradlew installDist
```

**Beads Tasks:**
```bash
bd create "VED-TP0: Setup API keys for all 4 AI testing tools" --type task --priority 1
bd create "VED-TP1: Install TestPilot and generate first 5 unit tests" --type task --priority 1
bd create "VED-TP2: Deploy QA-use Docker container" --type task --priority 1
bd create "VED-TP3: Install e2e-test-agent and write 3 test cases" --type task --priority 1
bd create "VED-TP4: Build Arbigent CLI and create first scenario" --type task --priority 2
```

---

### **Phase 1: Unit Test Generation (Week 1) - TestPilot**

#### Goal: 70% unit test coverage for backend services

**Tasks:**
1. Generate tests for `apps/api/src/modules/users/users.service.ts`
2. Generate tests for `apps/api/src/modules/budgets/budgets.service.ts`
3. Generate tests for `apps/api/src/modules/courses/courses.service.ts`
4. Generate tests for utility functions (`apps/api/src/common/utils/`)
5. Review & refine generated tests
6. Integrate with CI/CD

**Command:**
```bash
cd temp_skills/testpilot

# Generate tests for a service
node benchmark/run.js \
  --outputDir ./reports/users-service \
  --package ../../apps/api \
  --api api.json \
  --responses prompts.json

# Copy generated tests to project
cp reports/users-service/*.test.ts ../../apps/api/src/modules/users/__tests__/
```

**Success Metrics:**
- 50+ unit tests generated
- 70% coverage for services
- 90% passing tests (after refinement)

**Beads Tasks:**
```bash
bd create "VED-TP1A: Generate unit tests for UserService" --type task --priority 1
bd create "VED-TP1B: Generate unit tests for BudgetService" --type task --priority 1
bd create "VED-TP1C: Refine generated tests to 90% pass rate" --type task --priority 1
```

---

### **Phase 2: E2E Platform Deployment (Week 1) - QA-use**

#### Goal: Production E2E testing platform with 20 automated tests

**Tasks:**
1. Deploy QA-use via Docker
2. Configure database connection
3. Create test suites:
   - **Smoke Tests** (5 tests, run before every deploy)
   - **Regression Tests** (10 tests, run hourly)
   - **Critical Flows** (5 tests, run on every commit)
4. Set up email notifications (Resend)
5. Integrate with monitoring (Grafana)

**Test Suites to Create:**

**Smoke Tests (5):**
1. Homepage loads successfully
2. Login form is accessible
3. Signup form is accessible
4. Database connection is healthy
5. API health endpoint responds

**Regression Tests (10):**
1. User registration flow (full journey)
2. Login/logout flow
3. Course enrollment flow
4. Budget creation flow
5. Social post creation
6. User profile update
7. Password reset flow
8. Payment flow (mock)
9. Course completion flow
10. Certificate generation

**Critical Flows (5):**
1. End-to-end user journey (signup → enroll → complete)
2. Admin dashboard access
3. Data export functionality
4. Multi-language switching
5. Mobile responsive layout

**Configuration:**
```yaml
# docker-compose.qa-use.yml
services:
  qa-use:
    image: qa-use:latest
    ports:
      - "3100:3000"  # Don't conflict with main app
    environment:
      BROWSER_USE_API_KEY: ${BROWSER_USE_API_KEY}
      DATABASE_URL: postgresql://postgres:postgres@postgres-qa:5432/qa_use
      RESEND_API_KEY: ${RESEND_API_KEY}
      INNGEST_SIGNING_KEY: ${INNGEST_SIGNING_KEY}
```

**Success Metrics:**
- 20 E2E tests automated
- 95% pass rate
- Hourly automated runs
- Email alerts on failures

**Beads Tasks:**
```bash
bd create "VED-TP2A: Deploy QA-use Docker container" --type task --priority 1
bd create "VED-TP2B: Create 5 smoke tests" --type task --priority 1
bd create "VED-TP2C: Create 10 regression tests" --type task --priority 1
bd create "VED-TP2D: Set up email notifications" --type task --priority 2
```

---

### **Phase 3: Natural Language E2E (Week 2) - e2e-test-agent**

#### Goal: 15 natural language E2E tests for CI/CD

**Tasks:**
1. Install `e2e-test-agent` in monorepo
2. Create test directory structure
3. Write 15 natural language tests
4. Integrate with Playwright config
5. Add to CI/CD pipeline
6. Create test reporting

**Test Cases (15):**

**Authentication (3):**
```plaintext
# tests/e2e/auth/1-signup.test
open http://localhost:3002
click on "Sign Up" button
fill email field with "test@example.com"
fill password field with "SecurePass123!"
click "Create Account"
verify "Welcome" message appears

# tests/e2e/auth/2-login.test
open http://localhost:3002/login
enter email "test@example.com"
enter password "SecurePass123!"
click "Login"
verify dashboard is visible

# tests/e2e/auth/3-logout.test
login with existing user
click user menu
click "Logout"
verify redirected to homepage
```

**Course Flows (5):**
```plaintext
# tests/e2e/courses/1-browse.test
open courses page
scroll to see all courses
verify at least 5 courses are displayed

# tests/e2e/courses/2-enroll.test
login as student
find "Financial Literacy 101" course
click "Enroll Now"
verify enrollment success message
check if course appears in "My Courses"

# tests/e2e/courses/3-complete-lesson.test
open enrolled course
click first lesson
watch video for 5 seconds
click "Mark as Complete"
verify progress bar updates

# tests/e2e/courses/4-take-quiz.test
complete all lessons
click "Take Quiz"
answer all questions
submit quiz
verify score is displayed

# tests/e2e/courses/5-certificate.test
complete course with 80%+ score
verify certificate is generated
download certificate
check file exists
```

**Budget Management (4):**
```plaintext
# tests/e2e/budgets/1-create.test
login as user
navigate to "My Budget"
click "Create Budget"
set monthly income to "$5000"
add expense category "Rent" with "$1500"
add expense category "Food" with "$500"
save budget
verify budget summary shows correctly

# tests/e2e/budgets/2-edit.test
open existing budget
change "Food" expense to "$600"
save changes
verify updated amount appears

# tests/e2e/budgets/3-track-spending.test
open budget
add transaction "Grocery" under "Food" for "$50"
verify remaining budget for "Food" updates

# tests/e2e/budgets/4-analytics.test
navigate to budget analytics
verify pie chart displays categories
verify spending trend graph shows data
```

**Social Features (3):**
```plaintext
# tests/e2e/social/1-create-post.test
login as user
go to social feed
click "Create Post"
write "Just completed my first course!"
attach screenshot
post publicly
verify post appears in feed

# tests/e2e/social/2-like-comment.test
view social feed
like first post
add comment "Great job!"
verify like count increases
verify comment appears

# tests/e2e/social/3-share-achievement.test
complete course
click "Share Achievement"
select "Facebook"
verify share dialog opens
```

**CI/CD Integration:**
```typescript
// run-e2e-tests.ts
import { TestAgent } from 'e2e-test-agent';
import 'dotenv/config';

async function main() {
  const testAgent = new TestAgent({
    modelName: process.env.MODEL_NAME || 'gpt-4o',
    apiKey: process.env.API_KEY!,
    baseURL: process.env.BASE_URL,
    testsDir: './tests/e2e',
    maxSteps: 30,
  });

  const results = await testAgent.runAllTests();
  testAgent.printSummary(results);

  // Exit with error if any tests failed
  const failedTests = results.filter(r => !r.success);
  if (failedTests.length > 0) {
    process.exit(1);
  }
}

main().catch(console.error);
```

**Success Metrics:**
- 15 natural language tests
- 90% pass rate
- <5min execution time
- CI/CD integrated

**Beads Tasks:**
```bash
bd create "VED-TP3A: Install e2e-test-agent in monorepo" --type task --priority 1
bd create "VED-TP3B: Write 15 natural language test cases" --type task --priority 1
bd create "VED-TP3C: Integrate with CI/CD pipeline" --type task --priority 1
```

---

### **Phase 4: Scenario-Based Testing (Week 3) - Arbigent**

#### Goal: Complex multi-step scenarios with parallel execution

**Tasks:**
1. Build Arbigent CLI (Gradle)
2. Create scenario YAML files
3. Define scenario dependencies
4. Set up test sharding for parallel execution
5. Integrate with GitHub Actions

**Scenario Structure:**

```yaml
# tests/arbigent-project.yml
scenarios:
  # Base scenario: Login
  - id: "login"
    goal: "Login to V-EdFinance with test credentials"
    initializationMethods:
      - type: "OpenLink"
        url: "http://localhost:3002/login"
      - type: "Wait"
        duration: 2000
    
  # Scenario 2: Create Budget (depends on login)
  - id: "create-budget"
    goal: "Create a monthly budget with income and expenses"
    dependency: "login"
    imageAssertions:
      - assertionPrompt: "Budget creation form is visible"
      - assertionPrompt: "Budget summary shows income and expenses"
  
  # Scenario 3: Enroll in Course (depends on login)
  - id: "enroll-course"
    goal: "Enroll in 'Financial Literacy 101' course"
    dependency: "login"
    imageAssertions:
      - assertionPrompt: "Course appears in 'My Courses' section"
  
  # Scenario 4: Complete Course (depends on enroll-course)
  - id: "complete-course"
    goal: "Complete all lessons and take final quiz"
    dependency: "enroll-course"
    imageAssertions:
      - assertionPrompt: "Certificate is displayed"
  
  # Scenario 5: Share Achievement (depends on complete-course)
  - id: "share-achievement"
    goal: "Share course completion on social feed"
    dependency: "complete-course"
    imageAssertions:
      - assertionPrompt: "Achievement post is visible in social feed"
```

**GitHub Actions Sharding:**
```yaml
# .github/workflows/arbigent-e2e.yml
name: Arbigent E2E Tests

on: [push, pull_request]

jobs:
  arbigent-tests:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        shardIndex: [1, 2, 3, 4]
        shardTotal: [4]
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Arbigent
        run: |
          brew tap takahirom/homebrew-repo
          brew install takahirom/repo/arbigent
      
      - name: Run E2E Tests
        run: |
          arbigent run \
            --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }} \
            --project-file=tests/arbigent-project.yml \
            --ai-type=openai \
            --openai-api-key=${{ secrets.OPENAI_API_KEY }} \
            --os=web
      
      - name: Upload Results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: arbigent-report-${{ matrix.shardIndex }}
          path: arbigent-result/*
```

**Success Metrics:**
- 10+ complex scenarios
- Dependency chains working
- Test sharding (4 parallel runs)
- <3min execution time (with sharding)

**Beads Tasks:**
```bash
bd create "VED-TP4A: Build Arbigent CLI from source" --type task --priority 2
bd create "VED-TP4B: Create 10 scenario YAML files" --type task --priority 2
bd create "VED-TP4C: Set up GitHub Actions sharding" --type task --priority 2
```

---

## 📊 Coverage & Quality Metrics

### **Pre-Integration Baseline (Current)**
| Metric | Current | Target |
|--------|---------|--------|
| Unit Test Coverage | ~40% | 90% |
| E2E Test Coverage | ~30% | 85% |
| Test Execution Time | ~10min | <3min |
| Test Maintenance Effort | High (brittle selectors) | Low (self-healing) |
| CI/CD Pass Rate | ~85% | 98% |
| Manual Testing Effort | ~8 hours/week | <1 hour/week |

### **Post-Integration Targets (After 4 Weeks)**
| Metric | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Final |
|--------|---------|---------|---------|---------|-------|
| Unit Tests | +30% | +40% | +50% | +50% | **90%** |
| E2E Tests | +20% | +50% | +70% | +85% | **85%** |
| Test Speed | 10min | 8min | 5min | 3min | **<3min** |
| Pass Rate | 85% | 90% | 95% | 98% | **98%** |
| Manual Effort | 8h/wk | 6h/wk | 3h/wk | 1h/wk | **<1h/wk** |

---

## 💰 Cost Analysis (Monthly)

| Tool | API/Service | Monthly Cost | ROI |
|------|-------------|--------------|-----|
| **TestPilot** | OpenAI API (unit test gen) | $10-20 | 1-time cost (generate tests once) |
| **QA-use** | BrowserUse API | $20-50 | Replaces manual E2E testing (save $500/month) |
| **e2e-test-agent** | OpenAI API (GPT-4o) | $15-30 | CI/CD automation (save $300/month) |
| **Arbigent** | OpenAI API (scenario tests) | $10-20 | Parallel execution (save $200/month) |
| **TOTAL** | | **$55-120/month** | **Save $1000/month in manual testing** |

**ROI:** 8-18x return on investment

---

## 🔄 CI/CD Integration

### **GitHub Actions Workflow (All 4 Tools)**

```yaml
# .github/workflows/ai-testing-army.yml
name: AI Testing Army

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  unit-tests-testpilot:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
      - name: Install TestPilot
        run: |
          cd temp_skills/testpilot
          npm install && npm run build
      - name: Generate Unit Tests
        run: |
          node benchmark/run.js \
            --outputDir ./reports \
            --package ./apps/api
        env:
          TESTPILOT_LLM_API_ENDPOINT: ${{ secrets.OPENAI_ENDPOINT }}
          TESTPILOT_LLM_AUTH_HEADERS: ${{ secrets.OPENAI_AUTH_HEADERS }}
      - name: Run Generated Tests
        run: pnpm --filter api test

  e2e-qa-use:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Start QA-use Platform
        run: |
          cd temp_skills/qa-use
          docker compose up -d
        env:
          BROWSER_USE_API_KEY: ${{ secrets.BROWSER_USE_API_KEY }}
      - name: Run Scheduled Tests
        run: |
          curl -X POST http://localhost:3000/api/run-suite?suiteId=smoke-tests

  e2e-natural-language:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install Dependencies
        run: pnpm install
      - name: Run Natural Language Tests
        run: npx tsx run-e2e-tests.ts
        env:
          MODEL_NAME: gpt-4o
          API_KEY: ${{ secrets.OPENAI_API_KEY }}
          TESTS_DIR: ./tests/e2e

  e2e-arbigent-sharded:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shardIndex: [1, 2, 3, 4]
        shardTotal: [4]
    steps:
      - uses: actions/checkout@v3
      - name: Install Arbigent
        run: |
          brew tap takahirom/homebrew-repo
          brew install takahirom/repo/arbigent
      - name: Run Sharded Tests
        run: |
          arbigent run \
            --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }} \
            --project-file=tests/arbigent-project.yml \
            --ai-type=openai \
            --openai-api-key=${{ secrets.OPENAI_API_KEY }}

  quality-gates:
    needs: [unit-tests-testpilot, e2e-qa-use, e2e-natural-language, e2e-arbigent-sharded]
    runs-on: ubuntu-latest
    steps:
      - name: Check All Tests Passed
        run: |
          echo "All AI testing agents passed!"
          echo "✅ Unit tests: TestPilot"
          echo "✅ E2E platform: QA-use"
          echo "✅ Natural language: e2e-test-agent"
          echo "✅ Scenarios: Arbigent"
```

---

## 🚀 Quick Start (Get All 4 Running in 1 Day)

### **Morning Session (4 hours):**

**Hour 1: Setup**
```bash
# Get API keys
# - BrowserUse: https://cloud.browser-use.com/billing
# - OpenAI: https://platform.openai.com/api-keys

# Create .env.testing
cat > .env.testing << EOF
BROWSER_USE_API_KEY=your_key
OPENAI_API_KEY=your_key
RESEND_API_KEY=your_key
MODEL_NAME=gpt-4o
EOF
```

**Hour 2: Install All Tools**
```bash
# 1. TestPilot
cd temp_skills/testpilot && npm install && npm run build

# 2. QA-use
cd temp_skills/qa-use && docker compose up -d

# 3. e2e-test-agent
pnpm add e2e-test-agent --filter web

# 4. Arbigent
cd temp_skills/arbigent && ./gradlew installDist
```

**Hour 3: First Tests**
```bash
# TestPilot: Generate 5 unit tests
cd temp_skills/testpilot
node benchmark/run.js --outputDir ./reports --package ../../apps/api

# e2e-test-agent: Write 1 test
mkdir -p tests/e2e
echo "open localhost:3002, verify homepage loads" > tests/e2e/1.test
npx tsx run-e2e-tests.ts
```

**Hour 4: Deploy QA-use**
```bash
# Access UI: http://localhost:3000
# Create first test suite: "Smoke Tests"
# Add 3 tests:
#   1. Homepage loads
#   2. Login form accessible
#   3. API health check
```

### **Afternoon Session (4 hours):**

**Hour 5-6: Create Beads Tasks**
```bash
bd create "VED-TP1A: Generate unit tests for UserService" --type task --priority 1
bd create "VED-TP2A: Deploy QA-use Docker container" --type task --priority 1
bd create "VED-TP3A: Install e2e-test-agent" --type task --priority 1
bd create "VED-TP4A: Build Arbigent CLI" --type task --priority 2

# Update AGENTS.md
echo "## AI Testing Army" >> AGENTS.md
echo "- TestPilot: Unit test generation" >> AGENTS.md
echo "- QA-use: E2E platform" >> AGENTS.md
echo "- e2e-test-agent: Natural language tests" >> AGENTS.md
echo "- Arbigent: Scenario testing" >> AGENTS.md
```

**Hour 7-8: First Full Test Run**
```bash
# Run all 4 tools
./scripts/run-all-ai-tests.sh

# Expected output:
# ✅ TestPilot: 5 unit tests generated
# ✅ QA-use: 3 smoke tests passed
# ✅ e2e-test-agent: 1 test passed
# ✅ Arbigent: 1 scenario passed
```

---

## 📝 Next Steps

**Immediate (Today):**
1. Get API keys (BrowserUse, OpenAI)
2. Install all 4 tools
3. Run first test with each tool
4. Create Beads tasks for Phase 1

**This Week:**
1. Phase 1: Generate 50 unit tests (TestPilot)
2. Phase 2: Deploy QA-use with 20 E2E tests
3. Phase 3: Write 15 natural language tests (e2e-test-agent)
4. Document workflows in AGENTS.md

**Next Week:**
1. Phase 4: Build Arbigent scenarios
2. Integrate all tools with CI/CD
3. Set up monitoring alerts
4. Train team on natural language testing

---

## 🎓 Team Training

**For QA Engineers:**
- How to write natural language tests (e2e-test-agent)
- How to use QA-use UI (test management)
- How to create Arbigent scenarios (YAML)

**For Developers:**
- How TestPilot generates unit tests
- How to refine generated tests
- CI/CD integration patterns

**For DevOps:**
- Docker deployment (QA-use)
- GitHub Actions sharding (Arbigent)
- Monitoring setup (Grafana)

---

**Status:** ✅ Plan Complete - Ready for Deployment  
**Next:** Get API keys and start Phase 0 setup

**Beads Command to Start:**
```bash
bd create "VED-ARMY: Deploy 4 AI Testing Agents" --type epic --priority 1
bd create "VED-TP0: Setup API keys for all 4 tools" --type task --priority 1 --deps blocks:VED-ARMY
```
