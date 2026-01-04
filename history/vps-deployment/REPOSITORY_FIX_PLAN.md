# Repository Fix Plan - Merge spike/simplified-nav to main

**Date:** 2026-01-05  
**Issue:** API codebase missing on `main` branch (blocking VPS deployment)  
**Root Cause:** `spike/simplified-nav` has 1000+ commits ahead of `main`  
**Impact:** Cannot deploy applications to VPS (GreenMountain track blocked)

---

## 📊 Current State Analysis

### Branch Comparison
```bash
# main branch (last commit: 2026-01-03)
f3f2969 docs: Complete thread handoff - 96% project completion achieved

# spike/simplified-nav (last commit: 2026-01-04)
bb05b51 feat: Quick wins + Payment system complete

# Divergence: 1000+ files changed, 50,000+ lines added
```

### Key Differences
| Component | main | spike/simplified-nav | Status |
|-----------|------|---------------------|--------|
| apps/api/ | Missing (submodule) | Full codebase ✅ | **CRITICAL** |
| Frontend Skills | ❌ | ✅ ClaudeKit installed | Major |
| Payment System | ❌ | ✅ Complete | Major |
| Certificates | ❌ | ✅ Complete | Major |
| YouTube Integration | ❌ | ✅ Complete | Major |
| Beads Tasks | 100+ tasks | 200+ tasks | Active dev |
| VPS Deployment | ❌ | Scripts ready ✅ | **BLOCKER** |

### Why main is Outdated
- `main` was frozen at 2026-01-03 after Phase 0 completion
- All active development shifted to `spike/simplified-nav`
- Payment system epic (ved-do76, ved-ejqc, ved-khlu, ved-pqpv) completed on spike
- Certificate system completed
- YouTube integration completed
- **apps/api was de-submoduled** on spike but still submodule on main

---

## 🎯 Merge Strategy

### Option A: Fast-Forward Merge (RECOMMENDED - IF POSSIBLE)
**Best for:** Clean history preservation

```bash
# Step 1: Check if fast-forward is possible
git checkout main
git merge-base main spike/simplified-nav  # Check common ancestor

# Step 2: Attempt fast-forward
git merge --ff-only spike/simplified-nav

# If successful:
git push origin main

# Result: main = spike/simplified-nav (exact copy)
```

**Pros:**
- ✅ Clean linear history
- ✅ No merge conflicts
- ✅ Preserves all commit messages
- ✅ Fast (1 minute)

**Cons:**
- ⚠️  Only works if main has no divergent commits

---

### Option B: Squash Merge (FALLBACK)
**Best for:** Simplifying huge changeset

```bash
# Step 1: Backup current main
git branch main-backup-2026-01-05

# Step 2: Squash merge spike into main
git checkout main
git merge --squash spike/simplified-nav

# Step 3: Review changes (optional)
git diff --stat

# Step 4: Commit with comprehensive message
git commit -m "feat: Merge spike/simplified-nav - Production readiness

Merges 1000+ files from spike/simplified-nav to main branch.

Major changes:
- De-submodule apps/api (complete NestJS backend)
- Payment system (Stripe integration)
- Certificate generation system
- YouTube video integration
- Frontend ClaudeKit skills
- VPS deployment scripts
- 200+ Beads tasks tracked

Completes:
- ved-do76 (Payment core)
- ved-ejqc (Payment webhooks)
- ved-khlu (Payment UI)
- ved-pqpv (Payment testing)
- ved-llhb, ved-io80, ved-crk7, ved-xbiv (Certificates)
- YouTube epic tasks

This brings main branch to production-ready state for VPS deployment."

# Step 5: Push to remote
git push origin main
```

**Pros:**
- ✅ Works even with divergent history
- ✅ Single clean commit on main
- ✅ Easy to revert if needed
- ✅ Good for deployment tracking

**Cons:**
- ⚠️  Loses individual commit history (spike commits become one)
- ⚠️  Harder to trace specific changes later

---

### Option C: Rebase + Force Push (DANGEROUS - NOT RECOMMENDED)
**Only if:** You need to rewrite history

```bash
# DO NOT USE unless absolutely necessary
git checkout main
git rebase spike/simplified-nav
git push --force origin main  # ⚠️  DESTRUCTIVE
```

**Why NOT to use:**
- ❌ Breaks anyone who has `main` checked out
- ❌ Destroys main's commit history
- ❌ Can cause data loss
- ❌ Violates Git best practices

---

## 📋 Pre-Merge Checklist

### 1. Verify Current Work is Saved
```bash
# Check for uncommitted changes on spike branch
git status

# If changes exist, stash or commit them
git add .
git commit -m "wip: Save work before merge"
```

### 2. Verify Beads Sync
```bash
# Ensure .beads/issues.jsonl is up to date
beads.exe doctor
beads.exe sync

# Commit beads state
git add .beads/
git commit -m "bd sync: pre-merge state"
```

### 3. Backup Current main Branch
```bash
git branch main-backup-2026-01-05
git push origin main-backup-2026-01-05
```

### 4. Test Builds Locally (Optional but Recommended)
```bash
# On spike/simplified-nav
pnpm install
pnpm --filter api build
pnpm --filter web build
pnpm test
```

---

## 🚀 Execution Plan (Recommended: Option A → Option B)

### Phase 1: Attempt Fast-Forward (5 min)
```bash
git checkout main
git pull --rebase origin main
git merge --ff-only spike/simplified-nav

# If successful:
git push origin main
# ✅ DONE - Skip to Phase 3

# If fails with "fatal: Not possible to fast-forward":
# ➡️  Continue to Phase 2
```

### Phase 2: Squash Merge (10 min)
```bash
# Backup main
git branch main-backup-2026-01-05
git push origin main-backup-2026-01-05

# Merge spike
git checkout main
git merge --squash spike/simplified-nav

# Commit with detailed message (see Option B above)
git commit -m "feat: Merge spike/simplified-nav - Production readiness..."

# Push to remote
git push origin main
```

### Phase 3: Verify Merge Success (5 min)
```bash
# Check that apps/api exists on main
git checkout main
ls apps/api/src  # Should show src files, not empty

# Verify key files
ls apps/api/Dockerfile  # Should exist
ls apps/api/package.json  # Should exist

# Check commit
git log --oneline -1  # Should show merge commit
```

### Phase 4: Update spike/simplified-nav (5 min)
```bash
# After merge, update spike branch
git checkout spike/simplified-nav
git merge main  # Fast-forward to include merge commit
git push origin spike/simplified-nav
```

### Phase 5: Notify Deployment Agent (1 min)
```bash
# Update GreenMountain agent to use main branch
# Re-run deployment script
node scripts/vps-toolkit/deploy-staging.js
```

---

## ⚠️  Risk Assessment

### Low Risk ✅
- Fast-forward merge (if possible)
- Squash merge with backup

### Medium Risk ⚠️
- Merge conflicts (unlikely - main is outdated, not divergent)
- Build failures after merge (mitigated by pre-merge testing)

### High Risk 🔴
- Force push (DO NOT USE)
- Merging without backup
- Merging with uncommitted work

---

## 🔄 Rollback Plan (If Needed)

### If Merge Causes Issues
```bash
# Option 1: Reset to backup branch
git checkout main
git reset --hard main-backup-2026-01-05
git push --force origin main  # Only if no one else pulled new main

# Option 2: Revert merge commit
git revert HEAD  # If squash merge
git push origin main
```

---

## 📊 Success Criteria

After merge, verify:
- ✅ `apps/api/` directory exists on `main` branch
- ✅ `apps/api/Dockerfile` exists
- ✅ `apps/api/src/` has full NestJS codebase
- ✅ `git log` shows merge commit
- ✅ Local build succeeds: `pnpm --filter api build`
- ✅ VPS deployment script can clone and build from `main`
- ✅ No Beads task data lost
- ✅ `.beads/issues.jsonl` synced

---

## 🎯 Recommended Action

**Execute Option A (Fast-Forward) first:**
- Takes 5 minutes
- Zero risk if fast-forward succeeds
- Preserves full history

**If fails, use Option B (Squash):**
- Takes 10 minutes
- Low risk with backup
- Production-ready result

**Timeline:**
- Pre-merge checks: 5 min
- Merge execution: 5-10 min
- Verification: 5 min
- **Total: 15-20 minutes**

---

## 📝 Post-Merge Tasks

1. **Update AGENTS.md** (if needed)
2. **Close Beads tasks** related to merge
3. **Re-run VPS deployment** (GreenMountain track)
4. **Update documentation** referencing branch names
5. **Notify team** (if collaborative project)

---

**Next Step:** Execute Phase 1 (Fast-Forward attempt)

**Blocking:** GreenMountain VPS deployment  
**Priority:** P0 - CRITICAL  
**Estimated Time:** 15-20 minutes
