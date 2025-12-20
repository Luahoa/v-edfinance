---
description: Create Beads tasks - epic, feature, task, bug, chore
---

# Creating Beads Tasks

## Prerequisites
Navigate to project directory:
```bash
cd "c:\Users\luaho\Demo project\v-edfinance"
```

## Create Epic (2-4 weeks)

// turbo
1. **Create epic for large feature**
```bash
& "$env:USERPROFILE\go\bin\bd.exe" create "Epic: Large Feature Name" \
  --description="Detailed description of the epic scope, goals, and success metrics" \
  -t epic \
  -p 1 \
  --json
```

## Create Feature (3-7 days)

// turbo
2. **Create feature task**
```bash
& "$env:USERPROFILE\go\bin\bd.exe" create "Feature: Specific Feature Name" \
  --description="User story and acceptance criteria" \
  -t feature \
  -p 1 \
  --deps blocks:ved-EPIC-ID \
  --json
```

## Create Task (4-8 hours)

// turbo
3. **Create regular task**
```bash
& "$env:USERPROFILE\go\bin\bd.exe" create "Task: Specific Work Item" \
  --description="Implementation details and requirements" \
  -t task \
  -p 2 \
  --json
```

## Create Bug

// turbo
4. **Create bug report**
```bash
& "$env:USERPROFILE\go\bin\bd.exe" create "Bug: Error Description" \
  --description="Steps to reproduce, expected vs actual behavior, affected users" \
  -t bug \
  -p 0 \
  --json
```

**Bug Priority Guide:**
- p0 (Critical): Production down, data loss, security breach
- p1 (High): Major functionality broken
- p2 (Medium): Minor issues with workaround
- p3 (Low): Cosmetic issues

## Create Chore

// turbo
5. **Create maintenance task**
```bash
& "$env:USERPROFILE\go\bin\bd.exe" create "Chore: Maintenance Task" \
  --description="Why this maintenance is needed and what will be done" \
  -t chore \
  -p 3 \
  --json
```

## Add Dependencies

6. **Link tasks with dependencies**
```bash
# Task A depends on Task B (B blocks A)
& "$env:USERPROFILE\go\bin\bd.exe" dep add ved-TASK-A ved-TASK-B
```

7. **Create discovered task** (found during work)
```bash
& "$env:USERPROFILE\go\bin\bd.exe" create "Discovered: New Issue" \
  --description="Found while working on parent task" \
  -t task \
  -p 2 \
  --deps discovered-from:ved-PARENT-ID \
  --json
```

## After Creating

// turbo
8. **Sync to share with team**
```bash
& "$env:USERPROFILE\go\bin\bd.exe" sync
```

## Notes
- Always include detailed descriptions
- Use appropriate priorities (0=Critical, 1=High, 2=Medium, 3=Low, 4=Backlog)
- Link tasks to epics/features with dependencies
- Sync after creating important tasks
