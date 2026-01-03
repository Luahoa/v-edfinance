# 🎯 Beads-Driven Optimization Roadmap

**Epic:** V-EdFinance Complete Optimization & Deployment  
**Timeline:** 4 weeks (56 hours)  
**Tracking:** All tasks managed via beads CLI  
**Workflow:** MANDATORY beads integration at every step

---

## 📋 BEADS TASK STRUCTURE

### Epic Hierarchy:
```
VED-EPIC-OPT (Parent Epic - 4 weeks)
├── PHASE-0: Emergency Fixes (3 hours)
│   ├── ved-opt-001: Fix Web Build - Add lucide-react
│   ├── ved-opt-002: Fix Schema Drift - Update Drizzle
│   ├── ved-opt-003: Remove Unused Dependencies
│   ├── ved-opt-004: Add Performance Indexes
│   ├── ved-opt-005: Increase Connection Pool
│   ├── ved-opt-006: Archive Old Files
│   └── ved-opt-007: Verify All Builds
│
├── PHASE-1: Database Optimization (16 hours)
│   ├── ved-opt-101: Fix N+1 Query - MetricsService
│   ├── ved-opt-102: Parallelize NudgeScheduler
│   ├── ved-opt-103: Enable pg_stat_statements
│   ├── ved-opt-104: Complete Drizzle Schema Sync
│   └── ved-opt-105: Migrate BehaviorLog to Drizzle
│
├── PHASE-2: Test Coverage Expansion (20 hours)
│   ├── ved-opt-201: Fix E2E Test Seeds
│   ├── ved-opt-202: Re-enable Skipped Tests
│   ├── ved-opt-203: Add Health Module Tests
│   ├── ved-opt-204: Add Audit Module Tests
│   └── ved-opt-205: Add WebSocket Tests
│
├── PHASE-3: Performance Tuning (12 hours)
│   ├── ved-opt-301: Implement Redis Caching
│   ├── ved-opt-302: Partition BehaviorLog Table
│   └── ved-opt-303: Run Load Testing
│
└── PHASE-4: Production Deployment (8 hours)
    ├── ved-opt-401: VPS Database Setup
    ├── ved-opt-402: Deploy to Staging
    ├── ved-opt-403: Deploy to Production
    └── ved-opt-404: Post-Deployment Monitoring
```

---

## 🔧 BEADS COMMANDS REFERENCE

### Session Start Protocol (MANDATORY):
```bash
# 1. Sync with remote
git pull --rebase

# 2. Sync beads metadata
./beads.exe sync

# 3. Health check
./beads.exe doctor

# 4. Find available work
./beads.exe ready

# 5. Check current phase
./beads.exe list --title-contains "PHASE-0" --status open
```

### Task Lifecycle:
```bash
# Claim a task
./beads.exe update ved-opt-001 --status in_progress

# Work on task...
# ... make changes ...
# ... write tests ...

# Complete task (use workflow script - MANDATORY)
./scripts/amp-beads-workflow.ps1 `
  -TaskId "ved-opt-001" `
  -Message "Added lucide-react dependency, web build now passing"

# Script automatically:
# 1. Runs tests
# 2. Pauses for Amp review
# 3. Git commits
# 4. Closes beads task
# 5. Syncs metadata
# 6. Pushes to remote
```

### Session End Protocol (MANDATORY):
```bash
# 1. Verify no orphaned work
./beads.exe ready

# 2. Health check
./beads.exe doctor

# 3. Ensure all changes pushed
git status  # Should show "up to date with origin"
```

---

## 📝 TASK CREATION COMMANDS

### Create PHASE-0 Tasks (Copy-Paste):
```bash
# Epic parent
./beads.exe create "Epic: V-EdFinance Complete Optimization" `
  --type epic `
  --priority 0 `
  --estimate "56h"

# Get epic ID (assume ved-epic-opt)

# PHASE-0 Tasks (P0 - Critical)
./beads.exe create "PHASE-0: Fix Web Build - Add lucide-react" `
  --type task `
  --priority 0 `
  --estimate "5m" `
  --deps "discovered-from:ved-epic-opt"

./beads.exe create "PHASE-0: Fix Schema Drift - Update Drizzle passwordHash" `
  --type task `
  --priority 0 `
  --estimate "30m" `
  --deps "discovered-from:ved-epic-opt"

./beads.exe create "PHASE-0: Remove Unused Dependencies (next/react)" `
  --type task `
  --priority 0 `
  --estimate "10m" `
  --deps "discovered-from:ved-epic-opt"

./beads.exe create "PHASE-0: Add Performance Indexes to BehaviorLog" `
  --type task `
  --priority 0 `
  --estimate "1h" `
  --deps "discovered-from:ved-epic-opt"

./beads.exe create "PHASE-0: Increase DB Connection Pool to 20" `
  --type task `
  --priority 0 `
  --estimate "5m" `
  --deps "discovered-from:ved-epic-opt"

./beads.exe create "PHASE-0: Archive Old Files - Cleanup Root" `
  --type task `
  --priority 0 `
  --estimate "30m" `
  --deps "discovered-from:ved-epic-opt"

./beads.exe create "PHASE-0: Verify All Builds - API + Web" `
  --type task `
  --priority 0 `
  --estimate "45m" `
  --deps "discovered-from:ved-epic-opt,blocks:ved-opt-101"
```

### Create PHASE-1 Tasks:
```bash
# PHASE-1 Tasks (Database Optimization)
./beads.exe create "PHASE-1: Fix N+1 Query Pattern in MetricsService" `
  --type task `
  --priority 1 `
  --estimate "4h" `
  --deps "discovered-from:ved-epic-opt,blocked-by:ved-opt-007"

./beads.exe create "PHASE-1: Parallelize NudgeScheduler Processing" `
  --type task `
  --priority 1 `
  --estimate "2h" `
  --deps "discovered-from:ved-epic-opt,blocked-by:ved-opt-007"

./beads.exe create "PHASE-1: Enable pg_stat_statements on VPS" `
  --type task `
  --priority 1 `
  --estimate "30m" `
  --deps "discovered-from:ved-epic-opt"

./beads.exe create "PHASE-1: Complete Drizzle Schema Sync (1:1 Prisma)" `
  --type task `
  --priority 1 `
  --estimate "3h" `
  --deps "discovered-from:ved-epic-opt,blocked-by:ved-opt-002"

./beads.exe create "PHASE-1: Migrate BehaviorLog to Drizzle" `
  --type task `
  --priority 1 `
  --estimate "5h" `
  --deps "discovered-from:ved-epic-opt,blocked-by:ved-opt-104"
```

### Create PHASE-2 Tasks:
```bash
# PHASE-2 Tasks (Test Coverage)
./beads.exe create "PHASE-2: Fix E2E Test Database Seeds" `
  --type task `
  --priority 1 `
  --estimate "4h" `
  --deps "discovered-from:ved-epic-opt,blocked-by:ved-opt-007"

./beads.exe create "PHASE-2: Re-enable 15 Skipped E2E Tests" `
  --type task `
  --priority 1 `
  --estimate "4h" `
  --deps "discovered-from:ved-epic-opt,blocked-by:ved-opt-201"

./beads.exe create "PHASE-2: Add Health Module Tests (0% → 80%)" `
  --type task `
  --priority 1 `
  --estimate "1h" `
  --deps "discovered-from:ved-epic-opt"

./beads.exe create "PHASE-2: Add Audit Module Tests (0% → 70%)" `
  --type task `
  --priority 1 `
  --estimate "3h" `
  --deps "discovered-from:ved-epic-opt"

./beads.exe create "PHASE-2: Add WebSocket Module Tests (0% → 70%)" `
  --type task `
  --priority 1 `
  --estimate "2h" `
  --deps "discovered-from:ved-epic-opt"

./beads.exe create "PHASE-2: Add Integration Tests - Database/Storage" `
  --type task `
  --priority 2 `
  --estimate "4h" `
  --deps "discovered-from:ved-epic-opt"

./beads.exe create "PHASE-2: Add DTO Validation Tests (Courses)" `
  --type task `
  --priority 2 `
  --estimate "2h" `
  --deps "discovered-from:ved-epic-opt"
```

### Create PHASE-3 Tasks:
```bash
# PHASE-3 Tasks (Performance)
./beads.exe create "PHASE-3: Implement Redis Caching Layer" `
  --type task `
  --priority 2 `
  --estimate "4h" `
  --deps "discovered-from:ved-epic-opt,blocked-by:ved-opt-105"

./beads.exe create "PHASE-3: Partition BehaviorLog by Month" `
  --type task `
  --priority 2 `
  --estimate "4h" `
  --deps "discovered-from:ved-epic-opt,blocked-by:ved-opt-105"

./beads.exe create "PHASE-3: Run Vegeta Load Testing (1000 users)" `
  --type task `
  --priority 2 `
  --estimate "4h" `
  --deps "discovered-from:ved-epic-opt,blocked-by:ved-opt-301,ved-opt-302"
```

### Create PHASE-4 Tasks:
```bash
# PHASE-4 Tasks (Production Deployment)
./beads.exe create "PHASE-4: VPS Database Extensions Setup" `
  --type task `
  --priority 0 `
  --estimate "2h" `
  --deps "discovered-from:ved-epic-opt,blocked-by:ved-opt-303"

./beads.exe create "PHASE-4: Deploy API to Staging (Dokploy)" `
  --type task `
  --priority 0 `
  --estimate "2h" `
  --deps "discovered-from:ved-epic-opt,blocked-by:ved-opt-401"

./beads.exe create "PHASE-4: Deploy Web to Production (Cloudflare)" `
  --type task `
  --priority 0 `
  --estimate "2h" `
  --deps "discovered-from:ved-epic-opt,blocked-by:ved-opt-402"

./beads.exe create "PHASE-4: Post-Deployment Monitoring (24h)" `
  --type task `
  --priority 0 `
  --estimate "2h" `
  --deps "discovered-from:ved-epic-opt,blocked-by:ved-opt-403"
```

---

## 🔥 MANDATORY WORKFLOW ENFORCEMENT

### Rule 1: NO COMMITS WITHOUT BEADS
**Old (BANNED):**
```bash
❌ git add -A && git commit -m "fixed stuff"
❌ Click "Commit All" in VSCode
❌ Manual git push
```

**New (MANDATORY):**
```bash
✅ ./scripts/amp-beads-workflow.ps1 -TaskId "ved-opt-XXX" -Message "..."
```

**Auto-workflow (RECOMMENDED for agents):**
```bash
✅ ./scripts/amp-auto-workflow.ps1 -TaskId "ved-opt-XXX" -Message "..."
# Auto-regenerates code based on Amp review (up to 3 iterations)
```

---

### Rule 2: EVERY SESSION = BEADS SYNC

**Session Start Checklist:**
```bash
[ ] git pull --rebase
[ ] ./beads.exe sync           # ← SYNC FIRST
[ ] ./beads.exe doctor         # ← VERIFY HEALTH
[ ] ./beads.exe ready          # ← FIND WORK
[ ] ./beads.exe update ved-XXX --status in_progress  # ← CLAIM TASK
```

**Session End Checklist:**
```bash
[ ] ./scripts/amp-beads-workflow.ps1  # ← COMPLETE TASK
[ ] ./beads.exe ready                 # ← CHECK FOR MORE WORK
[ ] ./beads.exe doctor                # ← VERIFY HEALTH
[ ] git status                        # ← MUST BE CLEAN
```

---

### Rule 3: TASK DEPENDENCIES ENFORCED

**Example Workflow:**
```bash
# Task ved-opt-002 depends on ved-opt-001
./beads.exe update ved-opt-001 --status in_progress

# Fix web build...
./scripts/amp-beads-workflow.ps1 -TaskId "ved-opt-001" -Message "Added lucide-react"

# Now ved-opt-002 becomes available
./beads.exe ready  # Shows ved-opt-002 as unblocked

# Claim next task
./beads.exe update ved-opt-002 --status in_progress
```

---

## 📊 PROGRESS TRACKING

### View Progress by Phase:
```bash
# PHASE-0 Progress
./beads.exe list --title-contains "PHASE-0" --status all

# PHASE-1 Progress
./beads.exe list --title-contains "PHASE-1" --status all

# All open tasks
./beads.exe ready

# Blocked tasks
./beads.exe list --status blocked
```

### Generate Progress Report:
```bash
# Export to markdown
./beads.exe list --format json > beads_progress.json

# View epic tree
./beads.exe show ved-epic-opt
```

---

## 🎯 FIRST TASK WALKTHROUGH

### Step-by-Step: ved-opt-001 (Fix Web Build)

**1. Start Session:**
```bash
git pull --rebase
./beads.exe sync
./beads.exe doctor
./beads.exe ready
```

**2. Claim Task:**
```bash
./beads.exe update ved-opt-001 --status in_progress
```

**3. Execute Fix:**
```bash
cd apps/web
pnpm add lucide-react
pnpm build  # Verify passes
```

**4. Run Tests:**
```bash
cd ../..
pnpm test  # Ensure nothing broken
```

**5. Complete via Workflow:**
```powershell
.\scripts\amp-beads-workflow.ps1 `
  -TaskId "ved-opt-001" `
  -Message "Added lucide-react dependency to apps/web. Web build now passing. Verified no breaking changes via test suite."

# Script flow:
# 1. Runs: pnpm test
# 2. Stages changes: git add -A
# 3. Generates diff for Amp review
# 4. [PAUSE] User reviews Amp suggestions
# 5. If approved: git commit
# 6. Closes beads task: ./beads.exe close ved-opt-001
# 7. Syncs metadata: ./beads.exe sync
# 8. Pushes: git push
```

**6. Verify:**
```bash
git status  # Should show "up to date with origin"
./beads.exe show ved-opt-001  # Should show status: completed
./beads.exe ready  # Next task (ved-opt-002) should now be available
```

---

## 🔐 QUALITY GATES (Beads-Enforced)

### Pre-Task Gates:
```bash
# Before claiming any task:
./beads.exe doctor  # Must pass 27/32 checks minimum

# Check dependencies:
./beads.exe show ved-opt-XXX  # Verify no blockers
```

### Mid-Task Gates:
```bash
# Every 30 minutes of work:
pnpm --filter api build   # Must pass
pnpm --filter web build   # Must pass

# Every hour:
pnpm test  # Must have no new failures
```

### Post-Task Gates:
```bash
# Before calling amp-beads-workflow:
pnpm --filter api build   # MUST PASS
pnpm --filter web build   # MUST PASS
pnpm test                 # MUST PASS

# After workflow completes:
git status                # MUST show "up to date"
./beads.exe doctor        # MUST pass
```

---

## 🚀 PHASE-0 EXECUTION PLAN (Today)

### Task Sequence (3 hours):
```
ved-opt-001 (5m)  → ved-opt-002 (30m) → ved-opt-003 (10m) →
ved-opt-004 (1h)  → ved-opt-005 (5m)  → ved-opt-006 (30m) →
ved-opt-007 (45m)
```

### Parallel Execution (if multiple agents):
```
Agent 1: ved-opt-001 + ved-opt-003 + ved-opt-005
Agent 2: ved-opt-002 + ved-opt-004
Agent 3: ved-opt-006 + ved-opt-007
```

### Success Criteria:
```bash
# At end of PHASE-0:
pnpm --filter api build   # ✅ PASSING
pnpm --filter web build   # ✅ PASSING
./beads.exe list --title-contains "PHASE-0" --status completed  # 7/7 tasks
git log --oneline -7      # 7 commits (one per task)
```

---

## 📈 METRICS DASHBOARD

### Track via Beads:
```bash
# Velocity (tasks/week)
./beads.exe list --status completed --since 7d | wc -l

# Completion rate
./beads.exe list --title-contains "PHASE-0" --status completed | wc -l
# Divide by total tasks (7)

# Blocked tasks (should be 0)
./beads.exe list --status blocked | wc -l

# Epic progress
./beads.exe show ved-epic-opt
# Check completed vs total subtasks
```

---

## 🛡️ ANTI-HALLUCINATION PROTOCOL

### Beads-Enforced Rules:
1. **Always verify task exists before claiming:**
   ```bash
   ./beads.exe show ved-opt-XXX  # Must return valid task
   ```

2. **Always check dependencies:**
   ```bash
   ./beads.exe show ved-opt-XXX  # Check "blocked by" field
   ```

3. **Always run quality gates before closing:**
   ```bash
   pnpm --filter api build && pnpm --filter web build && pnpm test
   # Only close if all pass
   ```

4. **Always use workflow script (never manual commit):**
   ```bash
   ./scripts/amp-beads-workflow.ps1  # MANDATORY
   ```

---

## 📚 DOCUMENTATION UPDATES

### AGENTS.md Integration:
This roadmap should be referenced in AGENTS.md under:
- **Current Focus** section
- **Beads Task Management** section
- **Landing the Plane** session completion

### New Handoff Template:
```markdown
# Thread Handoff - [Phase Name]

**Current Beads Epic:** ved-epic-opt
**Phase:** PHASE-X
**Tasks Completed:** X/Y
**Next Task:** ved-opt-XXX

## Quick Start:
\`\`\`bash
./beads.exe sync
./beads.exe ready
./beads.exe update ved-opt-XXX --status in_progress
\`\`\`

## Exit Criteria:
- [ ] All PHASE-X tasks completed
- [ ] ./beads.exe doctor passing
- [ ] git status clean
```

---

**Created:** 2025-12-23  
**Status:** 🟢 READY FOR EXECUTION  
**First Task:** ved-opt-001 (Fix Web Build - 5 min)  
**Workflow:** MANDATORY beads integration at every step
