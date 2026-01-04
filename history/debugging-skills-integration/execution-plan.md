# Execution Plan: Debugging Skills Integration for Phase 0 Blockers

**Epic:** Integrate ClaudeKit Debugging Skills to Fix Phase 0 Blockers  
**Generated:** 2026-01-04  
**Goal:** Install and apply ClaudeKit debugging skills to systematically eliminate 33 build errors (ved-6bdg, ved-gdvp, ved-o1cw)

---

## 📋 Discovery Summary

### Current State (From STRATEGIC_DEBT_PAYDOWN_PLAN.md)
```
Build Health:        ❌ CRITICAL FAILURE
├─ API:              ❌ 33 TypeScript errors
├─ Web:              ❌ 1 config error
└─ Test Suite:       ⚠️  Blocked (cannot run)

Debt Composition:
├─ Schema Drift:     61% (20/33 errors) → Prisma missing fields
├─ Type Safety:      21% (7/33 errors)  → JSONB validation
└─ Auth/Async:       18% (6/33 errors)  → JWT + Promise types
```

### ClaudeKit Debugging Skills Available
1. **systematic-debugging** - 4-phase framework (Root Cause → Pattern → Hypothesis → Implementation)
2. **defense-in-depth** - Multi-layer validation (Entry → Business → Environment → Debug)
3. **verification-before-completion** - Evidence-based completion claims
4. **root-cause-tracing** - Backward tracing through call stacks

### Integration Strategy
**Approach:** Install skills → Apply systematic debugging to Phase 0 tasks → Verify with defense-in-depth → Validate with verification protocol

---

## 🎯 Tracks (Sequential - Dependencies Exist)

| Track | Agent       | Beads (in order)                          | File Scope                        | Duration |
|-------|-------------|-------------------------------------------|-----------------------------------|----------|
| 1     | DebugSetup  | ved-setup-1 → ved-setup-2                 | `.claude/skills/debugging/**`     | 30 min   |
| 2     | SchemaFixer | ved-7i9 → ved-gdvp                        | `apps/api/prisma/**`              | 2.5 hrs  |
| 3     | TypeGuard   | ved-type-1 → ved-type-2                   | `apps/api/src/**/*.service.ts`    | 1.5 hrs  |
| 4     | AsyncFixer  | ved-auth-1 → ved-async-1                  | `apps/api/src/modules/auth/**`    | 1 hr     |
| 5     | WebConfig   | ved-6bdg                                  | `apps/web/src/i18n/**`            | 30 min   |
| 6     | Verifier    | ved-verify-1 → ved-verify-2 → ved-verify-3| `apps/**`                         | 1 hr     |

**Total Duration:** ~7 hours (1 focused session)

---

## 📦 Track 1: DebugSetup - Install Debugging Skills

**Agent:** DebugSetup  
**File Scope:** `.claude/skills/debugging/**`  
**Dependencies:** None  
**Duration:** 30 minutes

### Beads

#### ved-setup-1: Copy ClaudeKit debugging skills
**Description:**
Copy 4 debugging skills from `../claudekit-skills/.claude/skills/debugging/` to `.claude/skills/debugging/`:
- systematic-debugging
- defense-in-depth
- verification-before-completion
- root-cause-tracing

**Acceptance Criteria:**
- [ ] All 4 skills copied to `.claude/skills/debugging/`
- [ ] SKILL.md files readable and intact
- [ ] No file corruption during copy

**Commands:**
```bash
mkdir -p .claude/skills/debugging
cp -r ../claudekit-skills/.claude/skills/debugging/* .claude/skills/debugging/
```

---

#### ved-setup-2: Create integration documentation
**Description:**
Create `docs/DEBUGGING_SKILLS_INTEGRATION.md` documenting:
- How to use each skill
- Integration with Beads workflow
- Integration with Amp review process
- Phase 0 specific applications

**Acceptance Criteria:**
- [ ] Documentation file created
- [ ] Usage examples for each skill
- [ ] Beads integration protocol documented
- [ ] Amp workflow integration documented

**Template:**
```markdown
# Debugging Skills Integration Guide

## Available Skills
1. systematic-debugging - [description]
2. defense-in-depth - [description]
3. verification-before-completion - [description]
4. root-cause-tracing - [description]

## Usage with Beads
[How to apply skills during bead execution]

## Usage with Amp
[How skills integrate with amp-beads-workflow.ps1]

## Phase 0 Applications
[Specific use cases for current blockers]
```

---

## 🔧 Track 2: SchemaFixer - Fix Prisma Schema Drift (20/33 errors)

**Agent:** SchemaFixer  
**File Scope:** `apps/api/prisma/**`  
**Dependencies:** Track 1 complete  
**Duration:** 2.5 hours  
**Debugging Skill:** systematic-debugging (Phase 1: Root Cause Investigation)

### Beads

#### ved-7i9: Fix Prisma schema missing models/fields
**Context:** Phase 0, Task T0.1 from STRATEGIC_DEBT_PAYDOWN_PLAN.md

**Root Cause Investigation (Systematic Debugging Phase 1):**
1. Read build errors completely (note line numbers, missing fields)
2. Trace data flow: Where are `ModerationLog`, `Achievement` referenced?
3. Check git history: When were these removed/never added?
4. Gather evidence: List ALL missing fields across codebase

**Changes Required:**
- Add `ModerationLog` model
- Add `Achievement` model  
- Add `User.dateOfBirth`, `User.moderationStrikes`
- Resolve `User.preferredLanguage` vs `preferredLocale` conflict

**Acceptance Criteria (Verification Before Completion):**
- [ ] Run `cd apps/api && npx prisma validate` → exit 0
- [ ] Run `npx prisma format` → no errors
- [ ] Run `npx prisma generate` → types generated
- [ ] Evidence: Copy validation output to bead close reason

**Defense-in-Depth Validation:**
- Layer 1: Prisma schema validation passes
- Layer 2: TypeScript compilation uses generated types
- Layer 3: Build runs without schema errors
- Layer 4: Log schema changes in migration file

---

#### ved-gdvp: Regenerate Drizzle schema from Prisma
**Context:** Drizzle schema drift detected in PROJECT_AUDIT

**Root Cause Investigation:**
1. Read error: "Drizzle schema out of sync"
2. Check last regeneration date
3. Verify Prisma → Drizzle sync process

**Changes Required:**
```bash
cd apps/api
pnpm drizzle-kit generate:pg  # Sync from Prisma
# DO NOT run drizzle migrations - Prisma owns schema
```

**Acceptance Criteria (Verification Before Completion):**
- [ ] Run `pnpm drizzle-kit generate:pg` → exit 0
- [ ] Verify `drizzle-schema.ts` matches Prisma models
- [ ] Run `pnpm --filter api build` → schema errors resolved
- [ ] Evidence: Diff showing schema updates

**Defense-in-Depth:**
- Layer 1: Drizzle generation succeeds
- Layer 2: Schema matches Prisma exactly
- Layer 3: Build compiles with new schema
- Layer 4: Document in PRISMA_DRIZZLE_HYBRID_STRATEGY.md

---

## 🛡️ Track 3: TypeGuard - Fix JSONB Type Safety (7/33 errors)

**Agent:** TypeGuard  
**File Scope:** `apps/api/src/**/*.service.ts`  
**Dependencies:** Track 2 complete (schema must exist first)  
**Duration:** 1.5 hours  
**Debugging Skill:** defense-in-depth

### Beads

#### ved-type-1: Fix ZodError.errors → ZodError.issues
**Context:** Phase 0, Task T0.2

**Root Cause Investigation:**
1. Read error messages: Find all `ZodError.errors` references
2. Check Zod version in package.json
3. Verify correct API: `ZodError.issues` in Zod docs

**Changes Required:**
Find and replace all `error.errors` → `error.issues` in validation code

**Defense-in-Depth Validation:**
- Layer 1: Entry point - ValidationService validates all JSONB writes
- Layer 2: Business logic - Each service checks schema before write
- Layer 3: Runtime - Zod throws on invalid data (catches edge cases)
- Layer 4: Debug - Log validation failures with full context

**Acceptance Criteria:**
- [ ] Run `pnpm --filter api build` → 7 fewer errors
- [ ] All Zod validations use `.issues` not `.errors`
- [ ] Evidence: Build output showing error count decrease

---

#### ved-type-2: Add null checks for JSONB field access
**Context:** Phase 0, Task T0.2

**Root Cause Investigation:**
1. Find all JSONB field access: `user.metadata.`, `course.localized.`
2. Identify which can be null/undefined
3. Check if null checks exist

**Changes Required:**
Add runtime null checks before accessing JSONB nested fields:
```typescript
// Before
const locale = user.metadata.preferredLocale;

// After (Defense-in-Depth)
if (!user.metadata) {
  throw new Error('User metadata is null');
}
const locale = user.metadata.preferredLocale ?? 'vi';
```

**Defense-in-Depth Validation:**
- Layer 1: Entry - Validate JSONB structure on write
- Layer 2: Business - Null check before access
- Layer 3: Environment - Default values for missing fields
- Layer 4: Debug - Log when defaults used

**Acceptance Criteria:**
- [ ] All JSONB accesses have null checks
- [ ] Run `pnpm --filter api build` → 0 JSONB type errors
- [ ] Evidence: TypeScript compilation output

---

## 🔐 Track 4: AsyncFixer - Fix Auth/Async Issues (6/33 errors)

**Agent:** AsyncFixer  
**File Scope:** `apps/api/src/modules/auth/**`  
**Dependencies:** Track 2 complete  
**Duration:** 1 hour  
**Debugging Skill:** root-cause-tracing

### Beads

#### ved-auth-1: Fix jwtService.sign() type mismatch
**Context:** Phase 0, Task T0.3

**Root Cause Tracing:**
1. Read error stack trace completely
2. Find where `jwtService.sign()` is called
3. Trace backward: What calls this? What type does it expect?
4. Check NestJS JWT docs for correct signature

**Changes Required:**
Remove ternary, always pass options object:
```typescript
// Before
const token = this.jwtService.sign(payload, expiresIn ? { expiresIn } : undefined);

// After (Fix at Source)
const token = this.jwtService.sign(payload, { expiresIn: expiresIn || '1h' });
```

**Acceptance Criteria:**
- [ ] Run `pnpm --filter api build` → 3 fewer errors
- [ ] All `jwtService.sign()` calls type-safe
- [ ] Evidence: Build output

---

#### ved-async-1: Fix Promise return types
**Context:** Phase 0, Task T0.4

**Root Cause Investigation:**
1. Find all async functions missing `Promise<>` return types
2. Check `checkUserAlignment()` async chain
3. Verify TypeScript strict mode settings

**Changes Required:**
Add explicit `Promise<>` return types to all async functions

**Acceptance Criteria:**
- [ ] Run `pnpm --filter api build` → 3 fewer errors
- [ ] All async functions have `Promise<T>` return types
- [ ] Evidence: Build output showing 0 async errors

---

## 🌐 Track 5: WebConfig - Fix Next-intl Config (1 error)

**Agent:** WebConfig  
**File Scope:** `apps/web/src/i18n/**`  
**Dependencies:** None (independent)  
**Duration:** 30 minutes  
**Debugging Skill:** systematic-debugging (Pattern Analysis - Phase 2)

### Beads

#### ved-6bdg: Create i18n request.ts config
**Context:** Phase 0, Task T0.5

**Pattern Analysis (Systematic Debugging Phase 2):**
1. Find working examples in next-intl docs
2. Read reference implementation COMPLETELY
3. Compare against our current setup
4. Identify differences

**Changes Required:**
Create `apps/web/src/i18n/request.ts` following next-intl docs:
```typescript
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./locales/${locale}.json`)).default
}));
```

**Acceptance Criteria:**
- [ ] Run `pnpm --filter web build` → exit 0
- [ ] Web build passes completely
- [ ] Evidence: Build success output

---

## ✅ Track 6: Verifier - Build Verification & Quality Gates

**Agent:** Verifier  
**File Scope:** `apps/**`  
**Dependencies:** Tracks 2, 3, 4, 5 complete  
**Duration:** 1 hour  
**Debugging Skill:** verification-before-completion

### Beads

#### ved-verify-1: Run full build verification
**Context:** Phase 0, Task T0.6

**Verification Protocol:**
```bash
# API Build
cd apps/api
pnpm build
echo "Exit code: $?"

# Web Build  
cd apps/web
pnpm build
echo "Exit code: $?"

# Web Lint
pnpm lint
echo "Exit code: $?"
```

**Acceptance Criteria (Verification Before Completion):**
- [ ] `pnpm --filter api build` → exit 0, 0 errors
- [ ] `pnpm --filter web build` → exit 0, 0 errors
- [ ] `pnpm --filter web lint` → exit 0, 0 warnings
- [ ] Evidence: Full command output copied to bead close reason

**Defense-in-Depth:**
- Layer 1: TypeScript compilation passes
- Layer 2: Linter catches code quality issues
- Layer 3: Build artifacts generated successfully
- Layer 4: Log build metrics (time, bundle size)

---

#### ved-verify-2: Run diagnostic verification
**Context:** Ensure no regressions

**Verification Commands:**
```bash
# Prisma schema valid
cd apps/api
npx prisma validate

# Drizzle schema synced
pnpm drizzle-kit generate:pg --check

# Dependencies installed
pnpm install --frozen-lockfile
```

**Acceptance Criteria:**
- [ ] Prisma validation passes
- [ ] Drizzle schema up-to-date
- [ ] No dependency drift
- [ ] Evidence: All command outputs

---

#### ved-verify-3: Update documentation & create baseline
**Context:** Document Phase 0 completion

**Changes Required:**
1. Update `TEST_COVERAGE_BASELINE.md` with build status
2. Update `STRATEGIC_DEBT_PAYDOWN_PLAN.md` Phase 0 status
3. Create `history/debugging-skills-integration/completion-report.md`

**Completion Report Template:**
```markdown
# Phase 0 Completion Report

**Date:** 2026-01-04  
**Duration:** [actual time]  
**Build Status:** ✅ ALL PASSING

## Errors Fixed
- Schema Drift: 20 errors → 0
- Type Safety: 7 errors → 0
- Auth/Async: 6 errors → 0
- Web Config: 1 error → 0

**Total:** 33 errors → 0 ✅

## Debugging Skills Applied
[List specific applications]

## Verification Evidence
[Attach build outputs]

## Next Phase
Ready for Phase 1: Coverage Measurement
```

**Acceptance Criteria:**
- [ ] All documentation updated
- [ ] Completion report created with evidence
- [ ] Beads epic status updated
- [ ] Evidence: Git diff showing documentation updates

---

## 🔗 Cross-Track Dependencies

```
Track 1 (DebugSetup) 
    ↓
Track 2 (SchemaFixer) ────┐
    ↓                     ↓
Track 3 (TypeGuard) ──────┤
    ↓                     ↓
Track 4 (AsyncFixer) ─────┤
                          ↓
Track 5 (WebConfig) ──────┤
                          ↓
                    Track 6 (Verifier)
```

**Critical Path:** Track 1 → Track 2 → Track 6 (schema must exist before verification)

**Parallel Opportunities:**
- Tracks 3, 4, 5 can run in parallel AFTER Track 2 completes
- Track 6 waits for ALL to complete

---

## 🎓 Key Learnings (Debugging Skills Application)

### Systematic Debugging Framework
- **Phase 1 (Root Cause):** Read errors completely, reproduce, trace data flow
- **Phase 2 (Pattern):** Find working examples (next-intl docs), compare differences
- **Phase 3 (Hypothesis):** "Schema missing → build fails" → test by adding schema
- **Phase 4 (Implementation):** Create failing test → fix → verify

### Defense-in-Depth Validation
- **Layer 1:** Entry point validation (Prisma schema, Zod schemas)
- **Layer 2:** Business logic checks (null checks, type guards)
- **Layer 3:** Environment guards (TypeScript strict mode)
- **Layer 4:** Debug logging (migration logs, build metrics)

### Verification Before Completion
- **Iron Law:** NO completion claims without fresh verification evidence
- **Protocol:** Run command → Read output → Verify → THEN claim
- **Evidence:** Attach command outputs to bead close reasons

### Root Cause Tracing
- Trace backward: `jwtService.sign()` error → caller → type mismatch
- Fix at source, not symptom
- Don't add bandaid fixes

---

## 📊 Success Metrics

**Phase 0 Exit Criteria (from STRATEGIC_DEBT_PAYDOWN_PLAN.md):**
```bash
✅ All builds pass (API + Web)
✅ 0 TypeScript errors
✅ Ready for Phase 1 (Coverage Measurement)
```

**Verification Commands:**
```bash
# Must ALL return exit 0
pnpm --filter api build
pnpm --filter web build
pnpm --filter web lint
```

**Documentation:**
- [ ] `docs/DEBUGGING_SKILLS_INTEGRATION.md` created
- [ ] `history/debugging-skills-integration/completion-report.md` created
- [ ] `STRATEGIC_DEBT_PAYDOWN_PLAN.md` Phase 0 marked complete

---

## 🚀 Orchestrator Quick Start

**When ready to execute:**

1. Load orchestrator skill: `/skill orchestrator`
2. Read this plan: `Read("history/debugging-skills-integration/execution-plan.md")`
3. Initialize Agent Mail
4. Spawn 6 workers (1 sequential, then 3 parallel, then 1 sequential, then 1 final)
5. Monitor via epic thread: `debugging-skills-phase0`
6. Handle blockers
7. Verify Phase 0 complete

**Estimated Wall Time:** 3-4 hours (with parallelization)
