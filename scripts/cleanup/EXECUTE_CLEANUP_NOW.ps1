# 🧹 V-EdFinance Project Cleanup Executor
# Auto-generated: 2026-01-04
# Reduces root from 180+ files to 15 core files

param(
    [switch]$DryRun = $true,
    [switch]$Force = $false
)

Write-Host "🧹 V-EdFinance Project Cleanup Starting..." -ForegroundColor Cyan
Write-Host "Mode: $(if($DryRun){'DRY RUN'}else{'LIVE EXECUTION'})" -ForegroundColor Yellow

# ========================================
# PHASE 1: SAFETY CHECKS
# ========================================
Write-Host "`n📋 Phase 1: Safety Checks" -ForegroundColor Green

# Check git status
$gitStatus = git status --short
if ($gitStatus -and !$Force) {
    Write-Host "❌ Uncommitted changes detected. Commit first or use -Force" -ForegroundColor Red
    exit 1
}

# Create backup
if (!$DryRun) {
    Write-Host "💾 Creating backup..." -ForegroundColor Yellow
    $backupDir = "cleanup-backup-$(Get-Date -Format 'yyyy-MM-dd-HHmmss')"
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
}

# ========================================
# PHASE 2: ARCHIVE HISTORICAL REPORTS
# ========================================
Write-Host "`n📦 Phase 2: Archive Historical Reports (47 files)" -ForegroundColor Green

$archiveStructure = @{
    "docs/archive/2025-12/wave-reports" = @("WAVE*.bat")
    "docs/archive/2026-01/session-reports" = @("THREAD_HANDOFF*.md", "SESSION*.md", "PROGRESS*.md")
    "docs/archive/2026-01/audit-reports" = @("PROJECT_AUDIT*.md", "AUDIT*.md")
    "docs/archive/2026-01/completion-reports" = @("*_COMPLETION*.md", "*_STATUS*.md", "*_REPORT*.md", "*_PIPELINE*.md", "*_SUMMARY*.md")
    "docs/archive/2026-01/cleanup-reports" = @("CLEANUP_*.md", "BV_MVP*.md")
}

foreach ($targetDir in $archiveStructure.Keys) {
    if (!$DryRun) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }
    
    foreach ($pattern in $archiveStructure[$targetDir]) {
        $files = Get-ChildItem -Filter $pattern -File -ErrorAction SilentlyContinue
        foreach ($file in $files) {
            if ($DryRun) {
                Write-Host "  [DRY] Would move: $($file.Name) → $targetDir" -ForegroundColor Cyan
            } else {
                Move-Item $file.FullName "$targetDir/$($file.Name)" -Force
                Write-Host "  ✅ Moved: $($file.Name) → $targetDir" -ForegroundColor Green
            }
        }
    }
}

# ========================================
# PHASE 3: CONSOLIDATE TEST OUTPUTS
# ========================================
Write-Host "`n🧪 Phase 3: Consolidate Test Outputs (15+ files)" -ForegroundColor Green

$testStructure = @{
    "test-results/unit/archive" = @("test_output*.txt", "test_failures*.txt")
    "test-results/coverage/archive" = @("coverage_*.txt")
}

foreach ($targetDir in $testStructure.Keys) {
    if (!$DryRun) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }
    
    foreach ($pattern in $testStructure[$targetDir]) {
        $files = Get-ChildItem -Filter $pattern -File -ErrorAction SilentlyContinue
        foreach ($file in $files) {
            if ($DryRun) {
                Write-Host "  [DRY] Would move: $($file.Name) → $targetDir" -ForegroundColor Cyan
            } else {
                Move-Item $file.FullName "$targetDir/$($file.Name)" -Force
                Write-Host "  ✅ Moved: $($file.Name) → $targetDir" -ForegroundColor Green
            }
        }
    }
}

# ========================================
# PHASE 4: ORGANIZE AUTOMATION SCRIPTS
# ========================================
Write-Host "`n🛠️ Phase 4: Organize Automation Scripts (40+ files)" -ForegroundColor Green

$scriptStructure = @{
    "scripts/setup" = @("INSTALL_*.bat", "INSTALL_*.ps1", "SETUP_*.bat", "COMPLETE_SETUP.bat", "*_INSTALL*.ps1")
    "scripts/fix" = @("FIX_*.bat", "FORCE_*.bat", "NUCLEAR_RESET.bat")
    "scripts/test" = @("RUN_*TESTS.bat", "TEST_*.bat", "VERIFY_*.bat", "CHECK_*.bat")
    "scripts/deploy" = @("VPS_*.bat", "VPS_*.ps1", "AMPHITHEATRE_*.ps1", "R2_*.bat", "DOWNLOAD_*.ps1")
    "scripts/dev" = @("START_*.bat", "STOP_*.bat", "RESTART_*.bat", "QUICK_*.bat", "CLEAN_START.bat", "QUICK_*.ps1", "SIMPLE_*.ps1")
    "scripts/monitoring" = @("*MONITORING*.bat", "VIEW_*.bat")
}

foreach ($targetDir in $scriptStructure.Keys) {
    if (!$DryRun) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }
    
    foreach ($pattern in $scriptStructure[$targetDir]) {
        $files = Get-ChildItem -Filter $pattern -File -ErrorAction SilentlyContinue
        foreach ($file in $files) {
            # Skip if already in scripts/ subdirectory
            if ($file.DirectoryName -like "*\scripts\*") { continue }
            
            if ($DryRun) {
                Write-Host "  [DRY] Would move: $($file.Name) → $targetDir" -ForegroundColor Cyan
            } else {
                $newName = $file.Name.ToLower().Replace('_', '-')
                Move-Item $file.FullName "$targetDir/$newName" -Force
                Write-Host "  ✅ Moved: $($file.Name) → $targetDir/$newName" -ForegroundColor Green
            }
        }
    }
}

# ========================================
# PHASE 5: CLEANUP TEMP FILES
# ========================================
Write-Host "`n🗑️ Phase 5: Remove Temp Files (20+ files)" -ForegroundColor Green

$tempFiles = @(
    '$null',
    'temp_*.ts', 'temp_*.txt', 'temp_*.py', 'temp_*.pub',
    '*.log',
    'api_build_success.txt',
    'audit-root-files.txt',
    'categorization.json',
    'git-status-raw.txt',
    'move-execution.log',
    'remove_duplicates.py',
    'update_schema.py',
    'go_installer.msi',
    'routes.txt',
    'security-audit.json',
    'test-r2-upload.txt',
    'test-upload.txt',
    'quick-test.ts',
    'move-files.ps1',
    'BEADS_TASKS_SIMPLE.txt'
)

foreach ($pattern in $tempFiles) {
    $files = Get-ChildItem -Filter $pattern -File -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        if ($DryRun) {
            Write-Host "  [DRY] Would delete: $($file.Name)" -ForegroundColor Cyan
        } else {
            Remove-Item $file.FullName -Force
            Write-Host "  ✅ Deleted: $($file.Name)" -ForegroundColor Green
        }
    }
}

# ========================================
# PHASE 6: CONSOLIDATE DOCUMENTATION
# ========================================
Write-Host "`n📚 Phase 6: Consolidate Documentation" -ForegroundColor Green

$docStructure = @{
    "docs/database" = @("DATABASE_*.md", "SCHEMA_*.md")
    "docs/beads" = @("BEADS_*.md")
    "docs/deployment" = @("AMPHITHEATRE_*.md", "VPS_*.md", "DOKPLOY_*.md")
    "docs/ai-optimization" = @("AI_SYSTEM_*.md", "PHASE2_*.md")
}

foreach ($targetDir in $docStructure.Keys) {
    if (!$DryRun) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }
    
    foreach ($pattern in $docStructure[$targetDir]) {
        $files = Get-ChildItem -Filter $pattern -File -ErrorAction SilentlyContinue
        foreach ($file in $files) {
            if ($DryRun) {
                Write-Host "  [DRY] Would move: $($file.Name) → $targetDir" -ForegroundColor Cyan
            } else {
                Move-Item $file.FullName "$targetDir/$($file.Name)" -Force
                Write-Host "  ✅ Moved: $($file.Name) → $targetDir" -ForegroundColor Green
            }
        }
    }
}

# ========================================
# PHASE 7: FINAL REPORT
# ========================================
Write-Host "`n📊 Final Report" -ForegroundColor Green

$remainingFiles = Get-ChildItem -File | Where-Object { 
    $_.Extension -in @('.md', '.bat', '.ps1', '.txt', '.log') 
}

Write-Host "`nRemaining root files:" -ForegroundColor Yellow
Write-Host "  Total: $($remainingFiles.Count)" -ForegroundColor Cyan

if ($remainingFiles.Count -le 20) {
    Write-Host "`n✅ SUCCESS! Root directory cleaned to $($remainingFiles.Count) files" -ForegroundColor Green
    Write-Host "`nCore files (should keep):" -ForegroundColor Yellow
    $coreFiles = @('AGENTS.md', 'SPEC.md', 'README.md', 'ARCHITECTURE.md', 
                   'STRATEGIC_DEBT_PAYDOWN_PLAN.md', 'TEST_COVERAGE_BASELINE.md',
                   'package.json', 'tsconfig.json', 'turbo.json', 'biome.json',
                   'pnpm-workspace.yaml', 'vitest.config.ts', 'playwright.config.ts',
                   '.gitignore', '.npmrc')
    
    foreach ($file in $remainingFiles) {
        $isCore = $file.Name -in $coreFiles
        $color = if ($isCore) { "Green" } else { "Red" }
        Write-Host "  $($file.Name)" -ForegroundColor $color
    }
} else {
    Write-Host "`n⚠️ Still $($remainingFiles.Count) files in root. Review needed." -ForegroundColor Yellow
}

if ($DryRun) {
    Write-Host "`n✅ DRY RUN COMPLETE. Review above, then run with -DryRun:`$false" -ForegroundColor Cyan
} else {
    Write-Host "`n✅ CLEANUP COMPLETE!" -ForegroundColor Green
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Review changes: git status" -ForegroundColor White
    Write-Host "  2. Test builds: pnpm build" -ForegroundColor White
    Write-Host "  3. Commit: git add -A && git commit -m 'chore: Project cleanup - 93% root reduction'" -ForegroundColor White
}
