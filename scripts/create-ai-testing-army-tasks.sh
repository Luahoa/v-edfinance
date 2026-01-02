#!/bin/bash
# AI Testing Army - Beads Task Creator
# Run this to create all 38 tasks for AI Testing Army deployment

echo "🚀 Creating AI Testing Army beads tasks..."

# Epic
bd create "Deploy AI Testing Army for 100% Coverage" \
  --type epic \
  --priority 1 \
  --description "Integrate 4 AI testing agents: TestPilot (unit), QA-use (E2E platform), e2e-test-agent (natural language), Arbigent (scenarios)"

# Phase 0: Setup (Day 1)
bd create "Get BrowserUse API key" \
  --type task \
  --priority 1 \
  --description "Sign up at https://cloud.browser-use.com/billing and get API key (~$20-50/month)"

bd create "Get OpenAI API key for testing" \
  --type task \
  --priority 1 \
  --description "Get OpenAI API key from https://platform.openai.com/api-keys for GPT-4o (~$30/month)"

bd create "Create .env.testing file with all API keys" \
  --type task \
  --priority 1 \
  --description "Create .env.testing with BROWSER_USE_API_KEY, OPENAI_API_KEY, MODEL_NAME=gpt-4o"

bd create "Install TestPilot (unit test generator)" \
  --type task \
  --priority 1 \
  --description "cd temp_skills/testpilot && npm install && npm run build"

bd create "Install QA-use Docker platform" \
  --type task \
  --priority 1 \
  --description "cd temp_skills/qa-use && docker compose up -d"

bd create "Install e2e-test-agent in monorepo" \
  --type task \
  --priority 1 \
  --description "pnpm add e2e-test-agent --filter web"

bd create "Build Arbigent CLI from source" \
  --type task \
  --priority 2 \
  --description "cd temp_skills/arbigent && ./gradlew installDist"

# Phase 1: TestPilot (Week 1)
bd create "Generate unit tests for UserService" \
  --type task \
  --priority 1 \
  --description "Use TestPilot to generate tests for apps/api/src/modules/users/users.service.ts"

bd create "Generate unit tests for BudgetService" \
  --type task \
  --priority 1 \
  --description "Use TestPilot to generate tests for apps/api/src/modules/budgets/budgets.service.ts"

bd create "Generate unit tests for CoursesService" \
  --type task \
  --priority 1 \
  --description "Use TestPilot to generate tests for apps/api/src/modules/courses/courses.service.ts"

bd create "Generate unit tests for utility functions" \
  --type task \
  --priority 1 \
  --description "Use TestPilot to generate tests for apps/api/src/common/utils/"

bd create "Refine generated tests to 90% pass rate" \
  --type task \
  --priority 1 \
  --description "Review and fix generated tests, ensure 90%+ pass rate"

# Phase 2: QA-use (Week 1)
bd create "Deploy QA-use platform and verify UI" \
  --type task \
  --priority 1 \
  --description "Access http://localhost:3100 and verify QA-use UI loads"

bd create "Create Smoke Tests suite (5 tests)" \
  --type task \
  --priority 1 \
  --description "Create 5 smoke tests: homepage, login form, signup form, DB health, API health"

bd create "Create Regression Tests suite (10 tests)" \
  --type task \
  --priority 1 \
  --description "Create 10 regression tests for core flows (registration, login, courses, budgets, social)"

bd create "Create Critical Flows suite (5 tests)" \
  --type task \
  --priority 1 \
  --description "Create 5 critical flow tests for end-to-end user journeys"

bd create "Set up email notifications via Resend" \
  --type task \
  --priority 2 \
  --description "Configure Resend API for failure alerts"

bd create "Configure hourly automated test runs" \
  --type task \
  --priority 2 \
  --description "Set up scheduling for regression tests to run hourly"

# Phase 3: e2e-test-agent (Week 2)
bd create "Write 3 authentication test cases" \
  --type task \
  --priority 1 \
  --description "Create tests/e2e/auth/ with signup, login, logout tests"

bd create "Write 5 course flow test cases" \
  --type task \
  --priority 1 \
  --description "Create tests/e2e/courses/ with browse, enroll, complete, quiz, certificate tests"

bd create "Write 4 budget management test cases" \
  --type task \
  --priority 1 \
  --description "Create tests/e2e/budgets/ with create, edit, track, analytics tests"

bd create "Write 3 social feature test cases" \
  --type task \
  --priority 1 \
  --description "Create tests/e2e/social/ with post, like/comment, share tests"

bd create "Create run-e2e-tests.ts runner script" \
  --type task \
  --priority 1 \
  --description "Create TypeScript runner for e2e-test-agent"

bd create "Integrate e2e-test-agent with CI/CD" \
  --type task \
  --priority 1 \
  --description "Add to GitHub Actions workflow"

# Phase 4: Arbigent (Week 3)
bd create "Create arbigent-project.yml with scenarios" \
  --type task \
  --priority 2 \
  --description "Create YAML file with 10 scenarios and dependencies"

bd create "Test login scenario (base scenario)" \
  --type task \
  --priority 2 \
  --description "Create and test login scenario"

bd create "Test create-budget scenario" \
  --type task \
  --priority 2 \
  --description "Create budget scenario with dependency on login"

bd create "Test enroll-course scenario" \
  --type task \
  --priority 2 \
  --description "Course enrollment scenario"

bd create "Test complete-course scenario" \
  --type task \
  --priority 2 \
  --description "Course completion scenario chain (depends on enroll)"

bd create "Set up GitHub Actions sharding (4 parallel)" \
  --type task \
  --priority 2 \
  --description "Configure matrix sharding in .github/workflows/arbigent-e2e.yml"

# Integration & Monitoring
bd create "Create unified CI/CD workflow for all 4 tools" \
  --type task \
  --priority 1 \
  --description "Create .github/workflows/ai-testing-army.yml"

bd create "Integrate with Grafana monitoring" \
  --type task \
  --priority 2 \
  --description "Add test metrics to Grafana dashboards"

bd create "Document workflows in AGENTS.md" \
  --type task \
  --priority 2 \
  --description "Add AI Testing Army section to AGENTS.md"

bd create "Create team training guide" \
  --type task \
  --priority 2 \
  --description "Document how to write natural language tests for QA/devs"

# Quality Gates
bd create "Verify 90% unit test coverage achieved" \
  --type task \
  --priority 1 \
  --description "Run coverage report and verify 90%+ coverage"

bd create "Verify 85% E2E test coverage achieved" \
  --type task \
  --priority 1 \
  --description "Verify all critical flows have E2E tests"

bd create "Verify <3min test execution time" \
  --type task \
  --priority 2 \
  --description "Optimize test execution with parallelization"

bd create "Verify 98% CI/CD pass rate" \
  --type task \
  --priority 1 \
  --description "Monitor and fix flaky tests"

echo "✅ Created 38 AI Testing Army tasks!"
echo ""
echo "Next steps:"
echo "1. bd ready - See available tasks"
echo "2. bd update <task-id> --status in_progress - Start first task"
echo "3. Follow AI_TESTING_ARMY_BEADS_PLAN.md for execution order"
