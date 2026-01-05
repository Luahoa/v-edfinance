# AUTO DATABASE SEED TESTING SUITE
# PowerShell Script - Fixed Version

param(
    [switch]$SkipBenchmark = $false
)

$ErrorActionPreference = "Continue"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "AUTO DATABASE SEED TESTING SUITE" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to project
Set-Location "C:\Users\luaho\Demo project\v-edfinance"

$TestResults = @{
    Phase1 = @{ Status = "Pending"; StartTime = $null; EndTime = $null }
    Phase2 = @{ Status = "Pending"; StartTime = $null; EndTime = $null }
    Phase3 = @{ Status = "Pending"; StartTime = $null; EndTime = $null }
}

# PHASE 1: SEED VALIDATION
Write-Host "================================" -ForegroundColor Cyan
Write-Host "[Phase 1] Seed Validation Tests" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$TestResults.Phase1.StartTime = Get-Date

try {
    Set-Location "apps\api"
    
    Write-Host "Resetting database..." -ForegroundColor Yellow
    pnpm exec npx prisma migrate reset --force --skip-seed 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Database reset failed"
    }
    Write-Host "Database reset complete" -ForegroundColor Green
    
    Write-Host "Running basic seed..." -ForegroundColor Yellow
    pnpm exec ts-node prisma/seed.ts 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Basic seed failed"
    }
    Write-Host "Basic seed complete" -ForegroundColor Green
    
    Write-Host "Running dev scenario seed..." -ForegroundColor Yellow
    pnpm exec npx prisma migrate reset --force --skip-seed 2>&1 | Out-Null
    pnpm exec ts-node prisma/seeds/index.ts dev 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Dev seed failed"
    }
    Write-Host "Dev scenario seed complete" -ForegroundColor Green
    
    $TestResults.Phase1.Status = "PASSED"
    Write-Host ""
    Write-Host "[Phase 1] PASSED" -ForegroundColor Green
    
} catch {
    $TestResults.Phase1.Status = "FAILED"
    Write-Host ""
    Write-Host "[Phase 1] FAILED" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

$TestResults.Phase1.EndTime = Get-Date
Set-Location "..\.."

# PHASE 2: TRIPLE-ORM VERIFICATION
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "[Phase 2] Triple-ORM Tests" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$TestResults.Phase2.StartTime = Get-Date

try {
    Set-Location "apps\api"
    
    Write-Host "Running Triple-ORM test suite..." -ForegroundColor Yellow
    $testResult = pnpm test database.service.seed.spec.ts 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        throw "Triple-ORM tests failed"
    }
    
    $TestResults.Phase2.Status = "PASSED"
    Write-Host ""
    Write-Host "[Phase 2] PASSED" -ForegroundColor Green
    
} catch {
    $TestResults.Phase2.Status = "FAILED"
    Write-Host ""
    Write-Host "[Phase 2] FAILED" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

$TestResults.Phase2.EndTime = Get-Date
Set-Location "..\.."

# PHASE 3: AI AGENT DATA
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "[Phase 3] AI Agent Data Tests" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$TestResults.Phase3.StartTime = Get-Date

try {
    Set-Location "apps\api"
    
    Write-Host "Running AI Agent test suite..." -ForegroundColor Yellow
    $testResult = pnpm test ai-agent-data.spec.ts 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        throw "AI Agent tests failed"
    }
    
    $TestResults.Phase3.Status = "PASSED"
    Write-Host ""
    Write-Host "[Phase 3] PASSED" -ForegroundColor Green
    
} catch {
    $TestResults.Phase3.Status = "FAILED"
    Write-Host ""
    Write-Host "[Phase 3] FAILED" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

$TestResults.Phase3.EndTime = Get-Date
Set-Location "..\.."

# FINAL REPORT
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "FINAL TEST REPORT" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$totalPassed = 0
$totalFailed = 0

foreach ($phaseName in $TestResults.Keys | Sort-Object) {
    $phase = $TestResults[$phaseName]
    $duration = 0
    if ($phase.StartTime -and $phase.EndTime) {
        $duration = ($phase.EndTime - $phase.StartTime).TotalSeconds
    }
    
    $color = if ($phase.Status -eq "PASSED") { "Green"; $totalPassed++ } else { "Red"; $totalFailed++ }
    
    Write-Host "$phaseName : " -NoNewline
    Write-Host $phase.Status -ForegroundColor $color -NoNewline
    Write-Host " ($duration seconds)"
}

Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Passed: $totalPassed" -ForegroundColor Green
Write-Host "  Failed: $totalFailed" -ForegroundColor Red

# Save JSON report
$reportData = @{
    Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Results = $TestResults
    Summary = @{
        Passed = $totalPassed
        Failed = $totalFailed
    }
}

$reportPath = "DATABASE_SEED_TEST_RESULTS.json"
$reportData | ConvertTo-Json -Depth 5 | Out-File -FilePath $reportPath -Encoding UTF8

Write-Host ""
Write-Host "Report saved to: $reportPath" -ForegroundColor Green
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Testing Complete!" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
