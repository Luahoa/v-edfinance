# 🧪 Deep-Dive Implementation Plan

## 📈 Coverage Milestones
- **Checkpoint 1 (Sprint 1):** 50% Overall (Core services complete)
- **Checkpoint 2 (Sprint 2):** 65% Overall (Integration tests + Advanced logic)
- **Checkpoint 3 (Final):** 80%+ Overall (E2E flows + Edge cases)

## 🛠️ Mocking & Testing Strategies

### 1. Advanced Tooling Integration
- **AVA**: Used for high-speed, concurrent testing of utility functions and standalone logic where Jest's overhead is unnecessary.
- **Bats**: Validates the integrity of our DevOps scripts (`scripts/`, `setup/`, `backup/`) to ensure environment stability.
- **Vegeta**: Performs stress tests on the NestJS API to ensure the VPS (Dokploy) can handle 100+ concurrent users as per Phase 3 requirements.

### 2. Database Mocking (Prisma)
Always use a mock Prisma client for unit tests to prevent database contamination.
```typescript
const mockPrisma = {
  user: { findUnique: jest.fn(), update: jest.fn() },
  // ...
};
```

### 2. External Services (AI/S3)
Mock external API calls (Gemini, R2) using `jest.spyOn` or manual mocks.
```typescript
// AIService Scenario
it('should handle AI downtime gracefully', async () => {
  jest.spyOn(geminiClient, 'generateContent').mockRejectedValue(new Error('API Down'));
  const result = await aiService.ask('Hello');
  expect(result.text).toContain('fallback message');
});
```

### 3. Integration Requirements
- **PostgreSQL**: Real Docker instance for `@test:e2e` scripts.
- **Header Propagation**: Test `accept-language` for i18n accuracy.

## 🚧 Risk Management Matrix

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **Flaky E2E Tests** | High | Use `data-testid`, retry logic, and stable network wait states. |
| **DB Performance** | Medium | Transactional rollbacks or per-suite DB cleanup. |
| **JSONB Complexity** | High | Use `ValidationService` in tests to verify schema integrity. |
| **Mock Drift** | Medium | Regular sync checks between mocks and actual API responses. |

## 🎯 Detailed Test Scenarios

### AuthenticationService
- [ ] Brute-force protection: Verify account lock after 5 failed attempts.
- [ ] Token leak prevention: Ensure password hashes never exist in memory post-return.

### SimulationService
- [ ] Portfolio valuation: Test complex ROI calculation with varying market conditions.
- [ ] Lockdown logic: Verify virtual funds cannot be withdrawn during lock periods.

## ✅ Success Criteria
- [ ] **Overall Coverage**: 80% (Statements/Branches/Lines).
- [ ] **Zero Red**: No failing tests in CI/CD pipeline.
- [ ] **Badges**: Up-to-date coverage badges in README.
