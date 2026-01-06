# Testing Documentation

Test strategies, guides, and reports for V-EdFinance.

## Contents

### Guides
- [E2E Testing Guide](e2e-testing-guide.md) - End-to-end test workflows
- [Test Environment Guide](test-environment-guide.md) - Environment setup
- [Test Mock Standardization Guide](test-mock-standardization-guide.md) - Mock data patterns

### Planning
- [Test Coverage Plan](test-coverage-plan.md) - Coverage strategy and goals

### Reports
- [Stress Test Report](stress-test-report.md) - Performance testing results
- [Scenario Generator Test Report](scenario-generator-test-report.md) - Simulation module tests
- [Behavior Tracking Test Report](behavior-tracking-test-report.md) - Analytics module tests

## Test Commands

```bash
pnpm test                  # Run all tests
pnpm --filter web test     # Frontend tests
pnpm --filter api test     # Backend tests
```

See [AGENTS.md](../../AGENTS.md#testing) for framework selection.
