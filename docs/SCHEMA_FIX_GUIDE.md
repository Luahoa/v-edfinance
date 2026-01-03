# 🔧 Schema Fix Guide - Quick Reference

**Goal:** Fix 15 TypeScript errors to unblock Tracks 2-3

---

## Schema Mismatches Found

### 1. User Model - No Direct `streak` or `locale` or `lastLoginAt`

**Actual Schema:**
```prisma
model User {
  id                   String    @id
  preferredLocale      String    @default("vi")  // NOT "locale"
  // NO lastLoginAt field
  // NO streak field (it's in UserStreak relation)
  streaks              UserStreak?  // Relation to separate table
}

model UserStreak {
  userId           String   @unique
  currentStreak    Int      @default(0)
  lastActivityDate DateTime @default(now())
}
```

**Fix Pattern:**
```typescript
// ❌ OLD (wrong):
user.locale
user.streak  
user.lastLoginAt

// ✅ NEW (correct):
user.preferredLocale
user.streaks?.currentStreak || 0
user.streaks?.lastActivityDate || new Date()
```

---

### 2. BehaviorLog - Requires `sessionId` and `path`

**Actual Schema:**
```prisma
model BehaviorLog {
  sessionId      String   // REQUIRED
  path           String   // REQUIRED
  eventType      String
  actionCategory String?  @default("GENERAL")
  payload        Json?
}
```

**Fix Pattern:**
```typescript
// ❌ OLD (wrong):
await prisma.behaviorLog.create({
  data: {
    userId,
    eventType,
    payload,
  }
});

// ✅ NEW (correct):
await prisma.behaviorLog.create({
  data: {
    userId,
    sessionId: `system-${userId}`,  // ADD
    path: '/ai/proactive-nudge',     // ADD
    eventType,
    actionCategory: 'ENGAGEMENT',
    payload,
  }
});
```

---

### 3. No `courseProgress` Model - Use `UserProgress` Instead

**Actual Schema:**
```prisma
model UserProgress {  // NOT CourseProgress
  userId             String
  lessonId           String
  progressPercentage Float?  @default(0)
  completedAt        DateTime?
}
```

**Fix Pattern:**
```typescript
// ❌ OLD (wrong):
const progress = await prisma.courseProgress.findMany({
  where: { progress: { gte: 80 } }
});

// ✅ NEW (correct - need to aggregate by user):
const progress = await prisma.userProgress.groupBy({
  by: ['userId'],
  where: {
    progressPercentage: { gte: 80 },
  },
  having: {
    _avg: { progressPercentage: { gte: 80 } }
  }
});

// OR simpler: Just find incomplete lessons
const almostDone = await prisma.userProgress.findMany({
  where: {
    progressPercentage: { gte: 80, lt: 100 },
    completedAt: null,
  },
  include: {
    user: true,
    lesson: { include: { course: true } }
  }
});
```

---

### 4. `findSimilarOptimizations` Expects String, Not Array

**Error:** `Argument of type 'number[]' is not assignable to parameter of type 'string'`

**Root Cause:** `pgvector.service.ts` method signature mismatch

**Fix Pattern:**
```typescript
// Check actual method signature in pgvector.service.ts:
// async findSimilarOptimizations(queryText: string, options: {...})
// OR
// async findSimilarOptimizations(embedding: number[], options: {...})

// If it expects STRING:
const similar = await this.pgvector.findSimilarOptimizations(query, options);

// If it expects ARRAY:
const embedding = await this.pgvector.generateEmbedding(query);
const similar = await this.pgvector.findSimilarOptimizations(embedding, options);
```

---

## Quick Fix Checklist

### File: `apps/api/src/ai/proactive-triggers.service.ts`

**Line 28-34: User query with `lastLoginAt` and `locale`**
```typescript
// ✅ FIX:
const usersAtRisk = await this.prisma.user.findMany({
  where: {
    streaks: {
      lastActivityDate: { lt: twentyHoursAgo },
      currentStreak: { gte: 3 },
    }
  },
  select: {
    id: true,
    email: true,
    preferredLocale: true,  // NOT locale
    streaks: {
      select: {
        currentStreak: true,
        lastActivityDate: true,
      }
    }
  },
});
```

**Line 45: Access `user.lastLoginAt`**
```typescript
// ✅ FIX:
const hoursLeft = 24 - (now.getTime() - user.streaks.lastActivityDate.getTime()) / (1000 * 60 * 60);
```

**Line 53: Access `user.streak`**
```typescript
// ✅ FIX:
streak: user.streaks?.currentStreak || 0,
```

**Line 68-77: BehaviorLog create (missing sessionId, path)**
```typescript
// ✅ FIX:
await this.prisma.behaviorLog.create({
  data: {
    userId: user.id,
    sessionId: `proactive-trigger-${Date.now()}`,
    path: '/ai/proactive/streak-warning',
    eventType: 'PROACTIVE_NUDGE_SENT',
    actionCategory: 'ENGAGEMENT',
    payload: {
      nudgeType: nudge.type,
      hoursLeft: Math.floor(hoursLeft),
      message: nudge.message[user.preferredLocale || 'vi'],
    },
  },
});
```

**Line 94: `courseProgress` → `userProgress`**
```typescript
// ✅ FIX:
const almostDone = await this.prisma.userProgress.findMany({
  where: {
    progressPercentage: { gte: 80, lt: 100 },
    completedAt: null,
    updatedAt: { lt: sevenDaysAgo },
  },
  include: {
    user: { select: { id: true, email: true, preferredLocale: true } },
    lesson: { include: { course: true } },
  },
  take: 50,
});

// Then access as:
cp.user.preferredLocale
cp.lesson.course.title  
cp.progressPercentage
```

---

### File: `apps/api/src/modules/nudge/nudge-engine.service.ts`

**Line 104: Missing `getCourseCompletionNudge` method**
```typescript
// ✅ FIX: Add method or use existing pattern
case 'COURSE_COMPLETION':
  return this.getStreakNudge(user, safeData, persona);  // Reuse existing
```

**Line 113: User select with `knowledgeLevel`, `locale`, `streak`**
```typescript
// ✅ FIX:
const user = await this.prisma.user.findUnique({
  where: { id: userId },
  select: {
    preferredLocale: true,  // NOT locale
    streaks: {
      select: { currentStreak: true }
    }
  }
});

// Access as:
user.preferredLocale
user.streaks?.currentStreak || 0
```

**Line 125-127: Access wrong fields**
```typescript
// ✅ FIX:
- Knowledge Level: BEGINNER  // Remove if not in schema
- Locale: ${user.preferredLocale || 'vi'}
- Streak: ${user.streaks?.currentStreak || 0} days
```

**Line 168: BehaviorLog create (missing sessionId, path)**
```typescript
// ✅ FIX:
await this.prisma.behaviorLog.create({
  data: {
    userId,
    sessionId: `nudge-variant-${Date.now()}`,
    path: '/nudge/ai-variant',
    eventType: 'NUDGE_VARIANT_TEST',
    actionCategory: 'ENGAGEMENT',
    payload: data,
    timestamp: new Date(),
  },
});
```

---

### File: `apps/api/src/ai/rag-adapter.service.ts`

**Line 49: `findSimilarOptimizations` argument type**
```typescript
// ✅ CHECK pgvector.service.ts method signature first:
Read('apps/api/src/database/pgvector.service.ts', [140, 160])

// If it expects embedding array, current code is OK
// If it expects query string, change to:
const similar = await this.pgvector.findSimilarOptimizations(query, {
  threshold,
  limit,
});
```

---

## Automated Fix Script (Optional)

**Create:** `apps/api/fix-schema-mismatches.sh`

```bash
#!/bin/bash

# Fix user.locale → user.preferredLocale
find apps/api/src -name "*.ts" -exec sed -i 's/user\.locale/user.preferredLocale/g' {} +

# Fix user.streak → user.streaks?.currentStreak
find apps/api/src -name "*.ts" -exec sed -i 's/user\.streak/user.streaks?.currentStreak/g' {} +

# Fix courseProgress → userProgress
find apps/api/src -name "*.ts" -exec sed -i 's/courseProgress/userProgress/g' {} +

echo "✅ Automated fixes applied. Manual review required for:"
echo "  - BehaviorLog creates (add sessionId, path)"
echo "  - User queries (include streaks relation)"
```

---

## Verification Checklist

After fixes:

```bash
# 1. Type check
cd apps/api
pnpm tsc --noEmit

# 2. Build
pnpm build

# 3. Run tests
pnpm test

# 4. Start dev server
pnpm dev

# 5. Test endpoints
curl http://localhost:3001/api/ai/metrics/baseline
```

---

## Estimated Time

| Task | Time |
|------|------|
| Fix proactive-triggers.service.ts | 30 min |
| Fix nudge-engine.service.ts | 20 min |
| Fix rag-adapter.service.ts | 10 min |
| Build + test verification | 15 min |
| **Total** | **75 minutes** |

---

**Next:** After fixes complete → Resume Tracks 2-3 → Week 2 (Track 4)
