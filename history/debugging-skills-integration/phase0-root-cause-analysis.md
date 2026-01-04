# Phase 0 Root Cause Analysis

**Date:** 2026-01-04  
**Debugging Skill:** systematic-debugging (Phase 1)  
**Status:** Root cause identified ✅

---

## Phase 1: Root Cause Investigation

### Error Summary (Fresh Build Output)
```
Total Errors: 16 TypeScript errors (not 33 as estimated)
Category Breakdown:
- Missing User fields: 8 errors (lastLoginAt, locale, streak, knowledgeLevel)
- Missing BehaviorLog required fields: 4 errors (sessionId, path not provided)
- Wrong model name: 1 error (courseProgress → userProgress)
- Type mismatches: 3 errors (pgvector, payload validation, missing method)
```

### Hypothesis Revision
**Original:** "33 errors from schema drift (missing models)"  
**Actual:** "16 errors from field name mismatches and required field violations"

**Evidence:**
```bash
cd apps/api && pnpm build 2>&1
# Output shows specific field errors:
# - Property 'lastLoginAt' does not exist on type 'User'
# - Property 'locale' does not exist (should be 'preferredLocale')
# - Property 'streak' does not exist on type 'User'
# - courseProgress → userProgress (model renamed)
# - sessionId, path missing from BehaviorLog.create()
```

---

## Root Causes Identified

### 1. User Model Field Migrations (8 errors)
**Files Affected:**
- `src/ai/proactive-triggers.service.ts`
- `src/modules/nudge/nudge-engine.service.ts`

**Root Cause:** Code uses old field names that don't exist in schema

| Old Field (Used in Code) | Schema Field | Status |
|--------------------------|--------------|--------|
| `user.lastLoginAt` | Does NOT exist | ❌ Never added |
| `user.locale` | `user.preferredLocale` | ❌ Renamed |
| `user.streak` | Does NOT exist | ❌ Never added |
| `user.knowledgeLevel` | Does NOT exist | ❌ Never added |

**Data Flow Trace:**
```
proactive-triggers.service.ts:28
  → Queries User with lastLoginAt filter
  → Field doesn't exist in schema
  → TypeScript error TS2353

nudge-engine.service.ts:126
  → Accesses user.locale
  → Should be user.preferredLocale
  → TypeScript error TS2339
```

---

### 2. BehaviorLog Required Fields (4 errors)
**Files Affected:**
- `src/ai/proactive-triggers.service.ts` (2 occurrences)
- `src/modules/nudge/nudge-engine.service.ts` (1 occurrence)
- `src/courses/courses.service.ts` (1 occurrence)

**Root Cause:** BehaviorLog.create() calls missing required fields `sessionId` and `path`

**Schema Requirement:**
```prisma
model BehaviorLog {
  id            String   @id @default(uuid())
  userId        String
  sessionId     String   // REQUIRED ← Missing in create() calls
  path          String   // REQUIRED ← Missing in create() calls
  eventType     String
  actionCategory String
  payload       Json?
  timestamp     DateTime @default(now())
  // ...
}
```

**Defense-in-Depth Violation:** Entry point validation missing (no check for required fields before DB write)

---

### 3. Model Name Change (1 error)
**File Affected:** `src/ai/proactive-triggers.service.ts:94`

**Root Cause:** Model renamed from `courseProgress` to `userProgress`

**Evidence:**
```typescript
// Old code
const almostDone = await this.prisma.courseProgress.findMany({...});

// Schema has
model UserProgress { ... }

// Should be
const almostDone = await this.prisma.userProgress.findMany({...});
```

---

### 4. Type Mismatches (3 errors)

#### 4a. pgvector Argument Type
**File:** `src/ai/rag-adapter.service.ts:49`
```typescript
// Error: Argument of type 'number[]' is not assignable to parameter of type 'string'
const similar = await this.pgvector.findSimilarOptimizations(embedding, {...});
```
**Root Cause:** Method signature expects string, receives number[]

#### 4b. Payload Validation Type
**File:** `src/courses/courses.service.ts:243`
```typescript
// ValidationResult type incompatible with InputJsonValue
payload: { validationResult: ValidationResult, ... }
```
**Root Cause:** Type mismatch between custom type and Prisma JSON type

#### 4c. Missing Method
**File:** `src/modules/nudge/nudge-engine.service.ts:104`
```typescript
// Property 'getCourseCompletionNudge' does not exist
return this.getCourseCompletionNudge(user, safeData, persona);
```
**Root Cause:** Method never implemented

---

## Pattern Analysis (Phase 2)

### Common Pattern: Migration Debt
**All errors stem from incomplete migrations:**
1. Schema evolved (fields renamed/added/removed)
2. Code not updated to match
3. No tests caught mismatches
4. Build fails at TypeScript compilation

### Defense-in-Depth Missing
- **Layer 1 (Entry):** No validation of field existence before access
- **Layer 2 (Business):** No null checks for optional fields
- **Layer 3 (Environment):** TypeScript strict mode enabled (good!) but ignored warnings
- **Layer 4 (Debug):** No logging of schema mismatches

### Working Examples Found
```prisma
// Schema (working reference)
model User {
  preferredLocale String @default("vi")  // ✓ Exists
  // NO lastLoginAt, locale, streak, knowledgeLevel
}

// Correct usage in other files
user.preferredLocale  // ✓ Works
```

---

## Revised Fix Strategy (Phase 3 Hypothesis)

### Option A: Add Missing Fields to Schema ⚠️ RISKY
**Pros:** Fixes errors quickly  
**Cons:** May not be needed features, adds debt

### Option B: Remove References to Non-Existent Fields ✅ RECOMMENDED
**Pros:** Aligns code with actual schema, removes dead code  
**Cons:** May break features (needs verification)

### Option C: Hybrid Approach
1. **Remove** references to never-implemented fields (lastLoginAt, streak, knowledgeLevel)
2. **Rename** locale → preferredLocale throughout codebase
3. **Add defaults** for BehaviorLog required fields (sessionId, path)
4. **Fix** model names (courseProgress → userProgress)

**Recommended:** Option C with defense-in-depth validation

---

## Next Steps (Implementation Phase)

### Track 2 Revised: Field Alignment (not Schema Drift)
1. ✅ **ved-field-1:** Remove lastLoginAt, streak, knowledgeLevel references
2. ✅ **ved-field-2:** Rename locale → preferredLocale throughout codebase
3. ✅ **ved-field-3:** Add sessionId, path defaults to BehaviorLog.create()
4. ✅ **ved-field-4:** Rename courseProgress → userProgress
5. ✅ **ved-field-5:** Fix type mismatches (pgvector, ValidationResult)
6. ✅ **ved-field-6:** Implement or remove getCourseCompletionNudge

### Verification Commands
```bash
# After each fix
pnpm --filter api build 2>&1 | findstr "error TS" | measure-object -line

# Target: 0 errors
```

---

## Learnings from Systematic Debugging

### What Worked
✅ Reading error messages completely revealed exact issues  
✅ Tracing data flow identified root causes  
✅ Comparing against schema found mismatches  

### Mistakes Avoided
❌ Did NOT jump to "add missing models" (would be wrong fix)  
❌ Did NOT assume "33 errors" without verification  
❌ Did NOT fix symptoms without root cause investigation  

### Iron Law Applied
> "NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST"

We completed Phase 1 BEFORE attempting fixes. ✅

---

## Estimated Impact

**Before Root Cause Analysis:** 
- Planned to add models/fields → 2.5 hours
- Would create unnecessary schema bloat
- Wouldn't fix actual errors

**After Root Cause Analysis:**
- Remove dead code references → 1 hour
- Rename fields → 30 minutes  
- Add required defaults → 30 minutes
- **Total: 2 hours (30 min saved, cleaner solution)**

---

## Defense-in-Depth Plan

### Layer 1: Entry Validation
```typescript
// Before accessing user fields
if (!user.preferredLocale) {
  user.preferredLocale = 'vi'; // Default
}
```

### Layer 2: Business Logic
```typescript
// Before BehaviorLog.create()
const sessionId = context.sessionId || 'system';
const path = context.path || '/internal';
```

### Layer 3: Environment Guards
```typescript
// TypeScript strict mode (already enabled)
// Add ESLint rule: no-unsafe-member-access
```

### Layer 4: Debug Logging
```typescript
// Log when defaults used
logger.warn('Using default sessionId for BehaviorLog', { userId, eventType });
```

---

## Next: Execute Fixes

Proceed to Track 2 implementation with correct root causes identified.
