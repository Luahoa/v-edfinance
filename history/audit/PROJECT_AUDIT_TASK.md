# Project Audit & Technical Debt Cleanup - Task Definition

## 🚨 Context

**Trigger:** VED-4R86 (Prisma Migration) encountered multiple blockers during VPS deployment:
- Missing dependencies (pgvector)
- Schema drift between local and VPS
- Migration files referencing non-existent tables
- PostgreSQL constraint violations (NOW() in index predicates)

**Root Cause:** Accumulated technical debt from rapid development without systematic cleanup and validation.

**Decision:** PAUSE deployment track to conduct comprehensive project audit and debt repayment.

---

## 📋 Audit Scope

### 1. **Schema & Database Integrity**
- [ ] Verify schema.prisma matches all migration files
- [ ] Document intentional schema subsets (dev vs production)
- [ ] Validate all JSONB structures against SchemaRegistry
- [ ] Check for orphaned migrations or conflicting states

### 2. **Dependency & Environment Drift**
- [ ] Audit package.json vs actual usage (unused deps)
- [ ] Verify Docker images have required dependencies
- [ ] Check .env files for missing/outdated variables
- [ ] Validate VPS environment matches local requirements

### 3. **Code Quality & Type Safety**
- [ ] Run full TypeScript typecheck (api + web)
- [ ] Identify any `any` types or type suppressions
- [ ] Check for dead code / unused imports
- [ ] Validate all service method signatures exist

### 4. **Build & Test Infrastructure**
- [ ] Verify all build commands work (api, web, packages)
- [ ] Check test coverage and identify missing tests
- [ ] Validate CI/CD pipeline configurations
- [ ] Audit monitoring setup (Grafana, Prometheus)

### 5. **Documentation Debt**
- [ ] Update AGENTS.md with recent learnings
- [ ] Document VPS deployment decisions
- [ ] Create migration validation runbook
- [ ] Update architecture diagrams if needed

### 6. **File System Cleanup**
- [ ] Remove temporary files (temp_*, echo/, etc.)
- [ ] Archive completed spike experiments
- [ ] Consolidate duplicate documentation
- [ ] Clean up outdated scripts

---

## 🎯 Success Criteria

- [ ] Zero TypeScript errors in api + web
- [ ] All builds pass without warnings
- [ ] Database schema documented and validated
- [ ] VPS deployment runbook complete
- [ ] Technical debt register updated
- [ ] Cleanup commit synced to GitHub

---

## 📊 Estimated Impact

| Category | Files Affected | Risk | Time Estimate |
|----------|----------------|------|---------------|
| Schema | 10-15 | HIGH | 2-3 hours |
| Dependencies | 5-10 | MEDIUM | 1 hour |
| Type Safety | 50+ | MEDIUM | 3-4 hours |
| Build/Test | 10-20 | LOW | 1-2 hours |
| Documentation | 5-10 | LOW | 1 hour |
| File Cleanup | 20-30 | LOW | 30 min |

**Total:** 8-11 hours (1.5 days with breaks)

---

## 🚀 Next Steps

1. Create Epic bead: `bd create "Project Audit & Technical Debt Cleanup" -t epic -p 0`
2. Use Planning Skill to decompose into tracks
3. Use Orchestrator Skill to spawn parallel audit agents
4. Execute cleanup with Beads Trinity protocol

---

## 📝 Related Documents

- [MIGRATION_FIX_PLAN.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/history/vps-deployment/MIGRATION_FIX_PLAN.md) - Lessons from migration issues
- [AGENTS.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/AGENTS.md) - Anti-Hallucination Protocol
- [SPEC.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/SPEC.md) - Quality standards

---

**Priority:** P0 (Blocking deployment continuation)  
**Type:** Epic  
**Status:** TODO  
**Created:** 2026-01-05
