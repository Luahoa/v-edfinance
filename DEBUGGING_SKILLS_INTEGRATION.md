# Debugging Skills Integration Guide

**Version:** 1.0  
**Date:** 2026-01-04  
**Status:** Active - Integrated into V-EdFinance workflow

---

## 📚 Available Skills

### 1. systematic-debugging
**Location:** `.claude/skills/debugging/systematic-debugging/`  
**Description:** Four-phase debugging framework ensuring root cause investigation before fixes

**When to Use:**
- ANY bug, test failure, or unexpected behavior
- Build failures (current Phase 0 blockers)
- Performance problems
- Integration issues

**Phases:**
1. **Root Cause Investigation** - Read errors, reproduce, trace data flow
2. **Pattern Analysis** - Find working examples, compare differences
3. **Hypothesis & Testing** - Form theory, test minimally
4. **Implementation** - Create failing test → fix → verify

**Key Principle:** NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST

---

### 2. defense-in-depth
**Location:** `.claude/skills/debugging/defense-in-depth/`  
**Description:** Multi-layer validation making bugs structurally impossible

**When to Use:**
- After finding root cause (Phase 4 of systematic-debugging)
- Implementing fixes for data validation issues
- JSONB field access (current Type Safety blockers)
- Preventing regressions

**Four Layers:**
1. **Entry Point Validation** - Reject invalid input at API boundary
2. **Business Logic Validation** - Ensure data makes sense for operation
3. **Environment Guards** - Prevent dangerous operations in specific contexts
4. **Debug Instrumentation** - Capture context for forensics

**Example:**
```typescript
// Layer 1: Entry validation
if (!workingDirectory || workingDirectory.trim() === '') {
  throw new Error('workingDirectory cannot be empty');
}

// Layer 2: Business logic
if (!existsSync(workingDirectory)) {
  throw new Error(`Directory does not exist: ${workingDirectory}`);
}

// Layer 3: Environment guard
if (process.env.NODE_ENV === 'test' && !workingDirectory.startsWith(tmpdir())) {
  throw new Error('Refusing operation outside temp dir in tests');
}

// Layer 4: Debug logging
logger.debug('Operation started', { workingDirectory, stack: new Error().stack });
```

---

### 3. verification-before-completion
**Location:** `.claude/skills/debugging/verification-before-completion/`  
**Description:** Evidence-based completion claims - run verification before claiming success

**When to Use:**
- Before closing any bead
- Before claiming "tests pass", "build succeeds", "bug fixed"
- Before committing or creating PRs
- MANDATORY for all completion claims

**The Iron Law:**
```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

**The Gate Function:**
1. **IDENTIFY:** What command proves this claim?
2. **RUN:** Execute the FULL command (fresh, complete)
3. **READ:** Full output, check exit code, count failures
4. **VERIFY:** Does output confirm the claim?
5. **ONLY THEN:** Make the claim

**Example:**
```bash
# ❌ WRONG
"Build should pass now"
"Looks correct"

# ✅ CORRECT
pnpm --filter api build
# [output shows: exit 0, 0 errors]
"Build passes - verified with command output above"
```

---

### 4. root-cause-tracing
**Location:** `.claude/skills/debugging/root-cause-tracing/`  
**Description:** Backward tracing through call stacks to find original triggers

**When to Use:**
- Error deep in call stack
- Bad value passed from unknown origin
- Need to find where invalid data originated
- Part of systematic-debugging Phase 1

**Technique:**
1. Start at symptom (where error occurs)
2. Trace backward: What called this with bad value?
3. Continue up stack until you find source
4. Fix at source, not symptom

**Example:**
```
Error: "workingDirectory is empty" at git init
← WorkspaceManager.createWorkspace('')
← Project.create(name, '')
← Test setup with empty string
FIX: Validate at Project.create() entry point
```

---

## 🔗 Integration with Beads Workflow

### During Bead Execution

**1. Start Bead (Apply systematic-debugging Phase 1)**
```bash
bd update <bead-id> --status in_progress

# Root Cause Investigation:
# - Read error messages completely
# - Reproduce issue
# - Check recent changes (git diff)
# - Trace data flow (use root-cause-tracing)
```

**2. Work on Bead (Apply defense-in-depth)**
```typescript
// Implement fix with multi-layer validation
// Layer 1: Entry validation
// Layer 2: Business logic
// Layer 3: Environment guards
// Layer 4: Debug logging
```

**3. Complete Bead (Apply verification-before-completion)**
```bash
# MANDATORY: Run verification commands
pnpm --filter api build
# [Read full output]

# Attach evidence to close reason
bd close <bead-id> --reason "Build verified: exit 0, 0 errors (output attached)"
```

---

## 🤖 Integration with Amp Review Process

### Amp-Beads Workflow Script
**Location:** `scripts/amp-beads-workflow.ps1`

**Debugging Skills Integration Points:**

**1. Pre-flight Checks (verification-before-completion)**
```powershell
# Script runs tests BEFORE staging changes
pnpm test
# If tests fail → STOP (no Amp review needed)
```

**2. Code Review (systematic-debugging for Amp suggestions)**
```powershell
# Amp reviews diff
# If Amp suggests changes:
#   → Apply systematic-debugging to understand suggestion
#   → Implement with defense-in-depth
#   → Verify with verification-before-completion
```

**3. Git Commit (verification-before-completion)**
```powershell
# ONLY commit if:
# - Tests pass (verified)
# - Build succeeds (verified)
# - Amp approves (evidence-based)
```

**4. Beads Close (verification-before-completion)**
```powershell
# Close bead with evidence
bd close $TaskId --reason "Task complete - verified outputs attached"
```

**5. Beads Sync (defense-in-depth)**
```powershell
# Multi-layer safety:
# - Layer 1: Git commit succeeds
# - Layer 2: Beads task closed
# - Layer 3: Beads sync completes
# - Layer 4: Git push succeeds
```

---

## 🎯 Phase 0 Specific Applications

### Blocker 1: Schema Drift (20/33 errors)
**Skill:** systematic-debugging

**Phase 1: Root Cause Investigation**
```bash
# Read errors completely
pnpm --filter api build 2>&1 | grep "error TS"

# Trace data flow
# - Where are ModerationLog, Achievement referenced?
# - Why are they missing from schema?

# Check git history
git log --all --full-history -- apps/api/prisma/schema.prisma
```

**Phase 2: Pattern Analysis**
```prisma
// Find working models in schema
model User { ... }  // ✓ Works

// Compare against missing models
model ModerationLog { ... }  // ✗ Missing
```

**Phase 3: Hypothesis**
```
Hypothesis: "Models were never added to schema, causing TypeScript errors"
Test: Add models → run build → verify errors decrease
```

**Phase 4: Implementation (with defense-in-depth)**
```prisma
// Layer 1: Schema validation
npx prisma validate

// Layer 2: Generate types
npx prisma generate

// Layer 3: Build verification
pnpm --filter api build

// Layer 4: Migration logging
npx prisma migrate dev --name add_missing_models
```

---

### Blocker 2: JSONB Type Safety (7/33 errors)
**Skill:** defense-in-depth

**Multi-Layer Validation:**
```typescript
// Layer 1: Entry validation (ValidationService)
const validated = await ValidationService.validate('userMetadata', data);

// Layer 2: Business logic null checks
if (!user.metadata) {
  throw new Error('User metadata is null');
}

// Layer 3: Runtime default values
const locale = user.metadata.preferredLocale ?? 'vi';

// Layer 4: Debug logging
logger.debug('JSONB access', { 
  userId: user.id, 
  hasMetadata: !!user.metadata,
  locale 
});
```

---

### Blocker 3: Auth/Async Issues (6/33 errors)
**Skill:** root-cause-tracing

**Backward Tracing:**
```
Error: "Type mismatch in jwtService.sign()"
← AuthService.generateToken(payload, expiresIn?)
← LoginController.login()
← HTTP POST /auth/login

Root Cause: Ternary passes undefined instead of empty object
Fix: Always pass options object with default expiresIn
```

---

## 📋 Quick Reference Checklist

### Before Starting Any Bug Fix:
- [ ] Load systematic-debugging skill
- [ ] Complete Phase 1: Root Cause Investigation
- [ ] Complete Phase 2: Pattern Analysis
- [ ] Complete Phase 3: Hypothesis Testing
- [ ] NO FIXES until root cause identified

### When Implementing Fix:
- [ ] Apply defense-in-depth (4 layers)
- [ ] Create failing test first
- [ ] Implement single fix
- [ ] Run verification commands

### Before Closing Bead:
- [ ] Apply verification-before-completion
- [ ] Run ALL verification commands
- [ ] Read full output
- [ ] Attach evidence to close reason
- [ ] NO claims without evidence

### Beads Workflow Integration:
- [ ] Start: Root cause investigation
- [ ] Work: Defense-in-depth implementation
- [ ] Complete: Verification before completion
- [ ] Use amp-beads-workflow.ps1 script

---

## 🚫 Red Flags - STOP

If you catch yourself thinking:
- "Quick fix for now, investigate later" → STOP, use systematic-debugging
- "Build should pass now" → STOP, run verification-before-completion
- "Just try changing X" → STOP, complete root cause investigation
- "Looks correct" → STOP, provide evidence
- "One more fix attempt" (after 2+ failures) → STOP, question architecture

**ALL mean: Return to systematic-debugging Phase 1**

---

## 📊 Success Metrics

**From debugging sessions:**
- Systematic approach: 15-30 minutes to fix
- Random fixes: 2-3 hours thrashing
- First-time fix rate: 95% vs 40%
- New bugs introduced: Near zero vs common

**Phase 0 Target:**
- 33 build errors → 0 errors
- Using systematic-debugging for ALL fixes
- defense-in-depth for ALL implementations
- verification-before-completion for ALL claims

---

## 🔄 Continuous Improvement

**After Each Bead:**
1. Document what worked
2. Update this guide if new patterns emerge
3. Share learnings in beads close reason
4. Add examples to skills documentation

**After Phase 0:**
1. Measure actual time vs estimates
2. Count fixes requiring rework
3. Verify all skills applied correctly
4. Update AGENTS.md with lessons learned

---

## 📚 Related Documentation

- [Execution Plan](../history/debugging-skills-integration/execution-plan.md)
- [Strategic Debt Paydown Plan](../STRATEGIC_DEBT_PAYDOWN_PLAN.md)
- [Amp-Beads Integration Guide](./AMP_BEADS_INTEGRATION_GUIDE.md)
- [Beads Integration Deep Dive](../BEADS_INTEGRATION_DEEP_DIVE.md)
