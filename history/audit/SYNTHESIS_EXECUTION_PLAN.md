# Technical Debt Execution Plan - Oracle Synthesis

**Generated**: 2026-01-05  
**Oracle Analysis**: Synthesized from 4 comprehensive audit reports  
**Critical Path**: 2.5 hours to resume VPS deployment  
**Total Debt**: ~49 hours (defer 90% post-deployment)

---

## Executive Summary

The Oracle has analyzed all audit findings and identified a **minimal viable deployment path** that resolves critical blockers in ~2.5 hours while deferring 90% of technical debt to post-deployment cleanup.

### Key Metrics
- **P0 Blockers**: 4 merge conflicts (50 minutes to resolve)
- **Deployment Blockers**: Build chain + Docker fixes (1.5 hours)
- **Security Critical**: SSH private key in repository (10 minutes)
- **Deferred Items**: JSONB validation, schema drift, type safety (47 hours)

---

## Critical Path (P0) - MUST Fix Before Any Work

### Blocker 1: Root package.json Merge Conflict
**File**: `package.json`  
**Impact**: `pnpm install` fails, no builds possible  
**Estimate**: 15 minutes

**Resolution Strategy**:
```bash
# Keep upstream (Updated) version - more comprehensive scripts
git checkout --theirs package.json

# Manually add workspaces array from stashed version:
# "workspaces": ["apps/*", "packages/*"]
```

**Verification**:
```bash
pnpm install  # Should complete without errors
```

---

### Blocker 2: apps/web/package.json Merge Conflict
**File**: `apps/web/package.json`  
**Impact**: Frontend build fails  
**Estimate**: 15 minutes

**Resolution Strategy**:
- Merge BOTH dependency sets
- Keep @radix-ui/* packages (UI components)
- Keep date-fns, framer-motion, zustand
- Keep testing libraries from both sides

**Verification**:
```bash
cd apps/web
pnpm install
pnpm build
```

---

### Blocker 3: Dashboard Page Merge Conflict
**File**: `apps/web/src/app/[locale]/dashboard/page.tsx`  
**Impact**: Build fails with syntax error  
**Estimate**: 10 minutes

**Resolution**: Remove conflict markers, keep desired implementation

---

### Blocker 4: Docker Compose Duplicates
**File**: `docker-compose.monitoring.yml`  
**Impact**: Docker Compose parse error  
**Estimate**: 10 minutes

**Resolution**: Delete lines 2-30 (duplicate prometheus/grafana), keep lines 32-77

---

## Track A: Build Chain (Required for Deployment)

**Dependencies**: P0 complete  
**Estimate**: 1 hour  
**Priority**: CRITICAL

| Step | Task | Command |
|------|------|---------|
| A1 | Standardize TypeScript to ^5.9.3 | `npx json -I -f package.json -e 'this.devDependencies.typescript="^5.9.3"'` |
| A2 | Standardize @types/node to ^22.10.7 | Similar for all 3 packages |
| A3 | Remove Next.js from apps/api | `cd apps/api && npm pkg delete dependencies.next` |
| A4 | Verify build | `pnpm install && pnpm build` |

---

## Track E2: Security Critical (SSH Key)

**Dependencies**: None  
**Estimate**: 10 minutes  
**Priority**: CRITICAL

```powershell
# Move SSH key out of repository
$sshDir = "$env:USERPROFILE\.ssh"
Move-Item "amp_vps_private_key.txt" -Destination "$sshDir\amp_vps_private_key"
icacls "$sshDir\amp_vps_private_key" /inheritance:r /grant:r "$env:USERNAME:F"

# Update .gitignore
echo "*_private_key.txt" >> .gitignore
git add .gitignore
git commit -m "security: move SSH private key out of repository"
```

---

## Deferred Tracks (Post-Deployment)

### Track B: Schema Drift (4 hours)
- Reconcile 11 orphaned models in `add_integration_models.sql`
- Fix 3 duplicate model definitions
- Create rollback scripts
- **Decision Required**: Delete or integrate orphaned models?

### Track C: Docker Infrastructure (35 minutes remaining)
- Standardize networks to `vedfinance-network`
- Fix Grafana port conflict (3001 → 3002)
- Add health checks

### Track D: Code Quality (40 hours)
- 482 `any` types → typed interfaces
- 115 console.logs → proper logger
- JSONB validation (65% gap)
- i18n completion (3 strings)

### Track E: Filesystem Cleanup (2 hours)
- Remove 99MB binaries from git
- Reorganize 82 root markdown files
- Consolidate temp_* directories

---

## Execution DAG

```
┌──────────────────────────────────────────┐
│      P0: Merge Conflicts (50 min)       │
│  ├── package.json (root)                │
│  ├── apps/web/package.json              │
│  ├── dashboard/page.tsx                 │
│  └── docker-compose.monitoring.yml      │
└──────────────┬───────────────────────────┘
               ▼
┌──────────────────────────────────────────┐
│  CHECKPOINT: pnpm install && pnpm build  │
└──────────────┬───────────────────────────┘
               │
      ┌────────┴────────┬────────────┐
      ▼                 ▼            ▼
┌──────────┐      ┌──────────┐  ┌──────────┐
│ Track A  │      │ Track E2 │  │  DEFER   │
│TypeScript│      │ SSH Key  │  │ B, C, D  │
│ Versions │      │ Security │  │          │
└────┬─────┘      └────┬─────┘  └──────────┘
     │                 │
     └─────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│    DEPLOYMENT GATE: Resume VPS Deploy    │
└──────────────────────────────────────────┘
```

---

## Beads Task Breakdown

| Bead ID | Title | Track | Priority | Estimate |
|---------|-------|-------|----------|----------|
| VED-P0A | Resolve root package.json merge conflict | P0 | Critical | 15m |
| VED-P0B | Resolve apps/web package.json merge | P0 | Critical | 15m |
| VED-P0C | Fix dashboard/page.tsx merge conflict | P0 | Critical | 10m |
| VED-P0D | Fix docker-compose.monitoring duplicates | P0 | Critical | 10m |
| VED-A1 | Standardize TypeScript versions | A | High | 30m |
| VED-A2 | Standardize @types/node versions | A | High | 15m |
| VED-A3 | Remove Next.js from API package | A | High | 15m |
| VED-E2 | Move SSH private key (security) | E | Critical | 10m |

---

## Recommended Execution Order

### Immediate (Now)
1. P0A: Root package.json merge
2. P0B: apps/web package.json merge
3. P0C: Dashboard page merge
4. P0D: Docker compose duplicates
5. **CHECKPOINT**: `pnpm install && pnpm build`

### Short-term (Next 1 hour)
6. A1-A3: Build chain standardization
7. E2: SSH key security fix
8. **GATE**: Resume VPS deployment

### Long-term (Post-deployment)
9. Track B: Schema drift resolution
10. Track C: Docker network standardization
11. Track D: Code quality improvements
12. Track E: Filesystem cleanup

---

## Success Criteria

### Deployment Resume Gate
- [ ] All P0 merge conflicts resolved
- [ ] `pnpm install` completes without errors
- [ ] `pnpm build` succeeds for web + api
- [ ] TypeScript versions standardized
- [ ] SSH key moved out of repository
- [ ] No critical security issues remain

### Full Audit Complete
- [ ] All 4 audit reports reviewed
- [ ] Oracle synthesis approved
- [ ] Beads created for all P0 tasks
- [ ] Deployment blockers documented
- [ ] Deferred items logged with estimates

---

## Notes

- **Schema Drift**: SocialPost/BuddyGroup not on VPS is acceptable per user context
- **JSONB Validation**: 65% gap is runtime safety issue, not build blocker
- **Type Safety**: 482 `any` types compile fine, refactor iteratively
- **File Cleanup**: 99MB binaries bloat repo but don't block deployment

**Total Time**: 2.5 hours critical path → Resume deployment  
**Deferred**: 47 hours → Post-deployment cleanup sprint
