# Manual Migration Documentation: add_integration_models.sql

**File:** `apps/api/prisma/migrations/add_integration_models.sql`  
**Type:** Manual SQL Migration (Post-Deploy Script)  
**Status:** ✅ Applied  
**Date Created:** 2025-12-23 (estimated)

---

## Purpose

This manual migration adds **integration test models** required for advanced testing scenarios (Wave 3 Batch 2). These models support:
- Multi-user challenges
- AI personalization pipeline
- Course lifecycle tracking
- Behavioral nudge system
- Content storage integration

---

## Why Manual Migration?

This file exists as a **standalone SQL script** rather than a Prisma migration because:

1. **Test-Only Models** - Some models (Challenge, Enrollment, etc.) are primarily for integration tests
2. **Schema Experimentation** - Allows testing new features without polluting production Prisma schema
3. **Incremental Rollout** - Can be applied selectively to test databases
4. **Backward Compatibility** - Can be run alongside existing Prisma migrations without conflicts

---

## Models Added

### I007: Multi-User Challenge Flow
- `Challenge` - Challenge definitions with JSONB description
- `ChallengeParticipant` - User participation tracking

### I008: AI Personalization Pipeline
- `AIAnalysis` - AI-generated user insights (JSONB result field)

### I009: Course Lifecycle
- `Enrollment` - Course enrollment tracking
- `LessonProgress` - Individual lesson completion
- `QuizAttempt` - Quiz attempts and scores
- `Certificate` - Course completion certificates
- `Achievement` - Achievement definitions (JSONB description)

### I010: Nudge Behavior Loop
- `NudgeHistory` - Behavioral nudge tracking (JSONB message/metadata)

### I011: Storage Content Flow
- `CourseAsset` - R2 storage integration (JSONB metadata)

---

## Schema Modifications

### User Table Additions
```sql
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastActiveAt" TIMESTAMP;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "preferredLanguage" TEXT DEFAULT 'vi';
```

### UserAchievement Linking
```sql
ALTER TABLE "UserAchievement" ADD COLUMN IF NOT EXISTS "achievementId" TEXT;
-- Foreign key to Achievement table
```

### BehaviorLog Metadata
```sql
ALTER TABLE "BehaviorLog" ADD COLUMN IF NOT EXISTS "metadata" JSONB DEFAULT '{}';
```

---

## How to Apply

### Development Environment
```bash
# Apply manually (if not already applied)
psql $DATABASE_URL -f apps/api/prisma/migrations/add_integration_models.sql

# Or via Prisma (if converted to migration)
npx prisma migrate deploy
```

### Test Environment
```bash
# Apply to test database
psql $TEST_DATABASE_URL -f apps/api/prisma/migrations/add_integration_models.sql
```

### Production (VPS)
⚠️ **Not recommended** unless models are moved to main Prisma schema

---

## Migration to Prisma Format

If these models become production-ready, convert to Prisma migration:

1. **Add to `schema.prisma`:**
```prisma
model Challenge {
  id           String   @id @default(uuid())
  title        String
  description  Json
  targetAmount Int
  startDate    DateTime
  endDate      DateTime
  createdById  String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

// ... other models
```

2. **Generate migration:**
```bash
npx prisma migrate dev --name integrate_challenge_models --create-only
```

3. **Delete manual SQL file** after verification

---

## JSONB Fields Added

| Model | Field | Validation Schema | Status |
|---|---|---|---|
| Challenge | description | I18N_TEXT | ⚠️ NOT IN SCHEMA REGISTRY |
| AIAnalysis | result | - | ⚠️ NOT IN SCHEMA REGISTRY |
| Achievement | description | I18N_TEXT | ⚠️ NOT IN SCHEMA REGISTRY |
| NudgeHistory | message | I18N_TEXT | ⚠️ NOT IN SCHEMA REGISTRY |
| NudgeHistory | metadata | - | ⚠️ NOT IN SCHEMA REGISTRY |
| CourseAsset | metadata | - | ⚠️ NOT IN SCHEMA REGISTRY |
| BehaviorLog | metadata | - | ⚠️ NOT IN SCHEMA REGISTRY |

**Action Required:** If promoting to production, add Zod schemas to `SchemaRegistry`

---

## Rollback

To remove these tables:

```sql
DROP TABLE IF EXISTS "CourseAsset" CASCADE;
DROP TABLE IF EXISTS "NudgeHistory" CASCADE;
DROP TABLE IF EXISTS "Achievement" CASCADE;
DROP TABLE IF EXISTS "Certificate" CASCADE;
DROP TABLE IF EXISTS "QuizAttempt" CASCADE;
DROP TABLE IF EXISTS "LessonProgress" CASCADE;
DROP TABLE IF EXISTS "Enrollment" CASCADE;
DROP TABLE IF EXISTS "AIAnalysis" CASCADE;
DROP TABLE IF EXISTS "ChallengeParticipant" CASCADE;
DROP TABLE IF EXISTS "Challenge" CASCADE;

ALTER TABLE "User" DROP COLUMN IF EXISTS "lastActiveAt";
ALTER TABLE "User" DROP COLUMN IF EXISTS "preferredLanguage";
ALTER TABLE "UserAchievement" DROP COLUMN IF EXISTS "achievementId";
ALTER TABLE "BehaviorLog" DROP COLUMN IF EXISTS "metadata";
```

---

## Integration Test Coverage

These models support the following integration test scenarios:

- **I007:** Multi-user challenges with leaderboard
- **I008:** AI-driven course recommendations
- **I009:** Full course enrollment → lesson completion → certificate flow
- **I010:** Behavioral nudges (Hooked framework)
- **I011:** R2 storage for course assets

**Test Files:**
- `apps/api/test/integration/challenge-flow.e2e-spec.ts`
- `apps/api/test/integration/ai-personalization.e2e-spec.ts`
- `apps/api/test/integration/course-lifecycle.e2e-spec.ts`

---

## Next Steps

1. **Monitor Usage:** Track if these models are actively used in tests
2. **Schema Validation:** Add Zod schemas if promoting to production
3. **Migrate to Prisma:** Convert to proper Prisma migration if keeping long-term
4. **Cleanup:** Remove if not needed after integration test completion

---

**Last Updated:** 2026-01-05 (ved-rypi)  
**Status:** Documented ✅
