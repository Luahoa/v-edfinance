# Test Mock Standardization Guide

**Created:** 2025-12-21  
**Purpose:** Provide consistent Prisma mocking across all test files  
**Status:** ✅ Mock helper created, ready for adoption

---

## Problem Statement

**Before:** Tests manually create partial Prisma mocks, leading to:
- Inconsistent mock implementations across 117 test files
- Missing methods causing `undefined is not a function` errors  
- Difficult to maintain and update as schema evolves

**Example (Old Pattern):**
```typescript
const mockPrismaService = {
  user: {
    findUnique: vi.fn(),
    // Missing findMany, create, update, etc.
  },
  behaviorLog: {
    create: vi.fn(),
    // Missing findMany, count, etc.
  },
  // Missing 20+ other models
};
```

**Issues:**
- If service calls `prisma.user.findMany()`, test crashes
- No type safety - can mock non-existent methods
- Boilerplate repeated in every test file

---

## Solution: Centralized Mock Helper

**File:** `src/test-utils/prisma-mock.helper.ts`

**Features:**
- ✅ All 30+ Prisma models mocked with full CRUD methods
- ✅ Reusable factory functions for common entities
- ✅ Error simulation helpers (Prisma error codes)
- ✅ Transaction mocking support
- ✅ Type-safe (returns `jest.Mocked<PrismaService>`)

---

## Migration Guide

### Step 1: Import the Helper

```typescript
// Old
import { PrismaService } from '../../prisma/prisma.service';

// New
import { createMockPrismaService, createMockUser, createMockCourse } from '../../test-utils/prisma-mock.helper';
```

### Step 2: Replace Manual Mock

```typescript
// OLD (Manual Mock - 30+ lines)
const mockPrismaService = {
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  behaviorLog: {
    create: vi.fn(),
  },
  achievement: {
    findUnique: vi.fn(),
  },
};

// NEW (Centralized Mock - 1 line)
const mockPrisma = createMockPrismaService();
```

### Step 3: Use in Test Module

```typescript
const module: TestingModule = await Test.createTestingModule({
  providers: [
    MyService,
    { provide: PrismaService, useValue: mockPrisma },
  ],
}).compile();
```

### Step 4: Configure Mocks for Tests

```typescript
// Mock return values
mockPrisma.user.findUnique.mockResolvedValue(createMockUser({ id: 'user-1' }));
mockPrisma.course.findMany.mockResolvedValue([createMockCourse()]);

// Mock errors
import { createPrismaError, PrismaErrorCodes } from '../../test-utils/prisma-mock.helper';
mockPrisma.user.findUnique.mockRejectedValue(
  createPrismaError(PrismaErrorCodes.NOT_FOUND, 'User not found')
);
```

---

## Available Helpers

### 1. `createMockPrismaService()`
Returns a full PrismaService mock with all models and methods.

**Models included:**
- User, RefreshToken, UserRelationship
- Course, Lesson, LessonBlock, UserProgress, UserChecklist
- Achievement, UserAchievement, UserStreak, NudgeTrigger
- SimulationScenario, SimulationEvent, SimulationCommitment
- InvestmentProfile, VirtualPortfolio, PortfolioAsset, PortfolioTransaction
- BehaviorLog, AnalyticsPersona
- ChatThread, ChatMessage
- SystemSettings, StorageFile, ModerationLog
- BuddyGroup, BuddyMember, BuddyChallenge, SocialPost

**Methods per model:**
- `findUnique`, `findFirst`, `findMany`
- `create`, `update`, `upsert`, `delete`, `deleteMany`
- `count`, `aggregate`, `groupBy`, `updateMany`

**Client methods:**
- `$connect`, `$disconnect`
- `$executeRaw`, `$queryRaw`
- `$transaction`, `$on`, `$use`

### 2. `createMockUser(overrides?)`
Creates a minimal valid User object with LocalizedContent fields.

```typescript
const user = createMockUser({
  email: 'custom@example.com',
  points: 1000,
  role: 'ADMIN',
});
```

### 3. `createMockCourse(overrides?)`
Creates a minimal valid Course object.

```typescript
const course = createMockCourse({
  level: 'ADVANCED',
  estimatedHours: 20,
});
```

### 4. `createMockAchievement(overrides?)`
Creates a minimal valid Achievement object.

```typescript
const achievement = createMockAchievement({
  pointsRequired: 500,
  iconKey: 'star',
});
```

### 5. `createMockBehaviorLog(overrides?)`
Creates a minimal valid BehaviorLog object.

```typescript
const log = createMockBehaviorLog({
  actionType: 'COURSE_COMPLETE',
  actionData: { courseId: 'course-1' },
});
```

### 6. `createPrismaError(code, message)`
Simulates Prisma error responses.

```typescript
import { PrismaErrorCodes } from '../../test-utils/prisma-mock.helper';

mockPrisma.user.create.mockRejectedValue(
  createPrismaError(PrismaErrorCodes.UNIQUE_CONSTRAINT, 'Email already exists')
);
```

**Available error codes:**
- `NOT_FOUND` (P2025)
- `UNIQUE_CONSTRAINT` (P2002)
- `FOREIGN_KEY_CONSTRAINT` (P2003)
- `CONNECTION_ERROR` (P1001)
- `TIMEOUT` (P1008)
- `DATABASE_ERROR` (P2010)

### 7. `mockPrismaTransaction(operations)`
Mocks a Prisma transaction with multiple operations.

```typescript
mockPrisma.$transaction.mockImplementation(
  mockPrismaTransaction([
    { model: 'user', method: 'create', result: mockUser },
    { model: 'behaviorLog', method: 'create', result: mockLog },
  ])
);
```

---

## Migration Checklist

### For Each Test File:

- [ ] Import `createMockPrismaService` from `test-utils/prisma-mock.helper`
- [ ] Replace manual `mockPrismaService` object with `createMockPrismaService()`
- [ ] Update provider in `TestingModule` to use new mock
- [ ] Replace manual mock object creation with factory functions (`createMockUser`, etc.)
- [ ] Run test to verify no regressions
- [ ] Remove old mock definitions

### Expected Impact Per File:
- **Lines removed:** 20-50 (manual mock definitions)
- **Lines added:** 5-10 (import + factory usage)
- **Net reduction:** ~30 lines per test file

---

## Example Migration

### Before (85 lines of mock boilerplate):

```typescript
describe('SharingService', () => {
  let service: SharingService;
  let prisma: PrismaService;

  const mockPrismaService = {
    behaviorLog: {
      create: vi.fn(),
    },
    achievement: {
      findUnique: vi.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SharingService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<SharingService>(SharingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should share achievement', async () => {
    const mockAchievement = {
      id: 'ach-1',
      name: { vi: 'Test', en: 'Test', zh: 'Test' },
      description: { vi: 'Desc', en: 'Desc', zh: 'Desc' },
      iconKey: 'trophy',
    };

    vi.mocked(prisma.achievement.findUnique).mockResolvedValue(mockAchievement);

    const result = await service.shareAchievement('user-1', 'ach-1');
    
    expect(result).toBeDefined();
  });
});
```

### After (50 lines - 41% reduction):

```typescript
import { createMockPrismaService, createMockAchievement } from '../../test-utils/prisma-mock.helper';

describe('SharingService', () => {
  let service: SharingService;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SharingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SharingService>(SharingService);
  });

  it('should share achievement', async () => {
    const mockAchievement = createMockAchievement({ id: 'ach-1' });

    mockPrisma.achievement.findUnique.mockResolvedValue(mockAchievement);

    const result = await service.shareAchievement('user-1', 'ach-1');
    
    expect(result).toBeDefined();
  });
});
```

---

## Priority Files for Migration

**High Priority (Failing Tests):**
1. `src/modules/social/sharing.service.spec.ts`
2. `src/modules/nudge/framing.service.spec.ts`
3. `src/modules/simulation/scenario-generator.service.spec.ts`
4. `src/common/health.controller.spec.ts`
5. `src/modules/nudge/nudge-scheduler.service.spec.ts`
6. `src/modules/nudge/reward.service.spec.ts`

**Medium Priority (Passing but verbose):**
7-20. All other service spec files with manual mocks

**Low Priority (Already clean):**
- Pure function tests (no Prisma dependency)
- E2E tests (use real DB or test containers)

---

## Automated Migration Script

**Future work:** Create a codemod script to automate migration:

```bash
# Planned command:
pnpm run migrate:mocks --file=src/modules/*/spec.ts
```

**What it would do:**
1. Detect manual `mockPrismaService` objects
2. Replace with `createMockPrismaService()` import
3. Convert manual entity creation to factory functions
4. Run tests to verify

---

## Success Metrics

**Goal:** Fix 10-15 test failures related to missing Prisma mock methods

**Current Status:**
- ✅ Helper created: `test-utils/prisma-mock.helper.ts`
- ⏳ Files migrated: 0/117
- ⏳ Tests fixed: 0/169

**Next Steps:**
1. Migrate top 5 priority files
2. Run tests and measure pass rate improvement
3. Document lessons learned
4. Scale to remaining files

---

## Troubleshooting

### Issue: "Cannot read property 'findMany' of undefined"

**Cause:** Service calls a Prisma method that isn't mocked

**Solution:** Use `createMockPrismaService()` which includes ALL methods

### Issue: "Type mismatch - expected LocalizedContent"

**Cause:** Manual mock object missing required fields

**Solution:** Use factory functions like `createMockCourse()` which include all required fields

### Issue: "Transaction callback receives undefined"

**Cause:** `$transaction` mock not properly configured

**Solution:** Use `mockPrismaTransaction()` helper

```typescript
mockPrisma.$transaction.mockImplementation(
  mockPrismaTransaction([...operations])
);
```

---

## References

- [Prisma Schema](../../prisma/schema.prisma)
- [Mock Helper Implementation](../../src/test-utils/prisma-mock.helper.ts)
- [Vitest Mocking Docs](https://vitest.dev/guide/mocking.html)
- [NestJS Testing Docs](https://docs.nestjs.com/fundamentals/testing)

---

**Last Updated:** 2025-12-21  
**Maintainer:** Test Infrastructure Team (Agent ved-sm0.2)
