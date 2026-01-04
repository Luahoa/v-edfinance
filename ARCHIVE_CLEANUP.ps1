# ═══════════════════════════════════════════════════════════════
# Archive Cleanup Script - ved-3tl1
# ═══════════════════════════════════════════════════════════════
# Purpose: Move old files to history/, clean root directory
# Task: PHASE-0 Archive Old Files Cleanup
# ═══════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"
$RootDir = Get-Location

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Archive Cleanup - ved-3tl1" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ═══════════════════════════════════════════════════════════════
# Step 1: Create Archive Structure
# ═══════════════════════════════════════════════════════════════

Write-Host "[1/10] Creating archive structure..." -ForegroundColor Yellow

$archiveDirs = @(
    "history/phase1-mvp/sessions",
    "history/phase1-mvp/payment/manual-steps",
    "history/phase1-mvp/payment/summaries",
    "history/phase1-mvp/youtube",
    "history/scripts/temp",
    "history/scripts/test",
    "history/data",
    "history/beads",
    "history/misc",
    "history/temp_directories"
)

foreach ($dir in $archiveDirs) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
}

Write-Host "✅ Archive structure created" -ForegroundColor Green
Write-Host ""

# ═══════════════════════════════════════════════════════════════
# Step 2: Move Session Handoffs
# ═══════════════════════════════════════════════════════════════

Write-Host "[2/10] Archiving session handoff documents..." -ForegroundColor Yellow

$sessionFiles = @(
    "SESSION_HANDOFF_PAYMENT_COMPLETE.md",
    "SESSION_HANDOFF_PAYMENT_PHASE1_COMPLETE.md",
    "SESSION_HANDOFF_VED-KHLU_COMPLETE.md",
    "CLEANUP_SUCCESS_REPORT.md",
    "COMPREHENSIVE_PROJECT_CLEANUP_PLAN.md"
)

foreach ($file in $sessionFiles) {
    if (Test-Path $file) {
        Move-Item -Path $file -Destination "history/phase1-mvp/sessions/" -Force
        Write-Host "  ✓ $file" -ForegroundColor Gray
    }
}

Write-Host "✅ Session docs archived" -ForegroundColor Green
Write-Host ""

# ═══════════════════════════════════════════════════════════════
# Step 3: Move YouTube Docs
# ═══════════════════════════════════════════════════════════════

Write-Host "[3/10] Archiving YouTube integration docs..." -ForegroundColor Yellow

Get-ChildItem -Filter "YOUTUBE_INTEGRATION_*.md" | ForEach-Object {
    Move-Item -Path $_.FullName -Destination "history/phase1-mvp/youtube/" -Force
    Write-Host "  ✓ $($_.Name)" -ForegroundColor Gray
}

Write-Host "✅ YouTube docs archived" -ForegroundColor Green
Write-Host ""

# ═══════════════════════════════════════════════════════════════
# Step 4: Move Payment Docs
# ═══════════════════════════════════════════════════════════════

Write-Host "[4/10] Archiving payment documentation..." -ForegroundColor Yellow

# Manual steps
Get-ChildItem -Filter "MANUAL_STEPS_VED-*.md" | ForEach-Object {
    Move-Item -Path $_.FullName -Destination "history/phase1-mvp/payment/manual-steps/" -Force
    Write-Host "  ✓ $($_.Name)" -ForegroundColor Gray
}

# Summaries
$paymentSummaries = @(
    "VED-DO76_COMPLETION_SUMMARY.md",
    "AUTOMATED_EXECUTION_PLAN.md",
    "EXECUTE_NOW_VED-DO76.md"
)

foreach ($file in $paymentSummaries) {
    if (Test-Path $file) {
        Move-Item -Path $file -Destination "history/phase1-mvp/payment/summaries/" -Force
        Write-Host "  ✓ $file" -ForegroundColor Gray
    }
}

Write-Host "✅ Payment docs archived" -ForegroundColor Green
Write-Host ""

# ═══════════════════════════════════════════════════════════════
# Step 5: Move Temporary Scripts
# ═══════════════════════════════════════════════════════════════

Write-Host "[5/10] Archiving temporary scripts..." -ForegroundColor Yellow

$tempScripts = @(
    "QUICK_COMMIT_VED-DO76.ps1",
    "temp_commit_clean.bat",
    "temp_commit.ps1",
    "temp_create_beads.ps1",
    "move-files.ps1"
)

foreach ($file in $tempScripts) {
    if (Test-Path $file) {
        Move-Item -Path $file -Destination "history/scripts/temp/" -Force
        Write-Host "  ✓ $file" -ForegroundColor Gray
    }
}

Write-Host "✅ Temp scripts archived" -ForegroundColor Green
Write-Host ""

# ═══════════════════════════════════════════════════════════════
# Step 6: Move Test Scripts
# ═══════════════════════════════════════════════════════════════

Write-Host "[6/10] Archiving test/seed scripts..." -ForegroundColor Yellow

$testScripts = @(
    "AUTO_RUN_SEED_TESTS.ps1",
    "AUTO_SEED_COMPLETE.bat",
    "AUTO_TEST_LAUNCHER.bat",
    "SIMPLE_SEED_TEST.bat"
)

foreach ($file in $testScripts) {
    if (Test-Path $file) {
        Move-Item -Path $file -Destination "history/scripts/test/" -Force
        Write-Host "  ✓ $file" -ForegroundColor Gray
    }
}

Write-Host "✅ Test scripts archived" -ForegroundColor Green
Write-Host ""

# ═══════════════════════════════════════════════════════════════
# Step 7: Move Data Files
# ═══════════════════════════════════════════════════════════════

Write-Host "[7/10] Archiving data files..." -ForegroundColor Yellow

$dataFiles = @(
    "DATABASE_SEED_TEST_RESULTS.json",
    "TEST_COVERAGE_BASELINE.md"
)

foreach ($file in $dataFiles) {
    if (Test-Path $file) {
        Move-Item -Path $file -Destination "history/data/" -Force
        Write-Host "  ✓ $file" -ForegroundColor Gray
    }
}

Write-Host "✅ Data files archived" -ForegroundColor Green
Write-Host ""

# ═══════════════════════════════════════════════════════════════
# Step 8: Move Beads Files
# ═══════════════════════════════════════════════════════════════

Write-Host "[8/10] Archiving Beads files..." -ForegroundColor Yellow

$beadsFiles = @(
    "BEADS_SYNC_READY.md",
    "BEADS_TASKS_SIMPLE.txt"
)

foreach ($file in $beadsFiles) {
    if (Test-Path $file) {
        Move-Item -Path $file -Destination "history/beads/" -Force
        Write-Host "  ✓ $file" -ForegroundColor Gray
    }
}

Write-Host "✅ Beads files archived" -ForegroundColor Green
Write-Host ""

# ═══════════════════════════════════════════════════════════════
# Step 9: Move Miscellaneous Files
# ═══════════════════════════════════════════════════════════════

Write-Host "[9/10] Archiving miscellaneous files..." -ForegroundColor Yellow

$miscFiles = @(
    "EXECUTE_NEXT.bat",
    "go_installer.msi",
    "remove_duplicates.py",
    "update_schema.py",
    "temp_prisma_models.txt",
    "temp_pub_key.pub"
)

foreach ($file in $miscFiles) {
    if (Test-Path $file) {
        Move-Item -Path $file -Destination "history/misc/" -Force
        Write-Host "  ✓ $file" -ForegroundColor Gray
    }
}

# Handle $null file (special case)
if (Test-Path '$null') {
    Move-Item -Path '$null' -Destination "history/misc/" -Force -ErrorAction SilentlyContinue
    Write-Host "  ✓ `$null" -ForegroundColor Gray
}

Write-Host "✅ Misc files archived" -ForegroundColor Green
Write-Host ""

# ═══════════════════════════════════════════════════════════════
# Step 10: Move Temporary Directories
# ═══════════════════════════════════════════════════════════════

Write-Host "[10/10] Archiving temporary directories..." -ForegroundColor Yellow

$tempDirs = @(
    "temp_ai_gallery",
    "temp_beads_viewer",
    "temp_gemini_chatbot",
    "temp_skills",
    "echo",
    "swarms",
    "beads"
)

foreach ($dir in $tempDirs) {
    if (Test-Path $dir) {
        Move-Item -Path $dir -Destination "history/temp_directories/" -Force
        Write-Host "  ✓ $dir/" -ForegroundColor Gray
    }
}

# Handle "Created data directory" (has spaces)
if (Test-Path "Created data directory") {
    Move-Item -Path "Created data directory" -Destination "history/temp_directories/" -Force
    Write-Host "  ✓ Created data directory/" -ForegroundColor Gray
}

Write-Host "✅ Temp directories archived" -ForegroundColor Green
Write-Host ""

# ═══════════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════════

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ CLEANUP COMPLETE" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Count files before/after
$rootFiles = (Get-ChildItem -File).Count
$archivedFiles = (Get-ChildItem -Path "history" -Recurse -File).Count

Write-Host "Results:" -ForegroundColor White
Write-Host "  • Files in root: $rootFiles" -ForegroundColor Cyan
Write-Host "  • Files archived: $archivedFiles" -ForegroundColor Cyan
Write-Host "  • Archive location: history/" -ForegroundColor Cyan
Write-Host ""

Write-Host "Essential files preserved:" -ForegroundColor Yellow
$essentialFiles = @("README.md", "AGENTS.md", "SPEC.md", "package.json", "tsconfig.json")
foreach ($file in $essentialFiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file (MISSING!)" -ForegroundColor Red
    }
}
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review history/ directory" -ForegroundColor White
Write-Host "  2. Update .gitignore (add history/temp_directories/)" -ForegroundColor White
Write-Host "  3. Commit changes" -ForegroundColor White
Write-Host ""
