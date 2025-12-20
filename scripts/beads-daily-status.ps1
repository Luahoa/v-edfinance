# Beads Daily Status Report
# Run this every morning to see your task status

$BD = "$env:USERPROFILE\go\bin\bd.exe"
$ProjectDir = "c:\Users\luaho\Demo project\v-edfinance"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   🎯 Beads Daily Status Report" -ForegroundColor Cyan
Write-Host "   $(Get-Date -Format 'yyyy-MM-dd HH:mm')" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Push-Location $ProjectDir

# 1. Sync first
Write-Host "📥 Syncing with team..." -ForegroundColor Yellow
& $BD sync
Write-Host ""

# 2. Overall Statistics
Write-Host "========================================" -ForegroundColor Green
Write-Host "📊 PROJECT STATISTICS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
& $BD stats
Write-Host ""

# 3. In Progress Tasks
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "🏗️  IN PROGRESS TASKS" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
$inProgress = & $BD list --status in_progress --json | ConvertFrom-Json
if ($inProgress) {
    $inProgress | Format-Table @{Label="ID"; Expression={$_.id}}, 
                                @{Label="Title"; Expression={$_.title}}, 
                                @{Label="Priority"; Expression={$_.priority}} -AutoSize
} else {
    Write-Host "No tasks in progress" -ForegroundColor Gray
}
Write-Host ""

# 4. Recently Closed (last 24 hours)
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ COMPLETED (Last 24h)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
$closed = & $BD list --status closed --since 1d --json | ConvertFrom-Json
if ($closed) {
    $closed | Format-Table @{Label="ID"; Expression={$_.id}}, 
                           @{Label="Title"; Expression={$_.title}}, 
                           @{Label="Closed At"; Expression={
                               ([DateTime]$_.closed_at).ToString("HH:mm")
                           }} -AutoSize
} else {
    Write-Host "No tasks completed yesterday" -ForegroundColor Gray
}
Write-Host ""

# 5. Blocked Tasks
Write-Host "========================================" -ForegroundColor Red
Write-Host "🚫 BLOCKED TASKS" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
$blocked = & $BD blocked --json | ConvertFrom-Json
if ($blocked) {
    $blocked | Format-Table @{Label="ID"; Expression={$_.id}}, 
                            @{Label="Title"; Expression={$_.title}}, 
                            @{Label="Blockers"; Expression={$_.dependency_count}} -AutoSize
    Write-Host "⚠️  Review these blockers!" -ForegroundColor Red
} else {
    Write-Host "✅ No blocked tasks" -ForegroundColor Green
}
Write-Host ""

# 6. Ready Tasks (High Priority)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📋 READY TO WORK (Priority 0-1)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$ready = & $BD ready --priority 0,1 --json | ConvertFrom-Json
if ($ready) {
    $ready | Select-Object -First 5 | Format-Table @{Label="ID"; Expression={$_.id}}, 
                                                     @{Label="Title"; Expression={$_.title}}, 
                                                     @{Label="Type"; Expression={$_.issue_type}},
                                                     @{Label="Priority"; Expression={
                                                         switch($_.priority) {
                                                             0 { "🔴 CRITICAL" }
                                                             1 { "🟠 HIGH" }
                                                             2 { "🟡 MEDIUM" }
                                                             3 { "🟢 LOW" }
                                                             default { $_.priority }
                                                         }
                                                     }} -AutoSize
} else {
    Write-Host "No high-priority tasks ready. Check medium priority:" -ForegroundColor Yellow
    $readyMedium = & $BD ready --priority 2 --json | ConvertFrom-Json
    if ($readyMedium) {
        $readyMedium | Select-Object -First 3 | Format-Table id, title, issue_type -AutoSize
    }
}
Write-Host ""

# 7. Summary
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "💡 RECOMMENDATIONS" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

if ($blocked) {
    Write-Host "⚠️  You have $($blocked.Count) blocked task(s) - review dependencies" -ForegroundColor Red
}

if ($inProgress -and $inProgress.Count -gt 3) {
    Write-Host "⚠️  Too many tasks in progress ($($inProgress.Count)) - focus on completing current work" -ForegroundColor Yellow
}

if ($ready) {
    Write-Host "✅ $($ready.Count) task(s) ready to start" -ForegroundColor Green
    Write-Host "   Suggested next task: $($ready[0].id) - $($ready[0].title)" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  No tasks ready - check if dependencies need to be resolved" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "🚀 Quick Actions:" -ForegroundColor Cyan
Write-Host "   Claim task:   bd update ved-XXX --status in_progress" -ForegroundColor Gray
Write-Host "   Close task:   bd close ved-XXX --reason 'Completed'" -ForegroundColor Gray
Write-Host "   Create task:  bd create 'Title' -t task -p 2 --json" -ForegroundColor Gray
Write-Host "   Sync:         bd sync" -ForegroundColor Gray
Write-Host "========================================`n" -ForegroundColor Cyan

Pop-Location
