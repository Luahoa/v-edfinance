# Git Issues Fix Plan - Post Repository Merge

**Date:** 2026-01-05  
**Context:** After ved-hs88 (repository merge), git is in broken state  
**Priority:** P0 - Blocking commit/push operations

---

## 🔍 Current Issues Analysis

### Issue 1: Beads Daemon Lock Conflict
```
error: read error while indexing .beads/daemon.lock: Permission denied
error: .beads/daemon.lock: failed to insert into database
error: unable to index file '.beads/daemon.lock'
fatal: adding files failed
```

**Root Cause:** Beads daemon is running and holding lock file

### Issue 2: Git Worktree State Confusion
```
BUG: merge-ort.c:4638: Conflicted beads/BEADS_GUIDE.md but nothing in basic working tree or index
```

**Root Cause:** Merge happened in `.git/beads-worktrees/main/` but stash pop tried to apply to `spike/simplified-nav`

### Issue 3: Uncommitted Changes
```
❌ Error: Uncommitted changes detected
```

**Root Cause:** 
- `.beads/issues.jsonl` updated by ved-hs88 close
- `.beads/agent-mail/` files created
- `history/vps-deployment/` files created

---

## 🎯 Fix Strategy (3-Step Recovery)

### Step 1: Stop Beads Daemon (2 min)
**Goal:** Release `.beads/daemon.lock`

```bash
# Check if daemon is running
tasklist | findstr beads

# Kill daemon process
taskkill /F /IM beads.exe

# Remove stale lock file
del .beads\daemon.lock
```

**Verification:**
```bash
# Should not exist
ls .beads/daemon.lock  # Should error

# Should succeed
git add .beads/issues.jsonl
```

---

### Step 2: Clean Git State (5 min)
**Goal:** Reset to clean working tree

```bash
# Drop failed stash (contains merge conflicts)
git stash drop

# Check current branch
git branch  # Should be on spike/simplified-nav

# Verify main branch merge was successful
git log origin/main --oneline -5  # Should show 204d5b1

# Clean untracked files that cause issues
git clean -fd .beads/
git clean -fd history/
```

**Alternative (if clean fails):**
```bash
# Manual clean - keep important files
git checkout -- .beads/issues.jsonl  # Reset to last commit
git checkout -- .beads/agent-mail/   # Reset agent mail

# Re-apply ved-hs88 closure manually
beads.exe update ved-hs88 --status closed
```

---

### Step 3: Commit Beads Sync (3 min)
**Goal:** Properly commit beads state

```bash
# Sync beads (should work after daemon stopped)
beads.exe sync --no-daemon

# If sync fails, manual commit:
git add .beads/issues.jsonl
git add .beads/agent-mail/merge-complete-notification.json
git add history/vps-deployment/
git commit -m "bd sync: Repository merge complete (ved-hs88)"

# Push to remote
git push origin spike/simplified-nav
```

---

## 🚨 Risk Assessment

### Low Risk ✅
- Stopping daemon (can restart)
- Dropping stash (already conflicted)
- Manual beads commit (just metadata)

### Medium Risk ⚠️
- Git clean (might delete untracked work)
- Checkout to reset files (loses local changes)

### Mitigation
```bash
# Backup before clean
git status > git-status-backup.txt
git diff > git-diff-backup.txt
git stash list > git-stash-backup.txt
```

---

## 📋 Detailed Execution Steps

### Phase 1: Diagnostic (1 min)
```bash
# 1. Check what's running
tasklist | findstr beads

# 2. Check git state
git status --porcelain

# 3. Check worktrees
git worktree list

# 4. Check stash
git stash list
```

**Expected Output:**
```
# Tasklist: beads.exe (PID XXXX)
# Git status: M .beads/issues.jsonl, ?? history/...
# Worktrees: main at .git/beads-worktrees/main, spike/simplified-nav at .
# Stash: stash@{0}: WIP: VPS deployment work before merge
```

---

### Phase 2: Stop Daemon (1 min)
```bash
# Windows
taskkill /F /IM beads.exe
del .beads\daemon.lock

# Verify
git add .beads/daemon.lock  # Should error "does not exist"
```

**Success Criteria:** No beads.exe in tasklist, no daemon.lock file

---

### Phase 3: Clean State (3 min)
```bash
# Option A: Drop conflicted stash
git stash drop stash@{0}

# Option B: If you need the stash
git stash show -p stash@{0} > stash-backup.patch
git stash drop stash@{0}
```

**Success Criteria:** `git stash list` is empty or shows no conflicts

---

### Phase 4: Commit Beads (3 min)
```bash
# Use beads sync with daemon disabled
beads.exe sync --no-daemon

# If still fails, manual approach:
git add .beads/issues.jsonl
git add .beads/agent-mail/
git add history/vps-deployment/OPTIMIZED_MERGE_PLAN_TRINITY.md
git add history/vps-deployment/REPOSITORY_FIX_PLAN.md

git commit -m "bd sync: Repository merge complete (ved-hs88)

Beads task ved-hs88 closed successfully.
Main branch merged from spike/simplified-nav via fast-forward.
Unblocks VPS deployment tasks: ved-y1u, ved-drx, ved-8yqm.

Method: Beads Trinity (bd + bv + agent mail)
Execution time: 15 minutes
Files merged: 1000+
"

git push origin spike/simplified-nav
```

**Success Criteria:** Push succeeds, remote updated

---

### Phase 5: Verification (2 min)
```bash
# 1. Check remote
git log origin/spike/simplified-nav --oneline -3

# 2. Verify beads state
beads.exe show ved-hs88  # Should show status: closed

# 3. Verify main branch
git log origin/main --oneline -3  # Should show 204d5b1

# 4. Check for lingering issues
git status  # Should be clean or only show untracked files
```

---

## 🔄 Rollback Plan (If Fix Fails)

### Scenario 1: Beads Corruption
```bash
# Restore from external beads repo
cd .beads/
git pull  # Pull from external beads repo
cd ..
beads.exe sync --no-daemon
```

### Scenario 2: Git State Broken
```bash
# Reset to last known good state
git reset --hard origin/spike/simplified-nav
git clean -fd

# Re-close ved-hs88
beads.exe update ved-hs88 --status closed
beads.exe sync --no-daemon
```

### Scenario 3: Main Branch Needs Revert
```bash
# Only if main branch merge was bad (EXTREME)
git checkout main
git reset --hard main-backup-2026-01-05
git push --force origin main
```

---

## 📊 Expected Outcomes

### Success State
- ✅ No beads daemon running
- ✅ Git status clean (or only untracked files)
- ✅ ved-hs88 closed in beads
- ✅ Spike branch pushed to remote
- ✅ Main branch has apps/api/ code
- ✅ Ready for VPS deployment

### Time Estimate
- **Diagnostic:** 1 min
- **Stop Daemon:** 1 min
- **Clean State:** 3 min
- **Commit Beads:** 3 min
- **Verification:** 2 min
- **Total:** 10 minutes

---

## 🎓 Lessons Learned (For Future Skills)

### What Went Wrong
1. **Stash pop after worktree merge** - Applied stash to wrong working tree
2. **Beads daemon not stopped** - Held lock during git operations
3. **No pre-commit cleanup** - Left daemon.lock in working tree

### Prevention Rules
1. **Always stop daemon before major git operations**
   ```bash
   taskkill /F /IM beads.exe
   ```

2. **Don't stash in worktrees** - Commit or discard instead
   ```bash
   # Good
   git add . && git commit -m "wip"
   
   # Bad (in worktree)
   git stash
   ```

3. **Use beads sync --no-daemon for automation**
   ```bash
   beads.exe sync --no-daemon
   ```

4. **Always verify git state before push**
   ```bash
   git status
   git diff --staged
   ```

---

## 🚀 Next Steps After Fix

1. ✅ Create `.agents/skills/repository-merge/SKILL.md`
2. ✅ Create `.agents/workflows/beads-git-workflow.md`
3. ✅ Document in `docs/git-operations/MERGE_PROTOCOL.md`
4. ✅ Add to `AGENTS.md` as standard procedure
5. ✅ Resume VPS deployment (GreenMountain track)

---

**Execute:** Run Step 1 (Stop Daemon) now
