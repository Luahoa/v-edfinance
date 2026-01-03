# V-EdFinance Cleanup - LIVE EXECUTION
Write-Host "Starting LIVE cleanup..." -ForegroundColor Red

# Phase 2: Archive
Write-Host "`nArchiving historical reports..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "docs/archive/2025-12/wave-reports" -Force | Out-Null
New-Item -ItemType Directory -Path "docs/archive/2026-01/session-reports" -Force | Out-Null
New-Item -ItemType Directory -Path "docs/archive/2026-01/audit-reports" -Force | Out-Null
New-Item -ItemType Directory -Path "docs/archive/2026-01/completion-reports" -Force | Out-Null
New-Item -ItemType Directory -Path "docs/archive/2026-01/cleanup-reports" -Force | Out-Null

Get-ChildItem -Filter "CLEANUP_*.md" | Move-Item -Destination "docs/archive/2026-01/cleanup-reports" -Force
Get-ChildItem -Filter "BV_MVP*.md" | Move-Item -Destination "docs/archive/2026-01/cleanup-reports" -Force
Get-ChildItem -Filter "THREAD_HANDOFF*.md" | Move-Item -Destination "docs/archive/2026-01/session-reports" -Force
Get-ChildItem -Filter "WAVE*.bat" | Move-Item -Destination "docs/archive/2025-12/wave-reports" -Force
Get-ChildItem -Filter "PROJECT_AUDIT*.md" | Move-Item -Destination "docs/archive/2026-01/audit-reports" -Force
Get-ChildItem -Filter "*_COMPLETION*.md" | Move-Item -Destination "docs/archive/2026-01/completion-reports" -Force
Get-ChildItem -Filter "*_STATUS*.md" | Move-Item -Destination "docs/archive/2026-01/completion-reports" -Force
Get-ChildItem -Filter "*_PIPELINE*.md" | Move-Item -Destination "docs/archive/2026-01/completion-reports" -Force
Get-ChildItem -Filter "*_REPORT*.md" | Move-Item -Destination "docs/archive/2026-01/completion-reports" -Force
Get-ChildItem -Filter "*_SUMMARY*.md" | Move-Item -Destination "docs/archive/2026-01/completion-reports" -Force
Get-ChildItem -Filter "GIT_COMMIT*.md" | Move-Item -Destination "docs/archive/2026-01/completion-reports" -Force

# Phase 3: Test outputs
Write-Host "Consolidating test outputs..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "test-results/unit/archive" -Force | Out-Null
New-Item -ItemType Directory -Path "test-results/coverage/archive" -Force | Out-Null

Get-ChildItem -Filter "test_output*.txt" | Move-Item -Destination "test-results/unit/archive" -Force
Get-ChildItem -Filter "test_failures*.txt" | Move-Item -Destination "test-results/unit/archive" -Force
Get-ChildItem -Filter "coverage_*.txt" | Move-Item -Destination "test-results/coverage/archive" -Force

# Phase 4: Scripts
Write-Host "Organizing scripts..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "scripts/setup" -Force | Out-Null
New-Item -ItemType Directory -Path "scripts/fix" -Force | Out-Null
New-Item -ItemType Directory -Path "scripts/test" -Force | Out-Null
New-Item -ItemType Directory -Path "scripts/deploy" -Force | Out-Null
New-Item -ItemType Directory -Path "scripts/dev" -Force | Out-Null
New-Item -ItemType Directory -Path "scripts/monitoring" -Force | Out-Null

Get-ChildItem -Filter "INSTALL_*.bat" | Move-Item -Destination "scripts/setup" -Force
Get-ChildItem -Filter "INSTALL_*.ps1" | Move-Item -Destination "scripts/setup" -Force
Get-ChildItem -Filter "SETUP_*.bat" | Move-Item -Destination "scripts/setup" -Force
Get-ChildItem -Filter "*_INSTALL*.ps1" | Move-Item -Destination "scripts/setup" -Force
Get-ChildItem -Filter "COMPLETE_SETUP.bat" | Move-Item -Destination "scripts/setup" -Force
Get-ChildItem -Filter "FINAL_INSTALL.ps1" | Move-Item -Destination "scripts/setup" -Force
Get-ChildItem -Filter "SIMPLE_*.ps1" | Move-Item -Destination "scripts/setup" -Force

Get-ChildItem -Filter "FIX_*.bat" | Move-Item -Destination "scripts/fix" -Force
Get-ChildItem -Filter "FORCE_*.bat" | Move-Item -Destination "scripts/fix" -Force
Get-ChildItem -Filter "NUCLEAR_RESET.bat" | Move-Item -Destination "scripts/fix" -Force

Get-ChildItem -Filter "RUN_*TESTS.bat" | Move-Item -Destination "scripts/test" -Force
Get-ChildItem -Filter "TEST_*.bat" | Move-Item -Destination "scripts/test" -Force
Get-ChildItem -Filter "VERIFY_*.bat" | Move-Item -Destination "scripts/test" -Force
Get-ChildItem -Filter "CHECK_*.bat" | Move-Item -Destination "scripts/test" -Force

Get-ChildItem -Filter "VPS_*.bat" | Move-Item -Destination "scripts/deploy" -Force
Get-ChildItem -Filter "VPS_*.ps1" | Move-Item -Destination "scripts/deploy" -Force
Get-ChildItem -Filter "AMPHITHEATRE_*.ps1" | Move-Item -Destination "scripts/deploy" -Force
Get-ChildItem -Filter "R2_*.bat" | Move-Item -Destination "scripts/deploy" -Force
Get-ChildItem -Filter "DOWNLOAD_*.ps1" | Move-Item -Destination "scripts/deploy" -Force

Get-ChildItem -Filter "START_*.bat" | Move-Item -Destination "scripts/dev" -Force
Get-ChildItem -Filter "STOP_*.bat" | Move-Item -Destination "scripts/dev" -Force
Get-ChildItem -Filter "RESTART_*.bat" | Move-Item -Destination "scripts/dev" -Force
Get-ChildItem -Filter "QUICK_*.bat" | Move-Item -Destination "scripts/dev" -Force
Get-ChildItem -Filter "CLEAN_START.bat" | Move-Item -Destination "scripts/dev" -Force

Get-ChildItem -Filter "*MONITORING*.bat" | Move-Item -Destination "scripts/monitoring" -Force
Get-ChildItem -Filter "VIEW_*.bat" | Move-Item -Destination "scripts/monitoring" -Force

# Phase 5: Temp files
Write-Host "Removing temp files..." -ForegroundColor Yellow
Get-ChildItem -Filter "temp_*" | Remove-Item -Force
Get-ChildItem -Filter "*.log" | Remove-Item -Force
Remove-Item "api_build_success.txt" -Force -ErrorAction SilentlyContinue
Remove-Item "audit-root-files.txt" -Force -ErrorAction SilentlyContinue
Remove-Item "categorization.json" -Force -ErrorAction SilentlyContinue
Remove-Item "git-status-raw.txt" -Force -ErrorAction SilentlyContinue
Remove-Item "routes.txt" -Force -ErrorAction SilentlyContinue
Remove-Item "security-audit.json" -Force -ErrorAction SilentlyContinue
Remove-Item "test-*.txt" -Force -ErrorAction SilentlyContinue
Remove-Item "quick-test.ts" -Force -ErrorAction SilentlyContinue

# Phase 6: Docs
Write-Host "Organizing documentation..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "docs/database" -Force | Out-Null
New-Item -ItemType Directory -Path "docs/beads" -Force | Out-Null
New-Item -ItemType Directory -Path "docs/ai-optimization" -Force | Out-Null

Get-ChildItem -Filter "DATABASE_*.md" | Move-Item -Destination "docs/database" -Force
Get-ChildItem -Filter "SCHEMA_*.md" | Move-Item -Destination "docs/database" -Force
Get-ChildItem -Filter "BEADS_*.md" | Move-Item -Destination "docs/beads" -Force
Get-ChildItem -Filter "AI_SYSTEM_*.md" | Move-Item -Destination "docs/ai-optimization" -Force
Get-ChildItem -Filter "PHASE2_*.md" | Move-Item -Destination "docs/ai-optimization" -Force

Write-Host "`nCLEANUP COMPLETE!" -ForegroundColor Green

$remaining = (Get-ChildItem -Filter "*.md").Count
Write-Host "Remaining .md files in root: $remaining" -ForegroundColor Cyan
