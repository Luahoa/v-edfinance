# 🤖 Phase 0 Agent Deployment Plan
**Sub-Agent Orchestration for Emergency Stabilization**

**Based on:** [FEASIBILITY_ANALYSIS_REPORT.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/FEASIBILITY_ANALYSIS_REPORT.md)  
**Implements:** [TECHNICAL_DEBT_ELIMINATION_PLAN.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/TECHNICAL_DEBT_ELIMINATION_PLAN.md)  
**Date:** 2025-12-21  
**Status:** 🔴 READY FOR DEPLOYMENT

---

## ⚠️ CRITICAL LESSONS FROM 100-AGENT FAILURE

### What Went Wrong:
```
❌ 100 agents deployed in PARALLEL
❌ No build gates between waves
❌ Agents assumed schema exists
❌ No verification until end
━━━━━━━━━━━━━━━━━━━━━━━━━━━
   RESULT: 33 build errors
```

### What We'll Do Differently:
```
✅ Agents run SEQUENTIALLY
✅ Build verification after EACH agent
✅ Schema-first approach
✅ Incremental validation
━━━━━━━━━━━━━━━━━━━━━━━━━━━
   GOAL: 0 build errors
```

---

## 🎯 DEPLOYMENT STRATEGY

### Sequential Execution Model
```
Agent A01 → Verify → Agent A02 → Verify → Agent A03 → Verify → ...
            ✅                  ✅                  ✅

If ANY verify fails: STOP, rollback, fix manually
```

### Build Gate Protocol
After EVERY agent completes:
```bash
# 1. Build check
pnpm --filter api build 2>&1 | tee agent-AXX-build.log

# 2. Error count
grep "error TS" agent-AXX-build.log | wc -l

# 3. Success criteria
if [ $? -eq 0 ]; then
  echo "✅ Agent AXX PASSED"
  git add -A && git commit -m "fix: Agent AXX complete"
else
  echo "❌ Agent AXX FAILED - Manual intervention required"
  exit 1
fi
```

---

## 🤖 AGENT ROSTER

### Wave A: Schema Foundation (CRITICAL PATH)
**Agents:** 2  
**Duration:** 2 hours  
**Dependency:** NONE - must run first  
**Build Gate:** After EACH agent

#### Agent A01: Prisma Schema Architect
**Task:** Add `ModerationLog` model  
**Effort:** 1 hour  
**Priority:** 🔴 P0

**Deliverables:**
1. Add `ModerationLog` model to `apps/api/prisma/schema.prisma`
2. Add relations to `User` model
3. Run `npx prisma migrate dev --name add_moderation_log`
4. Run `npx prisma generate`
5. Verify build: `pnpm --filter api build`

**Success Criteria:**
- ✅ Migration file created
- ✅ Prisma client regenerated
- ✅ Build errors reduce by ~12 (moderationLog references)

**Verification Command:**
```bash
# Count errors before
BEFORE=$(pnpm --filter api build 2>&1 | grep "error TS" | wc -l)

# Run agent work
# ... agent executes ...

# Count errors after
AFTER=$(pnpm --filter api build 2>&1 | grep "error TS" | wc -l)

# Verify improvement
if [ $AFTER -lt $BEFORE ]; then
  echo "✅ Progress: $BEFORE → $AFTER errors"
else
  echo "❌ REGRESSION: $BEFORE → $AFTER errors"
  exit 1
fi
```

---

#### Agent A02: Achievement System Architect
**Task:** Add `Achievement` model  
**Effort:** 1 hour  
**Priority:** 🔴 P0  
**Depends on:** Agent A01 (must run after)

**Deliverables:**
1. Add `Achievement` model to schema
2. Add `UserAchievement` junction table
3. Add relation to `User` model
4. Run `npx prisma migrate dev --name add_achievement_system`
5. Run `npx prisma generate`
6. Verify build: `pnpm --filter api build`

**Success Criteria:**
- ✅ Migration file created
- ✅ Build errors reduce by ~8 (achievement references)
- ✅ Total errors now ~13 (from 33)

**Known Files to Update:**
- `apps/api/src/modules/gamification/sharing.service.ts` (uses `prisma.achievement`)
- `apps/api/src/modules/gamification/user-achievement.service.ts`

---

### Wave B: Type Safety Hardening (PARALLEL SAFE)
**Agents:** 3  
**Duration:** 1.5 hours  
**Dependency:** Wave A must complete first  
**Build Gate:** After ALL Wave B agents

**Note:** These agents can run in parallel since they touch different files.

#### Agent B01: Validation Service Fixer
**Task:** Fix `ZodError.errors` → `ZodError.issues`  
**Effort:** 30 minutes  
**Priority:** 🔴 P0

**Files to Edit:**
1. `apps/api/src/common/validation.service.ts` (Line ~128)

**Changes:**
```typescript
// Find all instances of:
result.error.errors

// Replace with:
result.error.issues
```

**Success Criteria:**
- ✅ Validation service builds
- ✅ Zod error handling correct
- ✅ 1-2 build errors resolved

**Verification:**
```bash
pnpm --filter api tsc --noEmit apps/api/src/common/validation.service.ts
```

---

#### Agent B02: AB Testing Safety Engineer
**Task:** Add null checks to JSONB payload access  
**Effort:** 30 minutes  
**Priority:** 🔴 P0

**Files to Edit:**
1. `apps/api/src/modules/analytics/ab-testing.service.ts`

**Pattern to Apply:**
```typescript
// Before:
const payload = assignment.payload as { variantId: string };
return payload.variantId;

// After:
if (!assignment.payload) return null;
const payload = assignment.payload as { variantId?: string };
return payload.variantId ?? null;
```

**Success Criteria:**
- ✅ All JSONB accesses null-checked
- ✅ 2-3 build errors resolved

---

#### Agent B03: Heatmap Service Hardener
**Task:** Fix heatmap JSONB validation  
**Effort:** 30 minutes  
**Priority:** 🔴 P0

**Files to Edit:**
1. `apps/api/src/modules/analytics/heatmap.service.ts`

**Pattern to Apply:**
```typescript
// Before:
const coords = log.payload.coordinates;

// After:
if (!log.payload || typeof log.payload !== 'object') continue;
const payload = log.payload as { coordinates?: { x: number; y: number } };
if (!payload.coordinates) continue;
const coords = payload.coordinates;
```

**Success Criteria:**
- ✅ Runtime safety improved
- ✅ 2-3 build errors resolved

---

### Wave C: Auth & Async Fixes (SEQUENTIAL)
**Agents:** 2  
**Duration:** 1 hour  
**Dependency:** Wave B must complete first  
**Build Gate:** After EACH agent

#### Agent C01: Auth JWT Engineer
**Task:** Fix JWT signature type mismatch  
**Effort:** 30 minutes  
**Priority:** 🔴 P0

**Files to Edit:**
1. `apps/api/src/auth/auth.service.ts` (Line ~147)

**Changes:**
```typescript
// Before:
const accessToken = this.jwtService.sign(
  payload,
  expiresIn ? { expiresIn } : undefined
);

// After:
const options = expiresIn ? { expiresIn } : {};
const accessToken = this.jwtService.sign(payload, options);
```

**Success Criteria:**
- ✅ Auth service builds
- ✅ JWT signing type-safe
- ✅ 3 build errors resolved

---

#### Agent C02: Async Promise Wrapper
**Task:** Fix missing Promise wrappers  
**Effort:** 30 minutes  
**Priority:** 🔴 P0

**Files to Edit:**
1. `apps/api/src/modules/gamification/social-proof.service.ts` (Line ~246)

**Changes:**
```typescript
// Before:
async checkUserAlignment(userId: string, action: string) {
  return this.calculateScore(userId, action);
}

// After:
async checkUserAlignment(userId: string, action: string): Promise<number> {
  return await this.calculateScore(userId, action);
}
```

**Pattern to Find:**
```bash
# Find async functions without await
grep -n "async.*{" apps/api/src/**/*.ts | \
  xargs -I {} sh -c 'grep -A 3 "{}" | grep -q "await" || echo "{}"'
```

**Success Criteria:**
- ✅ All async functions have proper return types
- ✅ All async calls use `await`
- ✅ 3 build errors resolved
- ✅ **API BUILD NOW PASSES (0 errors)**

---

### Wave D: Frontend Config (INDEPENDENT)
**Agents:** 1  
**Duration:** 30 minutes  
**Dependency:** Can run in parallel with Wave C  
**Build Gate:** After agent completes

#### Agent D01: Next-intl Config Creator
**Task:** Create missing i18n config  
**Effort:** 30 minutes  
**Priority:** 🔴 P0

**Files to Create:**
1. `apps/web/src/i18n/request.ts` (NEW FILE)

**Content:**
```typescript
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./locales/${locale}.json`)).default,
  timeZone: 'Asia/Ho_Chi_Minh',
  now: new Date()
}));
```

**Prerequisites Check:**
```bash
# Verify locale files exist
ls apps/web/src/i18n/locales/
# Should show: en.json, vi.json, zh.json

# If missing, create:
mkdir -p apps/web/src/i18n/locales
echo '{}' > apps/web/src/i18n/locales/vi.json
echo '{}' > apps/web/src/i18n/locales/en.json
echo '{}' > apps/web/src/i18n/locales/zh.json
```

**Success Criteria:**
- ✅ Config file created
- ✅ Web build passes
- ✅ No next-intl errors

**Verification:**
```bash
pnpm --filter web build
# Expected: ✅ Build successful
```

---

### Wave E: Final Verification (CRITICAL)
**Agents:** 1  
**Duration:** 1 hour  
**Dependency:** All previous waves must complete  
**Build Gate:** FINAL CERTIFICATION

#### Agent E01: Quality Assurance Validator
**Task:** Comprehensive build verification  
**Effort:** 1 hour  
**Priority:** 🔴 P0

**Deliverables:**
1. **Full Build Test:**
   ```bash
   pnpm build  # All workspaces
   ```

2. **Type Check:**
   ```bash
   cd apps/api && tsc --noEmit
   cd ../web && tsc --noEmit
   ```

3. **Lint Check:**
   ```bash
   pnpm --filter api lint
   pnpm --filter web lint
   ```

4. **Test Suite Smoke Test:**
   ```bash
   pnpm --filter api test
   # Verify: Tests CAN run (may have failures, that's Phase 1)
   ```

5. **Generate Build Report:**
   ```bash
   cat > PHASE0_BUILD_REPORT.md << EOF
   # Phase 0 Build Report
   
   **Date:** $(date)
   **Status:** ✅ COMPLETE
   
   ## Build Results
   - API Build: ✅ PASS (0 errors)
   - Web Build: ✅ PASS (0 errors)
   - Lint: ✅ PASS
   - Type Check: ✅ PASS
   - Test Suite: ✅ RUNNABLE
   
   ## Error Reduction
   - Baseline: 33 errors
   - After Wave A: ~13 errors
   - After Wave B: ~6 errors
   - After Wave C: 0 errors (API)
   - After Wave D: 0 errors (Web)
   - **FINAL: 0 ERRORS**
   
   ## Agents Deployed
   - A01: ModerationLog Model ✅
   - A02: Achievement Model ✅
   - B01: Validation Service ✅
   - B02: AB Testing Safety ✅
   - B03: Heatmap Service ✅
   - C01: Auth JWT ✅
   - C02: Async Promises ✅
   - D01: Next-intl Config ✅
   - E01: Quality Validator ✅
   
   ## Next Steps
   - Phase 1: Coverage Measurement
   - See: STRATEGIC_DEBT_PAYDOWN_PLAN.md
   EOF
   ```

**Success Criteria:**
- ✅ ALL builds pass
- ✅ 0 TypeScript errors
- ✅ Tests executable
- ✅ Report generated
- ✅ **READY FOR PHASE 1**

---

## 🔧 ORCHESTRATION SCRIPT

### Automated Deployment (Use with Caution)
```bash
#!/bin/bash
# File: deploy-phase0-agents.sh

set -e  # Exit on any error

WORKSPACE_ROOT="c:/Users/luaho/Demo project/v-edfinance"
cd "$WORKSPACE_ROOT"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper: Count build errors
count_errors() {
  pnpm --filter api build 2>&1 | grep "error TS" | wc -l
}

# Helper: Build gate
build_gate() {
  local agent_name=$1
  echo "${YELLOW}🔍 Build Gate: Verifying $agent_name${NC}"
  
  if pnpm --filter api build 2>&1 | tee "logs/${agent_name}-build.log" | grep -q "error TS"; then
    local error_count=$(grep "error TS" "logs/${agent_name}-build.log" | wc -l)
    echo "${RED}❌ $agent_name FAILED: $error_count errors remain${NC}"
    echo "See logs/${agent_name}-build.log for details"
    return 1
  else
    echo "${GREEN}✅ $agent_name PASSED: Build clean${NC}"
    return 0
  fi
}

# Setup
mkdir -p logs
BASELINE_ERRORS=$(count_errors)
echo "📊 Baseline: $BASELINE_ERRORS errors"

# WAVE A: Schema Foundation
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌊 WAVE A: Schema Foundation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Agent A01
echo "🤖 Deploying Agent A01: Prisma Schema Architect (ModerationLog)"
# MANUAL INTERVENTION POINT: Agent does work here
read -p "Press ENTER after Agent A01 completes..."
build_gate "A01" || exit 1
git add -A && git commit -m "fix(agent): A01 - Add ModerationLog model" || true

# Agent A02
echo "🤖 Deploying Agent A02: Achievement System Architect"
read -p "Press ENTER after Agent A02 completes..."
build_gate "A02" || exit 1
git add -A && git commit -m "fix(agent): A02 - Add Achievement model" || true

AFTER_WAVE_A=$(count_errors)
echo "📊 After Wave A: $AFTER_WAVE_A errors (was $BASELINE_ERRORS)"

# WAVE B: Type Safety (can parallelize)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌊 WAVE B: Type Safety Hardening"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "🤖 Deploying Wave B Agents (B01, B02, B03) in parallel..."
echo "Agent B01: Validation Service Fixer"
echo "Agent B02: AB Testing Safety Engineer"
echo "Agent B03: Heatmap Service Hardener"
read -p "Press ENTER after ALL Wave B agents complete..."
build_gate "WaveB" || exit 1
git add -A && git commit -m "fix(agent): Wave B - JSONB type safety" || true

AFTER_WAVE_B=$(count_errors)
echo "📊 After Wave B: $AFTER_WAVE_B errors"

# WAVE C: Auth & Async
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌊 WAVE C: Auth & Async Fixes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "🤖 Deploying Agent C01: Auth JWT Engineer"
read -p "Press ENTER after Agent C01 completes..."
build_gate "C01" || exit 1
git add -A && git commit -m "fix(agent): C01 - Auth JWT signature" || true

echo "🤖 Deploying Agent C02: Async Promise Wrapper"
read -p "Press ENTER after Agent C02 completes..."
build_gate "C02" || exit 1
git add -A && git commit -m "fix(agent): C02 - Async promises" || true

AFTER_WAVE_C=$(count_errors)
echo "📊 After Wave C: $AFTER_WAVE_C errors (SHOULD BE 0)"

# WAVE D: Frontend Config
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌊 WAVE D: Frontend Config"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "🤖 Deploying Agent D01: Next-intl Config Creator"
read -p "Press ENTER after Agent D01 completes..."
pnpm --filter web build 2>&1 | tee logs/D01-web-build.log
if [ $? -eq 0 ]; then
  echo "${GREEN}✅ Web build PASSED${NC}"
  git add -A && git commit -m "fix(agent): D01 - Next-intl config" || true
else
  echo "${RED}❌ Web build FAILED${NC}"
  exit 1
fi

# WAVE E: Final Verification
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌊 WAVE E: Final Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "🤖 Deploying Agent E01: Quality Assurance Validator"
read -p "Press ENTER after Agent E01 completes..."

# Final build check
pnpm build 2>&1 | tee logs/E01-final-build.log
if [ $? -eq 0 ]; then
  echo "${GREEN}✅✅✅ PHASE 0 COMPLETE! All builds pass! ✅✅✅${NC}"
  git add -A && git commit -m "feat(phase0): Complete - All builds green" || true
  git push
else
  echo "${RED}❌ Final build check FAILED${NC}"
  exit 1
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 PHASE 0 SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Baseline:   $BASELINE_ERRORS errors"
echo "After Wave A: $AFTER_WAVE_A errors"
echo "After Wave B: $AFTER_WAVE_B errors"
echo "After Wave C: $AFTER_WAVE_C errors"
echo "Final:      0 errors"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "${GREEN}🎉 READY FOR PHASE 1: Coverage Measurement${NC}"
```

**Usage:**
```bash
chmod +x deploy-phase0-agents.sh
./deploy-phase0-agents.sh
```

---

## 🧪 AGENT VERIFICATION PROTOCOL

### Per-Agent Verification Checklist
For EACH agent before marking "complete":

#### 1. Code Quality Check
```bash
# Lint the files changed
pnpm --filter api lint

# Type check
cd apps/api && tsc --noEmit
```

#### 2. Build Regression Test
```bash
# Before agent work
BEFORE=$(pnpm --filter api build 2>&1 | grep "error TS" | wc -l)

# After agent work
AFTER=$(pnpm --filter api build 2>&1 | grep "error TS" | wc -l)

# Verify improvement
if [ $AFTER -ge $BEFORE ]; then
  echo "❌ REGRESSION: Agent made it worse!"
  exit 1
fi
```

#### 3. File Integrity Check
```bash
# Verify no unintended changes
git diff --name-only

# Expected: Only files agent was supposed to touch
```

#### 4. Migration Safety (for Schema agents)
```bash
# Verify migration is reversible
npx prisma migrate dev --create-only

# Review migration SQL
cat prisma/migrations/*/migration.sql

# Check for destructive operations (DROP, DELETE)
grep -i "DROP\|DELETE" prisma/migrations/*/migration.sql
# Expected: No output (unless intentional)
```

#### 5. Documentation Update
```bash
# Agent must update agent log
echo "Agent AXX: [Task] - COMPLETE" >> PHASE0_AGENT_LOG.md
echo "  - Files changed: [list]" >> PHASE0_AGENT_LOG.md
echo "  - Errors reduced: $BEFORE → $AFTER" >> PHASE0_AGENT_LOG.md
echo "  - Verification: ✅ PASSED" >> PHASE0_AGENT_LOG.md
```

---

## 🚨 ROLLBACK PROCEDURES

### If Agent Fails Verification:
```bash
# 1. Immediately stop all agents
kill $(jobs -p)

# 2. Identify failing agent
echo "Agent AXX failed at: $(date)" >> PHASE0_INCIDENTS.md

# 3. Rollback changes
git reset --hard HEAD

# 4. Review agent task
cat PHASE0_AGENT_DEPLOYMENT_PLAN.md | grep -A 20 "Agent AXX"

# 5. Manual fix (do not re-deploy agent)
# Fix the issue manually
# Document in PHASE0_INCIDENTS.md

# 6. Resume from next agent
./deploy-phase0-agents.sh --resume-from AXX
```

### If Multiple Agents Fail:
```bash
# Nuclear option: Revert entire Phase 0
git reset --hard <commit-before-phase0>

# Switch to manual execution
# Follow TECHNICAL_DEBT_ELIMINATION_PLAN.md manually
```

---

## 📊 PROGRESS DASHBOARD

### Real-Time Monitoring
```bash
# Create monitoring dashboard
watch -n 10 '
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "PHASE 0 AGENT DEPLOYMENT"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Current Errors: $(pnpm --filter api build 2>&1 | grep "error TS" | wc -l)"
  echo "Agents Complete: $(git log --oneline | grep "fix(agent)" | wc -l) / 9"
  echo "Last Agent: $(git log -1 --oneline | grep "fix(agent)" | cut -d: -f2)"
  echo "Status: $(pnpm build > /dev/null 2>&1 && echo "✅ GREEN" || echo "❌ RED")"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
'
```

---

## 🎯 SUCCESS CRITERIA MATRIX

| Wave | Agents | Duration | Error Reduction | Build Status | Gate |
|------|--------|----------|-----------------|--------------|------|
| **A** | A01-A02 | 2h | 33 → 13 (~60%) | ⏳ Building | 🔴 MUST PASS |
| **B** | B01-B03 | 1.5h | 13 → 6 (~50%) | ⏳ Building | 🔴 MUST PASS |
| **C** | C01-C02 | 1h | 6 → 0 (100%) | ✅ API GREEN | 🔴 MUST PASS |
| **D** | D01 | 0.5h | N/A | ✅ WEB GREEN | 🔴 MUST PASS |
| **E** | E01 | 1h | 0 → 0 | ✅ ALL GREEN | 🟢 FINAL CERT |

**Total Duration:** 6 hours (with buffer)  
**Total Agents:** 9  
**Expected Outcome:** 0 build errors, Phase 1 ready

---

## 📚 AGENT TEMPLATES

### Agent Task Template
```markdown
# Agent [ID]: [Name]

## Mission
[One sentence description]

## Prerequisites
- [ ] Dependency agents complete
- [ ] Build baseline captured
- [ ] Files backed up

## Execution Steps
1. [Step 1]
2. [Step 2]
3. ...

## Verification
```bash
# Verification command
pnpm --filter api build
```

## Success Criteria
- [ ] Build improves
- [ ] No regressions
- [ ] Files committed

## Rollback
```bash
git reset --hard HEAD~1
```

## Handoff
Next agent: [ID]
```

---

## 🎖️ DEPLOYMENT AUTHORIZATION

**This plan is APPROVED for execution ONLY IF:**
- [ ] All team members reviewed this document
- [ ] Backup of current state created (`git branch phase0-backup`)
- [ ] Monitoring dashboard running
- [ ] Manual override available (kill switch)
- [ ] Rollback procedures tested

**Deployment Lead:** [Name]  
**Start Date/Time:** [YYYY-MM-DD HH:MM]  
**Expected Completion:** [YYYY-MM-DD HH:MM]

---

**🚀 READY TO DEPLOY?**  
**Start with Wave A - Agent A01**  
**See: [AGENT_VERIFICATION_PROTOCOL.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/AGENT_VERIFICATION_PROTOCOL.md)**
