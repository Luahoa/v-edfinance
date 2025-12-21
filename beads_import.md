# E2E Stabilization Plan

## [Epic] E2E Testing Stabilization & Expansion
Priority: 1
Type: epic
Status: open

### [Task] Fix 401 Unauthorized in E2E behavior-flow tests
Priority: 0
Type: bug
Dependency: blocks:ved-qh9
Description: Fix the immediate blocker where integration tests fail due to JWT/Mock mismatches.

### [Task] Implement Registration & Onboarding E2E Flow
Priority: 1
Type: task
Description: Implement 'Flow 1' from TEST_COVERAGE_PLAN.md using Playwright.

### [Task] Implement Course Enrollment E2E Flow
Priority: 1
Type: task
Description: Implement 'Flow 2' from TEST_COVERAGE_PLAN.md.

### [Task] Implement AI Chat E2E Flow
Priority: 2
Type: task
Description: Implement 'Flow 3' from TEST_COVERAGE_PLAN.md.

### [Task] Setup E2E in CI/CD Pipeline
Priority: 1
Type: task
Description: Configure GitHub Actions to run Playwright tests and publish reports.
