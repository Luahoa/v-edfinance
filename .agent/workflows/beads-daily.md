---
description: Daily Beads workflow - sync, check ready tasks, update status
---

# Daily Beads Workflow

## Morning Routine (Start of Day)

// turbo-all

1. **Sync with team**
```bash
cd "c:\Users\luaho\Demo project\v-edfinance"
& "$env:USERPROFILE\go\bin\bd.exe" sync
```

2. **Check project stats**
```bash
& "$env:USERPROFILE\go\bin\bd.exe" stats
```

3. **View ready tasks** (no blockers)
```bash
& "$env:USERPROFILE\go\bin\bd.exe" ready --json
```

4. **Check high-priority tasks**
```bash
& "$env:USERPROFILE\go\bin\bd.exe" list --status open --priority 0,1 --json
```

## Claiming a Task

5. **Update task to in-progress**
```bash
# Replace ved-XXX with actual task ID
& "$env:USERPROFILE\go\bin\bd.exe" update ved-XXX --status in_progress --json
```

6. **View task details**
```bash
& "$env:USERPROFILE\go\bin\bd.exe" show ved-XXX --json
```

## During Work

7. **Create discovered task** (if you find new work)
```bash
& "$env:USERPROFILE\go\bin\bd.exe" create "Task title" \
  --description="Detailed description" \
  -t task \
  -p 2 \
  --deps discovered-from:ved-PARENT \
  --json
```

8. **Add comment for progress**
```bash
& "$env:USERPROFILE\go\bin\bd.exe" comment ved-XXX "Progress update: 50% done, pending tests"
```

## Completing a Task

9. **Close completed task**
```bash
& "$env:USERPROFILE\go\bin\bd.exe" close ved-XXX \
  --reason "Completed: implementation done, tests passing, docs updated" \
  --json
```

## End of Day Routine

10. **Final sync**
```bash
& "$env:USERPROFILE\go\bin\bd.exe" sync
```

11. **Check blocked tasks** (for planning)
```bash
& "$env:USERPROFILE\go\bin\bd.exe" blocked --json
```

## Notes
- Always use JSON output (`--json`) for automated processing
- Sync at least twice daily to avoid conflicts
- Add descriptive close reasons to help with tracking
