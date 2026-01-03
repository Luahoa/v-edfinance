# 🔍 Project Audit Report - 2025-12-22

## Executive Summary

| Component | Status | Time | Notes |
|-----------|--------|------|-------|
| API Build | ✅ PASS | <1s | NestJS build successful |
| Web Build | ❌ FAIL | ~20s | Next.js 16.1.0 prerender bug |
| Prisma Generate | ✅ PASS | <1s | Client generated successfully |
| Test Suite | ❌ FAIL | >69s | Exceeded 30s threshold |
| Beads Health | ✅ PASS | <1s | 30 passed, 2 warnings |

---

## 🔴 Critical Issues

### 1. Web Build Failure - Next.js 16.1.0 Bug

**Error:**
```
Error [InvariantError]: Invariant: Expected workUnitAsyncStorage to have a store.
This is a bug in Next.js.
```

**Affected Pages:**
- `/vi/login`
- `/vi/simulation/life`

**Root Cause:**
Next.js 16.1.0 có bug khi prerender client components sử dụng `useTranslations` từ `next-intl`. Đây là [known issue](https://github.com/vercel/next.js/issues) với Next.js 16.

**Recommended Fix:**
```bash
# Option 1: Downgrade to Next.js 15.x (stable)
pnpm --filter web add next@15.3.2

# Option 2: Add dynamic export to affected pages
# Add to each affected page:
export const dynamic = 'force-dynamic';
```

---

### 2. Test Suite Timeout (>30s)

**Observation:**
- Test suite ran for **69+ seconds** before being stopped
- Many tests passed, but overall suite is too slow
- E2E tests are skipped (require PostgreSQL)

**Test Categories:**
| Category | Count | Status |
|----------|-------|--------|
| Unit Tests | ~100+ | ✅ Running |
| Integration Tests | ~20 | ⏭️ Skipped (no DB) |
| E2E Tests | ~10 | ⏭️ Skipped (no DB) |

**Recommended Actions:**

1. **Separate test scripts:**
```json
{
  "test:unit": "vitest run --testPathPattern='.*\\.spec\\.ts$' --exclude='**/e2e/**' --exclude='**/integration/**'",
  "test:integration": "vitest run --testPathPattern='.*integration.*'",
  "test:e2e": "vitest run --config ./test/vitest-e2e.config.ts"
}
```

2. **Add timeout configuration:**
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    testTimeout: 10000, // 10s per test
    hookTimeout: 5000,  // 5s for hooks
  }
});
```

3. **Parallel test execution:**
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 2,
      }
    }
  }
});
```

---

## ⚠️ Warnings

### 1. Beads Warnings (Non-blocking)

| Warning | Impact | Action |
|---------|--------|--------|
| Claude Plugin not installed | Low | Optional - for enhanced Claude integration |
| Claude Integration not configured | Low | Optional |

### 2. Next.js Config Warnings

```
⚠ Invalid next.config.ts options detected:
    Unrecognized key(s) in object: 'turbo' at "experimental"
```

**Fix:** Remove deprecated `turbo` key from experimental config.

---

## 🗄️ Database Structure Audit

### Current Schema Status

```bash
# Prisma status
✅ Schema: apps/api/prisma/schema.prisma
✅ Client: Generated successfully (v5.22.0)
✅ Migrations: Up to date
```

### JSONB Fields (Risk Areas)

| Table | JSONB Field | Validation | Status |
|-------|-------------|------------|--------|
| User | preferences | Zod schema | ✅ |
| Course | content | Zod schema | ✅ |
| Achievement | metadata | Zod schema | ✅ |
| BehaviorLog | data | Zod schema | ✅ |

**Recommendation:** Continue using `ValidationService` for all JSONB writes.

---

## 📊 Performance Benchmarks

| Operation | Target | Actual | Status |
|-----------|--------|--------|--------|
| API Build | <30s | <1s | ✅ PASS |
| Web Build | <30s | FAIL | ❌ FAIL |
| Prisma Generate | <30s | <1s | ✅ PASS |
| Unit Tests (all) | <30s | >69s | ❌ FAIL |
| Single Unit Test | <1s | ~0.1s | ✅ PASS |

---

## 🛠️ Action Plan

### Immediate (P0)

1. **Fix Web Build:**
   ```bash
   # Downgrade Next.js
   cd apps/web
   pnpm add next@15.3.2
   pnpm build
   ```

2. **Split Test Scripts:**
   - Add `test:unit` for fast feedback (<30s)
   - Keep `test:integration` and `test:e2e` separate

### Short-term (P1)

3. **Optimize Test Suite:**
   - Add timeouts
   - Enable parallel execution
   - Mock heavy dependencies

4. **Clean Next.js Config:**
   - Remove deprecated `turbo` experimental key
   - Clean up lockfile warnings

### Medium-term (P2)

5. **Database Performance:**
   - Add indexes for frequently queried JSONB paths
   - Implement query caching for hot paths

6. **CI/CD Optimization:**
   - Separate build and test stages
   - Add caching for node_modules and .next

---

## ✅ Healthy Components

- ✅ NestJS API Build
- ✅ Prisma Schema & Client
- ✅ Beads Issue Tracking
- ✅ Git Integration
- ✅ Sync-branch configured

---

## 📝 Next Steps

1. Create beads issue for Web Build fix
2. Create beads issue for Test Suite optimization
3. Execute fixes in priority order
4. Re-run audit to verify

---

*Generated: 2025-12-22 02:53 UTC+7*
*Audit Version: 1.0*
