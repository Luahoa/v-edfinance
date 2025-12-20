# Beads Dashboard - Real-time Audit Progress
# Shows current status of all audit tasks

Write-Host "=== Beads Audit Dashboard ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

# Get all tasks
try {
    $allTasks = bd list --json | ConvertFrom-Json
} catch {
    Write-Host "[ERROR] Failed to fetch tasks from Beads" -ForegroundColor Red
    exit 1
}

# Overall Statistics
Write-Host "📊 Overall Progress" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

$total = $allTasks.Count
$open = ($allTasks | Where-Object { $_.status -eq 'open' }).Count
$inProgress = ($allTasks | Where-Object { $_.status -eq 'in_progress' }).Count
$closed = ($allTasks | Where-Object { $_.status -eq 'closed' }).Count

$completionPct = if ($total -gt 0) { [math]::Round(($closed / $total) * 100, 1) } else { 0 }

Write-Host "Total Tasks:     $total"
Write-Host "Open:            $open" -ForegroundColor Yellow
Write-Host "In Progress:     $inProgress" -ForegroundColor Cyan
Write-Host "Completed:       $closed" -ForegroundColor Green
Write-Host "Completion:      $completionPct%" -ForegroundColor $(if ($completionPct -ge 90) { 'Green' } elseif ($completionPct -ge 50) { 'Yellow' } else { 'Red' })
Write-Host ""

# Progress Bar
$barLength = 40
$filledLength = [math]::Floor(($completionPct / 100) * $barLength)
$bar = "█" * $filledLength + "░" * ($barLength - $filledLength)
Write-Host "[$bar] $completionPct%" -ForegroundColor Green
Write-Host ""

# By Priority
Write-Host "🎯 By Priority" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

$byPriority = $allTasks | Group-Object -Property priority | Sort-Object Name

foreach ($group in $byPriority) {
    $pLabel = switch ($group.Name) {
        "0" { "P0 (Critical)" }
        "1" { "P1 (High)" }
        "2" { "P2 (Medium)" }
        "3" { "P3 (Low)" }
        "4" { "P4 (Backlog)" }
        default { "P? (Unknown)" }
    }
    
    $pOpen = ($group.Group | Where-Object { $_.status -ne 'closed' }).Count
    $pClosed = ($group.Group | Where-Object { $_.status -eq 'closed' }).Count
    $pTotal = $group.Count
    
    $color = switch ($group.Name) {
        "0" { "Red" }
        "1" { "Yellow" }
        default { "White" }
    }
    
    Write-Host "$pLabel : $pClosed/$pTotal completed ($pOpen remaining)" -ForegroundColor $color
}

Write-Host ""

# By Type
Write-Host "📋 By Type" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

$byType = $allTasks | Group-Object -Property type

foreach ($group in $byType) {
    $tOpen = ($group.Group | Where-Object { $_.status -ne 'closed' }).Count
    Write-Host "$($group.Name): $($group.Count) total ($tOpen open)"
}

Write-Host ""

# Critical Tasks (P0)
$criticalTasks = $allTasks | Where-Object { $_.priority -eq 0 -and $_.status -ne 'closed' }

if ($criticalTasks.Count -gt 0) {
    Write-Host "🚨 Critical Tasks (P0)" -ForegroundColor Red
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    
    foreach ($task in $criticalTasks | Select-Object -First 10) {
        $statusIcon = switch ($task.status) {
            'open' { '⭕' }
            'in_progress' { '🔄' }
            default { '❓' }
        }
        Write-Host "  $statusIcon $($task.id): $($task.title)" -ForegroundColor Red
    }
    
    if ($criticalTasks.Count -gt 10) {
        Write-Host "  ... and $($criticalTasks.Count - 10) more" -ForegroundColor Gray
    }
    Write-Host ""
}

# Ready Tasks
try {
    $readyTasks = bd ready --json | ConvertFrom-Json
    
    if ($readyTasks.Count -gt 0) {
        Write-Host "✅ Ready Tasks (No Blockers)" -ForegroundColor Green
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
        
        foreach ($task in $readyTasks | Select-Object -First 5) {
            $pLabel = "P$($task.priority)"
            Write-Host "  [$pLabel] $($task.id): $($task.title)" -ForegroundColor Green
        }
        
        if ($readyTasks.Count -gt 5) {
            Write-Host "  ... and $($readyTasks.Count - 5) more ready tasks" -ForegroundColor Gray
        }
        Write-Host ""
        Write-Host "💡 Tip: Run 'bd ready --json' to get full list" -ForegroundColor Cyan
    } else {
        Write-Host "ℹ️  No tasks ready (all tasks have blockers)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Could not fetch ready tasks" -ForegroundColor Yellow
}

Write-Host ""

# Velocity (if applicable)
$today = Get-Date
$weekAgo = $today.AddDays(-7)

$closedThisWeek = $allTasks | Where-Object { 
    $_.status -eq 'closed' -and 
    $_.updated -and 
    ([DateTime]$_.updated) -ge $weekAgo 
}

if ($closedThisWeek) {
    Write-Host "📈 Velocity" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "Tasks closed this week: $($closedThisWeek.Count)"
    
    $remainingOpen = $open + $inProgress
    if ($closedThisWeek.Count -gt 0) {
        $weeksRemaining = [math]::Ceiling($remainingOpen / $closedThisWeek.Count)
        Write-Host "Estimated weeks to completion: $weeksRemaining" -ForegroundColor Cyan
    }
    Write-Host ""
}

# Next Steps
Write-Host "🎯 Suggested Next Actions" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

if ($criticalTasks.Count -gt 0) {
    Write-Host "1. Focus on $($criticalTasks.Count) critical P0 tasks" -ForegroundColor Red
} elseif ($readyTasks.Count -gt 0) {
    Write-Host "1. Work on ready tasks: bd ready --json" -ForegroundColor Green
} else {
    Write-Host "1. Review blocked tasks: bd blocked" -ForegroundColor Yellow
}

Write-Host "2. Update progress: bd update <task-id> --status in_progress"
Write-Host "3. Close completed: bd close <task-id> --reason 'Done'"
Write-Host "4. Sync changes: bd sync"
Write-Host ""

Write-Host "Run this dashboard anytime: .\scripts\audit\beads-dashboard.ps1" -ForegroundColor Cyan
Write-Host ""
