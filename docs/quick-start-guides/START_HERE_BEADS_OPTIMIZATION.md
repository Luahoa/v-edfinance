# ✅ BEADS INTEGRATION COMPLETE - Optimization Roadmap

**Date:** 2025-12-23  
**Status:** 🟢 Ready to Execute  
**Beads Tasks Created:** 7/7 for PHASE-0  
**Next Action:** Start ved-6bdg (Fix Web Build - 5 minutes)

---

## 🎯 WHAT WAS ACCOMPLISHED

### 1. ✅ Comprehensive Project Audit
- **File Created:** [COMPREHENSIVE_AUDIT_AND_OPTIMIZATION_ROADMAP_2025-12-23.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/COMPREHENSIVE_AUDIT_AND_OPTIMIZATION_ROADMAP_2025-12-23.md)
- **Findings:**
  - 🔴 Web build broken (missing lucide-react)
  - 🔴 Database schema drift (Drizzle passwordHash mismatch)
  - 🔴 N+1 query patterns (30x slowdown in analytics)
  - 🟡 Test coverage 50.71% (need 80%+)
  - 🟡 200MB of temporary files to cleanup

### 2. ✅ Beads-Driven Workflow Created
- **File Created:** [BEADS_OPTIMIZATION_ROADMAP.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/BEADS_OPTIMIZATION_ROADMAP.md)
- **Workflow:** MANDATORY beads for all commits
- **Protocol:** amp-beads-workflow.ps1 script enforced

### 3. ✅ PHASE-0 Tasks in Beads (7 tasks)
```
✓ ved-6bdg: Fix Web Build - Add lucide-react (5m)
✓ ved-gdvp: Fix Schema Drift - Drizzle passwordHash (30m)
✓ ved-1y3c: Remove Unused Dependencies (10m)
✓ ved-ll5l: Add BehaviorLog Performance Indexes (1h)
✓ ved-08wy: Increase Connection Pool to 20 (5m)
✓ ved-3tl1: Archive Old Files Cleanup (30m)
✓ ved-o1cw: Verify All Builds Quality Gate (45m)
```

**Total PHASE-0 Time:** 3 hours 5 minutes

---

## 🚀 HOW TO START (Copy-Paste Commands)

### Session Start Protocol (MANDATORY):
```bash
# 1. Sync with remote
git pull --rebase

# 2. Sync beads
beads.exe sync

# 3. Health check
beads.exe doctor

# 4. View available tasks
beads.exe ready

# 5. View PHASE-0 tasks
beads.exe list --title-contains "PHASE-0" --status open

# 6. Claim first task
beads.exe update ved-6bdg --status in_progress
```

---

## 📋 TASK 1: Fix Web Build (ved-6bdg) - 5 minutes

### Problem:
```
Module not found: Can't resolve 'lucide-react'

Affected files:
- apps/web/src/app/[locale]/courses/[id]/lessons/[lessonId]/page.tsx
- apps/web/src/app/[locale]/dashboard/page.tsx
- apps/web/src/app/[locale]/leaderboard/page.tsx
- apps/web/src/app/[locale]/simulation/life/page.tsx
- apps/web/src/app/[locale]/simulation/page.tsx
```

### Solution:
```bash
# 1. Claim task
beads.exe update ved-6bdg --status in_progress

# 2. Add dependency
cd apps/web
pnpm add lucide-react

# 3. Verify build passes
pnpm build

# 4. Go back to root
cd ../..

# 5. Run tests
pnpm test

# 6. Complete via workflow (MANDATORY)
.\scripts\amp-beads-workflow.ps1 `
  -TaskId "ved-6bdg" `
  -Message "Added lucide-react dependency. Web build now passing."
```

### Expected Output:
```
✅ pnpm add lucide-react  → Package added
✅ pnpm build             → Build successful
✅ pnpm test              → Tests passing
✅ Workflow complete      → Task closed, changes pushed
```

---

## 🔐 MANDATORY WORKFLOW RULES

### ❌ BANNED (DO NOT DO):
```bash
# NEVER do these anymore:
git add -A && git commit -m "..."  # ❌ NO BEADS TRACKING
git push                           # ❌ NO TASK CLOSURE
Click "Commit All" in VSCode       # ❌ BYPASSES WORKFLOW
```

### ✅ REQUIRED (ALWAYS DO):
```bash
# ALWAYS use workflow script:
.\scripts\amp-beads-workflow.ps1 -TaskId "ved-XXX" -Message "..."

# Script automatically:
# 1. Runs tests
# 2. Generates diff for Amp review
# 3. Commits (after approval)
# 4. Closes beads task
# 5. Syncs metadata
# 6. Pushes to remote
```

### 🤖 Auto-Regenerate Mode (Recommended for AI agents):
```bash
# Automatically regenerates code based on Amp feedback:
.\scripts\amp-auto-workflow.ps1 `
  -TaskId "ved-XXX" `
  -Message "..."

# Up to 3 iterations of code regeneration
# Commits only when Amp approves
```

---

## 📊 PHASE-0 EXECUTION PLAN (3 hours)

### Task Sequence:
```
ved-6bdg (5m)  → Fix Web Build
ved-gdvp (30m) → Fix Schema Drift
ved-1y3c (10m) → Remove Dependencies
ved-ll5l (1h)  → Add DB Indexes
ved-08wy (5m)  → Increase Connection Pool
ved-3tl1 (30m) → Archive Files
ved-o1cw (45m) → Verify Builds
```

### Success Criteria:
```bash
# At end of PHASE-0:
✅ pnpm --filter api build  # PASSING
✅ pnpm --filter web build  # PASSING
✅ All 7 PHASE-0 tasks completed in beads
✅ All changes pushed to remote
✅ beads.exe doctor passing
```

---

## 🗺️ FUTURE PHASES (Week 2-4)

### PHASE-1: Database Optimization (16h)
**Create tasks:**
```bash
beads.exe create "PHASE-1: Fix N+1 Query in MetricsService" --type task --priority 1 --estimate 240
beads.exe create "PHASE-1: Parallelize NudgeScheduler" --type task --priority 1 --estimate 120
beads.exe create "PHASE-1: Enable pg_stat_statements" --type task --priority 1 --estimate 30
beads.exe create "PHASE-1: Drizzle Schema Sync" --type task --priority 1 --estimate 180
beads.exe create "PHASE-1: Migrate BehaviorLog to Drizzle" --type task --priority 1 --estimate 300
```

### PHASE-2: Test Coverage (20h)
**Target:** 50.71% → 75%+ coverage

### PHASE-3: Performance (12h)
**Target:** <200ms p95 latency

### PHASE-4: Production Deployment (8h)
**Target:** VPS staging + production live

---

## 📚 KEY DOCUMENTATION

**Essential Reading:**
1. [COMPREHENSIVE_AUDIT_AND_OPTIMIZATION_ROADMAP_2025-12-23.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/COMPREHENSIVE_AUDIT_AND_OPTIMIZATION_ROADMAP_2025-12-23.md) - Complete audit + roadmap
2. [BEADS_OPTIMIZATION_ROADMAP.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/BEADS_OPTIMIZATION_ROADMAP.md) - Beads workflow guide
3. [AGENTS.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/AGENTS.md) - Project conventions

**Workflow Scripts:**
- [scripts/amp-beads-workflow.ps1](file:///c:/Users/luaho/Demo%20project/v-edfinance/scripts/amp-beads-workflow.ps1) - Manual review workflow
- [scripts/amp-auto-workflow.ps1](file:///c:/Users/luaho/Demo%20project/v-edfinance/scripts/amp-auto-workflow.ps1) - Auto-regenerate workflow

---

## 🎯 NEXT STEPS (In Order)

### 1. Start PHASE-0 Task 1 (NOW - 5 minutes)
```bash
beads.exe update ved-6bdg --status in_progress
cd apps/web && pnpm add lucide-react && pnpm build
cd ../.. && pnpm test
.\scripts\amp-beads-workflow.ps1 -TaskId "ved-6bdg" -Message "Web build fixed"
```

### 2. Continue to Task 2 (30 minutes)
```bash
beads.exe ready  # Shows ved-gdvp as next task
beads.exe update ved-gdvp --status in_progress
# Fix schema drift (see roadmap doc for details)
```

### 3. Complete All PHASE-0 (3 hours total)
- Work through all 7 tasks sequentially
- Use beads workflow for every task
- Verify quality gates at end

### 4. Create PHASE-1 Tasks (Week 2)
- After PHASE-0 complete
- Create database optimization tasks
- Start N+1 query fixes

---

## ✅ SESSION COMPLETION CHECKLIST

**Before ending work session:**
- [ ] All claimed tasks completed or updated
- [ ] All changes committed via amp-beads-workflow
- [ ] `git status` shows "up to date with origin"
- [ ] `beads.exe doctor` passing
- [ ] `beads.exe sync` completed
- [ ] No orphaned work (check `beads.exe ready`)

---

## 🔥 QUICK REFERENCE COMMANDS

```bash
# View all PHASE-0 tasks
beads.exe list --title-contains "PHASE-0"

# View ready work
beads.exe ready

# Claim a task
beads.exe update ved-XXX --status in_progress

# Complete a task (MANDATORY workflow)
.\scripts\amp-beads-workflow.ps1 -TaskId "ved-XXX" -Message "..."

# Health check
beads.exe doctor

# Sync with remote
beads.exe sync

# View task details
beads.exe show ved-XXX
```

---

**Created:** 2025-12-23  
**Status:** 🟢 READY TO EXECUTE  
**First Task:** ved-6bdg (Fix Web Build - 5 min)  
**Workflow:** MANDATORY beads integration enforced
