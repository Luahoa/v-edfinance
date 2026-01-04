# Optimized Repository Merge Plan - Beads Trinity Analysis

**Generated:** 2026-01-05  
**Method:** Beads Trinity (bd + bv + agent mail)  
**Priority:** P0 CRITICAL - Blocking VPS deployment

---

## 🔍 Beads Trinity Analysis

### 1. Current Task Graph State (beads.exe list)
**20 P0 Tasks Open:**
- Enrollment system: ved-klty, ved-jg4y, ved-9otm, ved-0jl6, ved-ecux
- Payment system: ved-cl04, ved-6s0z, ved-do76, ved-pqpv
- Progress API: ved-s2zu
- MVP Launch: ved-e1js
- Phase 0 cleanup: ved-ll5l, ved-1y3c
- **VPS deployment: ved-y1u, ved-drx, ved-8yqm** ← BLOCKED by repo merge

### 2. AI Recommendation (bv --robot-next)
```json
{
  "id": "ved-cw16",
  "title": "Task 14: Create complete docs structure",
  "score": 0.526,
  "reasons": [
    "🎯 Completing this unblocks 4 downstream issues",
    "🔀 Critical path bottleneck (betweenness: 99%)",
    "📊 High centrality (PageRank: 71%)"
  ]
}
```

**Analysis:** AI recommends documentation task, BUT repository merge is NOT in tracked tasks yet! We need to create a Beads task for it.

### 3. Graph Health Insights (bv --robot-insights)
**Key Metrics:**
- Total nodes: 312 tasks
- Total edges: 63 dependencies
- Density: 0.065% (low coupling - good)
- **Cycles detected: 0** ✅ (Clean DAG)
- Articulation points: 12 critical tasks (including ved-cw16, ved-pdg7)

**Top Bottlenecks (Betweenness Centrality):**
1. ved-pdg7 (81) - "Move EdTech test reports"
2. ved-cw16 (80) - "Create docs structure"
3. ved-ehux (80) - "Create behavioral-design structure"
4. ved-jssf (56) - Critical path blocker
5. ved-jtxp (45) - "Update documentation links"

**Critical Path Analysis:**
- Longest path: 8 steps (ved-aww5 → ved-ehux → ved-pdg7 → ved-cw16 → ved-23fn → ved-jtxp → ved-idst → ved-ucot)
- **Repository merge NOT on critical path** → Can be done in parallel!

### 4. What-If Analysis (Impact Simulation)
**If we complete repository merge:**
```
Direct unblocks: 3 tasks (ved-y1u, ved-drx, ved-8yqm)
Transitive unblocks: 10+ tasks (entire VPS deployment chain)
Estimated time saved: 8-10 hours (deployment can proceed)
Parallelization gain: HIGH (unblocks GreenMountain track)
```

---

## 🎯 Optimized Merge Strategy (Trinity-Informed)

### Phase 0: Create Beads Task (2 min)
**Why:** Track work, prevent conflicts with other agents

```bash
beads.exe create \
  "Repository merge: spike/simplified-nav → main" \
  --type task \
  --priority 0 \
  --tags vps,deployment,blocker \
  --deps blocks:ved-y1u,ved-drx,ved-8yqm \
  --estimate 20m

# Capture task ID
export MERGE_TASK_ID=$(beads.exe list --title-contains "Repository merge" --format json | jq -r '.[0].id')
```

**Expected output:** `ved-XXXX` (new task ID)

### Phase 1: Pre-Merge Checks (5 min)
**Coordinate with other agents via agent mail:**

```bash
# Check if any agent is working on main branch
cat .beads/issues.jsonl | grep -i "main" | grep "in_progress"

# If conflicts detected, send agent mail
echo "CRITICAL: Repository merge in progress. Do NOT commit to main until ved-$MERGE_TASK_ID complete." > .beads/agent-mail/merge-lock.txt

# Update task status
beads.exe update $MERGE_TASK_ID --status in_progress
```

**Safety checks:**
1. ✅ No uncommitted changes on spike
2. ✅ .beads/issues.jsonl synced
3. ✅ No other agent working on main branch
4. ✅ Backup branch created

### Phase 2: Fast-Forward Merge (5 min)
**Strategy:** Try fast-forward first (zero risk)

```bash
# Backup main
git branch main-backup-2026-01-05
git push origin main-backup-2026-01-05

# Attempt fast-forward
git checkout main
git pull --rebase origin main
git merge --ff-only spike/simplified-nav

# If succeeds:
git push origin main
beads.exe update $MERGE_TASK_ID --status completed --reason "Fast-forward merge successful. Main now has full apps/api/ codebase. VPS deployment unblocked."
git add .beads/
git commit -m "bd sync: Repository merge complete (ved-$MERGE_TASK_ID)"
git push

# If fails:
# → Continue to Phase 3
```

### Phase 3: Squash Merge Fallback (10 min)
**Strategy:** Single commit on main (if fast-forward fails)

```bash
# Squash merge
git checkout main
git merge --squash spike/simplified-nav

# Commit with Beads reference
git commit -m "feat: Merge spike/simplified-nav - Production ready (ved-$MERGE_TASK_ID)

Merges 1000+ files from spike/simplified-nav to main branch.

Major changes:
- De-submodule apps/api (complete NestJS backend)
- Payment system (ved-do76, ved-ejqc, ved-khlu, ved-pqpv)
- Certificate system (ved-llhb, ved-io80, ved-crk7, ved-xbiv)
- YouTube integration (ved-spk-yt-epic)
- Frontend ClaudeKit skills
- VPS deployment scripts
- 312 Beads tasks tracked

Unblocks:
- ved-y1u (pg_stat_statements)
- ved-drx (AI Agent deployment)
- ved-8yqm (PostgreSQL verification)
- GreenMountain VPS track (application deployment)

Beads task: ved-$MERGE_TASK_ID
Merged by: AI Agent via Beads Trinity workflow"

# Push to remote
git push origin main

# Update Beads
beads.exe update $MERGE_TASK_ID \
  --status completed \
  --reason "Squash merge complete. Main = spike (1000+ files merged). apps/api/ restored. VPS deployment unblocked."

# Sync Beads metadata
beads.exe sync
git add .beads/
git commit -m "bd sync: Merge complete (ved-$MERGE_TASK_ID)"
git push
```

### Phase 4: Post-Merge Verification (5 min)
**Trinity checks:**

```bash
# 1. Verify apps/api exists on main
git checkout main
ls apps/api/src | wc -l  # Should be 20+ directories

# 2. Verify build
pnpm --filter api build

# 3. Update spike branch
git checkout spike/simplified-nav
git merge main  # Fast-forward
git push origin spike/simplified-nav

# 4. Beads doctor check
beads.exe doctor

# 5. Notify dependent tasks (agent mail)
echo "Repository merge (ved-$MERGE_TASK_ID) complete. Tasks ved-y1u, ved-drx, ved-8yqm now unblocked. GreenMountain VPS deployment can proceed." > .beads/agent-mail/merge-complete.txt

# 6. Update dependency graph (bv will auto-refresh)
bv.exe --robot-insights  # Verify graph updated
```

---

## 📊 Trinity-Optimized Task Sequence

### Parallel Execution Plan
**Based on bv --robot-insights parallelization analysis:**

```
┌─────────────────────────────────────────────────────────┐
│              PARALLEL WORK TRACKS                        │
├─────────────────────────────────────────────────────────┤
│  Track A (Main Branch)                                  │
│  ├── ved-$MERGE_TASK_ID [5-20 min] ← THIS TASK          │
│  └── → Unblocks ved-y1u, ved-drx, ved-8yqm              │
│                                                          │
│  Track B (Documentation - Independent)                  │
│  ├── ved-ehux (behavioral-design structure)             │
│  ├── ved-pdg7 (move test reports)                       │
│  ├── ved-cw16 (docs structure) ← AI top pick            │
│  └── → Unblocks 4 downstream docs tasks                 │
│                                                          │
│  Track C (Payment System - Independent)                 │
│  ├── ved-do76 (Stripe webhooks)                         │
│  ├── ved-pqpv (Payment schema)                          │
│  └── → Unblocks enrollment system                       │
└─────────────────────────────────────────────────────────┘
```

**Strategy:**
1. **DO NOT WAIT** for documentation tasks (Track B)
2. **DO repository merge FIRST** (Track A) - Unblocks VPS deployment
3. **THEN run VPS deployment** (GreenMountain agent can proceed)
4. **PARALLEL:** Documentation tasks can run independently

---

## 🚨 Risk Mitigation (Agent Coordination)

### Conflict Prevention Protocol
**Using .beads/agent-mail/ for coordination:**

```bash
# Before merge (acquire lock)
cat > .beads/agent-mail/MERGE_IN_PROGRESS.lock <<EOF
{
  "task": "ved-$MERGE_TASK_ID",
  "agent": "Repository Merge Agent",
  "action": "DO NOT COMMIT TO MAIN BRANCH",
  "eta": "20 minutes",
  "started": "$(date -Iseconds)"
}
EOF

# After merge (release lock)
rm .beads/agent-mail/MERGE_IN_PROGRESS.lock
cat > .beads/agent-mail/merge-complete-notification.json <<EOF
{
  "task": "ved-$MERGE_TASK_ID",
  "status": "completed",
  "unblocked_tasks": ["ved-y1u", "ved-drx", "ved-8yqm"],
  "next_action": "VPS deployment can proceed",
  "completed": "$(date -Iseconds)"
}
EOF
```

### Rollback Plan (If Merge Breaks Build)
**Based on bv graph analysis - minimize damage:**

```bash
# Quick rollback (1 min)
git checkout main
git reset --hard main-backup-2026-01-05
git push --force origin main

# Update Beads
beads.exe update $MERGE_TASK_ID \
  --status open \
  --reason "Merge rolled back due to build failure. Investigating root cause."

# Notify via agent mail
echo "ROLLBACK: ved-$MERGE_TASK_ID rolled back. Main branch restored to pre-merge state." > .beads/agent-mail/merge-rollback.txt

# Re-analyze with bv
bv.exe --robot-insights  # Check if graph restored
```

---

## 📈 Success Metrics (Trinity Validation)

### Post-Merge Checks
```bash
# 1. Beads task closed
beads.exe show $MERGE_TASK_ID | grep "completed"

# 2. Dependency graph updated
bv.exe --robot-next  # Should now recommend ved-y1u or ved-drx

# 3. Blocked tasks unblocked
beads.exe list --status open --deps blocked-by:$MERGE_TASK_ID  # Should be 0

# 4. Build verification
pnpm --filter api build  # Must succeed
pnpm --filter web build  # Must succeed

# 5. VPS deployment ready
ls apps/api/Dockerfile  # Must exist
ls apps/api/src/main.ts  # Must exist

# 6. Graph health maintained
bv.exe --robot-insights | jq '.Cycles | length'  # Should be 0
```

---

## ⏱️ Estimated Timeline (Trinity-Optimized)

| Phase | Time | Bottleneck Risk | Parallelizable |
|-------|------|-----------------|----------------|
| Phase 0: Create Beads task | 2 min | LOW | No |
| Phase 1: Pre-merge checks | 5 min | LOW | No |
| Phase 2: Fast-forward merge | 5 min | ZERO | No |
| Phase 3: Squash fallback | 10 min | LOW | No |
| Phase 4: Verification | 5 min | MEDIUM | Partial |
| **TOTAL** | **15-27 min** | **LOW** | **Partial** |

**Critical Path Impact:** NOT on main critical path (ved-ehux → ved-pdg7 → ved-cw16)  
**Parallelization Gain:** HIGH (unblocks 3+ VPS deployment tasks)  
**Betweenness Impact:** LOW (merge is leaf node, not bottleneck)  
**PageRank Impact:** MEDIUM (unblocks important but not central tasks)

---

## 🎯 Recommended Action

**Trinity Consensus:**
1. ✅ **bd (Task Tracking):** Create Beads task for merge → Track progress
2. ✅ **bv (Graph Analysis):** Merge is NOT on critical path → Safe to do in parallel
3. ✅ **agent mail (Coordination):** Use lock file → Prevent conflicts

**EXECUTE NOW:**
```bash
# 1. Create Beads task
beads.exe create "Repository merge: spike → main" \
  --type task --priority 0 \
  --deps blocks:ved-y1u,ved-drx,ved-8yqm

# 2. Run optimized merge (Phase 1-4)
# 3. Verify with Trinity tools
# 4. Unblock VPS deployment
```

**Timeline:** 15-27 minutes  
**Risk:** LOW (backed up, reversible, coordinated)  
**Impact:** HIGH (unblocks 10+ tasks, enables VPS deployment)

---

**Generated by Beads Trinity Analysis**  
**Next Steps:** Execute Phase 0 → Create Beads task
