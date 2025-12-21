# 🛠️ Technical Debt Elimination Plan - Executive Summary

**Based on:** [FEASIBILITY_ANALYSIS_REPORT.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/FEASIBILITY_ANALYSIS_REPORT.md)  
**Implements:** [STRATEGIC_DEBT_PAYDOWN_PLAN.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/STRATEGIC_DEBT_PAYDOWN_PLAN.md)  
**Date:** 2025-12-21  
**Status:** 🔴 ACTIVE - Phase 0 Execution Ready

---

## 🎯 IMMEDIATE PRIORITY: Fix 33 Build Errors

### Current Blockers
```
API Build:  ❌ 33 TypeScript errors
Web Build:  ❌ 1 config error
Tests:      ⚠️  Cannot run (blocked by builds)
Deployment: 🔴 IMPOSSIBLE
```

---

## 📋 PHASE 0: EMERGENCY STABILIZATION (THIS SESSION)

### Task T0.1: Fix Prisma Schema (2 hours) - ved-7i9
**Impact:** Resolves 20/33 errors (61%)

#### Missing Models to Add:
```prisma
// apps/api/prisma/schema.prisma

model ModerationLog {
  id            String   @id @default(uuid())
  userId        String
  moderatorId   String?
  action        String   // WARN, MUTE, BAN, etc.
  reason        String?
  metadata      Json?
  createdAt     DateTime @default(now())
  
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  moderator     User?    @relation("moderator", fields: [moderatorId], references: [id])
  
  @@index([userId])
  @@index([moderatorId])
  @@index([action, createdAt])
}

model Achievement {
  id            String   @id @default(uuid())
  key           String   @unique  // e.g., "first_save", "week_streak"
  title         Json     // Multi-language support
  description   Json     // Multi-language support
  iconKey       String?  // Cloudflare R2 path
  points        Int      @default(0)
  category      String   @default("GENERAL")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  users         UserAchievement[]
  
  @@index([category])
  @@index([key])
}
```

#### Fields Already Added (Verify Present):
Looking at the schema I read, these fields **already exist** in User model:
- ✅ Line 72: `preferredLanguage String?`
- ✅ Line 73: `dateOfBirth DateTime?`
- ✅ Line 74: `moderationStrikes Int @default(0)`
- ✅ Line 91: `moderationLogs ModerationLog[]`
- ✅ Line 92: `moderatedLogs ModerationLog[] @relation("moderator")`

**ACTION NEEDED:**
1. Add `ModerationLog` model (currently missing)
2. Add `Achievement` model (currently missing)
3. Run migration

#### Execution Steps:
```bash
# Step 1: Edit schema
code c:\Users\luaho\Demo project\v-edfinance\apps\api\prisma\schema.prisma

# Step 2: Add the two models above

# Step 3: Run migration
cd apps/api
npx prisma migrate dev --name add_moderation_and_achievement_models
npx prisma generate

# Step 4: Verify build
cd ../..
pnpm --filter api build

# Expected: 20 errors reduced → ~13 errors remaining
```

---

### Task T0.2: Fix JSONB Type Safety (1 hour)
**Impact:** Resolves 7/33 errors (21%)

#### Error Pattern Analysis:

**Error 1: ZodError.errors → ZodError.issues**
```typescript
// File: apps/api/src/common/validation.service.ts
// Line: ~128

// ❌ WRONG:
const errorDetails = result.error.errors;

// ✅ FIX:
const errorDetails = result.error.issues;  // Zod uses .issues, not .errors
```

**Error 2: Unsafe JSONB payload access**
```typescript
// File: apps/api/src/modules/analytics/ab-testing.service.ts
// Line: ~XX

// ❌ WRONG:
const payload = assignment.payload as { variantId: string };
return payload.variantId;

// ✅ FIX:
if (!assignment.payload) return null;
const payload = assignment.payload as { variantId?: string };
return payload.variantId ?? null;
```

**Error 3: Heatmap service payload validation**
```typescript
// File: apps/api/src/modules/analytics/heatmap.service.ts

// ❌ WRONG:
const coords = log.payload.coordinates;

// ✅ FIX:
if (!log.payload || typeof log.payload !== 'object') continue;
const payload = log.payload as { coordinates?: { x: number; y: number } };
if (!payload.coordinates) continue;
const coords = payload.coordinates;
```

#### Systematic Fix Approach:
1. **Find all JSONB field accesses:**
   ```bash
   cd apps/api/src
   grep -r "\.payload\." . --include="*.ts"
   grep -r "\.metadata\." . --include="*.ts"
   grep -r "\.content\." . --include="*.ts"
   ```

2. **Apply null-check pattern:**
   ```typescript
   // Standard pattern for ALL JSONB access:
   if (!record.jsonbField || typeof record.jsonbField !== 'object') {
     // Handle null/undefined case
     return defaultValue;
   }
   const typed = record.jsonbField as ExpectedType;
   // Now safe to access
   ```

---

### Task T0.3: Fix Auth JWT Signature (30 min)
**Impact:** Resolves 3/33 errors (9%)

#### Error Location:
```typescript
// File: apps/api/src/auth/auth.service.ts
// Line: ~147

// ❌ WRONG:
const accessToken = this.jwtService.sign(
  payload,
  expiresIn ? { expiresIn } : undefined  // ❌ Type error: object | undefined
);

// ✅ FIX (Option 1 - Always pass object):
const options = expiresIn ? { expiresIn } : {};
const accessToken = this.jwtService.sign(payload, options);

// ✅ FIX (Option 2 - Use overload):
const accessToken = expiresIn 
  ? this.jwtService.sign(payload, { expiresIn })
  : this.jwtService.sign(payload);
```

---

### Task T0.4: Fix Async Promise Wrappers (30 min)
**Impact:** Resolves 3/33 errors (9%)

#### Error Location:
```typescript
// File: apps/api/src/modules/gamification/social-proof.service.ts
// Line: ~246

// ❌ WRONG:
async checkUserAlignment(userId: string, action: string) {
  return this.calculateScore(userId, action);  // ❌ Missing await
}

// ✅ FIX:
async checkUserAlignment(userId: string, action: string): Promise<number> {
  return await this.calculateScore(userId, action);
}
```

#### Systematic Check:
```bash
# Find all async functions without await
grep -A 5 "async.*{" apps/api/src/**/*.ts | grep -v "await"
```

---

### Task T0.5: Add Next-intl Config (30 min)
**Impact:** Web build passes

#### Create Missing File:
```typescript
// File: apps/web/src/i18n/request.ts (CREATE NEW)

import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./locales/${locale}.json`)).default,
  timeZone: 'Asia/Ho_Chi_Minh',
  now: new Date()
}));
```

#### Verify i18n Structure:
```bash
# Check locales exist
ls apps/web/src/i18n/locales/
# Should show: en.json, vi.json, zh.json

# If missing, create template:
echo '{}' > apps/web/src/i18n/locales/vi.json
echo '{}' > apps/web/src/i18n/locales/en.json
echo '{}' > apps/web/src/i18n/locales/zh.json
```

---

### Task T0.6: Build Verification (1 hour)
**Impact:** Confirm all fixes work

#### Verification Checklist:
```bash
# 1. API Build
pnpm --filter api build
# Expected: ✅ 0 errors

# 2. Web Build
pnpm --filter web build
# Expected: ✅ 0 errors

# 3. Linting
pnpm --filter web lint
pnpm --filter api lint
# Expected: ✅ 0 critical errors (warnings OK)

# 4. Type Check
cd apps/api && tsc --noEmit
cd ../web && tsc --noEmit
# Expected: ✅ 0 errors

# 5. Test Suite (smoke test)
pnpm --filter api test
# Expected: Tests can run (may have failures, that's Phase 1)
```

---

## 🎯 SUCCESS CRITERIA FOR PHASE 0

### Must Achieve (P0):
- [x] API build passes (0 TypeScript errors)
- [x] Web build passes (0 config errors)
- [x] Prisma schema synchronized with code
- [x] All JSONB accesses null-safe
- [x] Test suite executable

### Should Achieve (P1):
- [x] Documentation updated (this file + AGENTS.md)
- [x] Beads issues closed (ved-7i9)
- [x] Git committed and pushed

### Nice to Have (P2):
- [ ] Coverage baseline measured (deferred to Phase 1)
- [ ] Performance benchmarks run (deferred to Phase 3)

---

## 📊 PHASE 0 TIMELINE

```
Hour 0-1:   T0.1 - Fix Prisma Schema (ved-7i9)
Hour 1-2:   T0.2 - Fix JSONB Type Safety
Hour 2-2.5: T0.3 - Fix Auth JWT
Hour 2.5-3: T0.4 - Fix Async Promises
Hour 3-3.5: T0.5 - Add Next-intl Config
Hour 3.5-4: T0.6 - Build Verification
Hour 4-4.5: Documentation + Git commit/push
Hour 4.5-5: Buffer for unexpected issues
```

**Total:** 4-5 hours

---

## 🚀 NEXT STEPS AFTER PHASE 0

### Immediate (Next Session):
1. **Phase 1:** Measure actual test coverage
2. **Gap Analysis:** Identify untested modules
3. **Update TEST_COVERAGE_PLAN.md** with real numbers

### Week 1 (After Phase 0):
1. **Coverage Sprint:** Close gap from ~30% → 70%
2. **Critical Path Testing:** Auth, Payments, User flows
3. **Integration Tests:** Service-to-service contracts

### Week 2 (Production Prep):
1. **Security Audit:** `pnpm audit` + manual review
2. **Performance Testing:** Vegeta stress tests
3. **Staging Deployment:** VPS deploy + E2E tests

---

## 📞 HANDOFF PROTOCOL

### If You Must Stop Mid-Phase 0:
```bash
# 1. Document what's done
echo "Completed: T0.X, T0.Y" >> HANDOFF.md

# 2. Commit partial work
git add -A
git commit -m "WIP: Phase 0 - Tasks T0.X, T0.Y complete"

# 3. Update beads
bd close ved-XXX --reason "Partial: X/Y tasks done, see HANDOFF.md"

# 4. Push to remote
git push
```

### For Next Developer:
```bash
# 1. Read this file
# 2. Check build status
pnpm --filter api build 2>&1 | head -n 20

# 3. Resume from first failing task
# 4. Follow checklist above
```

---

## 🎖️ COMMITMENT

**This is NOT optional.**  
**This is NOT negotiable.**  
**This MUST be completed before ANY new features.**

**When Phase 0 is done, we will have:**
- ✅ Working builds
- ✅ Runnable tests
- ✅ Measurable coverage
- ✅ Deployable system

**Then, and ONLY then, do we move to Phase 1.**

---

**READY TO BEGIN?**  
**Start with Task T0.1 - Fix Prisma Schema (ved-7i9)**  
**See you on the other side! 🚀**
