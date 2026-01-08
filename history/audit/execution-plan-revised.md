# Execution Plan - REVISED after Spikes

**Epic:** VED-3GAT  
**Status:** Ready for Parallel Execution  
**Updated:** 2026-01-05 (Post-Spike Validation)

---

## 🎯 Critical Discovery from Spikes

### ❌ P0 Gate (Track 0) ELIMINATED

**Spike Results:**
- **ved-b51s:** No merge conflicts found. pnpm install + build both succeed.
- **ved-wbpj:** Schema valid. Prisma generate + API build pass. No drift.

**Conclusion:** Original P0 blockers (VED-P0A, VED-P0B) are based on outdated git state. No action needed.

---

## ✅ Revised 3-Track Strategy (Parallel Execution)

| Track | Agent       | Focus                    | Est. Time | Can Start |
|-------|-------------|--------------------------|-----------|-----------|
| 1     | BlueLake    | Backend Quality          | 4 hours   | NOW       |
| 2     | GreenCastle | Frontend Quality         | 3 hours   | NOW       |
| 3     | PurpleBear  | Documentation            | 2.5 hours | NOW       |

**Total Calendar Time:** ~4 hours (with parallelization)

---

## Track 1: Backend Quality - BlueLake

**File Scope:** `apps/api/**`  
**Priority:** P1

### Beads to Create:

1. **Fix API Test Type Errors** (3 hours)
   - scenario-generator.service.spec.ts (13 errors)
   - auth.service.spec.ts (1 error)
   - dynamic-config.service.spec.ts (4 errors)
   - ai-course-flow.e2e-spec.ts (3 errors)
   - **Total:** 21 TypeScript errors

2. **Audit JSONB SchemaRegistry** (30 min)
   - List all JSONB fields from schema.prisma
   - Check SchemaRegistry.ts for coverage
   - Add missing validators
   - **Found from spike:** 8+ JSONB fields (User.name, Course.title, etc.)

3. **Document Manual Migration** (30 min)
   - Investigate `add_integration_models.sql`
   - Convert to Prisma format or document as post-migration
   - Verify VPS migration history

4. **Categorize Backend TODOs** (30 min)
   - Extract 40 TODO/FIXME from apps/api
   - Create tech-debt-register.md (backend section)

**Acceptance:**
- `pnpm --filter api build` passes (zero errors)
- All JSONB fields in SchemaRegistry
- Manual migration documented
- TODO register created

---

## Track 2: Frontend Quality - GreenCastle

**File Scope:** `apps/web/**`  
**Priority:** P1

### Beads to Create:

1. **Fix Frontend Import Errors** (1.5 hours) ⭐ NEW
   - **Issue:** 26 build warnings discovered in spike ved-b51s
   - Fix `Icons` export in `apps/web/src/lib/icons.ts`
   - Fix `PanelGroup`, `PanelResizeHandle` imports in resizable.tsx
   - Verify Sidebar.tsx and lesson page work

2. **Fix Frontend Test Errors** (1 hour)
   - YouTubeErrorBoundary.test.tsx (29 TypeScript errors)
   - Add Vitest matchers (toBeInTheDocument, toHaveAttribute)

3. **Clean Temp Files** (30 min)
   - Remove: temp_ai_gallery/, temp_beads_viewer/, temp_gemini_chatbot/, temp_indie_tools/, temp_skills/
   - Archive: .spike/, .spikes/ → archive/spikes/
   - Verify git status clean

**Acceptance:**
- `pnpm --filter web build` passes with NO warnings
- All tests pass or documented
- No temp_* in root

---

## Track 3: Documentation - PurpleBear

**File Scope:** `docs/`, `AGENTS.md`, `runbooks/`, `history/`  
**Priority:** P2

### Beads to Create:

1. **Update AGENTS.md with Spike Learnings** (30 min)
   - Add spike workflow example
   - Document "verify before fixing" pattern
   - Add to quality checklist

2. **Create Tech Debt Register** (1 hour)
   - Consolidate TODO items from Track 1 & 2
   - Categorize: P0 (blocking), P1 (feature debt), P2 (nice-to-have)
   - Create docs/TECH_DEBT.md

3. **VPS Deployment Runbook** (1 hour)
   - Extract from history/vps-deployment/
   - Include: Dokploy setup, Cloudflare Tunnel, migration steps
   - Add to runbooks/vps-deployment.md

**Acceptance:**
- AGENTS.md updated with spike learnings
- Tech debt register created
- VPS runbook complete

---

## Success Metrics (Revised)

### Build Quality
- [x] `pnpm install` succeeds ✅ (verified in spike)
- [x] `pnpm build` succeeds ✅ (verified in spike, with warnings)
- [ ] `pnpm --filter api build` - zero errors
- [ ] `pnpm --filter web build` - zero warnings

### Database Integrity
- [x] `prisma generate` passes ✅ (verified in spike)
- [x] Schema vs migrations aligned ✅ (verified in spike)
- [ ] Manual migration documented
- [ ] All JSONB fields in SchemaRegistry

### Code Quality
- [ ] Zero TypeScript `any` in fixes
- [ ] 21 API test errors fixed
- [ ] 29 frontend test errors fixed
- [ ] 26 frontend build warnings fixed
- [ ] All TODO items documented

### Documentation
- [ ] AGENTS.md updated
- [ ] Tech debt register created
- [ ] VPS runbook complete

### Cleanup
- [ ] No temp_* directories
- [ ] Git status clean

---

## Timeline Estimate (Revised)

| Track  | Agent        | Time    | Dependencies |
|--------|--------------|---------|--------------|
| Track 1| BlueLake     | 4 hours | None (start now) |
| Track 2| GreenCastle  | 3 hours | None (start now) |
| Track 3| PurpleBear   | 2.5 hours | None (start now) |

**Critical Path:** Track 1 (4 hours)  
**Total Calendar Time:** ~4 hours (all parallel)  
**With Breaks:** 0.5 day

---

## Beads to Create (Next Step)

```bash
# Track 1: Backend Quality
bd create "Fix API Test Type Errors (21 errors)" --type task --priority 1 --blocks ved-3gat --no-daemon
bd create "Audit JSONB SchemaRegistry Coverage" --type task --priority 1 --blocks ved-3gat --no-daemon
bd create "Document Manual Migration File" --type task --priority 1 --blocks ved-3gat --no-daemon
bd create "Categorize Backend TODO Comments" --type task --priority 2 --blocks ved-3gat --no-daemon

# Track 2: Frontend Quality
bd create "Fix Frontend Import Warnings (26 items)" --type task --priority 1 --blocks ved-3gat --no-daemon
bd create "Fix Frontend Test TypeScript Errors (29 items)" --type task --priority 1 --blocks ved-3gat --no-daemon
bd create "Clean Temporary Directories" --type task --priority 2 --blocks ved-3gat --no-daemon

# Track 3: Documentation
bd create "Update AGENTS.md with Spike Learnings" --type task --priority 2 --blocks ved-3gat --no-daemon
bd create "Create Tech Debt Register" --type task --priority 2 --blocks ved-3gat --no-daemon
bd create "Create VPS Deployment Runbook" --type task --priority 2 --blocks ved-3gat --no-daemon
```

---

## Spike Learnings Embedded

### From ved-b51s (Merge Strategy):
- ✅ Always verify problem exists before creating fix
- ✅ Run `pnpm install` and `pnpm build` to baseline current state
- ✅ Discovered real issue: 26 frontend import warnings (not merge conflicts)

### From ved-wbpj (Schema Validation):
- ✅ `prisma generate` is sufficient validation (no need for running server)
- ✅ Schema is production-ready (no critical drift)
- ✅ Found 1 manual SQL file needing documentation
- ✅ Identified JSONB registry gap (8+ fields to audit)

---

## Status

- [x] Spikes complete (ved-b51s, ved-wbpj)
- [x] P0 Gate closed as unnecessary (ved-mdlo)
- [x] Execution plan revised
- [ ] **NEXT:** Create 10 Track beads
- [ ] **THEN:** Run `bv --robot-plan` to validate
- [ ] **FINALLY:** Execute 3 parallel tracks
