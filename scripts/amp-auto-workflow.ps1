# ═══════════════════════════════════════════════════════════════════════════
# Amp Auto-Regenerate Workflow Script
# ═══════════════════════════════════════════════════════════════════════════
# Purpose: Auto-accept Amp review suggestions and regenerate code
# Usage: ./scripts/amp-auto-workflow.ps1 -TaskId "ved-XXX" -Message "..."
# ═══════════════════════════════════════════════════════════════════════════

param(
    [Parameter(Mandatory=$true)]
    [string]$TaskId,
    
    [Parameter(Mandatory=$true)]
    [string]$Message,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipTests,
    
    [Parameter(Mandatory=$false)]
    [string]$CommitType = "feat",
    
    [Parameter(Mandatory=$false)]
    [int]$MaxIterations = 3
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Amp Auto-Regenerate Workflow" -ForegroundColor Cyan
Write-Host "  (Auto-accepts all Amp suggestions)" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════
# Configuration
# ═══════════════════════════════════════════════════════════════════════════

$iteration = 0
$ampApproved = $false
$reviewFile = "$RootDir\review-$TaskId.txt"
$regenerationLog = "$RootDir\regeneration-$TaskId.log"

# Clear previous logs
if (Test-Path $regenerationLog) { Remove-Item $regenerationLog }

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $Message" | Out-File -FilePath $regenerationLog -Append
    Write-Host $Message
}

# ═══════════════════════════════════════════════════════════════════════════
# ITERATION LOOP: Regenerate until Amp approves
# ═══════════════════════════════════════════════════════════════════════════

while (-not $ampApproved -and $iteration -lt $MaxIterations) {
    $iteration++
    
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
    Write-Host "  ITERATION $iteration / $MaxIterations" -ForegroundColor Magenta
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
    Write-Host ""
    
    Write-Log "Starting iteration $iteration"
    
    # ───────────────────────────────────────────────────────────────────────
    # STEP 1: Run Tests (if first iteration or after regeneration)
    # ───────────────────────────────────────────────────────────────────────
    
    if (-not $SkipTests) {
        Write-Host "[STEP 1] Running Tests..." -ForegroundColor Yellow
        Push-Location "$RootDir\apps\api"
        
        Write-Host "  → Building..." -ForegroundColor Cyan
        $buildResult = pnpm build 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Build failed!" -ForegroundColor Red
            Write-Log "Build failed at iteration $iteration"
            Pop-Location
            exit 1
        }
        
        Write-Host "  → Testing..." -ForegroundColor Cyan
        $testResult = pnpm test --run 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "⚠️  Tests failed. Will ask Amp to fix." -ForegroundColor Yellow
            Write-Log "Tests failed at iteration $iteration - Amp will address"
        } else {
            Write-Host "✅ Tests passed" -ForegroundColor Green
            Write-Log "Tests passed at iteration $iteration"
        }
        
        Pop-Location
    }
    
    # ───────────────────────────────────────────────────────────────────────
    # STEP 2: Stage Changes and Generate Diff
    # ───────────────────────────────────────────────────────────────────────
    
    Write-Host ""
    Write-Host "[STEP 2] Generating Code Review..." -ForegroundColor Yellow
    
    git add -A
    $diff = git diff --cached
    
    if (-not $diff) {
        Write-Host "✅ No changes detected. Code is final!" -ForegroundColor Green
        $ampApproved = $true
        continue
    }
    
    # Save diff to review file
    $diff | Out-File -FilePath $reviewFile -Encoding UTF8
    Write-Host "  → Review file: $reviewFile" -ForegroundColor Cyan
    Write-Log "Generated diff for iteration $iteration"
    
    # ───────────────────────────────────────────────────────────────────────
    # STEP 3: Amp Review (Automated)
    # ───────────────────────────────────────────────────────────────────────
    
    Write-Host ""
    Write-Host "[STEP 3] Amp Auto-Review..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  🤖 AMP REVIEW MODE: AUTOMATED" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Review File: $reviewFile" -ForegroundColor White
    Write-Host "Task: $TaskId" -ForegroundColor White
    Write-Host "Iteration: $iteration / $MaxIterations" -ForegroundColor White
    Write-Host ""
    Write-Host "Instructions for Amp:" -ForegroundColor Yellow
    Write-Host "  1. Review the diff in $reviewFile" -ForegroundColor White
    Write-Host "  2. If code is PERFECT:" -ForegroundColor White
    Write-Host "     → Say 'APPROVED' or 'LGTM'" -ForegroundColor Green
    Write-Host "     → Workflow will commit and push" -ForegroundColor Green
    Write-Host ""
    Write-Host "  3. If code NEEDS IMPROVEMENT:" -ForegroundColor White
    Write-Host "     → Provide specific line-by-line suggestions" -ForegroundColor Yellow
    Write-Host "     → Agent will AUTOMATICALLY regenerate code" -ForegroundColor Yellow
    Write-Host "     → Loop continues until approved" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "⏸️  WAITING FOR AMP REVIEW..." -ForegroundColor Magenta
    Write-Host ""
    
    Write-Log "Paused for Amp review at iteration $iteration"
    
    # Pause for user to let Amp review
    Write-Host "Press Enter after Amp has reviewed the code..." -ForegroundColor Yellow
    Read-Host
    
    # ───────────────────────────────────────────────────────────────────────
    # STEP 4: Check Amp Decision (User Input)
    # ───────────────────────────────────────────────────────────────────────
    
    Write-Host ""
    Write-Host "[STEP 4] Amp Decision..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Did Amp approve the code?" -ForegroundColor Cyan
    Write-Host "  1. APPROVED - Code is perfect, commit now" -ForegroundColor Green
    Write-Host "  2. NEEDS WORK - Amp provided suggestions, regenerate" -ForegroundColor Yellow
    Write-Host "  3. CANCEL - Stop workflow" -ForegroundColor Red
    Write-Host ""
    $decision = Read-Host "Enter choice (1-3)"
    
    switch ($decision) {
        "1" {
            Write-Host ""
            Write-Host "✅ Amp APPROVED! Proceeding to commit..." -ForegroundColor Green
            Write-Log "Amp approved code at iteration $iteration"
            $ampApproved = $true
        }
        "2" {
            Write-Host ""
            Write-Host "🔄 Amp requests changes. Auto-regenerating..." -ForegroundColor Yellow
            Write-Log "Amp requested changes at iteration $iteration - auto-regenerating"
            
            # ───────────────────────────────────────────────────────────────
            # STEP 5: Auto-Regenerate Code
            # ───────────────────────────────────────────────────────────────
            
            Write-Host ""
            Write-Host "[STEP 5] Auto-Regenerating Code..." -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Instructions for Agent:" -ForegroundColor Cyan
            Write-Host "  → Implement ALL suggestions from Amp review" -ForegroundColor White
            Write-Host "  → Fix TypeScript errors" -ForegroundColor White
            Write-Host "  → Update tests if needed" -ForegroundColor White
            Write-Host "  → Ensure build passes" -ForegroundColor White
            Write-Host ""
            Write-Host "⏸️  Agent, please regenerate code now..." -ForegroundColor Magenta
            Write-Host "Press Enter when regeneration is complete..." -ForegroundColor Yellow
            Read-Host
            
            Write-Host ""
            Write-Host "✅ Regeneration complete. Starting next iteration..." -ForegroundColor Green
            Write-Log "Code regenerated at iteration $iteration"
            
            # Unstage previous changes (will re-stage after regeneration)
            git reset HEAD > $null 2>&1
        }
        "3" {
            Write-Host ""
            Write-Host "❌ Workflow cancelled by user" -ForegroundColor Red
            Write-Log "Workflow cancelled at iteration $iteration"
            git reset HEAD > $null 2>&1
            exit 0
        }
        default {
            Write-Host ""
            Write-Host "❌ Invalid choice. Workflow cancelled." -ForegroundColor Red
            git reset HEAD > $null 2>&1
            exit 1
        }
    }
}

# ═══════════════════════════════════════════════════════════════════════════
# Check if max iterations reached without approval
# ═══════════════════════════════════════════════════════════════════════════

if (-not $ampApproved) {
    Write-Host ""
    Write-Host "⚠️  Max iterations ($MaxIterations) reached without Amp approval!" -ForegroundColor Yellow
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "  1. Commit anyway (override)" -ForegroundColor Yellow
    Write-Host "  2. Cancel workflow" -ForegroundColor Red
    Write-Host ""
    $override = Read-Host "Enter choice (1-2)"
    
    if ($override -ne "1") {
        Write-Host "Workflow cancelled." -ForegroundColor Red
        git reset HEAD > $null 2>&1
        exit 0
    }
    
    Write-Host "Proceeding with commit (manual override)..." -ForegroundColor Yellow
    Write-Log "Max iterations reached - proceeding with manual override"
}

# ═══════════════════════════════════════════════════════════════════════════
# FINAL STEPS: Commit, Beads, Push
# ═══════════════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  FINAL COMMIT PHASE" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Stage final changes
git add -A

# Commit
Write-Host "[FINAL] Creating Git Commit..." -ForegroundColor Yellow
$commitMessage = "${CommitType}: ${Message} (${TaskId})"
if ($iteration -gt 1) {
    $commitMessage += " - $iteration iterations with Amp review"
}

Write-Host "  → Commit message: $commitMessage" -ForegroundColor Cyan
$env:AMP_BEADS_WORKFLOW = "1"
git commit -m "$commitMessage"
$env:AMP_BEADS_WORKFLOW = $null

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git commit failed!" -ForegroundColor Red
    exit 1
}

$commitHash = git rev-parse --short HEAD
Write-Host "✅ Committed: $commitHash" -ForegroundColor Green
Write-Log "Committed: $commitHash - $commitMessage"

# Beads close
Write-Host ""
Write-Host "[FINAL] Closing Beads Task..." -ForegroundColor Yellow
$beadsReason = "Completed after $iteration Amp review iteration(s): $Message (commit: $commitHash)"
& "$RootDir\beads.exe" close $TaskId --reason "$beadsReason"

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Beads close failed, but commit is safe." -ForegroundColor Yellow
} else {
    Write-Host "✅ Task $TaskId closed in Beads" -ForegroundColor Green
    Write-Log "Beads task closed"
}

# Beads sync
Write-Host ""
Write-Host "[FINAL] Syncing Beads Metadata..." -ForegroundColor Yellow
& "$RootDir\beads.exe" sync

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Beads sync failed. Retry manually." -ForegroundColor Yellow
} else {
    Write-Host "✅ Beads metadata synced" -ForegroundColor Green
    Write-Log "Beads synced"
}

# Git push
Write-Host ""
Write-Host "[FINAL] Pushing to Remote..." -ForegroundColor Yellow
git push

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git push failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ All commits pushed to remote" -ForegroundColor Green
Write-Log "Pushed to remote"

# ═══════════════════════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ WORKFLOW COMPLETE" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor White
Write-Host "  • Task: $TaskId" -ForegroundColor Green
Write-Host "  • Iterations: $iteration" -ForegroundColor Green
Write-Host "  • Commit: $commitHash" -ForegroundColor Green
Write-Host "  • Amp Review: " -NoNewline -ForegroundColor Gray
if ($ampApproved) { Write-Host "APPROVED" -ForegroundColor Green } else { Write-Host "OVERRIDDEN" -ForegroundColor Yellow }
Write-Host "  • Beads: Synced" -ForegroundColor Green
Write-Host "  • Remote: Pushed" -ForegroundColor Green
Write-Host ""
Write-Host "Review file: $reviewFile" -ForegroundColor Cyan
Write-Host "Regeneration log: $regenerationLog" -ForegroundColor Cyan
Write-Host ""
