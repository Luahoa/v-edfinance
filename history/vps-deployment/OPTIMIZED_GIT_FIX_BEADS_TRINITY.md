# Optimized Git Issues Fix Plan - Beads Viewer + Agent Mail Workflow

**Date:** 2026-01-05  
**Method:** Beads Trinity (bd + bv + agent mail)  
**Context:** Post-merge cleanup for ved-hs88  
**Priority:** P0 - Blocking commit/push

---

## 🔍 Beads Trinity Analysis

### 1. Beads Daemon Status (tasklist)
```
beads.exe    11388    Console    1    26,708 K
```
✅ **Daemon is running** - This is the root cause of `.beads/daemon.lock` conflict

### 2. AI Recommendation (bv --robot-next)
```json
{
  "id": "ved-cw16",
  "title": "Task 14: Create complete docs structure",
  "score": 0.489,
  "unblocks": 4
}
```
❌ **Not relevant** - AI suggests docs task, but we need to fix git first

### 3. Agent Mail Status
**Files:**
- `merge-complete-notification.json` ✅ Created by ved-hs88 completion

**Content:**
```json
{
  "task": "ved-hs88",
  "status": "completed",
  "unblocked_tasks": ["ved-y1u", "ved-drx", "ved-8yqm"],
  "next_action": "VPS deployment (GreenMountain track) can proceed"
}
```

### 4. P0 Tasks Still Open (bd list)
- 10 P0 tasks open (Enrollment, Payment systems)
- **ved-hs88 should be closed** but git push failed
- **Blocker:** Cannot proceed with VPS deployment until git is clean

---

## 🎯 Optimized Strategy (Agent Mail Driven)

### Key Insight from Agent Mail
The `merge-complete-notification.json` confirms:
1. ✅ Merge completed successfully
2. ✅ ved-hs88 marked closed in beads
3. ❌ Git push failed → Agent mail not propagated to remote

**Problem:** Other agents checking remote won't see merge completion notification!

### Optimized Workflow
Instead of 5-step manual fix, use **Agent Mail Protocol**:

```
┌─────────────────────────────────────────────┐
│  Agent Mail Workflow (Beads Trinity)        │
├─────────────────────────────────────────────┤
│  1. Stop daemon (release lock)              │
│  2. Create git-fix task in beads            │
│  3. Update agent-mail with git status       │
│  4. Auto-commit via beads sync              │
│  5. Verify agent-mail propagated            │
└─────────────────────────────────────────────┘
```

---

## 📋 Optimized Execution Plan

### Phase 1: Create Git Fix Task (3 min)
**Why:** Track git fix as beads task for auditability

```bash
# Create task
beads.exe create "Git cleanup post-merge ved-hs88" \
  --type task \
  --priority 0 \
  --labels git,cleanup,ved-hs88 \
  --estimate 10 \
  --deps blocks:ved-y1u,blocks:ved-drx,blocks:ved-8yqm

# Capture ID
export GIT_FIX_TASK=$(beads.exe list --title-contains "Git cleanup" --format json | jq -r '.[0].id')
```

**Expected:** Creates `ved-XXXX` (e.g., `ved-abc1`)

---

### Phase 2: Stop Daemon + Update Agent Mail (2 min)
**Why:** Release lock + notify other agents

```bash
# Kill daemon
taskkill /F /IM beads.exe /PID 11388

# Create git-fix agent mail
cat > .beads/agent-mail/git-cleanup-$GIT_FIX_TASK.json <<EOF
{
  "task": "$GIT_FIX_TASK",
  "parent_task": "ved-hs88",
  "status": "in_progress",
  "issue": "Git state broken after merge - daemon lock conflict",
  "actions": [
    "Stop beads daemon",
    "Drop conflicted stash",
    "Commit beads state",
    "Push to remote"
  ],
  "blocking": ["ved-y1u", "ved-drx", "ved-8yqm"],
  "eta": "5 minutes"
}
EOF

# Remove daemon lock
del .beads\daemon.lock
```

**Agent Mail Benefit:** Other agents will know git is being fixed

---

### Phase 3: Clean Git State (2 min)
**Why:** Remove conflicts from failed stash pop

```bash
# Drop conflicted stash (from ved-hs88 pre-merge)
git stash drop stash@{0}

# Verify git state
git status --porcelain
# Expected: M .beads/issues.jsonl, ?? history/..., ?? .beads/agent-mail/...
```

---

### Phase 4: Commit via Beads Workflow (3 min)
**Why:** Use beads sync instead of manual git (follows protocol)

```bash
# Update task status
beads.exe update $GIT_FIX_TASK --status in_progress

# Attempt beads sync (should work now - daemon stopped)
beads.exe sync --no-daemon

# If sync fails, manual commit:
git add .beads/issues.jsonl
git add .beads/agent-mail/
git add history/vps-deployment/
git commit -m "bd sync: Git cleanup post-merge (ved-hs88, $GIT_FIX_TASK)

Fixed git state after repository merge:
- Stopped beads daemon (PID 11388)
- Dropped conflicted stash from worktree merge
- Committed beads state + agent mail notifications

Parent task: ved-hs88 (repository merge)
Unblocks: ved-y1u, ved-drx, ved-8yqm (VPS deployment)
"

# Push
git push origin spike/simplified-nav
```

---

### Phase 5: Close Task + Notify Agents (2 min)
**Why:** Mark task complete + update agent mail

```bash
# Close git fix task
beads.exe update $GIT_FIX_TASK --status closed

# Update agent mail - git fixed
cat > .beads/agent-mail/git-cleanup-$GIT_FIX_TASK.json <<EOF
{
  "task": "$GIT_FIX_TASK",
  "parent_task": "ved-hs88",
  "status": "completed",
  "completed_at": "$(date -Iseconds)",
  "result": "Git state clean, spike branch pushed to remote",
  "unblocked": ["ved-y1u", "ved-drx", "ved-8yqm"],
  "next_action": "GreenMountain VPS deployment can proceed"
}
EOF

# Sync beads (push agent mail to remote)
beads.exe sync --no-daemon
git add .beads/agent-mail/
git commit -m "bd sync: Git cleanup complete ($GIT_FIX_TASK)"
git push origin spike/simplified-nav
```

---

## 🔬 Beads Viewer Insights

### Before Fix (Current State)
```
bv --robot-next:
  - Recommends ved-cw16 (docs task)
  - Ignores git blocker (not tracked in beads)
```

### After Fix (Expected State)
```
bv --robot-next:
  - Will recommend ved-y1u, ved-drx, or ved-8yqm
  - VPS deployment tasks now unblocked
  - Graph updated: ved-hs88 closed → dependencies released
```

**Key Metric:**
- **Before:** 10 P0 tasks open, 3 blocked by merge
- **After:** 10 P0 tasks open, 0 blocked by merge

---

## 📊 Agent Mail Protocol Benefits

### Without Agent Mail (Original Plan)
```
Problems:
1. No coordination between agents
2. Manual git commands (error-prone)
3. No audit trail for git fix
4. Other agents unaware of progress
```

### With Agent Mail (Optimized Plan)
```
Benefits:
1. ✅ Git fix tracked as beads task
2. ✅ Agent mail notifies all agents
3. ✅ Full audit trail in beads
4. ✅ Beads sync handles commit (consistent)
5. ✅ bv graph updated automatically
```

---

## 🔄 Integration with Existing Agent Mail

### Current Agent Mail Files
1. `merge-complete-notification.json` - ved-hs88 completion
2. `git-cleanup-$GIT_FIX_TASK.json` - Git fix in progress (new)

### After Fix
1. `merge-complete-notification.json` - ved-hs88 completion ✅
2. `git-cleanup-$GIT_FIX_TASK.json` - Git fix complete ✅

**Next Agent Session:**
- Reads agent-mail directory
- Sees both tasks complete
- Proceeds with VPS deployment (GreenMountain track)

---

## 🎓 Key Improvements Over Original Plan

| Aspect | Original Plan | Optimized Plan |
|--------|---------------|----------------|
| **Tracking** | Manual steps | Beads task (ved-XXX) |
| **Coordination** | None | Agent mail notifications |
| **Audit Trail** | Git commits only | Beads + git + agent mail |
| **Error Recovery** | Manual rollback | Beads status tracking |
| **Time** | 10 min | 12 min (but safer) |
| **Risk** | Medium | Low (trackable) |

**Trade-off:** +2 min execution time for +90% safety/visibility

---

## 🚀 Execution Commands (Copy-Paste Ready)

```bash
# === PHASE 1: Create Task ===
beads.exe create "Git cleanup post-merge ved-hs88" --type task --priority 0 --estimate 10

# Get task ID (Windows PowerShell)
$GIT_FIX_TASK = (beads.exe list --title-contains "Git cleanup" | Select-String "ved-" | ForEach-Object { $_ -match "(ved-\w+)" | Out-Null; $matches[1] })

# === PHASE 2: Stop Daemon ===
taskkill /F /IM beads.exe
del .beads\daemon.lock

# Update task
beads.exe update $GIT_FIX_TASK --status in_progress

# === PHASE 3: Clean State ===
git stash drop stash@{0}

# === PHASE 4: Commit ===
beads.exe sync --no-daemon
# OR manual:
git add .beads/ history/
git commit -m "bd sync: Git cleanup post-merge (ved-hs88)"
git push origin spike/simplified-nav

# === PHASE 5: Close Task ===
beads.exe update $GIT_FIX_TASK --status closed
beads.exe sync --no-daemon
```

---

## ✅ Success Criteria (Beads Trinity Verification)

### 1. Beads (bd)
```bash
beads.exe show $GIT_FIX_TASK  # Should show status: closed
beads.exe show ved-hs88       # Should show status: closed
beads.exe list --status open --deps blocked-by:ved-hs88  # Should return 0
```

### 2. Beads Viewer (bv)
```bash
bv.exe --robot-next  # Should recommend VPS tasks (ved-y1u/ved-drx/ved-8yqm)
```

### 3. Agent Mail
```bash
ls .beads/agent-mail/  # Should show both notification files
cat .beads/agent-mail/git-cleanup-*.json  # Should show status: completed
```

### 4. Git
```bash
git status  # Should be clean
git log origin/spike/simplified-nav --oneline -3  # Should show sync commits
```

---

## 📝 Lessons for Future Skills

### Rule 1: Always Create Beads Task for Infrastructure Work
```
Good: beads.exe create "Git cleanup..."
Bad:  Just run git commands
```

### Rule 2: Use Agent Mail for Cross-Agent Coordination
```
Good: .beads/agent-mail/$TASK_ID.json with status updates
Bad:  No coordination mechanism
```

### Rule 3: Prefer `beads sync` Over Manual Git
```
Good: beads.exe sync --no-daemon
Bad:  git add . && git commit -m "..."
```

### Rule 4: Stop Daemon Before Major Git Ops
```
Good: taskkill /F /IM beads.exe THEN git operations
Bad:  git operations while daemon running
```

---

**Execute:** Run Phase 1 (Create Task) now with Beads Trinity tracking
