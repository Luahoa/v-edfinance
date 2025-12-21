# F009: Courses Endpoint Test Fix Report

## Issue
`ai-course-flow.e2e-spec.ts` - "should return all courses" test fails with 500 error

## Root Cause Analysis
1. **Missing Redis Config**: `CACHE_MANAGER` mock was incomplete (missing `reset` method)
2. **Missing Redis ENV**: Test didn't provide Redis connection config (`REDIS_HOST`, `REDIS_PORT`)
3. **Missing User Record**: Test referenced `userId` but never created the user in the database

## Changes Made

### File: `apps/api/test/integration/ai-course-flow.e2e-spec.ts`

#### 1. Enhanced ConfigService Mock (Lines 37-39)
```typescript
if (key === 'REDIS_HOST') return 'localhost';
if (key === 'REDIS_PORT') return '6379';
```
**Reason**: `CommonModule` imports `RedisCacheModule` which needs these configs.

#### 2. Completed CACHE_MANAGER Mock (Line 55)
```typescript
.overrideProvider('CACHE_MANAGER')
.useValue({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    reset: vi.fn(), // Added
})
```
**Reason**: Cache service may call `reset()` during initialization.

#### 3. Created Test User (Lines 68-80)
```typescript
await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password',
        role: Role.STUDENT,
    },
});
```
**Reason**: `CoursesService.updateProgress()` references user via foreign key constraint.

## Dependency Chain (Why 500 Occurred)

```
CoursesController.findAll()
  ↓
CoursesService (requires GamificationService, ValidationService)
  ↓
CommonModule (provides above services)
  ↓
RedisCacheModule (requires REDIS_* config + CACHE_MANAGER)
  ↓
❌ Missing config/incomplete mock → Module initialization fails → 500 error
```

## Success Criteria
✅ GET /courses returns 200  
✅ Response has `{ data: [], total: 0, page: 1, limit: 10 }`  
✅ No dependency injection errors  
✅ User exists for progress tracking tests  

## Testing
Run the test:
```bash
pnpm --filter api test ai-course-flow.e2e-spec.ts
```

Expected output:
```
✓ should return all courses (200)
✓ Response body has data array
```

## Related Files
- [`ai-course-flow.e2e-spec.ts`](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/test/integration/ai-course-flow.e2e-spec.ts#L160-L164)
- [`courses.service.ts`](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/src/courses/courses.service.ts#L35-L62)
- [`common.module.ts`](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/src/common/common.module.ts)
