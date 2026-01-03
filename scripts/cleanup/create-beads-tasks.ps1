# Beads Task Creation Script for Project Cleanup
# PowerShell version for Windows
# Run this to create all 22 cleanup tasks in beads

Write-Host "🔄 Creating Beads tasks for Project Cleanup..." -ForegroundColor Cyan

# EPIC: Project Cleanup
Write-Host "`n📦 Creating EPIC..." -ForegroundColor Yellow
& .\beads.exe create "EPIC: Comprehensive Project Cleanup" `
  --type epic `
  --priority 1 `
  --tags cleanup,documentation,automation `
  --description "Transform V-EdFinance from 201 root files to 15 core files using AI skills and automation"

$EPIC_ID = "ved-cleanup-epic"

# ═══════════════════════════════════════════════════════════
# PHASE 1: AI Categorization + Archive (5 hours, 8 tasks)
# ═══════════════════════════════════════════════════════════

Write-Host "`n📦 Creating Phase 1 tasks (AI Categorization + Archive)..." -ForegroundColor Yellow

& .\beads.exe create "ved-cleanup-1: Audit root directory files" `
  --type task `
  --priority 1 `
  --tags cleanup,phase1,audit `
  --discovered-from $EPIC_ID `
  --description "Count and list all .md files in root directory. Expected: 201 files"

& .\beads.exe create "ved-cleanup-2: Create AI categorization engine" `
  --type task `
  --priority 1 `
  --tags cleanup,phase1,ai `
  --discovered-from $EPIC_ID `
  --description "Build TypeScript script using Google Gemini API to categorize files"

& .\beads.exe create "ved-cleanup-3: Generate automated move plan" `
  --type task `
  --priority 1 `
  --tags cleanup,phase1,automation `
  --discovered-from $EPIC_ID `
  --deps blocks:ved-cleanup-2 `
  --description "Generate PowerShell script from AI categorization output"

& .\beads.exe create "ved-cleanup-4: Create archive directory structure" `
  --type task `
  --priority 1 `
  --tags cleanup,phase1,setup `
  --discovered-from $EPIC_ID `
  --description "Create docs/archive/2025-12 structure"

& .\beads.exe create "ved-cleanup-5: Move WAVE reports to archive" `
  --type task `
  --priority 1 `
  --tags cleanup,phase1,archive `
  --discovered-from $EPIC_ID `
  --deps blocks:ved-cleanup-4 `
  --description "Archive all WAVE*.md files"

& .\beads.exe create "ved-cleanup-6: Move SESSION reports to archive" `
  --type task `
  --priority 1 `
  --tags cleanup,phase1,archive `
  --discovered-from $EPIC_ID `
  --deps blocks:ved-cleanup-4 `
  --description "Archive all HANDOFF/SESSION/PROGRESS files"

& .\beads.exe create "ved-cleanup-7: Move old AUDIT reports to archive" `
  --type task `
  --priority 1 `
  --tags cleanup,phase1,archive `
  --discovered-from $EPIC_ID `
  --deps blocks:ved-cleanup-4 `
  --description "Archive old AUDIT reports (keep latest)"

& .\beads.exe create "ved-cleanup-8: Verify archive integrity" `
  --type task `
  --priority 1 `
  --tags cleanup,phase1,verification `
  --discovered-from $EPIC_ID `
  --deps blocks:ved-cleanup-5,ved-cleanup-6,ved-cleanup-7 `
  --description "Verify all files moved correctly"

# ═══════════════════════════════════════════════════════════
# PHASE 2: Extract EdTech Knowledge (4 hours, 5 tasks)
# ═══════════════════════════════════════════════════════════

Write-Host "`n🎓 Creating Phase 2 tasks (Extract EdTech Knowledge)..." -ForegroundColor Yellow

& .\beads.exe create "ved-cleanup-9: Extract Nudge Theory patterns" `
  --type task `
  --priority 1 `
  --tags cleanup,phase2,edtech,ai `
  --discovered-from $EPIC_ID `
  --deps blocks:ved-cleanup-8 `
  --description "Use Gemini to extract Nudge Theory from SPEC.md"

& .\beads.exe create "ved-cleanup-10: Extract Hooked Model patterns" `
  --type task `
  --priority 1 `
  --tags cleanup,phase2,edtech,ai `
  --discovered-from $EPIC_ID `
  --deps blocks:ved-cleanup-8 `
  --description "Use Gemini to extract Hooked Model from SPEC.md"

& .\beads.exe create "ved-cleanup-11: Extract Gamification patterns" `
  --type task `
  --priority 1 `
  --tags cleanup,phase2,edtech,ai `
  --discovered-from $EPIC_ID `
  --deps blocks:ved-cleanup-8 `
  --description "Use Gemini to extract Gamification from SPEC.md"

& .\beads.exe create "ved-cleanup-12: Create behavioral-design structure" `
  --type task `
  --priority 1 `
  --tags cleanup,phase2,setup `
  --discovered-from $EPIC_ID `
  --deps blocks:ved-cleanup-9,ved-cleanup-10,ved-cleanup-11 `
  --description "Create docs/behavioral-design directory structure"

& .\beads.exe create "ved-cleanup-13: Move EdTech test reports" `
  --type task `
  --priority 1 `
  --tags cleanup,phase2,move `
  --discovered-from $EPIC_ID `
  --deps blocks:ved-cleanup-12 `
  --description "Move test reports to behavioral-design/test-reports/"

# ═══════════════════════════════════════════════════════════
# PHASE 3: Consolidate Documentation (4 hours, 9 tasks)
# ═══════════════════════════════════════════════════════════

Write-Host "`n📚 Creating Phase 3 tasks (Consolidate Documentation)..." -ForegroundColor Yellow

& .\beads.exe create "ved-cleanup-14: Create complete docs structure" `
  --type task `
  --priority 1 `
  --tags cleanup,phase3,setup `
  --discovered-from $EPIC_ID `
  --deps blocks:ved-cleanup-13 `
  --description "Create all docs subdirectories"

& .\beads.exe create "ved-cleanup-15: Move database documentation" `
  --type task `
  --priority 1 `
  --tags cleanup,phase3,move `
  --discovered-from $EPIC_ID `
  --deps blocks:ved-cleanup-14 `
  --description "Verify database docs structure"

& .\beads.exe create "ved-cleanup-16: Move testing documentation" `
  --type task `
  --priority 1 `
  --tags cleanup,phase3,move `
  --discovered-from $EPIC_ID `
  --deps blocks:ved-cleanup-14 `
  --description "Move testing docs to docs/testing/"

& .\beads.exe create "ved-cleanup-17: Move DevOps documentation" `
  --type task `
  --priority 1 `
  --tags cleanup,phase3,move `
  --discovered-from $EPIC_ID `
  --deps blocks:ved-cleanup-14 `
  --description "Move DevOps docs to docs/devops/"

& .\beads.exe create "ved-cleanup-18: Move Beads documentation" `
  --type task `
  --priority 1 `
  --tags cleanup,phase3,move `
  --discovered-from $EPIC_ID `
  --deps blocks:ved-cleanup-14 `
  --description "Move Beads docs to docs/beads/"

& .\beads.exe create "ved-cleanup-19: Update all documentation links" `
  --type task `
  --priority 1 `
  --tags cleanup,phase3,automation `
  --discovered-from $EPIC_ID `
  --deps blocks:ved-cleanup-15,ved-cleanup-16,ved-cleanup-17,ved-cleanup-18 `
  --description "Update links in AGENTS.md, SPEC.md, README.md"

& .\beads.exe create "ved-cleanup-20: Run test suite verification" `
  --type task `
  --priority 1 `
  --tags cleanup,phase3,verification `
  --discovered-from $EPIC_ID `
  --deps blocks:ved-cleanup-19 `
  --description "Verify 98.7% pass rate maintained"

& .\beads.exe create "ved-cleanup-21: Check for broken links" `
  --type task `
  --priority 1 `
  --tags cleanup,phase3,verification `
  --discovered-from $EPIC_ID `
  --deps blocks:ved-cleanup-19 `
  --description "Run link checker script"

& .\beads.exe create "ved-cleanup-22: Final cleanup audit" `
  --type task `
  --priority 1 `
  --tags cleanup,phase3,verification `
  --discovered-from $EPIC_ID `
  --deps blocks:ved-cleanup-20,ved-cleanup-21 `
  --description "Final verification: root ≤15 files, all knowledge preserved"

Write-Host "`n✅ Created 22 cleanup tasks in beads!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Task Breakdown:" -ForegroundColor Cyan
Write-Host "   Phase 1 (AI + Archive):    ved-cleanup-1  to ved-cleanup-8  (8 tasks, 5 hours)"
Write-Host "   Phase 2 (EdTech Extract):  ved-cleanup-9  to ved-cleanup-13 (5 tasks, 4 hours)"
Write-Host "   Phase 3 (Consolidate):     ved-cleanup-14 to ved-cleanup-22 (9 tasks, 4 hours)"
Write-Host ""
Write-Host "🎯 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Run: .\beads.exe ready"
Write-Host "   2. Run: .\bv.exe --robot-next"
Write-Host "   3. Start with ved-cleanup-1 (Audit root directory)"
Write-Host ""
Write-Host "📖 Full plan: COMPREHENSIVE_PROJECT_CLEANUP_PLAN.md" -ForegroundColor Cyan
