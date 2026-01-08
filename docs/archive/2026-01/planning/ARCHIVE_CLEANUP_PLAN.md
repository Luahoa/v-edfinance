# Archive Cleanup Plan - ved-3tl1

**Date:** 2026-01-05  
**Task:** PHASE-0 Archive Old Files Cleanup  
**Goal:** Move old/temp files to history/, clean root directory

---

## Files to Archive

### Session Handoff Documents (9 files)
```
✅ SESSION_HANDOFF_PAYMENT_COMPLETE.md
✅ SESSION_HANDOFF_PAYMENT_PHASE1_COMPLETE.md
✅ SESSION_HANDOFF_VED-KHLU_COMPLETE.md
✅ YOUTUBE_INTEGRATION_COMPLETE.md
✅ YOUTUBE_INTEGRATION_TRACK1_COMPLETE.md
✅ YOUTUBE_INTEGRATION_TRACK4_SESSION1.md
✅ YOUTUBE_INTEGRATION_TRACK4_VED-YT14_COMPLETE.md
✅ CLEANUP_SUCCESS_REPORT.md
✅ COMPREHENSIVE_PROJECT_CLEANUP_PLAN.md
```
**Destination:** `history/phase1-mvp/sessions/`

---

### Manual Steps Documents (4 files)
```
✅ MANUAL_STEPS_VED-DO76.md
✅ MANUAL_STEPS_VED-EJQC.md
✅ MANUAL_STEPS_VED-KHLU.md
✅ MANUAL_STEPS_VED-PQPV.md
```
**Destination:** `history/phase1-mvp/payment/manual-steps/`

---

### Task Completion Summaries (3 files)
```
✅ VED-DO76_COMPLETION_SUMMARY.md
✅ AUTOMATED_EXECUTION_PLAN.md
✅ EXECUTE_NOW_VED-DO76.md
```
**Destination:** `history/phase1-mvp/payment/summaries/`

---

### Temporary Scripts (5 files)
```
✅ QUICK_COMMIT_VED-DO76.ps1
✅ temp_commit_clean.bat
✅ temp_commit.ps1
✅ temp_create_beads.ps1
✅ move-files.ps1
```
**Destination:** `history/scripts/temp/`

---

### Test/Seed Scripts (3 files)
```
✅ AUTO_RUN_SEED_TESTS.ps1
✅ AUTO_SEED_COMPLETE.bat
✅ AUTO_TEST_LAUNCHER.bat
✅ SIMPLE_SEED_TEST.bat
```
**Destination:** `history/scripts/test/`

---

### Data Files (2 files)
```
✅ DATABASE_SEED_TEST_RESULTS.json
✅ TEST_COVERAGE_BASELINE.md
```
**Destination:** `history/data/`

---

### Beads Archive (2 files)
```
✅ BEADS_SYNC_READY.md
✅ BEADS_TASKS_SIMPLE.txt
```
**Destination:** `history/beads/`

---

### Miscellaneous (6 files)
```
✅ EXECUTE_NEXT.bat
✅ go_installer.msi
✅ remove_duplicates.py
✅ update_schema.py
✅ temp_prisma_models.txt
✅ temp_pub_key.pub
✅ $null
```
**Destination:** `history/misc/`

---

### Temporary Directories (4 dirs)
```
✅ temp_ai_gallery/
✅ temp_beads_viewer/
✅ temp_gemini_chatbot/
✅ temp_skills/
✅ echo/
✅ swarms/
✅ beads/
✅ Created data directory/
```
**Destination:** `history/temp_directories/`

---

## Files to KEEP in Root

### Essential Project Files
- ✅ README.md
- ✅ SPEC.md
- ✅ AGENTS.md
- ✅ ARCHITECTURE.md
- ✅ STRATEGIC_DEBT_PAYDOWN_PLAN.md
- ✅ AVAILABLE_TASKS_NO_STRIPE.md
- ✅ QUICK_TASK_SELECTION.md

### Configuration Files
- ✅ package.json
- ✅ tsconfig.json
- ✅ turbo.json
- ✅ biome.json
- ✅ playwright.config.ts
- ✅ vitest.config.ts
- ✅ pnpm-workspace.yaml
- ✅ pnpm-lock.yaml
- ✅ dokploy.yaml
- ✅ All docker-compose.*.yml
- ✅ All .env.* files
- ✅ .gitignore, .gitattributes, .npmrc, .dockerignore

### Scripts & Tests
- ✅ run-e2e-tests.ts
- ✅ init-db.sql

### Executables
- ✅ beads.exe
- ✅ bv.exe

---

## Archive Structure

```
history/
├── phase1-mvp/
│   ├── sessions/           # Session handoff docs
│   ├── payment/
│   │   ├── manual-steps/   # Manual step guides
│   │   └── summaries/      # Task completion summaries
│   └── youtube/            # YouTube integration docs
├── scripts/
│   ├── temp/               # Temporary scripts
│   └── test/               # Test/seed scripts
├── data/                   # Test results, baselines
├── beads/                  # Beads archive
├── misc/                   # Miscellaneous files
└── temp_directories/       # Temporary directories
```

---

## Execution Steps

### Step 1: Create Archive Structure
```bash
mkdir -p history/phase1-mvp/sessions
mkdir -p history/phase1-mvp/payment/manual-steps
mkdir -p history/phase1-mvp/payment/summaries
mkdir -p history/phase1-mvp/youtube
mkdir -p history/scripts/temp
mkdir -p history/scripts/test
mkdir -p history/data
mkdir -p history/beads
mkdir -p history/misc
mkdir -p history/temp_directories
```

### Step 2: Move Session Handoffs
```bash
mv SESSION_HANDOFF_*.md history/phase1-mvp/sessions/
mv CLEANUP_*.md history/phase1-mvp/sessions/
mv COMPREHENSIVE_PROJECT_CLEANUP_PLAN.md history/phase1-mvp/sessions/
```

### Step 3: Move YouTube Docs
```bash
mv YOUTUBE_INTEGRATION_*.md history/phase1-mvp/youtube/
```

### Step 4: Move Payment Docs
```bash
mv MANUAL_STEPS_VED-*.md history/phase1-mvp/payment/manual-steps/
mv VED-DO76_COMPLETION_SUMMARY.md history/phase1-mvp/payment/summaries/
mv AUTOMATED_EXECUTION_PLAN.md history/phase1-mvp/payment/summaries/
mv EXECUTE_NOW_VED-DO76.md history/phase1-mvp/payment/summaries/
```

### Step 5: Move Scripts
```bash
mv QUICK_COMMIT_VED-DO76.ps1 history/scripts/temp/
mv temp_*.bat history/scripts/temp/
mv temp_*.ps1 history/scripts/temp/
mv move-files.ps1 history/scripts/temp/

mv AUTO_*.bat history/scripts/test/
mv AUTO_*.ps1 history/scripts/test/
mv SIMPLE_SEED_TEST.bat history/scripts/test/
```

### Step 6: Move Data Files
```bash
mv DATABASE_SEED_TEST_RESULTS.json history/data/
mv TEST_COVERAGE_BASELINE.md history/data/
```

### Step 7: Move Beads Files
```bash
mv BEADS_*.md history/beads/
mv BEADS_*.txt history/beads/
```

### Step 8: Move Misc Files
```bash
mv EXECUTE_NEXT.bat history/misc/
mv go_installer.msi history/misc/
mv remove_duplicates.py history/misc/
mv update_schema.py history/misc/
mv temp_prisma_models.txt history/misc/
mv temp_pub_key.pub history/misc/
mv '$null' history/misc/ 2>/dev/null || true
```

### Step 9: Move Temp Directories
```bash
mv temp_ai_gallery/ history/temp_directories/
mv temp_beads_viewer/ history/temp_directories/
mv temp_gemini_chatbot/ history/temp_directories/
mv temp_skills/ history/temp_directories/
mv echo/ history/temp_directories/
mv swarms/ history/temp_directories/
mv beads/ history/temp_directories/
mv "Created data directory/" history/temp_directories/ 2>/dev/null || true
```

---

## .gitignore Updates

Add to `.gitignore`:
```
# Archived files
history/temp_directories/
history/data/*.json

# Temporary files
temp_*
EXECUTE_NEXT.bat
$null

# Build artifacts
playwright-report/
test-results/
```

---

## Verification

After cleanup:
```bash
# Root should have ~40 files (down from ~80)
ls | wc -l

# Check essential files exist
ls README.md AGENTS.md SPEC.md package.json

# Verify history structure
ls history/
```

---

## Expected Results

**Before:**
- Root directory: ~80 files + 25 directories
- Cluttered, hard to navigate
- Temp files mixed with production code

**After:**
- Root directory: ~40 files + 15 directories
- Clean, organized structure
- All archived files preserved in history/

**Impact:**
- ✅ Faster file search
- ✅ Cleaner git status
- ✅ Better developer experience
- ✅ Preserved historical context

---

**Ready to execute!**
