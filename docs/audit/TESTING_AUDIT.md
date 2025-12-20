# Testing Audit Strategy

**Purpose**: Achieve 90%+ test coverage with high-quality, maintainable tests

---

## 🎯 Testing Philosophy

**Principle**: Test behavior, not implementation  
**Goal**: Confidence in refactoring  
**Standard**: Fast, isolated, deterministic

---

## 📊 Current Coverage Analysis

### Coverage Report Generation

```bash
# Unit tests
pnpm test:coverage

# E2E tests
pnpm playwright test --reporter=html

# Integration tests
cd apps/api && pnpm test:e2e
```

### Coverage Targets by Layer

| Layer | Target | Rationale |
|-------|--------|-----------|
| **Auth & Security** | 95%+ | Critical path |
| **Business Logic** | 90%+ | Core functionality |
| **API Controllers** | 85%+ | Integration points |
| **Database Queries** | 90%+ | Data integrity |
| **Utils/Helpers** | 80%+ | Supporting code |
| **UI Components** | 70%+ | Supplemented by E2E |

---

## 🧪 Test Types

### 1. Unit Tests (Vitest)

**What**: Individual functions/methods in isolation  
**When**: All business logic, utils, services  
**Tools**: Vitest, MSW (for API mocking)

**Example**:
```typescript
// apps/api/src/auth/auth.service.spec.ts
import { describe, it, expect, vi } from 'vitest';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      const authService = new AuthService();
      const result = await authService.validateUser('test@example.com', 'password123');
      
      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      const authService = new AuthService();
      
      await expect(
        authService.validateUser('test@example.com', 'wrong')
      ).rejects.toThrow('Invalid credentials');
    });
  });
});
```

### 2. Integration Tests (AVA)

**What**: Multiple components working together  
**When**: API endpoints, database operations  
**Tools**: AVA, Supertest, Test database

**Example**:
```typescript
// apps/api/src/users/users.controller.ava.ts
import test from 'ava';
import request from 'supertest';
import { app } from '../app';

test.serial('POST /api/users creates a new user', async t => {
  const response = await request(app)
    .post('/api/users')
    .send({
      email: 'newuser@example.com',
      name: 'New User',
      role: 'student'
    })
    .expect(201);

  t.is(response.body.email, 'newuser@example.com');
  t.truthy(response.body.id);
});

test.serial('GET /api/users returns paginated users', async t => {
  const response = await request(app)
    .get('/api/users?page=1&limit=10')
    .expect(200);

  t.true(Array.isArray(response.body.data));
  t is(response.body.data.length, 10);
});
```

### 3. E2E Tests (Playwright)

**What**: Complete user flows through UI  
**When**: Critical user journeys  
**Tools**: Playwright

**Example**:
```typescript
// tests/e2e/login-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    await page.fill('[data-testid="email-input"]', 'admin@v-edfinance.com');
    await page.fill('[data-testid="password-input"]', 'Admin@123');
    await page.click('[data-testid="login-button"]');
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should show error message with invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    await page.fill('[data-testid="email-input"]', 'wrong@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');
    
    await expect(page.locator('[data-testid="error-message"]')).toHaveText('Invalid credentials');
  });
});
```

### 4. Load Tests (Autocannon)

**What**: Performance under load  
**When**: Critical API endpoints  
**Tools**: Autocannon, Vegeta

**Example**:
```bash
# Basic load test
autocannon -c 100 -d 30 http://localhost:3001/api/health

# With custom payload
autocannon -c 50 -d 10 \
  -m POST \
  -H "Content-Type: application/json" \
  -b '{"email":"test@example.com","password":"test123"}' \
  http://localhost:3001/api/auth/login
```

---

## 🔍 Coverage Gap Analysis

### Identifying Untested Code

**Method 1: Coverage Report**
```bash
pnpm test:coverage --reporter=html
open coverage/index.html
```

**Method 2: Automated Gap Detection**
```powershell
# Parse coverage JSON
$coverage = Get-Content coverage/coverage-summary.json | ConvertFrom-Json

$uncovered = @()
foreach ($file in $coverage.PSObject.Properties) {
    if ($file.Value.lines.pct -lt 90) {
        $uncovered += @{
            file = $file.Name
            coverage = $file.Value.lines.pct
        }
    }
}

# Create Beads tasks
foreach ($item in $uncovered) {
    bd create "Add tests: $($item.file)" `
      --description="Current coverage: $($item.coverage)%. Target: 90%" `
      -t task -p 2 --json
}
```

---

## 🤖 TestMaster Workflow

### Automated Task Generation

```bash
# Run coverage analysis
pnpm test:coverage --reporter=json > coverage.json

# Generate Beads tasks for gaps
node scripts/audit/generate-test-tasks.js coverage.json

# Example task created:
bd create "Add unit tests: auth.service.ts" \
  --description="Current: 62%. Target: 95% (critical path)" \
  -t task -p 1 \
  --deps blocks:ved-test-coverage \
  --json
```

### Testing Checklist per Component

```markdown
## [ComponentName] Testing Checklist

### Unit Tests
- [ ] Happy path scenarios
- [ ] Error handling
- [ ] Edge cases (null, undefined, empty)
- [ ] Boundary conditions
- [ ] Async operations

### Integration Tests
- [ ] API endpoint success
- [ ] API endpoint errors (400, 401, 404, 500)
- [ ] Database transactions
- [ ] External service mocking

### E2E Tests (if applicable)
- [ ] User can complete primary flow
- [ ] Validation errors shown
- [ ] Loading states handled
- [ ] Navigation works
```

---

## 📋 Critical Paths to Test

### Authentication Flow
```markdown
## Auth Testing Priority

### P0 (Must Have)
- [x] Login with valid credentials
- [x] Login with invalid credentials
- [x] JWT token generation
- [x] JWT token validation
- [x] Password hashing
- [ ] Account lockout after failed attempts
- [ ] Password reset flow
- [ ] Token refresh mechanism

### P1 (Should Have)
- [ ] Login rate limiting
- [ ] Session management
- [ ] Multi-device handling
- [ ] Logout invalidation

### P2 (Nice to Have)
- [ ] Remember me functionality
- [ ] OAuth integration (if applicable)
- [ ] 2FA (if applicable)
```

### Payment Processing
```markdown
## Payment Testing Priority

### P0 (Critical)
- [ ] Payment creation
- [ ] Payment success handling
- [ ] Payment failure handling
- [ ] Refund processing
- [ ] Transaction logging

### P1
- [ ] Payment validation
- [ ] Currency handling
- [ ] Multiple payment methods
- [ ] Recurring payments

### P2
- [ ] Payment history
- [ ] Receipt generation
- [ ] Payment reminders
```

---

## 🛠️ Test Writing Guidelines

### Good Test Characteristics

**1. ARRANGE-ACT-ASSERT Pattern**
```typescript
test('should calculate total price correctly', () => {
  // ARRANGE: Set up test data
  const items = [
    { price: 100, quantity: 2 },
    { price: 50, quantity: 3 }
  ];
  
  // ACT: Execute the function under test
  const total = calculateTotal(items);
  
  // ASSERT: Verify the result
  expect(total).toBe(350);
});
```

**2. Descriptive Test Names**
```typescript
// ❌ Bad
test('test user creation', () => {});

// ✅ Good
test('should create user with valid data and return user ID', () => {});
test('should throw ValidationError when email is invalid', () => {});
```

**3. One Assertion per Test (when possible)**
```typescript
// ❌ Testing too much
test('user CRUD operations', async () => {
  const user = await createUser();
  expect(user).toBeDefined();
  
  const updated = await updateUser(user.id, { name: 'New Name' });
  expect(updated.name).toBe('New Name');
  
  await deleteUser(user.id);
  const deleted = await getUser(user.id);
  expect(deleted).toBeNull();
});

// ✅ Separate tests
test('should create user successfully', async () => {
  const user = await createUser({ email: 'test@example.com' });
  expect(user).toBeDefined();
});

test('should update user name', async () => {
  const user = await createUser();
  const updated = await updateUser(user.id, { name: 'New Name' });
  expect(updated.name).toBe('New Name');
});
```

### Test Data Management

**Use Factories**:
```typescript
// tests/factories/user.factory.ts
export function createTestUser(overrides = {}) {
  return {
    email: 'test@example.com',
    name: 'Test User',
    role: 'student',
    ...overrides
  };
}

// Usage
test('should create user', async () => {
  const userData = createTestUser({ email: 'specific@example.com' });
  const user = await userService.create(userData);
  expect(user.email).toBe('specific@example.com');
});
```

---

## 📊 Beads Task Structure for Testing

### Epic Hierarchy

```
ved-test-coverage (Epic)
├── ved-test-auth (Epic - Auth module)
│   ├── ved-test-auth-unit
│   ├── ved-test-auth-integration
│   └── ved-test-auth-e2e
├── ved-test-users (Epic - Users module)
├── ved-test-classes (Epic - Classes module)
└── ved-test-payments (Epic - Payments module)
```

### Task Template

```yaml
Title: "Add unit tests: [ComponentName]"
Description: |
  **Component**: apps/api/src/auth/auth.service.ts
  **Current Coverage**: 62%
  **Target Coverage**: 95% (critical path)
  
  **Missing Tests**:
  - [ ] validateUser() with valid credentials
  - [ ] validateUser() with invalid password
  - [ ] validateUser() with non-existent user
  - [ ] validateUser() with locked account
  - [ ] hashPassword() generates valid bcrypt hash
  - [ ] Error handling for database failures
  
  **Test Framework**: Vitest
  **Test File**: apps/api/src/auth/auth.service.spec.ts
  
  **Acceptance Criteria**:
  - [ ] Coverage ≥ 95%
  - [ ] All edge cases covered
  - [ ] Tests run in < 100ms
  - [ ] No test database pollution

Type: task
Priority: 1
Tags: testing, unit-test, auth, critical-path
Dependencies: blocks:ved-test-coverage
```

---

## ✅ Definition of Done for Testing

### Per Component
- [ ] Unit test coverage ≥ target
- [ ] All critical paths tested
- [ ] Edge cases covered
- [ ] Error scenarios tested
- [ ] Tests run in CI successfully
- [ ] No flaky tests

### Overall Project
- [ ] 90%+ overall coverage
- [ ] 95%+ for critical modules (auth, payments)
- [ ] All E2E flows have tests
- [ ] Load tests establish baselines
- [ ] Test suite runs in < 5 minutes

---

## 📈 Progress Tracking

### Daily Testing Metrics

```bash
# Run and track
pnpm test:coverage --reporter=json > daily-coverage.json

# Compare with baseline
node scripts/audit/compare-coverage.js baseline.json daily-coverage.json

# Output:
# Overall: 72% → 78% (+6%)
# Auth: 65% → 92% (+27%) ✅
```

### Weekly Report Template

```markdown
# Testing Progress - Week [X]

## Coverage Progress
- **Overall**: 72% → 78% (Target: 90%)
- **Auth Module**: 92% ✅ (Target: 95%)
- **Users Module**: 85% (Target: 90%)
- **Classes Module**: 68% (Target: 85%)

## Tests Added This Week
- 23 unit tests
- 8 integration tests
- 3 E2E tests

## Remaining Gap
- Users module: 12 unit tests needed
- Classes module: 18 unit tests + 2 E2E tests

## Blockers
- None

## Next Week Focus
- Complete Users module testing
- Start Classes module unit tests
```

---

**Use this guide with SUB_AGENT_WORKFLOWS.md (TestMaster section) for systematic test coverage expansion.**
