# 🚀 AI Testing Army - Beads Deployment Plan

**Date:** 2025-12-23  
**Status:** ✅ Downloaded 4 tools, creating beads tasks now

---

## ✅ Đã Hoàn Thành

1. ✅ **Downloaded all 4 AI testing tools:**
   - TestPilot (temp_skills/testpilot)
   - QA-use (temp_skills/qa-use)
   - e2e-test-agent (temp_skills/e2e-test-agent)
   - Arbigent (temp_skills/arbigent)

2. ✅ **Created comprehensive plan:**
   - [AI_TESTING_ARMY_INTEGRATION_PLAN.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/AI_TESTING_ARMY_INTEGRATION_PLAN.md)

---

## 📋 Beads Tasks to Create

### Epic: AI Testing Army Deployment

```bash
# Create Epic
bd create "Deploy AI Testing Army for 100% Coverage" \
  --type epic \
  --priority 1 \
  --description "Integrate 4 AI testing agents: TestPilot (unit), QA-use (E2E platform), e2e-test-agent (natural language), Arbigent (scenarios)"

# Phase 0: Setup (Day 1 - 8 hours)
bd create "VED-ARMY-00: Get BrowserUse API key" \
  --type task \
  --priority 1 \
  --description "Sign up at https://cloud.browser-use.com/billing and get API key (~$20-50/month)"

bd create "VED-ARMY-01: Get OpenAI API key for testing" \
  --type task \
  --priority 1 \
  --description "Get OpenAI API key from https://platform.openai.com/api-keys for GPT-4o (~$30/month)"

bd create "VED-ARMY-02: Create .env.testing file with all API keys" \
  --type task \
  --priority 1 \
  --description "Create .env.testing with BROWSER_USE_API_KEY, OPENAI_API_KEY, MODEL_NAME=gpt-4o"

# Phase 0: Install Tools
bd create "VED-ARMY-03: Install TestPilot (unit test generator)" \
  --type task \
  --priority 1 \
  --description "cd temp_skills/testpilot && npm install && npm run build"

bd create "VED-ARMY-04: Install QA-use Docker platform" \
  --type task \
  --priority 1 \
  --description "cd temp_skills/qa-use && docker compose up -d"

bd create "VED-ARMY-05: Install e2e-test-agent in monorepo" \
  --type task \
  --priority 1 \
  --description "pnpm add e2e-test-agent --filter web"

bd create "VED-ARMY-06: Build Arbigent CLI from source" \
  --type task \
  --priority 2 \
  --description "cd temp_skills/arbigent && ./gradlew installDist"

# Phase 1: TestPilot Unit Tests (Week 1)
bd create "VED-ARMY-10: Generate unit tests for UserService" \
  --type task \
  --priority 1 \
  --description "Use TestPilot to generate tests for apps/api/src/modules/users/users.service.ts"

bd create "VED-ARMY-11: Generate unit tests for BudgetService" \
  --type task \
  --priority 1 \
  --description "Use TestPilot to generate tests for apps/api/src/modules/budgets/budgets.service.ts"

bd create "VED-ARMY-12: Generate unit tests for CoursesService" \
  --type task \
  --priority 1 \
  --description "Use TestPilot to generate tests for apps/api/src/modules/courses/courses.service.ts"

bd create "VED-ARMY-13: Generate unit tests for utility functions" \
  --type task \
  --priority 1 \
  --description "Use TestPilot to generate tests for apps/api/src/common/utils/"

bd create "VED-ARMY-14: Refine generated tests to 90% pass rate" \
  --type task \
  --priority 1 \
  --description "Review and fix generated tests, ensure 90%+ pass rate"

# Phase 2: QA-use E2E Platform (Week 1)
bd create "VED-ARMY-20: Deploy QA-use platform and verify UI" \
  --type task \
  --priority 1 \
  --description "Access http://localhost:3100 and verify QA-use UI loads"

bd create "VED-ARMY-21: Create Smoke Tests suite (5 tests)" \
  --type task \
  --priority 1 \
  --description "Create 5 smoke tests: homepage, login form, signup form, DB health, API health"

bd create "VED-ARMY-22: Create Regression Tests suite (10 tests)" \
  --type task \
  --priority 1 \
  --description "Create 10 regression tests for core flows (registration, login, courses, budgets, social)"

bd create "VED-ARMY-23: Create Critical Flows suite (5 tests)" \
  --type task \
  --priority 1 \
  --description "Create 5 critical flow tests for end-to-end user journeys"

bd create "VED-ARMY-24: Set up email notifications via Resend" \
  --type task \
  --priority 2 \
  --description "Configure Resend API for failure alerts"

bd create "VED-ARMY-25: Configure hourly automated test runs" \
  --type task \
  --priority 2 \
  --description "Set up scheduling for regression tests to run hourly"

# Phase 3: e2e-test-agent Natural Language (Week 2)
bd create "VED-ARMY-30: Write 3 authentication test cases" \
  --type task \
  --priority 1 \
  --description "Create tests/e2e/auth/ with signup, login, logout tests"

bd create "VED-ARMY-31: Write 5 course flow test cases" \
  --type task \
  --priority 1 \
  --description "Create tests/e2e/courses/ with browse, enroll, complete, quiz, certificate tests"

bd create "VED-ARMY-32: Write 4 budget management test cases" \
  --type task \
  --priority 1 \
  --description "Create tests/e2e/budgets/ with create, edit, track, analytics tests"

bd create "VED-ARMY-33: Write 3 social feature test cases" \
  --type task \
  --priority 1 \
  --description "Create tests/e2e/social/ with post, like/comment, share tests"

bd create "VED-ARMY-34: Create run-e2e-tests.ts runner script" \
  --type task \
  --priority 1 \
  --description "Create TypeScript runner for e2e-test-agent"

bd create "VED-ARMY-35: Integrate e2e-test-agent with CI/CD" \
  --type task \
  --priority 1 \
  --description "Add to GitHub Actions workflow"

# Phase 4: Arbigent Scenarios (Week 3)
bd create "VED-ARMY-40: Create arbigent-project.yml with scenarios" \
  --type task \
  --priority 2 \
  --description "Create YAML file with 10 scenarios and dependencies"

bd create "VED-ARMY-41: Test login scenario (base scenario)" \
  --type task \
  --priority 2 \
  --description "Create and test login scenario"

bd create "VED-ARMY-42: Test create-budget scenario (depends on login)" \
  --type task \
  --priority 2 \
  --description "Create budget scenario with dependency"

bd create "VED-ARMY-43: Test enroll-course scenario" \
  --type task \
  --priority 2 \
  --description "Course enrollment scenario"

bd create "VED-ARMY-44: Test complete-course scenario (depends on enroll)" \
  --type task \
  --priority 2 \
  --description "Course completion scenario chain"

bd create "VED-ARMY-45: Set up GitHub Actions sharding (4 parallel)" \
  --type task \
  --priority 2 \
  --description "Configure matrix sharding in .github/workflows/arbigent-e2e.yml"

# Integration & Monitoring
bd create "VED-ARMY-50: Create unified CI/CD workflow for all 4 tools" \
  --type task \
  --priority 1 \
  --description "Create .github/workflows/ai-testing-army.yml"

bd create "VED-ARMY-51: Integrate with Grafana monitoring" \
  --type task \
  --priority 2 \
  --description "Add test metrics to Grafana dashboards"

bd create "VED-ARMY-52: Document workflows in AGENTS.md" \
  --type task \
  --priority 2 \
  --description "Add AI Testing Army section to AGENTS.md"

bd create "VED-ARMY-53: Create team training guide" \
  --type task \
  --priority 2 \
  --description "Document how to write natural language tests for QA/devs"

# Quality Gates
bd create "VED-ARMY-60: Verify 90% unit test coverage achieved" \
  --type task \
  --priority 1 \
  --description "Run coverage report and verify 90%+ coverage"

bd create "VED-ARMY-61: Verify 85% E2E test coverage achieved" \
  --type task \
  --priority 1 \
  --description "Verify all critical flows have E2E tests"

bd create "VED-ARMY-62: Verify <3min test execution time" \
  --type task \
  --priority 2 \
  --description "Optimize test execution with parallelization"

bd create "VED-ARMY-63: Verify 98% CI/CD pass rate" \
  --type task \
  --priority 1 \
  --description "Monitor and fix flaky tests"
```

---

## 🎯 Priority Execution Order

### **TODAY (8 hours):**

**Morning (4h):**
1. ✅ Get API keys (VED-ARMY-00, VED-ARMY-01)
2. ✅ Create .env.testing (VED-ARMY-02)
3. ✅ Install TestPilot (VED-ARMY-03)
4. ✅ Install QA-use (VED-ARMY-04)

**Afternoon (4h):**
5. ✅ Install e2e-test-agent (VED-ARMY-05)
6. ✅ Deploy QA-use UI (VED-ARMY-20)
7. ✅ Generate first unit test (VED-ARMY-10)
8. ✅ Create first natural language test (VED-ARMY-30)

---

## 🚀 Quick Start Commands

### Step 1: Create All Beads Tasks
```bash
# Run this script to create all tasks
./scripts/create-ai-testing-army-tasks.sh
```

### Step 2: Start with Phase 0
```bash
# Check ready tasks
bd ready

# Start first task
bd update VED-ARMY-00 --status in_progress

# Get BrowserUse API key
# Open: https://cloud.browser-use.com/billing
# Copy API key

# Update .env.testing
echo "BROWSER_USE_API_KEY=your_key_here" >> .env.testing

# Close task
bd close VED-ARMY-00 --reason "Got BrowserUse API key and added to .env.testing"
```

### Step 3: Install Tools
```bash
# TestPilot
bd update VED-ARMY-03 --status in_progress
cd temp_skills/testpilot
npm install && npm run build
bd close VED-ARMY-03 --reason "TestPilot installed successfully"

# QA-use
bd update VED-ARMY-04 --status in_progress
cd temp_skills/qa-use
docker compose up -d
# Access http://localhost:3100
bd close VED-ARMY-04 --reason "QA-use platform running on port 3100"

# e2e-test-agent
bd update VED-ARMY-05 --status in_progress
pnpm add e2e-test-agent --filter web
bd close VED-ARMY-05 --reason "e2e-test-agent added to monorepo"
```

---

## 📊 Success Metrics Dashboard

| Phase | Tasks | Est. Time | Priority | Status |
|-------|-------|-----------|----------|--------|
| Phase 0: Setup | 7 tasks | 8h | P1 | 🔴 Not Started |
| Phase 1: TestPilot | 5 tasks | 16h | P1 | 🔴 Not Started |
| Phase 2: QA-use | 6 tasks | 20h | P1 | 🔴 Not Started |
| Phase 3: e2e-agent | 6 tasks | 16h | P1 | 🔴 Not Started |
| Phase 4: Arbigent | 6 tasks | 20h | P2 | 🔴 Not Started |
| Integration | 4 tasks | 12h | P1-P2 | 🔴 Not Started |
| Quality Gates | 4 tasks | 8h | P1 | 🔴 Not Started |
| **TOTAL** | **38 tasks** | **100h** | | **0% Complete** |

---

## 🎯 Next Action

**Immediate:** Create beads tasks with this command:

```bash
# Copy/paste all bd create commands above to create tasks
# Or run:
cat > scripts/create-ai-testing-army-tasks.sh << 'EOF'
#!/bin/bash
# Paste all bd create commands here
EOF

chmod +x scripts/create-ai-testing-army-tasks.sh
./scripts/create-ai-testing-army-tasks.sh
```

**Then start with:**
```bash
bd ready
bd update VED-ARMY-00 --status in_progress
```
