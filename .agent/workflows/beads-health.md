---
description: Beads health check - duplicates, dependencies, cleanup
---

# Beads Health Check & Cleanup

Run this weekly to maintain a healthy task database.

## Prerequisites
Navigate to project directory:
```bash
cd "c:\Users\luaho\Demo project\v-edfinance"
```

## Health Check

// turbo-all

1. **View overall statistics**
```bash
& "$env:USERPROFILE\go\bin\bd.exe" stats
```

2. **Find duplicate tasks**
```bash
& "$env:USERPROFILE\go\bin\bd.exe" duplicates
```

3. **Check blocked tasks**
```bash
& "$env:USERPROFILE\go\bin\bd.exe" blocked --json
```

4. **List stale open tasks** (open for more than 30 days)
```bash
& "$env:USERPROFILE\go\bin\bd.exe" list --status open --json | ConvertFrom-Json | Where-Object { 
  $created = [DateTime]$_.created_at
  ((Get-Date) - $created).Days -gt 30 
} | Format-Table id, title, created_at
```

## Cleanup Actions

5. **Merge duplicate tasks** (if found)
```bash
# Review duplicates first, then merge
& "$env:USERPROFILE\go\bin\bd.exe" merge ved-DUP1 ved-DUP2 --into ved-ORIGINAL --json
```

6. **Remove invalid dependencies**
```bash
# If dependency is no longer valid
& "$env:USERPROFILE\go\bin\bd.exe" dep remove ved-TASK-A ved-TASK-B
```

7. **Close stale tasks** (manual review required)
```bash
# Review each stale task and close if no longer relevant
& "$env:USERPROFILE\go\bin\bd.exe" close ved-STALE \
  --reason "No longer relevant after architecture change" \
  --json
```

8. **Update missing descriptions**
```bash
# Find tasks without descriptions and update
& "$env:USERPROFILE\go\bin\bd.exe" list --json | ConvertFrom-Json | Where-Object { 
  -not $_.description 
} | ForEach-Object { 
  Write-Host "Missing description: $($_.id) - $($_.title)"
}

# Then manually update:
& "$env:USERPROFILE\go\bin\bd.exe" update ved-XXX --description "Add description here"
```

## Dependency Validation

9. **Check dependency tree for circular refs**
```bash
# Review dependency trees for major epics
& "$env:USERPROFILE\go\bin\bd.exe" list --type epic --json | ConvertFrom-Json | ForEach-Object {
  Write-Host "`n=== $($_.id): $($_.title) ==="
  & "$env:USERPROFILE\go\bin\bd.exe" dep tree $_.id
}
```

## Final Steps

// turbo
10. **Sync cleaned data**
```bash
& "$env:USERPROFILE\go\bin\bd.exe" sync
```

## Health Metrics to Monitor

**Good Health Indicators:**
- ✅ Avg Lead Time < 3 days
- ✅ Blocked tasks < 10% of open tasks
- ✅ No duplicate tasks
- ✅ 90%+ tasks have descriptions
- ✅ Ready tasks > 0 (always work available)

**Warning Signs:**
- ⚠️ Open tasks growing faster than close rate
- ⚠️ Many tasks blocked for > 1 week
- ⚠️ Circular dependencies detected
- ⚠️ Tasks without clear parent epic/feature

## Notes
- Run this check weekly (e.g., Friday afternoon)
- Document cleanup decisions in task comments
- Discuss blocked tasks in team standup
