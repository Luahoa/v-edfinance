# Beads Project Audit & Cleanup Script
$BD = "$env:USERPROFILE\go\bin\bd.exe"

Write-Host "--- BEADS AUDIT START ---" -ForegroundColor Cyan

# 1. Sync
Write-Host "Syncing with remote..."
& $BD sync

# 2. Check for stale issues (in_progress for > 7 days)
Write-Host "Checking for stale tasks..."
$staleThreshold = (Get-Date).AddDays(-7)
$openIssues = & $BD list --status in_progress --json | ConvertFrom-Json

foreach ($issue in $openIssues) {
    $createdAt = [DateTime]::Parse($issue.created_at)
    if ($createdAt -lt $staleThreshold) {
        Write-Host "STALE TASK DETECTED: $($issue.id) - $($issue.title)" -ForegroundColor Yellow
    }
}

# 3. Health Check
Write-Host "Running bd doctor..."
& $BD doctor

# 4. Git Integrity
Write-Host "Checking for uncommitted changes..."
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "WARNING: Uncommitted changes detected!" -ForegroundColor Red
} else {
    Write-Host "Git state is clean." -ForegroundColor Green
}

Write-Host "--- AUDIT COMPLETE ---" -ForegroundColor Cyan
