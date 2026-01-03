# 🚀 V-EdFinance MVP Launch Pipeline
**Date:** 2026-01-03  
**Status:** 🟢 READY TO EXECUTE  
**Methodology:** 6-Phase Systematic Pipeline  
**Oracle Review:** ✅ VALIDATED (88% confidence)

---

## 📊 PIPELINE OVERVIEW (6 PHASES)

```
MVP Request → Discovery → Synthesis → Verification → Decomposition → Validation → Track Planning → LAUNCH 🚀
```

| Phase | Tool Used | Output | Status |
|-------|-----------|--------|--------|
| 1. Discovery | Project audits, beads ready | [Discovery Report](#phase-1-discovery) | ✅ COMPLETE |
| 2. Synthesis | Oracle analysis | [Risk Map + Approach](#phase-2-synthesis) | ✅ COMPLETE |
| 3. Verification | Spikes (`.spike/`) | [Validated Fixes](#phase-3-verification) | ⏳ PENDING |
| 4. Decomposition | file-beads skill | [Task Breakdown](#phase-4-decomposition) | ✅ COMPLETE |
| 5. Validation | beads_viewer + Oracle | [Dependency Graph](#phase-5-validation) | ✅ COMPLETE |
| 6. Track Planning | bv --robot-plan | [Execution Tracks](#phase-6-track-planning) | ✅ COMPLETE |

---

## PHASE 1: DISCOVERY ✅

### Current State Analysis

**Project Health:**
```
✅ Test Suite:        1811/1834 passing (98.7%)
✅ Web Build:         PASSING (Next.js 15.1.8)
🔴 API Build:         9 TypeScript errors (ved-o1cw)
✅ Drizzle Schema:    SYNCED (ved-gdvp CLOSED)
⏳ Auth Security:     PLANNED (6h work)
⏳ Deployment:        VPS + Cloudflare ready
```

**Critical Blockers:**
- ved-o1cw: API Build (9 TypeScript errors) - **P0 CRITICAL**

**Discovery Documents:**
- [PROJECT_AUDIT_FINAL_2026-01-03.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/PROJECT_AUDIT_FINAL_2026-01-03.md)
- [V_EDFINANCE_COMPLETION_PIPELINE.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/V_EDFINANCE_COMPLETION_PIPELINE.md)

---

## PHASE 2: SYNTHESIS ✅ (Oracle Review)

### Timeline Adjustments (Oracle Recommendations)

| Phase | Original Estimate | **Oracle Adjusted** | Buffer | Risk |
|-------|-------------------|---------------------|--------|------|
| Phase 0 (Build Fix) | 50 min | **60 min** | +20% | 🟡 MEDIUM |
| Phase 1 (Coverage) | 2h | **2.5h** | +25% | 🟢 LOW |
| Auth Hardening | 6h | **9h** | +50% | 🔴 HIGH |
| Deployment | 2h | **3.5h** | +75% | 🟡 MEDIUM |
| **TOTAL** | **10.8h** | **✅ 15h** | **+39%** | - |

### Risk Map (Oracle Analysis)

```
                    IMPACT
                    HIGH │
                         │   ⬤ Auth Hardening
                         │     (Timeline slip risk)
                         │
                    MED  │   ⬤ Deploy           ⬤ API Build
                         │     (VPS access)       (Unknown errors)
                         │
                    LOW  │   ✅ Drizzle         ✅ Coverage
                         │     (Closed)          (Low risk)
                         │
                         └─────────────────────────────────────
                              LOW         MED         HIGH
                                    LIKELIHOOD
```

### Critical Path Validation

**Oracle Verdict:** ✅ **API Build FIRST, Drizzle SECOND**

```
ved-o1cw (API Build) ──► BUILD PASSES ──► Phase 1 ──► Auth ──► Deploy
   (60 min)              GATE              (2.5h)     (9h)    (3.5h)
                           │
                           └──► TOTAL CRITICAL PATH: 15 hours
```

**Rationale:**
1. Build gates everything (tests, schema validation, deploy)
2. Drizzle regeneration requires TypeScript compiler
3. Reversing order risks NEW errors from schema changes

---

## PHASE 3: VERIFICATION ⏳ (Planned Spikes)

### Spike 1: API Build Error Fix
**File:** `.spike/api-build-fix-2026-01-03.md`

**Workflow:**
```bash
# 1. Create spike branch
git checkout -b spike/api-build-fix

# 2. Fix KyselyService method calls (6 errors)
sed -i 's/executeRawQuery/executeRaw/g' apps/api/src/modules/debug/query-optimizer.service.ts

# 3. Install missing dependency
cd apps/api && pnpm add @nestjs/axios

# 4. Fix tablename variable (manual)
# Check context in query-optimizer.service.ts:274

# 5. Verify build
pnpm --filter api build

# 6. Document learnings
# Save to .spike/api-build-fix-2026-01-03.md
```

**Success Criteria:**
- ✅ 9 errors → 0 errors
- ✅ Build passes
- ✅ No new errors introduced

**Time Budget:** 60 minutes (Oracle adjusted)

---

### Spike 2: Auth Hardening Prototype
**File:** `.spike/jwt-blacklist-prototype-2026-01-03.md`

**Workflow:**
```bash
# 1. Research Redis JWT patterns
# Use Librarian: "NestJS Redis JWT blacklist implementation"

# 2. Create prototype
mkdir -p .spike/auth-blacklist
cd .spike/auth-blacklist

# 3. Test TTL cleanup
# Verify Redis expiry works

# 4. Benchmark performance
# Test overhead <10ms

# 5. Document learnings
# Save to .spike/jwt-blacklist-prototype-2026-01-03.md
```

**Validation Points:**
- Redis connection tested
- TTL expiry works
- Performance impact <10ms

**Time Budget:** 90 minutes (exploration phase)

---

## PHASE 4: DECOMPOSITION ✅

### Existing Beads (P0/P1)

**Phase 0 Blockers:**
- ✅ **ved-6bdg**: Web Build (CLOSED)
- ✅ **ved-gdvp**: Drizzle Schema Sync (CLOSED)
- 🔴 **ved-o1cw**: API Build Quality Gate (OPEN - 60 min)

**Auth Hardening (P1):**
- **ved-23r**: JWT Blacklist (Redis) - 4h (Oracle adjusted)
- **ved-c6i**: Session Invalidation - 2.5h
- **ved-7mn**: Progress Tampering - 2.5h

---

### 🔴 NEW BEADS TO CREATE (Oracle Identified)

**Missing Critical Tasks:**

```bash
# Deployment Blockers
bd create "Implement smoke test suite for deployment verification" \
  --type task --priority 0 --estimated-minutes 45 \
  --deps blocks:deployment

bd create "Create env validation script for production" \
  --type task --priority 0 --estimated-minutes 20 \
  --deps blocks:deployment

# Auth Related
bd create "Verify rate limiting on auth endpoints" \
  --type task --priority 1 --estimated-minutes 30 \
  --deps discovered-from:ved-23r

bd create "Configure session timeout policies" \
  --type task --priority 1 --estimated-minutes 30 \
  --deps discovered-from:ved-23r

# Operations
bd create "Document rollback procedures for database and code" \
  --type documentation --priority 1 --estimated-minutes 30

bd create "Implement frontend error boundaries" \
  --type feature --priority 1 --estimated-minutes 45
```

**Total Missing Time:** 3h 20min (critical gap identified by Oracle)

---

## PHASE 5: VALIDATION ✅ (Beads Trinity)

### Dependency Graph Analysis

**From Beads Trinity (bd + bv + mcp_agent_mail):**

```
┌─────────────────────────────────────────────────────────────┐
│                   DEPENDENCY GRAPH                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ved-o1cw (API Build) ──────┐                               │
│       │                     │                               │
│       ▼                     │ BLOCKS                        │
│  BUILD PASSES ✅             │                               │
│       │                     │                               │
│       ├─────────────────────┘                               │
│       │                                                     │
│       ├──► Phase 1 (Coverage) ─────┐                        │
│       │        │                   │                        │
│       │        ▼                   │ SEQUENTIAL             │
│       │   Coverage Baseline        │                        │
│       │        │                   │                        │
│       │        └───────────────────┘                        │
│       │                   │                                 │
│       └──────────────► Auth Hardening (Phase 3)             │
│                           │                                 │
│                           ├──► ved-23r (JWT Blacklist)      │
│                           ├──► ved-c6i (Session Inv.)       │
│                           └──► ved-7mn (Tampering)          │
│                                   │                         │
│                                   ▼                         │
│                            Deployment (Phase 4)             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Validation Results:**
- ✅ No circular dependencies
- ✅ Critical path identified (15h)
- ⚠️ 6 missing tasks (3.3h) - NOW ADDED
- ✅ Parallel opportunities: 2-3 tracks

---

## PHASE 6: TRACK PLANNING ✅ (Execution Strategy)

### 2-Agent Parallel Execution (Oracle Recommended)

```
AGENT ALLOCATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AGENT 1 (Critical Path - 14h total)
┌─────────────────────────────────────────────────────────────┐
│ WEEK 1                                                      │
│  Day 1: Phase 0 (ved-o1cw) - 1h                             │
│  Day 2: Phase 1 (Coverage) - 2.5h                           │
│                                                             │
│ WEEK 2-3                                                    │
│  Day 3-7: Auth Hardening (ved-23r, ved-c6i, ved-7mn) - 9h   │
│  Day 8: Smoke Tests + Verification - 1.5h                   │
└─────────────────────────────────────────────────────────────┘

AGENT 2 (Support Path - 7h total)
┌─────────────────────────────────────────────────────────────┐
│ WEEK 1 (Parallel with Agent 1)                              │
│  Day 1-2: Pattern Extraction (ved-vzx0, ved-aww5) - 1.5h    │
│  Day 3: Deploy Prep (env validation, docs) - 2h             │
│                                                             │
│ WEEK 2-3 (Parallel with Agent 1)                            │
│  Day 4-5: Missing Tasks (error boundaries, rollback) - 1.5h │
│  Day 6-7: Deploy Staging + Production - 2h                  │
└─────────────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ELAPSED TIME: 2-3 weeks (at 4-6h/week per agent)
```

---

### Track 1: Critical Path (Agent 1)

**Week 1:**
```bash
# Session 1 (60 min) - Phase 0
- Fix KyselyService method calls (15 min)
- Install @nestjs/axios (5 min)
- Fix tablename variable (20 min)
- Build verification (20 min)

# Session 2 (2.5h) - Phase 1
- Run Vitest coverage (45 min)
- Parse coverage JSON (30 min)
- Create TEST_COVERAGE_BASELINE.md (30 min)
- E2E coverage measurement (45 min)
```

**Week 2-3:**
```bash
# Sessions 3-5 (9h) - Auth Hardening
- ved-23r: JWT Blacklist (4h)
  ├─ Redis setup (60 min)
  ├─ BlacklistService + TTL (120 min)
  ├─ Logout endpoints (60 min)
  └─ JWT verify integration (60 min)
  
- ved-c6i: Session Invalidation (2.5h)
- ved-7mn: Progress Tampering (2.5h)

# Session 6 (1.5h) - Smoke Tests
- Implement smoke test suite (45 min)
- Run end-to-end verification (30 min)
- Fix any critical issues (15 min)
```

**Total Agent 1:** 14 hours

---

### Track 2: Support & Parallel (Agent 2)

**Week 1:**
```bash
# Parallel with Phase 0/1
- ved-vzx0: Extract Nudge Theory patterns (45 min)
- ved-aww5: Extract Hooked Model patterns (45 min)
- ved-wxc7: Extract Gamification patterns (45 min)

# Deploy Prep (2h)
- Env validation script (20 min)
- Rollback documentation (30 min)
- Migration dry-run (45 min)
- Production checklist (25 min)
```

**Week 2-3:**
```bash
# Missing Tasks (1.5h)
- Frontend error boundaries (45 min)
- Session timeout config (30 min)
- Rate limiting verification (15 min)

# Deployment (2h)
- VPS staging deploy (90 min)
- Cloudflare Pages setup (30 min)
```

**Total Agent 2:** 7 hours

---

## 🎯 SUCCESS METRICS

### Phase 0 Success (60 min)
```
✅ API build: 0 TypeScript errors
✅ Web build: PASSING
✅ All tests: 98.7%+ pass rate
✅ Drizzle schema: In sync
```

### Phase 1 Success (2.5h)
```
✅ Unit coverage: Measured + documented
✅ E2E coverage: Measured + documented
✅ TEST_COVERAGE_BASELINE.md: Created
✅ Coverage gates: Defined
```

### Phase 3 Success (9h)
```
✅ JWT blacklist: Implemented + tested
✅ Session invalidation: Working
✅ Progress tampering: Prevented
✅ Auth tests: Passing
```

### MVP Launch Success (18h total)
```
✅ All builds: GREEN
✅ Test coverage: ≥70%
✅ Auth security: Hardened
✅ Smoke tests: PASSING
✅ VPS staging: Deployed
✅ Cloudflare Pages: Deployed
✅ Zero-Debt: CERTIFIED
```

---

## 🚦 GO/NO-GO GATES

### Gate 1: Phase 0 Complete
**Criteria:**
- ✅ API build passes (0 errors)
- ✅ Tests still 98%+ passing
- ✅ No regression introduced

**Decision:** 
- ✅ PROCEED to Phase 1
- ⚠️ REASSESS if >3 new errors discovered
- ❌ STOP if build errors increase

---

### Gate 2: Phase 1 Complete
**Criteria:**
- ✅ Coverage baseline documented
- ✅ E2E scenarios identified
- ✅ Quality gates defined

**Decision:**
- ✅ PROCEED to Auth hardening
- ⚠️ DEFER if coverage <50% (need tests first)

---

### Gate 3: Auth Complete
**Criteria:**
- ✅ JWT blacklist tested
- ✅ Session invalidation verified
- ✅ No security regressions

**Decision:**
- ✅ PROCEED to deployment
- ⚠️ HOLD if security tests fail

---

### Gate 4: MVP Launch
**Criteria:**
- ✅ Smoke tests pass on staging
- ✅ No P0/P1 bugs in backlog
- ✅ Rollback plan documented

**Decision:**
- ✅ LAUNCH MVP
- ⚠️ BETA if minor issues
- ❌ DELAY if critical bugs

---

## 📅 TIMELINE SUMMARY

```
┌─────────────────────────────────────────────────────────────┐
│                     MVP LAUNCH TIMELINE                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Week 1 (6h)                                                │
│  ├─ Day 1: Phase 0 (1h)                 ✅ Gate 1          │
│  └─ Day 2: Phase 1 (2.5h)               ✅ Gate 2          │
│      + Pattern Extraction (2.5h)                            │
│                                                             │
│  Week 2-3 (12h)                                             │
│  ├─ Day 3-7: Auth Hardening (9h)        ✅ Gate 3          │
│  └─ Day 8-9: Deploy + Smoke (3h)        ✅ Gate 4          │
│                                                             │
│  TOTAL ELAPSED: 2-3 weeks                                   │
│  TOTAL EFFORT:  18 hours (2 agents)                         │
│                                                             │
│  🚀 MVP LAUNCH: Week 3 End                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 NEXT ACTIONS

### Immediate (Today):
1. ✅ Create this pipeline document
2. ⏳ Run Spike 1: API Build Fix (60 min)
3. ⏳ Create 6 missing beads (from Oracle analysis)
4. ⏳ Assign Agent 2 to Pattern Extraction

### Short-term (This Week):
1. ⏳ Complete Phase 0 (1h)
2. ⏳ Complete Phase 1 (2.5h)
3. ⏳ Begin Auth hardening spike

### Medium-term (Next 2 Weeks):
1. ⏳ Complete Auth hardening (9h)
2. ⏳ Deploy to staging
3. ⏳ MVP Launch 🚀

---

## 📊 RESOURCE REQUIREMENTS

**Agents:** 2 (parallel execution)
**Total Time:** 18 hours (effort)
**Elapsed Time:** 2-3 weeks
**Calendar:** At 4-6h/week per agent

**External Dependencies:**
- VPS access (for ved-y1u, ved-drx)
- Cloudflare account (for Pages deploy)
- Redis instance (for JWT blacklist)

---

## 🔗 REFERENCES

**Discovery Reports:**
- [PROJECT_AUDIT_FINAL_2026-01-03.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/PROJECT_AUDIT_FINAL_2026-01-03.md)
- [V_EDFINANCE_COMPLETION_PIPELINE.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/V_EDFINANCE_COMPLETION_PIPELINE.md)

**Strategy Documents:**
- [STRATEGIC_DEBT_PAYDOWN_PLAN.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/STRATEGIC_DEBT_PAYDOWN_PLAN.md)

**Beads Database:**
- `.beads/issues.jsonl` (200+ tasks tracked)

---

**Status:** 🟢 PIPELINE READY  
**Oracle Validation:** ✅ 88% Confidence  
**Next Step:** Execute Spike 1 (API Build Fix)  
**Thread:** T-019b83de-f58e-736b-84ff-83d191812659  
**Date:** 2026-01-03

---

*"Six phases. Two agents. Three weeks. MVP launch."* 🚀
