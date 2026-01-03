# 🚀 V-EdFinance MVP Launch - Quick Start Guide
**Date:** 2026-01-03  
**For:** Orchestrator Agent / Human Coordinator

---

## 📋 TL;DR (30 Second Summary)

**Mission:** Deploy V-EdFinance MVP to production in 3 weeks using 2 parallel agents.

**Status:** ✅ Planning complete, ready for execution  
**Effort:** 36 hours (18h per agent)  
**Timeline:** 3 weeks (6h/week per agent)  
**Confidence:** 85% (Oracle validated)

**Next Actions:**
1. Create epic bead → `bd create "MVP Launch - Production Deployment" --type epic --priority 0`
2. Create 10 missing beads (see commands below)
3. Verify Drizzle schema sync
4. Pre-provision Redis
5. Spawn BlueLake + GreenCastle agents

---

## 🎯 Quick Commands Reference

### Pre-Flight Checklist (5 minutes)

```bash
# 1. Create MVP Epic
bd create "MVP Launch - Production Deployment" \
  --type epic --priority 0 \
  --description "Deploy V-EdFinance to production with Zero-Debt compliance"

# Get epic ID
EPIC_ID=$(bd list --format json | jq -r '.[] | select(.title | contains("MVP Launch")) | .id')
echo "Epic ID: $EPIC_ID"

# 2. Verify Drizzle Schema (CRITICAL - do BEFORE agents start)
cd apps/api
pnpm drizzle-kit push --dry-run
# MUST show: "Everything is up to date 🏅" (0 changes)

# 3. Pre-provision Redis (avoid 2h delay later)
docker-compose up -d redis
redis-cli ping  # Should return "PONG"

# 4. Verify VPS Access
ssh root@103.54.153.248 "echo 'VPS accessible'"
```

### Create Missing Beads (10 beads, 2 minutes)

```bash
# Missing Tasks (Oracle Identified)
bd create "Implement smoke test suite for deployment verification" \
  --type task --priority 0 --estimated-minutes 55 \
  --deps discovered-from:$EPIC_ID

bd create "Create env validation script for production" \
  --type task --priority 0 --estimated-minutes 30 \
  --deps discovered-from:$EPIC_ID

bd create "Verify rate limiting on auth endpoints" \
  --type task --priority 1 --estimated-minutes 30 \
  --deps discovered-from:ved-23r

bd create "Configure session timeout policies" \
  --type task --priority 1 --estimated-minutes 30 \
  --deps discovered-from:ved-23r

bd create "Document rollback procedures for database and code" \
  --type documentation --priority 1 --estimated-minutes 45 \
  --deps discovered-from:$EPIC_ID

bd create "Implement frontend error boundaries" \
  --type feature --priority 1 --estimated-minutes 75 \
  --deps discovered-from:$EPIC_ID

# Additional Tasks (Oracle Recommended)
bd create "Verify database backup procedures" \
  --type task --priority 1 --estimated-minutes 15 \
  --deps discovered-from:$EPIC_ID

bd create "Implement health check endpoints for monitoring" \
  --type task --priority 1 --estimated-minutes 30 \
  --deps discovered-from:$EPIC_ID

bd create "Audit CORS configuration for production" \
  --type task --priority 1 --estimated-minutes 15 \
  --deps discovered-from:$EPIC_ID

bd create "Document secrets rotation plan" \
  --type documentation --priority 1 --estimated-minutes 20 \
  --deps discovered-from:$EPIC_ID
```

### Validate with bv (1 minute)

```bash
# Run analysis
bv --robot-insights > beads-validation-mvp.json

# Check for cycles (MUST be empty)
cat beads-validation-mvp.json | jq '.Cycles'

# Check critical path
cat beads-validation-mvp.json | jq '.CriticalPath'

# Success: No cycles, critical path = Coverage → Auth → Deploy
```

---

## 👥 Agent Assignments

### Track 1: BlueLake (Critical Path Agent)

**Responsibility:** Coverage → Auth → Deploy (sequential)  
**File Scope:** `apps/api/src/{auth,modules/debug}/**`, `apps/api/prisma/**`  
**Duration:** 18 hours over 3 weeks

**Beads (13 tasks):**
- Week 1: ved-gdvp, ved-glnb, ved-beu3, ved-23r (6h)
- Week 2: ved-c6i, ved-7mn, BD-NEW-RATE, BD-NEW-SESSION (6h)
- Week 3: BD-NEW-SMOKE, BD-NEW-ENV, BD-NEW-HEALTH, Deploy (6h)

**Quality Gates:**
- Gate 1 (End Week 1): Coverage baseline documented
- Gate 2 (End Week 2): Auth security hardened
- Gate 3 (End Week 3): Production deployed

---

### Track 2: GreenCastle (Support Agent)

**Responsibility:** Patterns + Missing Tasks + Deploy Prep (parallel)  
**File Scope:** `apps/api/src/modules/{nudge,social,gamification}/**`, `scripts/**`, `docs/**`  
**Duration:** 18 hours over 3 weeks

**Beads (15 tasks):**
- Week 1: ved-vzx0, ved-aww5, ved-wxc7, BD-NEW-ROLLBACK, BD-NEW-BACKUP, BD-NEW-CORS, BD-NEW-SECRETS (6h)
- Week 2: BD-NEW-ERROR, Deploy Prep, Integration Buffer (6h)
- Week 3: Cloudflare Pages Setup, Deploy Support, Final Buffer (6h)

**Deliverables:**
- Pattern extraction docs (3 files)
- Rollback + secrets rotation docs
- Error boundaries + smoke tests
- Deploy support

---

## 📊 Success Metrics (Quality Gates)

### Gate 1: Coverage Baseline (End Week 1)
```
✅ Drizzle schema: 0 drift verified
✅ E2E coverage: Measured + documented
✅ CI/CD pass rate: ≥98% verified
```

### Gate 2: Auth Security (End Week 2)
```
✅ JWT blacklist: Implemented + tested
✅ Session invalidation: Working
✅ Rate limiting: Enforced (5 login/15min, 10 refresh/1hr)
✅ Progress tampering: Prevented
✅ Session timeout: Configured (15min access, 7d refresh)
```

### Gate 3: Staging Verified (End Week 3)
```
✅ Smoke tests: All pass on staging VPS
✅ Rollback plan: Documented + tested
✅ No P0/P1 bugs: Backlog clean
```

### Gate 4: MVP Launch (Final)
```
✅ Production: Deployed to VPS + Cloudflare Pages
✅ Smoke tests: All pass on production
✅ Monitoring: Grafana dashboards active
✅ Zero-Debt: Certified (0 build errors, all gates green)
```

---

## ⚠️ Critical Risk Items

**1. Drizzle Schema Drift**
- **Check NOW:** `pnpm drizzle-kit push --dry-run` (MUST show 0 changes)
- **If drift found:** Regenerate schema BEFORE agents start
- **Impact:** 30 min delay if drift found, 4h+ if CRUD breaks

**2. Redis Not Pre-Provisioned**
- **Check NOW:** `docker-compose up -d redis && redis-cli ping`
- **If missing:** Start Redis NOW to avoid 2h delay in Week 2
- **Impact:** Auth sprint blocked until Redis available

**3. VPS Access Lost**
- **Check NOW:** `ssh root@103.54.153.248 "echo OK"`
- **If fails:** Contact infra team BEFORE Week 3
- **Impact:** Deployment blocked, +1-2 day delay

**4. File Conflicts Between Agents**
- **Mitigation:** Non-overlapping file scopes defined
- **Monitor:** Use Agent Mail file reservations
- **Fallback:** Orchestrator mediates via epic thread

---

## 📅 Week-by-Week Breakdown

### Week 1 (Jan 6-12, 2026)
```
BlueLake Focus:  Coverage measurement + Auth setup
GreenCastle:     Pattern extraction + Missing tasks P0
Gate:            Coverage baseline documented
Risk:            Drizzle drift (check BEFORE start)
```

### Week 2 (Jan 13-19, 2026)
```
BlueLake Focus:  Auth hardening (JWT, session, tampering)
GreenCastle:     Error boundaries + integration buffer
Gate:            Auth security verified
Risk:            Redis dependency (pre-provision!)
```

### Week 3 (Jan 20-26, 2026)
```
BlueLake Focus:  Smoke tests + deployment
GreenCastle:     Deploy support + final buffer
Gate:            Production deployed + verified
Risk:            VPS access (verify BEFORE this week)
```

---

## 🚀 Orchestrator Execution Steps

**If you are the orchestrator agent, follow these steps:**

1. **Read Full Plan:** [MVP_EXECUTION_PLAN_ORCHESTRATOR.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/history/mvp-launch/MVP_EXECUTION_PLAN_ORCHESTRATOR.md)
2. **Run Pre-Flight Checklist** (above)
3. **Create Epic + Missing Beads** (above)
4. **Validate with bv** (above)
5. **Initialize Agent Mail:**
   ```bash
   # Ensure project exists
   mcp__agent_mail__ensure_project(human_key="c:/Users/luaho/Demo project/v-edfinance")
   
   # Register orchestrator
   mcp__agent_mail__register_agent(
     project_key="c:/Users/luaho/Demo project/v-edfinance",
     name="MVP-Orchestrator",
     program="amp",
     model="claude-3-7-sonnet-20250219",
     task_description="Orchestrator for MVP Launch epic"
   )
   ```
6. **Spawn BlueLake Agent:**
   ```python
   Task(
     description="Worker BlueLake: MVP Critical Path",
     prompt="... (see full prompt in ORCHESTRATOR.md) ..."
   )
   ```
7. **Spawn GreenCastle Agent:**
   ```python
   Task(
     description="Worker GreenCastle: MVP Support",
     prompt="... (see full prompt in ORCHESTRATOR.md) ..."
   )
   ```
8. **Monitor Progress:**
   - Check epic thread every 1 hour
   - Handle blockers via Agent Mail
   - Verify quality gates at end of each week
9. **Announce Completion:**
   - Send epic completion summary
   - Close epic bead
   - Celebrate 🚀

---

## 📚 Full Documentation

**Planning Documents:**
- [MVP_EXECUTION_PLAN_ORCHESTRATOR.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/history/mvp-launch/MVP_EXECUTION_PLAN_ORCHESTRATOR.md) - Full execution plan (this is the master doc)
- [MVP_LAUNCH_PIPELINE_2026-01-03.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/MVP_LAUNCH_PIPELINE_2026-01-03.md) - Original 6-phase pipeline
- [BV_MVP_ANALYSIS_2026-01-03.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/BV_MVP_ANALYSIS_2026-01-03.md) - Beads Viewer analysis

**Strategy Documents:**
- [PROJECT_AUDIT_FINAL_2026-01-03.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/PROJECT_AUDIT_FINAL_2026-01-03.md) - Current state audit
- [STRATEGIC_DEBT_PAYDOWN_PLAN.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/STRATEGIC_DEBT_PAYDOWN_PLAN.md) - Zero-Debt protocol

**Skills Used:**
- [.agents/skills/orchestrator/SKILL.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/.agents/skills/orchestrator/SKILL.md) - Multi-agent coordination
- [.agents/skills/planning/SKILL.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/.agents/skills/planning/SKILL.md) - 6-phase planning pipeline

---

## 🎯 Decision Matrix

**When should I (Orchestrator) intervene?**

| Situation | Action |
|-----------|--------|
| Worker reports blocker | Reply with resolution via epic thread |
| Worker stuck >2 hours | Check inbox, coordinate via Agent Mail |
| Quality gate fails | HALT track, fix issues before proceeding |
| File conflict | Mediate via epic thread, assign file ownership |
| VPS access lost | Escalate to infra team, use fallback (Heroku) |
| Redis unavailable | Start Redis immediately, notify BlueLake |
| Production incident | Execute rollback procedure, notify all agents |

---

## ✅ Final Checklist Before Execution

```
Pre-Flight:
[ ] Epic bead created (bd-mvp-epic)
[ ] 10 missing beads created
[ ] bv validation passes (no cycles)
[ ] Drizzle schema sync verified (0 drift)
[ ] Redis provisioned + tested
[ ] VPS access verified

Agent Spawn:
[ ] Agent Mail initialized
[ ] BlueLake spawned via Task()
[ ] GreenCastle spawned via Task()
[ ] Epic thread created
[ ] Track threads created

Monitoring:
[ ] Epic thread monitored (hourly)
[ ] Inbox checked for blockers
[ ] Quality gates tracked (end of each week)

Completion:
[ ] Both tracks complete
[ ] All quality gates passed
[ ] Production deployed + verified
[ ] Epic closed
[ ] Zero-Debt certified
```

---

**Status:** 🟢 READY FOR EXECUTION  
**Confidence:** 85%  
**Estimated Completion:** 2026-01-26  
**Zero-Debt Certification:** Expected ✅

---

*"Two agents. Three weeks. MVP launched. From planning to production."* 🚀
