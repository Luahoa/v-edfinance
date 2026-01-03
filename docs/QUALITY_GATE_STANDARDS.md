# 📜 Quality Gate Standards - V-EdFinance

**Epic:** ved-xt3 - Phase 1: Quality Gate & Zero-Debt Engineering  
**Version:** 1.0  
**Date:** 2026-01-03  
**Status:** 🟢 ENFORCED

---

## Mission Statement

> **"Zero technical debt, zero surprises. Every commit must pass the quality gate before merge."**

This document defines **mandatory quality standards** for the V-EdFinance project. All code changes must pass these gates before being considered production-ready.

---

## Quality Gates Overview

| Gate | Focus | Enforcement | Blocker |
|------|-------|-------------|---------|
| **Gate 1** | TypeScript Build | CI/CD + Pre-commit | ✅ YES |
| **Gate 2** | Schema Sync | CI/CD | ✅ YES |
| **Gate 3** | Test Coverage | CI/CD | ✅ YES |
| **Gate 4** | Lint & Code Quality | CI/CD + Pre-commit | ⚠️ WARNING |
| **Gate 5** | Performance | Weekly Review | ⚠️ WARNING |
| **Gate 6** | Security | CI/CD + Manual | ✅ YES |

**Legend:**
- ✅ **Blocker:** Prevents merge/deployment
- ⚠️ **Warning:** Flags for review, doesn't block

---

## Gate 1: TypeScript Build & Type Safety

### Standards

| Metric | Target | Current | Enforcement |
|--------|--------|---------|-------------|
| **Build Errors** | 0 | 0 | ✅ Blocking |
| **Build Warnings** | 0 | 0 | ⚠️ Warning |
| **TypeScript Strict Mode** | Enabled | ✅ Enabled | ✅ Blocking |
| **`any` Types (Core)** | 0 | 0 | ✅ Blocking |
| **`any` Types (Tests)** | Allowed | N/A | ⏭️ Skip |
| **`@ts-ignore` Comments** | 0 (core) | 0 | ⚠️ Warning |

### Validation

```bash
# Manual check
pnpm --filter api build
pnpm --filter web build

# Automated (quality-gate.sh)
./scripts/quality-gate.sh
```

### Exceptions

- **Test Files:** `*.spec.ts` allowed to use `any` for mocking
- **Third-party Types:** If library has poor types, create wrapper with proper types
- **Migration Code:** Temporary `any` allowed with `// TODO: Type this` + issue ID

### Remediation

**If build fails:**
1. Read error message for file + line number
2. Fix type error (never use `as any` to bypass)
3. If stuck, create typed interface or use `unknown` + type guard
4. Re-run build until 0 errors

---

## Gate 2: Schema Synchronization

### Standards

| Metric | Target | Current | Enforcement |
|--------|--------|---------|-------------|
| **Prisma/Drizzle Parity** | 100% | 100% | ✅ Blocking |
| **Migration Status** | Up-to-date | ✅ Up-to-date | ✅ Blocking |
| **Schema Drift** | 0 warnings | 0 | ✅ Blocking |

### Validation

```bash
# Check Prisma schema
cd apps/api
npx prisma migrate status

# Check Drizzle sync
npx drizzle-kit check:pg

# Expected output: "No schema drift detected"
```

### Protocol

**When modifying database schema:**

1. **Edit Prisma schema ONLY** (source of truth)
   ```bash
   # Edit: apps/api/prisma/schema.prisma
   ```

2. **Create migration**
   ```bash
   cd apps/api
   npx prisma migrate dev --name descriptive_name
   ```

3. **Generate Prisma types**
   ```bash
   npx prisma generate
   ```

4. **Sync Drizzle schema**
   ```bash
   npx drizzle-kit generate:pg
   ```

5. **Verify parity**
   ```bash
   npx drizzle-kit check:pg  # Must pass!
   ```

6. **Commit changes** (include both Prisma + Drizzle files)

### Exceptions

- **Never** edit Drizzle schema directly
- **Never** run `drizzle-kit push` (Prisma owns migrations)
- **Never** modify `node_modules/.prisma` files

---

## Gate 3: Test Coverage

### Standards

| Metric | Target | Current | Enforcement |
|--------|--------|---------|-------------|
| **Lines Coverage** | ≥80% | 99%+ | ✅ Blocking |
| **Branches Coverage** | ≥75% | 95%+ | ⚠️ Warning |
| **Functions Coverage** | ≥80% | 98%+ | ⚠️ Warning |
| **Statements Coverage** | ≥80% | 99%+ | ✅ Blocking |

### Validation

```bash
# Run with coverage report
pnpm test -- --coverage --run

# View HTML report
open coverage/index.html
```

### Requirements by Module

| Module Type | Min Coverage | Exceptions |
|-------------|--------------|------------|
| **Core Services** | 90% | Config/setup files |
| **Controllers** | 85% | Health check endpoints |
| **Utilities** | 95% | None |
| **Guards/Middleware** | 100% | None (critical security) |
| **Tests** | N/A | Self-documenting |

### Test Pyramid

```
    /\
   /E2\     10% - End-to-End (Playwright)
  /────\
 / INT \    30% - Integration (Vitest + Prisma mock)
/──────\
| UNIT |    60% - Unit (Vitest + Mock all deps)
└──────┘
```

### Exceptions

- **UI Components:** Visual testing deferred to Phase 2
- **Config Files:** `*.config.ts` exempt from coverage
- **Type Definitions:** `*.d.ts` files exempt

---

## Gate 4: Lint & Code Quality

### Standards

| Metric | Target | Current | Enforcement |
|--------|--------|---------|-------------|
| **ESLint Errors** | 0 | 0 | ✅ Blocking |
| **ESLint Warnings** | \<10 | ~5 | ⚠️ Warning |
| **Prettier Format** | 100% | 100% | ✅ Blocking (pre-commit) |
| **Unused Imports** | 0 | 0 | ⚠️ Warning |
| **Unused Variables** | 0 | 0 | ⚠️ Warning |
| **Console Logs** | 0 (production) | 0 | ⚠️ Warning |

### Validation

```bash
# Lint API
pnpm --filter api lint

# Lint Web
pnpm --filter web lint

# Auto-fix issues
pnpm --filter api lint --fix
pnpm --filter web lint --fix
```

### ESLint Rules (Enforced)

```jsonc
{
  // TypeScript
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/explicit-function-return-type": "warn",
  
  // Code Quality
  "no-console": "warn",
  "no-debugger": "error",
  "no-unused-vars": "warn",
  
  // Security
  "no-eval": "error",
  "no-implied-eval": "error"
}
```

### Exceptions

- **Test Files:** `console.log` allowed in `.spec.ts`
- **Debug Module:** `apps/api/src/modules/debug/` exempt from no-console
- **Scripts:** `scripts/` folder exempt (but encouraged to follow)

---

## Gate 5: Performance Benchmarks

### Standards

| Metric | Baseline | Target | Current | Enforcement |
|--------|----------|--------|---------|-------------|
| **BehaviorLog Reads** | 120ms (Prisma) | \<84ms | \<50ms (Drizzle) | ⚠️ Weekly Review |
| **Analytics Queries** | 15min (Prisma) | \<2min | ~2min (Kysely) | ⚠️ Weekly Review |
| **API Response Time (p95)** | 500ms | \<200ms | ~150ms | ⚠️ Weekly Review |
| **Build Time** | 120s | \<90s | ~60s | ⏭️ Nice-to-have |

### Validation

```bash
# Run performance benchmarks
pnpm --filter api test:performance

# Check p95 latency (Prometheus)
curl http://localhost:9090/metrics | grep http_request_duration_p95
```

### ORM Performance Targets

| Operation | Prisma (Baseline) | Drizzle (Target) | Kysely (Analytics) |
|-----------|-------------------|------------------|-------------------|
| **Single Read** | 10ms | \<5ms (50% faster) | N/A |
| **Batch Read** | 120ms | \<40ms (65% faster) | \<15ms (87% faster) |
| **Complex Join** | 200ms | N/A | \<60ms (70% faster) |
| **Analytics Scan** | 15min | N/A | \<2min (87% faster) |

### Remediation

**If performance degrades:**
1. Check slow query log (pg_stat_statements)
2. Review missing indexes
3. Consider Drizzle migration for hot paths
4. Profile with Kysely for analytics

---

## Gate 6: Security Hardening

### Standards

| Check | Requirement | Enforcement |
|-------|-------------|-------------|
| **No Hardcoded Secrets** | 0 API keys in code | ✅ Blocking |
| **SQL Injection Prevention** | \<5 raw SQL queries | ⚠️ Warning |
| **XSS Protection** | All inputs sanitized | ⚠️ Manual Review |
| **CORS Configuration** | Whitelist only | ✅ Blocking |
| **Rate Limiting** | Enabled (@nestjs/throttler) | ✅ Blocking |
| **JWT Validation** | Strict mode | ✅ Blocking |

### Validation

```bash
# Check for exposed secrets
grep -r "sk-" apps/api/src --include="*.ts"
grep -r "API_KEY" apps/api/src --include="*.ts"

# Check raw SQL usage
grep -r "prisma.\$executeRaw\|prisma.\$queryRaw" apps/api/src

# Verify rate limiting
curl -I http://localhost:3001/api/health
# Should see: X-RateLimit-Limit, X-RateLimit-Remaining
```

### Secrets Management

**✅ Allowed:**
```typescript
// Load from .env
const apiKey = process.env.GOOGLE_API_KEY;
```

**❌ Forbidden:**
```typescript
// Hardcoded secrets
const apiKey = "sk-1234567890abcdef";  // ❌ NEVER!
```

### SQL Injection Prevention

**✅ Safe (Prisma ORM):**
```typescript
await prisma.user.findMany({
  where: { email: userInput }  // Parameterized ✅
});
```

**⚠️ Requires Review:**
```typescript
await prisma.$executeRaw`
  SELECT * FROM users WHERE email = ${userInput}
`;  // Raw SQL - requires security review
```

**❌ Dangerous:**
```typescript
await prisma.$executeRawUnsafe(
  `SELECT * FROM users WHERE email = '${userInput}'`
);  // ❌ SQL injection risk!
```

---

## Automation & CI/CD Integration

### Pre-commit Hook (Husky)

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Format check
pnpm format:check || exit 1

# Quick lint
pnpm --filter api lint || exit 1
pnpm --filter web lint || exit 1

# TypeScript check (fast)
pnpm --filter api build --noEmit || exit 1
pnpm --filter web build --noEmit || exit 1

echo "✅ Pre-commit checks passed"
```

### GitHub Actions Workflow

```yaml
# .github/workflows/quality-gate.yml
name: Quality Gate
on: [push, pull_request]

jobs:
  quality-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run Quality Gate
        run: ./scripts/quality-gate.sh
      
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

### Daily Cron Job (Production)

```bash
# Daily quality check at 2 AM
0 2 * * * cd /app && ./scripts/quality-gate.sh && echo "$(date): Quality gate passed" >> /var/log/quality-gate.log
```

---

## Remediation Playbook

### Scenario 1: Build Fails

**Error:** `TypeScript error TS2339: Property 'foo' does not exist`

**Fix:**
1. Read error location: `file.ts:42:10`
2. Check if property exists in type definition
3. If missing, add to interface/type
4. If intentional, use type assertion `(obj as HasFoo).foo`
5. Never use `any` to bypass

### Scenario 2: Test Coverage Below Threshold

**Error:** `Coverage for branches (72%) does not meet threshold (75%)`

**Fix:**
1. Run `pnpm test -- --coverage` to see uncovered lines
2. Add test cases for missing branches
3. Focus on `if/else`, `switch`, ternary operators
4. Aim for edge cases (null, empty array, etc.)

### Scenario 3: Schema Drift Detected

**Error:** `drizzle-kit check:pg failed - schema drift detected`

**Fix:**
1. Check which fields are out of sync
2. Run `npx drizzle-kit generate:pg` to re-sync
3. Review generated migration file
4. Commit both Prisma + Drizzle changes together

### Scenario 4: Performance Regression

**Alert:** `BehaviorLog reads now 150ms (was 50ms)`

**Fix:**
1. Check `pg_stat_statements` for slow queries
2. Review recent code changes (git diff)
3. Verify indexes exist (check migration files)
4. Consider adding composite index
5. Profile with `EXPLAIN ANALYZE` in PostgreSQL

---

## Maintenance & Evolution

### Weekly Review

- Review quality gate metrics (pass/fail trends)
- Adjust thresholds if consistently passing/failing
- Update standards based on production learnings

### Monthly Audit

- Review exceptions granted (should decrease over time)
- Update automation scripts for new checks
- Benchmark performance baselines

### Quarterly Retrospective

- Evaluate ROI of quality gates (bugs prevented vs. effort)
- Propose new gates based on production incidents
- Retire gates that provide minimal value

---

## Success Metrics

### Leading Indicators

- **Pre-merge Quality:** 100% of PRs pass quality gate before review
- **First-time Pass Rate:** ≥95% of commits pass on first try
- **Fix Time:** \<15 minutes to resolve quality gate failures

### Lagging Indicators

- **Production Bugs:** ↓ 70% (prevented by type safety + tests)
- **Incident Response Time:** ↓ 50% (better code quality)
- **Developer Confidence:** ↑ 90% (comprehensive checks)

---

## Appendix: Tool Versions

| Tool | Version | Purpose |
|------|---------|---------|
| **TypeScript** | 5.3.3 | Type checking |
| **ESLint** | 8.56.0 | Linting |
| **Prettier** | 3.1.1 | Formatting |
| **Vitest** | 1.2.0 | Testing |
| **Prisma** | 5.0.0 | Schema migrations |
| **Drizzle** | 0.45.1 | Fast CRUD |
| **Kysely** | 0.27.0 | Analytics |

---

**Status:** 🟢 ENFORCED  
**Last Updated:** 2026-01-03  
**Next Review:** 2026-01-10 (Weekly)
