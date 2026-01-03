# 🧹 V-EdFinance Cleanup - Execution Ready Plan
**Date:** 2026-01-04  
**Status:** ✅ **READY TO EXECUTE**  
**Estimated Time:** 2 hours (automated)

---

## 📊 CURRENT STATE ANALYSIS

### Root Directory Audit
```
Total Files in Root:    ~180 files
├─ Markdown (.md):      ~65 files
├─ Batch (.bat):        ~45 files  
├─ PowerShell (.ps1):   ~15 files
├─ Text/Logs (.txt):    ~20 files
├─ Config (.json):      ~10 files
└─ Other:               ~25 files

Target After Cleanup:   15 core files
Reduction:              ~165 files (92%)
```

### Files by Category

**Historical Reports (47 files) → Archive:**
- WAVE reports, SESSION handoffs, AUDIT reports
- MVP launch reports, COMPLETION reports
- CLEANUP reports, PROJECT status docs

**Test Outputs (15 files) → Consolidate:**
- test_output*.txt (10 files)
- coverage_*.txt (5 files)

**Automation Scripts (45 files) → Organize:**
- INSTALL_*.bat/ps1 (12 files)
- FIX_*.bat (10 files)
- RUN_*TESTS.bat (8 files)
- VPS_*, DEPLOY_* (10 files)
- START_*, STOP_* (5 files)

**Temp Files (20 files) → Delete:**
- temp_*.ts/txt/py (8 files)
- *.log (5 files)
- Misc temp files (7 files)

**Documentation (25 files) → Consolidate:**
- DATABASE_*.md, BEADS_*.md
- AI_SYSTEM_*.md, SCHEMA_*.md

---

## 🚀 AUTOMATED EXECUTION PLAN

### ✅ SCRIPT CREATED: `scripts/cleanup/EXECUTE_CLEANUP_NOW.ps1`

This PowerShell script automates ALL cleanup phases:

1. **Phase 1**: Safety checks (git status, backup)
2. **Phase 2**: Archive 47 historical reports
3. **Phase 3**: Consolidate 15 test outputs
4. **Phase 4**: Organize 45 automation scripts
5. **Phase 5**: Delete 20 temp files
6. **Phase 6**: Consolidate 25 documentation files
7. **Phase 7**: Generate final report

---

## 🎯 EXECUTION STEPS (2 Minutes Setup + Auto)

### Step 1: Pre-Flight Safety (Manual - 2 min)
```powershell
# Navigate to project root
cd "c:\Users\luaho\Demo project\v-edfinance"

# Commit any pending work
git status
git add -A
git commit -m "chore: Pre-cleanup checkpoint"

# Create cleanup branch (recommended)
git checkout -b cleanup/automated-2026-01-04
```

### Step 2: Dry Run (Automatic - 30 sec)
```powershell
# Review what will happen (NO changes made)
.\scripts\cleanup\EXECUTE_CLEANUP_NOW.ps1 -DryRun
```

**Review Output:**
- Check each "Would move/delete" line
- Verify no critical files targeted
- Confirm archive structure is correct

### Step 3: Execute Cleanup (Automatic - 1 min)
```powershell
# Execute LIVE cleanup
.\scripts\cleanup\EXECUTE_CLEANUP_NOW.ps1 -DryRun:$false
```

**Script will:**
- Create `docs/archive/` structure
- Move files to appropriate locations
- Rename scripts to kebab-case
- Delete temp files
- Generate final report

### Step 4: Verification (Manual - 5 min)
```powershell
# 1. Check root directory (should be ~15 files)
ls *.md | Measure-Object

# 2. Verify builds still work
pnpm --filter api build
pnpm --filter web build

# 3. Run tests
pnpm test

# 4. Check git status
git status
```

### Step 5: Commit & Merge (Manual - 2 min)
```powershell
# If all checks pass:
git add -A
git commit -m "chore: Automated project cleanup - 92% root reduction"

# Push to remote
git push origin cleanup/automated-2026-01-04

# Merge to main (or create PR)
git checkout main
git merge cleanup/automated-2026-01-04
git push origin main
```

---

## 📁 NEW DIRECTORY STRUCTURE

### After Cleanup:
```
v-edfinance/
├─ 📄 Core Files (15 files - KEEP IN ROOT)
│  ├─ AGENTS.md
│  ├─ SPEC.md
│  ├─ README.md
│  ├─ ARCHITECTURE.md
│  ├─ STRATEGIC_DEBT_PAYDOWN_PLAN.md
│  ├─ TEST_COVERAGE_BASELINE.md
│  ├─ package.json
│  ├─ tsconfig.json
│  ├─ turbo.json
│  ├─ biome.json
│  ├─ pnpm-workspace.yaml
│  ├─ vitest.config.ts
│  ├─ playwright.config.ts
│  ├─ .gitignore
│  └─ .npmrc
│
├─ 📦 docs/
│  ├─ archive/
│  │  ├─ 2025-12/
│  │  │  └─ wave-reports/ (WAVE*.bat)
│  │  └─ 2026-01/
│  │     ├─ session-reports/ (THREAD_HANDOFF*.md)
│  │     ├─ audit-reports/ (PROJECT_AUDIT*.md)
│  │     ├─ completion-reports/ (MVP_LAUNCH*.md)
│  │     └─ cleanup-reports/ (CLEANUP_*.md)
│  ├─ database/ (DATABASE_*.md, SCHEMA_*.md)
│  ├─ beads/ (BEADS_*.md)
│  ├─ deployment/ (VPS_*.md)
│  └─ ai-optimization/ (AI_SYSTEM_*.md)
│
├─ 🛠️ scripts/
│  ├─ setup/ (install-*.bat, setup-*.bat)
│  ├─ fix/ (fix-*.bat, nuclear-reset.bat)
│  ├─ test/ (run-tests.bat, verify-*.bat)
│  ├─ deploy/ (vps-*.bat, r2-*.bat)
│  ├─ dev/ (start-*.bat, restart-*.bat)
│  ├─ monitoring/ (monitoring-*.bat)
│  └─ cleanup/ (EXECUTE_CLEANUP_NOW.ps1)
│
└─ 🧪 test-results/
   ├─ unit/
   │  └─ archive/ (test_output*.txt)
   └─ coverage/
      └─ archive/ (coverage_*.txt)
```

---

## ✅ SUCCESS CRITERIA

### Quantitative:
- ✅ Root .md files: ≤ 15
- ✅ Root .bat files: 0
- ✅ Root .ps1 files: 0
- ✅ Temp files: 0
- ✅ Test suite: Still 98.7%+ passing
- ✅ Builds: 0 errors

### Qualitative:
- ✅ Clean root directory
- ✅ Organized docs/ hierarchy
- ✅ Scripts in logical categories
- ✅ Zero knowledge loss
- ✅ Git history preserved

---

## 🚨 SAFETY FEATURES

### Built-in Safeguards:
1. **Git Check**: Refuses to run if uncommitted changes (unless -Force)
2. **Dry Run Default**: Must explicitly set -DryRun:$false
3. **Backup Creation**: Creates timestamped backup before execution
4. **Non-Destructive**: Moves to archive, rarely deletes
5. **Rollback**: `git reset --hard` to undo if needed

### Rollback Plan:
```powershell
# If cleanup goes wrong:
git reset --hard HEAD~1  # Undo last commit
git clean -fd            # Remove untracked files
git checkout main        # Return to main branch
```

---

## 🎯 QUICK START (TL;DR)

```powershell
# 1. Navigate to project
cd "c:\Users\luaho\Demo project\v-edfinance"

# 2. Commit current work
git add -A && git commit -m "chore: Pre-cleanup checkpoint"

# 3. Create branch
git checkout -b cleanup/automated-2026-01-04

# 4. DRY RUN (review output)
.\scripts\cleanup\EXECUTE_CLEANUP_NOW.ps1 -DryRun

# 5. EXECUTE (if dry run looks good)
.\scripts\cleanup\EXECUTE_CLEANUP_NOW.ps1 -DryRun:$false

# 6. VERIFY
pnpm test && pnpm build

# 7. COMMIT
git add -A && git commit -m "chore: Automated cleanup - 92% reduction"
git push origin cleanup/automated-2026-01-04
```

**Total Time:** ~10 minutes (2 min setup + 1 min execution + 5 min verify + 2 min commit)

---

## 📞 TROUBLESHOOTING

### Issue: "Script refuses to run"
**Solution:** Commit or stash changes first
```powershell
git stash
.\scripts\cleanup\EXECUTE_CLEANUP_NOW.ps1 -DryRun:$false
git stash pop
```

### Issue: "Builds fail after cleanup"
**Solution:** Check for missing script references
```powershell
# Rollback
git reset --hard HEAD~1

# Fix references in AGENTS.md
# Re-run cleanup
```

### Issue: "Tests fail after cleanup"
**Solution:** Verify test files weren't moved
```powershell
# Check test-results/
ls test-results/ -Recurse

# Restore if needed
git checkout HEAD -- tests/
```

---

**Created:** 2026-01-04  
**Automation Script:** scripts/cleanup/EXECUTE_CLEANUP_NOW.ps1  
**Estimated Execution:** 10 minutes total  
**Status:** ✅ **READY TO EXECUTE NOW**
