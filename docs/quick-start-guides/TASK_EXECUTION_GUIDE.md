# 📋 Task-by-Task Execution Guide
**Simple, step-by-step instructions for each cleanup task**

---

## 🚀 HOW TO USE THIS GUIDE

1. **Create tasks** - Copy commands from BEADS_TASKS_SIMPLE.txt
2. **Start task** - Run `.\beads.exe update <task-id> --status in_progress`
3. **Follow steps** - Execute commands below for that task
4. **Complete task** - Run `.\beads.exe close <task-id> --reason "Done"`
5. **Next task** - Run `.\bv.exe --robot-next` to get AI recommendation

---

## ═══════════════════════════════════════════════════════════
## PHASE 1: AI CATEGORIZATION + ARCHIVE
## ═══════════════════════════════════════════════════════════

### 📋 TASK 1: Audit Root Directory (30 min)

**Beads Command:**
```powershell
.\beads.exe update ved-<task-id> --status in_progress
```

**Execution:**
```powershell
# 1. Count .md files
$mdFiles = Get-ChildItem -Filter "*.md"
Write-Host "Total .md files: $($mdFiles.Count)"

# 2. List all files
$mdFiles | Select-Object Name | Sort-Object Name > audit-root-files.txt

# 3. Open audit file
notepad audit-root-files.txt

# 4. Take note of count
# Expected: ~201 files
```

**Complete:**
```powershell
.\beads.exe close ved-<task-id> --reason "Audit complete: $($mdFiles.Count) files found"
```

---

### 🤖 TASK 2: Create AI Categorization Engine (60 min)

**Beads Command:**
```powershell
.\beads.exe update ved-<task-id> --status in_progress
```

**Execution:**
```powershell
# 1. Create directory
New-Item -ItemType Directory -Force -Path "scripts/cleanup"

# 2. Create script file
# Copy from COMPREHENSIVE_PROJECT_CLEANUP_PLAN.md
# Section: Step 1.1 - ai-categorizer.ts

# 3. Install dependencies
pnpm add @google/generative-ai

# 4. Add API key to .env
# GEMINI_API_KEY=your_key_here

# 5. Test script (dry-run)
npx tsx scripts/cleanup/ai-categorizer.ts --dry-run

# 6. Review output
# Check categorization is sensible
```

**Complete:**
```powershell
.\beads.exe close ved-<task-id> --reason "AI categorizer created and tested"
```

---

### ⚙️ TASK 3: Generate Automated Move Plan (30 min)

**Beads Command:**
```powershell
.\beads.exe update ved-<task-id> --status in_progress
```

**Execution:**
```powershell
# 1. Run AI categorizer
npx tsx scripts/cleanup/ai-categorizer.ts > categorization.json

# 2. Create move plan generator
# Copy from COMPREHENSIVE_PROJECT_CLEANUP_PLAN.md
# Section: Step 1.2 - generate-move-plan.ts

# 3. Generate PowerShell script
npx tsx scripts/cleanup/generate-move-plan.ts > auto-move.ps1

# 4. Review generated script
notepad auto-move.ps1

# 5. Verify commands look correct
```

**Complete:**
```powershell
.\beads.exe close ved-<task-id> --reason "Move plan generated: auto-move.ps1"
```

---

### 📁 TASK 4: Create Archive Structure (30 min)

**Beads Command:**
```powershell
.\beads.exe update ved-<task-id> --status in_progress
```

**Execution:**
```powershell
# 1. Create base directory
New-Item -ItemType Directory -Force -Path "docs/archive"

# 2. Create 2025-12 structure
New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/session-reports"
New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/test-waves"
New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/completion-reports"
New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/audits"

# 3. Create 2026-01 for future
New-Item -ItemType Directory -Force -Path "docs/archive/2026-01"

# 4. Verify structure
tree docs/archive /F

# 5. Create README
"# Archive - Historical Documentation`n`nArchived reports by date." > docs/archive/README.md
```

**Complete:**
```powershell
.\beads.exe close ved-<task-id> --reason "Archive structure created"
```

---

### 📦 TASK 5: Move WAVE Reports (30 min)

**Beads Command:**
```powershell
.\beads.exe update ved-<task-id> --status in_progress
```

**Execution:**
```powershell
# 1. List WAVE files
$waveFiles = Get-ChildItem -Filter "WAVE*.md"
Write-Host "Found $($waveFiles.Count) WAVE files"

# 2. DRY RUN - Show what will move
foreach ($file in $waveFiles) {
    Write-Host "Would move: $($file.Name) → test-waves/"
}

# 3. Confirm move
Read-Host "Press Enter to proceed with move"

# 4. Move files
foreach ($file in $waveFiles) {
    Move-Item $file.FullName "docs/archive/2025-12/test-waves/"
    Write-Host "✅ Moved: $($file.Name)"
}

# 5. Verify
Get-ChildItem "docs/archive/2025-12/test-waves/" | measure
```

**Complete:**
```powershell
.\beads.exe close ved-<task-id> --reason "Moved $($waveFiles.Count) WAVE reports"
```

---

### 📦 TASK 6: Move SESSION Reports (30 min)

**Beads Command:**
```powershell
.\beads.exe update ved-<task-id> --status in_progress
```

**Execution:**
```powershell
# 1. List SESSION files
$sessionFiles = Get-ChildItem | Where-Object { 
    $_.Name -like "*HANDOFF*.md" -or 
    $_.Name -like "*SESSION*.md" -or 
    $_.Name -like "*PROGRESS*.md" 
}
Write-Host "Found $($sessionFiles.Count) session files"

# 2. DRY RUN
foreach ($file in $sessionFiles) {
    Write-Host "Would move: $($file.Name) → session-reports/"
}

# 3. Confirm
Read-Host "Press Enter to proceed"

# 4. Move files
foreach ($file in $sessionFiles) {
    Move-Item $file.FullName "docs/archive/2025-12/session-reports/"
    Write-Host "✅ Moved: $($file.Name)"
}

# 5. Verify
Get-ChildItem "docs/archive/2025-12/session-reports/" | measure
```

**Complete:**
```powershell
.\beads.exe close ved-<task-id> --reason "Moved $($sessionFiles.Count) session reports"
```

---

### 📦 TASK 7: Move Old AUDIT Reports (30 min)

**Beads Command:**
```powershell
.\beads.exe update ved-<task-id> --status in_progress
```

**Execution:**
```powershell
# 1. List old AUDIT files (keep latest)
$auditFiles = Get-ChildItem | Where-Object {
    ($_.Name -like "AUDIT*.md" -or 
     $_.Name -like "COMPREHENSIVE_AUDIT*.md" -or
     $_.Name -like "COMPREHENSIVE_PROJECT_AUDIT*.md") -and
    $_.Name -notlike "*2026-01-03*"
}
Write-Host "Found $($auditFiles.Count) old audit files"

# 2. DRY RUN
foreach ($file in $auditFiles) {
    Write-Host "Would move: $($file.Name) → audits/"
}
Write-Host "`nKeeping: PROJECT_AUDIT_2026-01-03.md"

# 3. Confirm
Read-Host "Press Enter to proceed"

# 4. Move files
foreach ($file in $auditFiles) {
    Move-Item $file.FullName "docs/archive/2025-12/audits/"
    Write-Host "✅ Moved: $($file.Name)"
}

# 5. Verify latest audit still in root
if (Test-Path "PROJECT_AUDIT_2026-01-03.md") {
    Write-Host "✅ Latest audit preserved in root"
}
```

**Complete:**
```powershell
.\beads.exe close ved-<task-id> --reason "Moved $($auditFiles.Count) old audit reports"
```

---

### ✅ TASK 8: Verify Archive Integrity (30 min)

**Beads Command:**
```powershell
.\beads.exe update ved-<task-id> --status in_progress
```

**Execution:**
```powershell
# 1. Count archived files
$waveCount = (Get-ChildItem "docs/archive/2025-12/test-waves/").Count
$sessionCount = (Get-ChildItem "docs/archive/2025-12/session-reports/").Count
$auditCount = (Get-ChildItem "docs/archive/2025-12/audits/").Count

Write-Host "Archive Summary:"
Write-Host "  WAVE reports:    $waveCount"
Write-Host "  SESSION reports: $sessionCount"
Write-Host "  AUDIT reports:   $auditCount"
Write-Host "  TOTAL:           $($waveCount + $sessionCount + $auditCount)"

# 2. Check no orphans in root
$rootWave = (Get-ChildItem -Filter "WAVE*.md").Count
$rootSession = (Get-ChildItem | Where-Object { 
    $_.Name -like "*HANDOFF*.md" -or $_.Name -like "*SESSION*.md" 
}).Count

if ($rootWave -eq 0 -and $rootSession -eq 0) {
    Write-Host "✅ No orphaned files in root"
} else {
    Write-Host "⚠️  Found orphaned files: WAVE=$rootWave, SESSION=$rootSession"
}

# 3. Git commit
git add docs/archive
git commit -m "chore: Archive historical reports (Phase 1 complete)"

# 4. Verify commit
git log -1 --oneline
```

**Complete:**
```powershell
.\beads.exe close ved-<task-id> --reason "Archive verified: $($waveCount + $sessionCount + $auditCount) files archived"
```

**🎉 PHASE 1 COMPLETE! Take a break.**

---

## ═══════════════════════════════════════════════════════════
## PHASE 2: EXTRACT EDTECH KNOWLEDGE
## ═══════════════════════════════════════════════════════════

### 🎓 TASK 9: Extract Nudge Theory (45 min)

**Beads Command:**
```powershell
.\beads.exe update ved-<task-id> --status in_progress
```

**Execution:**
```powershell
# 1. Create extraction script (if not exists)
# Copy from COMPREHENSIVE_PROJECT_CLEANUP_PLAN.md
# Section: Step 2.1 - extract-edtech-knowledge.ts

# 2. Run extraction for Nudge Theory
npx tsx scripts/cleanup/extract-edtech-knowledge.ts --category nudge

# 3. Review extracted content
notepad docs/behavioral-design/nudge-theory/PATTERNS.md

# 4. Verify patterns extracted:
#    - Social Proof
#    - Loss Aversion
#    - Framing
#    - Mapping

# 5. Human validation (IMPORTANT!)
# Check extracted content matches SPEC.md
```

**Complete:**
```powershell
.\beads.exe close ved-<task-id> --reason "Nudge Theory patterns extracted and validated"
```

---

### 🎓 TASK 10: Extract Hooked Model (45 min)

**Beads Command:**
```powershell
.\beads.exe update ved-<task-id> --status in_progress
```

**Execution:**
```powershell
# 1. Run extraction for Hooked Model
npx tsx scripts/cleanup/extract-edtech-knowledge.ts --category hooked

# 2. Review extracted content
notepad docs/behavioral-design/hooked-model/PATTERNS.md

# 3. Verify patterns:
#    - Trigger
#    - Action
#    - Variable Reward
#    - Investment

# 4. Human validation
```

**Complete:**
```powershell
.\beads.exe close ved-<task-id> --reason "Hooked Model patterns extracted and validated"
```

---

### 🎓 TASK 11: Extract Gamification (45 min)

**Beads Command:**
```powershell
.\beads.exe update ved-<task-id> --status in_progress
```

**Execution:**
```powershell
# 1. Run extraction
npx tsx scripts/cleanup/extract-edtech-knowledge.ts --category gamification

# 2. Review
notepad docs/behavioral-design/gamification/PATTERNS.md

# 3. Verify patterns:
#    - Points, Badges, Leaderboards
#    - Commitment Contracts
#    - Buddy System

# 4. Human validation
```

**Complete:**
```powershell
.\beads.exe close ved-<task-id> --reason "Gamification patterns extracted and validated"
```

---

### 📁 TASK 12: Create EdTech Structure (30 min)

**Beads Command:**
```powershell
.\beads.exe update ved-<task-id> --status in_progress
```

**Execution:**
```powershell
# 1. Create base directory
New-Item -ItemType Directory -Force -Path "docs/behavioral-design"

# 2. Create category subdirectories
New-Item -ItemType Directory -Force -Path "docs/behavioral-design/nudge-theory"
New-Item -ItemType Directory -Force -Path "docs/behavioral-design/hooked-model"
New-Item -ItemType Directory -Force -Path "docs/behavioral-design/gamification"
New-Item -ItemType Directory -Force -Path "docs/behavioral-design/ai-behavioral"
New-Item -ItemType Directory -Force -Path "docs/behavioral-design/test-reports"

# 3. Create README
@"
# Behavioral Design Knowledge Base

EdTech behavioral psychology patterns and test results.

## Categories

- **nudge-theory/** - Richard Thaler's Nudge patterns
- **hooked-model/** - Nir Eyal's Hooked framework
- **gamification/** - Game mechanics for learning
- **ai-behavioral/** - AI + Psychology integration
- **test-reports/** - Validation test results
"@ > docs/behavioral-design/README.md

# 4. Verify structure
tree docs/behavioral-design /F
```

**Complete:**
```powershell
.\beads.exe close ved-<task-id> --reason "EdTech structure created"
```

---

### 📦 TASK 13: Move EdTech Test Reports (30 min)

**Beads Command:**
```powershell
.\beads.exe update ved-<task-id> --status in_progress
```

**Execution:**
```powershell
# 1. List test reports
$testReports = @(
    "GAMIFICATION_TEST_REPORT.md",
    "LOSS_AVERSION_TEST_REPORT.md",
    "SOCIAL_PROOF_TEST_REPORT.md",
    "COMMITMENT_CONTRACTS_TEST_REPORT.md",
    "NUDGE_TRIGGER_TEST_REPORT.md",
    "MARKET_SIMULATION_TEST_REPORT.md"
)

# 2. Move reports
foreach ($report in $testReports) {
    if (Test-Path $report) {
        Move-Item $report "docs/behavioral-design/test-reports/"
        Write-Host "✅ Moved: $report"
    }
}

# 3. Verify
Get-ChildItem "docs/behavioral-design/test-reports/" | measure

# 4. Git commit
git add docs/behavioral-design
git commit -m "docs: Extract EdTech behavioral design knowledge (Phase 2 complete)"
```

**Complete:**
```powershell
.\beads.exe close ved-<task-id> --reason "Moved $($testReports.Count) test reports"
```

**🎉 PHASE 2 COMPLETE! Take a break.**

---

## ═══════════════════════════════════════════════════════════
## PHASE 3: CONSOLIDATE DOCUMENTATION
## ═══════════════════════════════════════════════════════════

### 📁 TASK 14: Create Complete Docs Structure (30 min)

**Beads Command:**
```powershell
.\beads.exe update ved-<task-id> --status in_progress
```

**Execution:**
```powershell
# 1. Create all subdirectories
$dirs = @(
    "docs/ai-behavioral",
    "docs/testing",
    "docs/devops",
    "docs/beads",
    "docs/git-workflows",
    "docs/ai-testing"
)

foreach ($dir in $dirs) {
    New-Item -ItemType Directory -Force -Path $dir
    Write-Host "✅ Created: $dir"
}

# 2. Verify docs/database already exists
if (Test-Path "docs/database") {
    Write-Host "✅ docs/database exists"
}

# 3. Verify docs/behavioral-design from Phase 2
if (Test-Path "docs/behavioral-design") {
    Write-Host "✅ docs/behavioral-design exists"
}

# 4. Show complete structure
tree docs /F
```

**Complete:**
```powershell
.\beads.exe close ved-<task-id> --reason "Complete docs structure created"
```

---

### 📦 TASK 15-18: Move Documentation (Quick - 15-30 min each)

**Use this pattern for tasks 15, 16, 17, 18:**

```powershell
# 1. Start task
.\beads.exe update ved-<task-id> --status in_progress

# 2. List files to move
# (See COMPREHENSIVE_PROJECT_CLEANUP_PLAN.md for specific files)

# 3. DRY RUN
# Show what will move

# 4. Move files
Move-Item <file> <destination>

# 5. Complete task
.\beads.exe close ved-<task-id> --reason "Moved X files"
```

**See COMPREHENSIVE_PROJECT_CLEANUP_PLAN.md Section 3.2 for file lists.**

---

### 🔗 TASK 19: Update All Links (60 min)

**Beads Command:**
```powershell
.\beads.exe update ved-<task-id> --status in_progress
```

**Execution:**
```powershell
# 1. Create link updater script
# Copy from COMPREHENSIVE_PROJECT_CLEANUP_PLAN.md
# Section: Step 3.3 - update-links.ts

# 2. Run updater
npx tsx scripts/cleanup/update-links.ts

# 3. Review changes
git diff AGENTS.md
git diff SPEC.md
git diff README.md

# 4. Verify no broken links
# Check manually or use link checker
```

**Complete:**
```powershell
.\beads.exe close ved-<task-id> --reason "All links updated in core docs"
```

---

### ✅ TASK 20: Test Suite (30 min)

**Beads Command:**
```powershell
.\beads.exe update ved-<task-id> --status in_progress
```

**Execution:**
```powershell
# 1. Run full test suite
pnpm test

# 2. Check pass rate
# Expected: 98.7% (1811/1834 passing)

# 3. If failures, fix immediately
# Verify failures not caused by cleanup

# 4. Verify builds
pnpm --filter api build
pnpm --filter web build
```

**Complete:**
```powershell
.\beads.exe close ved-<task-id> --reason "Test suite passing: 98.7%"
```

---

### 🔍 TASK 21: Link Checker (30 min)

**Beads Command:**
```powershell
.\beads.exe update ved-<task-id> --status in_progress
```

**Execution:**
```powershell
# 1. Install link checker (if needed)
# npm install -g markdown-link-check

# 2. Check core docs
markdown-link-check AGENTS.md
markdown-link-check SPEC.md
markdown-link-check README.md

# 3. Fix any broken links

# 4. Re-check
```

**Complete:**
```powershell
.\beads.exe close ved-<task-id> --reason "All links verified - zero broken"
```

---

### 🎯 TASK 22: Final Audit (30 min)

**Beads Command:**
```powershell
.\beads.exe update ved-<task-id> --status in_progress
```

**Execution:**
```powershell
# 1. Count root .md files
$rootCount = (Get-ChildItem -Filter "*.md").Count
Write-Host "Root .md files: $rootCount (target: ≤15)"

# 2. Count archived files
$archiveCount = (Get-ChildItem -Recurse -Path "docs/archive" -Filter "*.md").Count
Write-Host "Archived files: $archiveCount"

# 3. Verify EdTech knowledge
$edtechCount = (Get-ChildItem -Recurse -Path "docs/behavioral-design" -Filter "*.md").Count
Write-Host "EdTech docs: $edtechCount"

# 4. Run beads health check
.\beads.exe doctor

# 5. Git status (should be clean or ready to commit)
git status

# 6. Final commit
git add -A
git commit -m "docs: Complete documentation cleanup (Phase 3 complete)"

# 7. PUSH (MANDATORY)
git push

# 8. Verify
git status
```

**Complete:**
```powershell
.\beads.exe close ved-<task-id> --reason "Final audit complete: $rootCount root files, all tests passing, git pushed"
```

**🎉 PROJECT CLEANUP COMPLETE!**

---

## 🎯 QUICK COMMAND REFERENCE

```powershell
# Start task
.\beads.exe update <task-id> --status in_progress

# Complete task
.\beads.exe close <task-id> --reason "Description of what was done"

# Get next task
.\bv.exe --robot-next

# View ready work
.\beads.exe ready

# Health check
.\beads.exe doctor

# Sync beads
.\beads.exe sync
```

---

**Created:** 2026-01-03 06:00  
**Total Tasks:** 22  
**Execution Mode:** One task at a time  
**Status:** ✅ **READY TO EXECUTE**
