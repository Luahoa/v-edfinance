@echo off
REM AI Testing Army - Beads Task Creator (Windows)
REM Run this to create all 38 tasks for AI Testing Army deployment

echo 🚀 Creating AI Testing Army beads tasks...

REM Epic
beads.exe create "Deploy AI Testing Army for 100%% Coverage" --type epic --priority 1 --description "Integrate 4 AI testing agents: TestPilot (unit), QA-use (E2E platform), e2e-test-agent (natural language), Arbigent (scenarios)"

REM Phase 0: Setup
beads.exe create "Get BrowserUse API key" --type task --priority 1 --description "Sign up at https://cloud.browser-use.com/billing"
beads.exe create "Get OpenAI API key for testing" --type task --priority 1 --description "Get from https://platform.openai.com/api-keys"
beads.exe create "Create .env.testing file" --type task --priority 1 --description "Create .env.testing with API keys"
beads.exe create "Install TestPilot" --type task --priority 1 --description "cd temp_skills/testpilot && npm install && npm run build"
beads.exe create "Install QA-use Docker" --type task --priority 1 --description "cd temp_skills/qa-use && docker compose up -d"
beads.exe create "Install e2e-test-agent" --type task --priority 1 --description "pnpm add e2e-test-agent --filter web"
beads.exe create "Build Arbigent CLI" --type task --priority 2 --description "cd temp_skills/arbigent && gradlew installDist"

REM Phase 1: TestPilot
beads.exe create "Generate tests for UserService" --type task --priority 1
beads.exe create "Generate tests for BudgetService" --type task --priority 1
beads.exe create "Generate tests for CoursesService" --type task --priority 1
beads.exe create "Generate tests for utilities" --type task --priority 1
beads.exe create "Refine generated tests to 90%%" --type task --priority 1

REM Phase 2: QA-use
beads.exe create "Deploy QA-use platform" --type task --priority 1
beads.exe create "Create Smoke Tests suite (5)" --type task --priority 1
beads.exe create "Create Regression Tests (10)" --type task --priority 1
beads.exe create "Create Critical Flows (5)" --type task --priority 1
beads.exe create "Set up email notifications" --type task --priority 2
beads.exe create "Configure hourly test runs" --type task --priority 2

REM Phase 3: e2e-test-agent
beads.exe create "Write 3 auth test cases" --type task --priority 1
beads.exe create "Write 5 course test cases" --type task --priority 1
beads.exe create "Write 4 budget test cases" --type task --priority 1
beads.exe create "Write 3 social test cases" --type task --priority 1
beads.exe create "Create e2e runner script" --type task --priority 1
beads.exe create "Integrate e2e with CI/CD" --type task --priority 1

REM Phase 4: Arbigent
beads.exe create "Create arbigent YAML" --type task --priority 2
beads.exe create "Test login scenario" --type task --priority 2
beads.exe create "Test budget scenario" --type task --priority 2
beads.exe create "Test course scenario" --type task --priority 2
beads.exe create "Test complete scenario" --type task --priority 2
beads.exe create "Set up GitHub sharding" --type task --priority 2

REM Integration
beads.exe create "Create unified CI/CD workflow" --type task --priority 1
beads.exe create "Integrate with Grafana" --type task --priority 2
beads.exe create "Document in AGENTS.md" --type task --priority 2
beads.exe create "Create training guide" --type task --priority 2

REM Quality Gates
beads.exe create "Verify 90%% unit coverage" --type task --priority 1
beads.exe create "Verify 85%% E2E coverage" --type task --priority 1
beads.exe create "Verify <3min execution" --type task --priority 2
beads.exe create "Verify 98%% CI/CD pass" --type task --priority 1

echo.
echo ✅ Created 38 AI Testing Army tasks!
echo.
echo Next steps:
echo 1. beads.exe ready - See available tasks
echo 2. beads.exe update [task-id] --status in_progress
echo 3. Follow AI_TESTING_ARMY_BEADS_PLAN.md
