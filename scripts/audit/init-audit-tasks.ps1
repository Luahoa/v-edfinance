# Initialize Beads Audit Tasks
# Creates the complete audit task hierarchy in Beads

param(
    [switch]$DryRun
)

Write-Host "=== Beads Audit Task Initialization ===" -ForegroundColor Cyan
Write-Host ""

if ($DryRun) {
    Write-Host "[DRY RUN MODE] No tasks will be created" -ForegroundColor Yellow
    Write-Host ""
}

# Check if Beads is available
try {
    $beadsVersion = bd version 2>&1
    Write-Host "[OK] Beads available: $beadsVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Beads not found. Please install first." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Creating audit task hierarchy..." -ForegroundColor Cyan
Write-Host ""

# Main Epic
Write-Host "[1/6] Creating main audit epic..." -ForegroundColor Yellow

$mainEpic = if (-not $DryRun) {
    bd create "Project Audit 2025" `
      --description="Comprehensive technical debt elimination and test coverage expansion" `
      -t epic -p 0 --json | ConvertFrom-Json
    $mainEpic.id
} else {
    Write-Host "  Would create: ved-audit-2025" -ForegroundColor Gray
    "ved-audit-2025"
}

Write-Host "  Created: $mainEpic" -ForegroundColor Green

# Sub-Epics
Write-Host "[2/6] Creating sub-epics..." -ForegroundColor Yellow

$epics = @(
    @{
        Title = "Technical Debt Scan"
        Description = "Automated and manual identification of technical debt across codebase"
        Deps = $mainEpic
    },
    @{
        Title = "Test Coverage Expansion"
        Description = "Achieve 90%+ test coverage with quality unit, integration, and E2E tests"
        Deps = $mainEpic
    },
    @{
        Title = "Security Audit"
        Description = "OWASP Top 10 compliance and vulnerability elimination"
        Deps = $mainEpic
    },
    @{
        Title = "Performance Optimization"
        Description = "API < 100ms, bundle < 200KB, Lighthouse > 90"
        Deps = $mainEpic
    },
    @{
        Title = "Documentation Update"
        Description = "100% API docs, current README, architecture diagrams"
        Deps = $mainEpic
    }
)

$epicIds = @{}
foreach ($epic in $epics) {
    if (-not $DryRun) {
        $result = bd create "$($epic.Title)" `
          --description="$($epic.Description)" `
          -t epic -p 1 `
          --deps "blocks:$($epic.Deps)" `
          --json | ConvertFrom-Json
        $epicIds[$epic.Title] = $result.id
    } else {
        Write-Host "  Would create: $($epic.Title)" -ForegroundColor Gray
    }
    Write-Host "  Created: $($epic.Title)" -ForegroundColor Green
}

# Technical Debt Tasks
Write-Host "[3/6] Creating technical debt tasks..." -ForegroundColor Yellow

$debtTasks = @(
    "Code Quality Scan - Biome violations",
    "Dependency Security Audit",
    "Performance Bottleneck Analysis",
    "Documentation Gap Analysis"
)

foreach ($task in $debtTasks) {
    if (-not $DryRun) {
        bd create "$task" `
          --description="Automated scan will populate subtasks" `
          -t task -p 1 `
          --deps "blocks:$($epicIds['Technical Debt Scan'])" `
          --json | Out-Null
    } else {
        Write-Host "  Would create: $task" -ForegroundColor Gray
    }
}

Write-Host "  Created $($debtTasks.Count) debt scan tasks" -ForegroundColor Green

# Testing Tasks
Write-Host "[4/6] Creating testing tasks..." -ForegroundColor Yellow

$testingTasks = @(
    @{ Title = "Unit Test Expansion - Auth Module"; Priority = 0 },
    @{ Title = "Unit Test Expansion - Users Module"; Priority = 1 },
    @{ Title = "Integration Test - API Endpoints"; Priority = 1 },
    @{ Title = "E2E Test - Critical User Flows"; Priority = 1 },
    @{ Title = "Load Testing - API Baseline"; Priority = 2 }
)

foreach ($task in $testingTasks) {
    if (-not $DryRun) {
        bd create "$($task.Title)" `
          --description="TestMaster will analyze and create subtasks" `
          -t task -p $task.Priority `
          --deps "blocks:$($epicIds['Test Coverage Expansion'])" `
          --json | Out-Null
    } else {
        Write-Host "  Would create: $($task.Title)" -ForegroundColor Gray
    }
}

Write-Host "  Created $($testingTasks.Count) testing tasks" -ForegroundColor Green

# Security Tasks
Write-Host "[5/6] Creating security audit tasks..." -ForegroundColor Yellow

$securityTasks = @(
    "OWASP Top 10 Compliance Check",
    "JWT Authentication Review",
    "Environment Variable Security Audit",
    "API Rate Limiting Verification"
)

foreach ($task in $securityTasks) {
    if (-not $DryRun) {
        bd create "$task" `
          --description="SecureGuard will perform security analysis" `
          -t task -p 0 `
          --deps "blocks:$($epicIds['Security Audit'])" `
          --json | Out-Null
    } else {
        Write-Host "  Would create: $task" -ForegroundColor Gray
    }
}

Write-Host "  Created $($securityTasks.Count) security tasks" -ForegroundColor Green

# Sync to git
Write-Host "[6/6] Syncing to git..." -ForegroundColor Yellow

if (-not $DryRun) {
    bd sync
    Write-Host "  Synced to git" -ForegroundColor Green
} else {
    Write-Host "  Would run: bd sync" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== Initialization Complete ===" -ForegroundColor Green
Write-Host ""

if (-not $DryRun) {
    Write-Host "Task Summary:" -ForegroundColor Cyan
    bd stats
    
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Run automated scans: .\scripts\audit\scan-code-quality.ps1" -ForegroundColor White
    Write-Host "2. Check ready tasks: bd ready --json" -ForegroundColor White
    Write-Host "3. Track progress: .\scripts\audit\beads-dashboard.ps1" -ForegroundColor White
} else {
    Write-Host "Run without -DryRun flag to create tasks" -ForegroundColor Yellow
}

Write-Host ""
