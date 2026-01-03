# V-EdFinance Project Cleanup Executor
# Auto-generated: 2026-01-04
# Reduces root from 180+ files to 15 core files

param(
    [switch]$DryRun = $true,
    [switch]$Force = $false
)

Write-Host "V-EdFinance Project Cleanup Starting..." -ForegroundColor Cyan
Write-Host "Mode: $(if($DryRun){'DRY RUN'}else{'LIVE EXECUTION'})" -ForegroundColor Yellow

# Phase 1: Safety Checks
Write-Host "`nPhase 1: Safety Checks" -ForegroundColor Green

$gitStatus = git status --short
if ($gitStatus -and !$Force) {
    Write-Host "Uncommitted changes detected. Commit first or use -Force" -ForegroundColor Red
    exit 1
}

# Phase 2: Archive Historical Reports
Write-Host "`nPhase 2: Archive Historical Reports (47 files)" -ForegroundColor Green

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
                Write-Host "  [DRY] Would move: $($file.Name) to $targetDir" -ForegroundColor Cyan
            } else {
                Move-Item $file.FullName "$targetDir/$($file.Name)" -Force
                Write-Host "  Moved: $($file.Name) to $targetDir" -ForegroundColor Green
            }
        }
    }
}

# Phase 3: Consolidate Test Outputs
Write-Host "`nPhase 3: Consolidate Test Outputs (15 files)" -ForegroundColor Green

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
                Write-Host "  [DRY] Would move: $($file.Name) to $targetDir" -ForegroundColor Cyan
            } else {
                Move-Item $file.FullName "$targetDir/$($file.Name)" -Force
                Write-Host "  Moved: $($file.Name) to $targetDir" -ForegroundColor Green
            }
        }
    }
}

# Phase 4: Organize Automation Scripts
Write-Host "`nPhase 4: Organize Automation Scripts (40 files)" -ForegroundColor Green

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
            if ($file.DirectoryName -like "*\scripts\*") { continue }
            
            if ($DryRun) {
                Write-Host "  [DRY] Would move: $($file.Name) to $targetDir" -ForegroundColor Cyan
            } else {
                $newName = $file.Name.ToLower().Replace('_', '-')
                Move-Item $file.FullName "$targetDir/$newName" -Force
                Write-Host "  Moved: $($file.Name) to $targetDir/$newName" -ForegroundColor Green
            }
        }
    }
}

# Phase 5: Remove Temp Files
Write-Host "`nPhase 5: Remove Temp Files (20 files)" -ForegroundColor Green

$tempPatterns = @('temp_*', '*.log', 'api_build_success.txt', 'audit-root-files.txt', 
                  'categorization.json', 'git-status-raw.txt', 'move-execution.log',
                  'routes.txt', 'security-audit.json', 'test-*.txt', 'quick-test.ts')

foreach ($pattern in $tempPatterns) {
    $files = Get-ChildItem -Filter $pattern -File -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        if ($DryRun) {
            Write-Host "  [DRY] Would delete: $($file.Name)" -ForegroundColor Cyan
        } else {
            Remove-Item $file.FullName -Force
            Write-Host "  Deleted: $($file.Name)" -ForegroundColor Green
        }
    }
}

# Phase 6: Consolidate Documentation
Write-Host "`nPhase 6: Consolidate Documentation" -ForegroundColor Green

$docStructure = @{
    "docs/database" = @("DATABASE_*.md", "SCHEMA_*.md")
    "docs/beads" = @("BEADS_*.md")
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
                Write-Host "  [DRY] Would move: $($file.Name) to $targetDir" -ForegroundColor Cyan
            } else {
                Move-Item $file.FullName "$targetDir/$($file.Name)" -Force
                Write-Host "  Moved: $($file.Name) to $targetDir" -ForegroundColor Green
            }
        }
    }
}

# Phase 7: Final Report
Write-Host "`nFinal Report" -ForegroundColor Green

$remainingFiles = Get-ChildItem -File | Where-Object { 
    $_.Extension -in @('.md', '.bat', '.ps1', '.txt', '.log') 
}

Write-Host "`nRemaining root files: $($remainingFiles.Count)" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "`nDRY RUN COMPLETE. Review above, then run with -DryRun:`$false" -ForegroundColor Cyan
} else {
    Write-Host "`nCLEANUP COMPLETE!" -ForegroundColor Green
    Write-Host "Next: git add -A and git commit -m 'chore: Project cleanup'" -ForegroundColor Yellow
}
