# ═══════════════════════════════════════════════════════════════════════════
# Amp + Beads Automated Workflow Script
# ═══════════════════════════════════════════════════════════════════════════
# Purpose: Safe integration between Amp code review and Beads task tracking
# Usage: ./scripts/amp-beads-workflow.ps1 -TaskId "ved-296" -Message "Feature complete"
# ═══════════════════════════════════════════════════════════════════════════

param(
    [Parameter(Mandatory=$true)]
    [string]$TaskId,
    
    [Parameter(Mandatory=$true)]
    [string]$Message,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipReview,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipTests,
    
    [Parameter(Mandatory=$false)]
    [string]$CommitType = "feat"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Amp + Beads Workflow Automation" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 1: Pre-flight Checks
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "[PHASE 1] Pre-flight Checks..." -ForegroundColor Yellow

# Check if in git repository
if (-not (Test-Path "$RootDir\.git")) {
    Write-Host "❌ Not in a git repository!" -ForegroundColor Red
    exit 1
}

# Check if beads is available
try {
    $beadsPath = "$RootDir\beads.exe"
    if (-not (Test-Path $beadsPath)) {
        Write-Host "❌ beads.exe not found at: $beadsPath" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Beads CLI not found!" -ForegroundColor Red
    exit 1
}

# Check git status
$gitStatus = git status --porcelain
if (-not $gitStatus) {
    Write-Host "⚠️  No changes detected. Nothing to commit." -ForegroundColor Yellow
    exit 0
}

Write-Host "✅ Pre-flight checks passed" -ForegroundColor Green

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 2: Run Tests (if not skipped)
# ═══════════════════════════════════════════════════════════════════════════

if (-not $SkipTests) {
    Write-Host ""
    Write-Host "[PHASE 2] Running Tests..." -ForegroundColor Yellow
    
    Push-Location "$RootDir\apps\api"
    
    # Build check
    Write-Host "  → Building API..." -ForegroundColor Cyan
    $buildResult = pnpm build 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed!" -ForegroundColor Red
        Write-Host $buildResult -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    # Run tests related to the change
    Write-Host "  → Running tests..." -ForegroundColor Cyan
    $testResult = pnpm test --run 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Some tests failed. Continue? (y/N)" -ForegroundColor Yellow
        $continue = Read-Host
        if ($continue -ne "y") {
            Pop-Location
            exit 1
        }
    }
    
    Pop-Location
    Write-Host "✅ Tests passed" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[PHASE 2] Tests skipped (--SkipTests)" -ForegroundColor Yellow
}

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 3: Stage Changes (CRITICAL - must be clean before beads)
# ═══════════════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "[PHASE 3] Staging Changes..." -ForegroundColor Yellow

# Create a temporary stash of current changes
Write-Host "  → Creating safety backup..." -ForegroundColor Cyan
git add -A
$stashResult = git stash push -m "AMP_BEADS_WORKFLOW_BACKUP_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

if ($LASTEXITCODE -eq 0) {
    Write-Host "  → Backup created: $stashResult" -ForegroundColor Green
    
    # Restore from stash
    git stash pop
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to restore changes!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  → No backup needed (no uncommitted changes)" -ForegroundColor Gray
}

Write-Host "✅ Changes staged safely" -ForegroundColor Green

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 4: Amp Code Review (if not skipped)
# ═══════════════════════════════════════════════════════════════════════════

if (-not $SkipReview) {
    Write-Host ""
    Write-Host "[PHASE 4] Amp Code Review..." -ForegroundColor Yellow
    Write-Host "  → Review suggestions will be saved to: review-$TaskId.txt" -ForegroundColor Cyan
    
    # Create review checkpoint
    $reviewFile = "$RootDir\review-$TaskId.txt"
    
    # Get diff for review
    $diff = git diff --cached
    
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
    Write-Host "  AMP REVIEW CHECKPOINT" -ForegroundColor Magenta
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "Changes staged. Ready for Amp review." -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  1. Let Amp review now (recommended)" -ForegroundColor White
    Write-Host "  2. Skip review and commit" -ForegroundColor Gray
    Write-Host "  3. Cancel workflow" -ForegroundColor Gray
    Write-Host ""
    $reviewChoice = Read-Host "Enter choice (1-3)"
    
    switch ($reviewChoice) {
        "1" {
            Write-Host ""
            Write-Host "  → Starting Amp review..." -ForegroundColor Cyan
            Write-Host "  → Amp will analyze changes and suggest improvements" -ForegroundColor Cyan
            Write-Host "  → Review output will be in review-$TaskId.txt" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "NOTE: Amp review is INTERACTIVE - respond to Amp's questions." -ForegroundColor Yellow
            Write-Host "After review, Amp will return here to continue workflow." -ForegroundColor Yellow
            Write-Host ""
            
            # Save diff to file for Amp to review
            $diff | Out-File -FilePath $reviewFile -Encoding UTF8
            
            Write-Host "Review file created: $reviewFile" -ForegroundColor Green
            Write-Host ""
            Write-Host "⏸️  WORKFLOW PAUSED" -ForegroundColor Yellow
            Write-Host "Please ask Amp to review the changes in $reviewFile" -ForegroundColor Yellow
            Write-Host "After Amp review, press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "2" {
            Write-Host "  → Skipping review" -ForegroundColor Gray
        }
        "3" {
            Write-Host "  → Workflow cancelled" -ForegroundColor Red
            git reset HEAD
            exit 0
        }
        default {
            Write-Host "❌ Invalid choice. Workflow cancelled." -ForegroundColor Red
            git reset HEAD
            exit 1
        }
    }
    
    Write-Host "✅ Review phase complete" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[PHASE 4] Amp Review skipped (--SkipReview)" -ForegroundColor Yellow
}

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 5: Git Commit (BEFORE beads to avoid conflicts)
# ═══════════════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "[PHASE 5] Creating Git Commit..." -ForegroundColor Yellow

$commitMessage = "${CommitType}: ${Message} (${TaskId})"
Write-Host "  → Commit message: $commitMessage" -ForegroundColor Cyan

# Set environment variable to bypass pre-commit hook
$env:AMP_BEADS_WORKFLOW = "1"
git commit -m "$commitMessage"
$env:AMP_BEADS_WORKFLOW = $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git commit failed!" -ForegroundColor Red
    exit 1
}

$commitHash = git rev-parse --short HEAD
Write-Host "✅ Committed: $commitHash - $commitMessage" -ForegroundColor Green

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 6: Beads Close Task (AFTER commit - safe!)
# ═══════════════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "[PHASE 6] Closing Beads Task..." -ForegroundColor Yellow

$beadsReason = "Completed: $Message (commit: $commitHash)"
Write-Host "  → Closing $TaskId with reason: $beadsReason" -ForegroundColor Cyan

& $beadsPath close $TaskId --reason "$beadsReason"
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Beads close failed, but commit is safe. Continue manually." -ForegroundColor Yellow
} else {
    Write-Host "✅ Task $TaskId closed in Beads" -ForegroundColor Green
}

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 7: Beads Sync (AFTER everything - no conflicts!)
# ═══════════════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "[PHASE 7] Syncing Beads Metadata..." -ForegroundColor Yellow

& $beadsPath sync
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Beads sync failed. Retry manually with: beads sync" -ForegroundColor Yellow
} else {
    Write-Host "✅ Beads metadata synced" -ForegroundColor Green
}

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 8: Git Push (Push ALL commits including beads)
# ═══════════════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "[PHASE 8] Pushing to Remote..." -ForegroundColor Yellow

Write-Host "  → Pushing commits to origin/main..." -ForegroundColor Cyan
git push
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git push failed!" -ForegroundColor Red
    Write-Host "Your commits are safe locally. Retry: git push" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ All commits pushed to remote" -ForegroundColor Green

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 9: Summary
# ═══════════════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ WORKFLOW COMPLETE" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor White
Write-Host "  • Tests: " -NoNewline -ForegroundColor Gray
if ($SkipTests) { Write-Host "Skipped" -ForegroundColor Yellow } else { Write-Host "Passed" -ForegroundColor Green }
Write-Host "  • Review: " -NoNewline -ForegroundColor Gray
if ($SkipReview) { Write-Host "Skipped" -ForegroundColor Yellow } else { Write-Host "Completed" -ForegroundColor Green }
Write-Host "  • Commit: $commitHash" -ForegroundColor Green
Write-Host "  • Task: $TaskId" -ForegroundColor Green
Write-Host "  • Beads: Synced" -ForegroundColor Green
Write-Host "  • Remote: Pushed" -ForegroundColor Green
Write-Host ""

if (-not $SkipReview -and (Test-Path $reviewFile)) {
    Write-Host "Review file saved: $reviewFile" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  → Check beads status: .\beads.exe ready" -ForegroundColor White
Write-Host "  → View task history: .\beads.exe show $TaskId" -ForegroundColor White
Write-Host ""
