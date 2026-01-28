# tRPC API E2E Tests

End-to-end tests for the V-EdFinance tRPC API using Playwright.

## Test Structure

```
tests/e2e/api/
├── trpc-course.spec.ts      # Course API (list, getBySlug)
├── trpc-user.spec.ts        # User API (testDb, getById, me, stats)
├── trpc-gamification.spec.ts # Gamification API (leaderboard, streak)
├── trpc-payment.spec.ts     # Payment API (transactions, revenue)
├── trpc-lesson.spec.ts      # Lesson API (getById, getByCourse, progress)
└── README.md                # This file
```

## Running Tests

### Prerequisites

1. Start the API server:
   ```bash
   pnpm --filter server dev
   ```

2. Ensure database is running with seed data

### Commands

```bash
# Run all API E2E tests
pnpm test:e2e:api

# Run specific test file
pnpm test:e2e:api -- trpc-course.spec.ts

# Run with UI (for debugging)
pnpm test:e2e:api -- --ui

# Run in headed mode (see browser)
pnpm test:e2e:api -- --headed
```

## Test Categories

### 1. Public Procedures
Tests that don't require authentication:
- `course.list` - List published courses
- `course.getBySlug` - Get course by slug
- `user.testDb` - Database health check
- `user.getById` - Get user public info
- `gamification.leaderboard` - Get leaderboard
- `lesson.getById` - Get lesson details
- `lesson.getByCourse` - List lessons for a course

### 2. Protected Procedures (Auth Required)
Tests that verify UNAUTHORIZED is returned without session:
- `user.me`, `user.getStats`, `user.updateProfile`
- `gamification.getStreak`, `gamification.updateStreak`, `gamification.addPoints`
- `payment.*` - All payment procedures
- `lesson.getProgress`, `lesson.markComplete`, `lesson.updateWatchTime`

### 3. Input Validation
Tests that verify Zod schema validation:
- Invalid limit/offset values
- Invalid enum values
- Invalid UUID formats

## Adding New Tests

1. Create a new spec file: `trpc-<router>.spec.ts`
2. Import Playwright test utilities
3. Use `request` fixture for HTTP calls
4. Follow the pattern:

```typescript
import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3001/trpc';

test.describe('tRPC <Router> API', () => {
  test('<procedure> - <description>', async ({ request }) => {
    const response = await request.get(`${API_BASE}/<router>.<procedure>`, {
      params: {
        input: JSON.stringify({ /* params */ }),
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.result.data).toBeDefined();
  });
});
```

## Configuration

See `playwright.api.config.ts` for test configuration:
- Test directory: `./tests/e2e/api`
- Web server: Starts API on port 3001
- Parallel execution enabled
- HTML report in `playwright-report/api/`
