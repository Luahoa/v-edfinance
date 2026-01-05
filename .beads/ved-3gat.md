# Epic: Project Audit & Technical Debt Cleanup

## Description

Comprehensive project audit to pay down technical debt accumulated during rapid development. 

**Triggered by:** Multiple deployment blockers in VED-4R86 (Prisma migration issues, schema drift, missing dependencies).

**Impact:** Blocking Track 4 deployment (VED-43OQ, VED-949O, VED-T298) until technical debt is resolved.

## Scope

### 1. Schema & Database Integrity
- Verify schema.prisma matches all migration files
- Document intentional schema subsets (dev vs production)
- Validate all JSONB structures against SchemaRegistry
- Check for orphaned migrations or conflicting states

### 2. Dependency & Environment Drift
- Audit package.json vs actual usage (unused deps)
- Verify Docker images have required dependencies
- Check .env files for missing/outdated variables
- Validate VPS environment matches local requirements

### 3. Code Quality & Type Safety
- Run full TypeScript typecheck (api + web)
- Identify any `any` types or type suppressions
- Check for dead code / unused imports
- Validate all service method signatures exist

### 4. Build & Test Infrastructure
- Verify all build commands work (api, web, packages)
- Check test coverage and identify missing tests
- Validate CI/CD pipeline configurations
- Audit monitoring setup (Grafana, Prometheus)

### 5. Documentation Debt
- Update AGENTS.md with recent learnings
- Document VPS deployment decisions
- Create migration validation runbook
- Update architecture diagrams if needed

### 6. File System Cleanup
- Remove temporary files (temp_*, echo/, etc.)
- Archive completed spike experiments
- Consolidate duplicate documentation
- Clean up outdated scripts

## Success Criteria

- [ ] Zero TypeScript errors in api + web
- [ ] All builds pass without warnings
- [ ] Database schema documented and validated
- [ ] VPS deployment runbook complete
- [ ] Technical debt register updated
- [ ] Cleanup commit synced to GitHub

## Estimated Time

8-11 hours (1.5 days with breaks)

## Related Documents

- [PROJECT_AUDIT_TASK.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/history/audit/PROJECT_AUDIT_TASK.md)
- [MIGRATION_FIX_PLAN.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/history/vps-deployment/MIGRATION_FIX_PLAN.md)
- [AGENTS.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/AGENTS.md)

## Next Steps

1. Use Planning Skill to decompose into tracks
2. Use Orchestrator Skill to spawn parallel audit agents
3. Execute with Beads Trinity protocol
