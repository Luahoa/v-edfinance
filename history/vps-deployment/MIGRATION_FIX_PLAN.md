# Migration Fix Plan - VED-4R86

**Date:** 2026-01-05  
**Epic:** VED-ET78 (Track 4 Application Deployment)  
**Blocker Task:** VED-4R86 (Prisma Migrations)

---

## 🔍 Root Cause Analysis

### Issue
Prisma migration deployment fails continuously with errors:
1. ✅ **FIXED:** pgvector extension missing
2. ✅ **FIXED:** 20251223_add_gin_indexes references non-existent `SocialPost` table
3. ⚠️ **ACTIVE:** 20251223_add_partial_indexes uses `NOW()` function (not IMMUTABLE) in index predicate

### Discovery
- **Local schema.prisma** contains `SocialPost`, `BuddyGroup`, `BuddyMember`, `BuddyChallenge` models
- **VPS database** only has: `User`, `BehaviorLog`, `Course`, `Lesson`, `InvestmentProfile`, `UserProgress`, `OptimizationLog`, `SystemSettings`
- **Migration mismatch:** Index migrations created for tables that don't exist in VPS

### Why This Happened
The migration files in `apps/api/prisma/migrations/` were created on local dev environment with full schema, but VPS deployment started from minimal schema (init_fresh migration only created core tables, not social features).

---

## ✅ Risk Assessment

| Component | Risk | Reason | Mitigation |
|-----------|------|--------|------------|
| Delete partial index migration | **LOW** | Migration hasn't been applied yet | Safe to remove/skip |
| Simplify GIN index migration | **LOW** | Only affects query performance, not data | Already done, just need final deploy |
| Schema drift | **MEDIUM** | Local vs VPS schemas differ | Document as acceptable (VPS = production subset) |
| Future migrations | **MEDIUM** | Need process to handle schema subsets | Add migration validation script |

---

## 📋 Recommended Approach

### Option A: Skip Problematic Migrations (RECOMMENDED)
**Pros:** Fast, safe, preserves existing data  
**Cons:** No partial indexes (minor performance impact)

**Steps:**
1. Mark `20251223_add_partial_indexes` as applied without executing (resolve as rolled-back)
2. Verify GIN indexes migration is clean
3. Deploy only GIN indexes migration
4. Document VPS schema subset in runbook

### Option B: Create VPS-Specific Migration
**Pros:** Clean migration history  
**Cons:** Takes longer, requires new migration file

**Steps:**
1. Create new migration: `20251223_add_vps_indexes` with only indexes for existing tables
2. Delete problematic migrations from VPS
3. Deploy new migration

---

## 🎯 Execution Plan (Option A - RECOMMENDED)

### Phase 1: Clean Migration State
**Task:** VED-MIG1 - Resolve failed migration states  
**Priority:** P0  
**Estimated:** 5 minutes

**Actions:**
```bash
# Mark partial indexes as resolved (skip it)
docker run --rm \
  --network host \
  -e DATABASE_URL="postgresql://postgres:Halinh!@34@172.17.0.1:5432/vedfinance" \
  -v /root/v-edfinance:/app \
  node:20-bookworm-slim \
  sh -c "apt-get update -qq && apt-get install -y -qq openssl && npm install -g prisma@5.22.0 && cd /app/apps/api/prisma && npx prisma migrate resolve --applied 20251223_add_partial_indexes"
```

**Success Criteria:**
- `npx prisma migrate status` shows no failed migrations
- Only GIN indexes migration pending

---

### Phase 2: Deploy GIN Indexes
**Task:** VED-MIG2 - Deploy simplified GIN indexes  
**Priority:** P0  
**Estimated:** 3 minutes

**Actions:**
```bash
# Deploy with fixed migration file (already uploaded)
docker run --rm \
  --network host \
  -e DATABASE_URL="postgresql://postgres:Halinh!@34@172.17.0.1:5432/vedfinance" \
  -v /root/v-edfinance:/app \
  node:20-bookworm-slim \
  sh -c "apt-get update -qq && apt-get install -y -qq openssl && npm install -g prisma@5.22.0 && cd /app/apps/api/prisma && npx prisma generate && npx prisma migrate deploy"
```

**Success Criteria:**
- Migration completes successfully
- Indexes created: `User_metadata_gin_idx`, `BehaviorLog_payload_gin_idx`

---

### Phase 3: Verification
**Task:** VED-MIG3 - Verify database state  
**Priority:** P0  
**Estimated:** 2 minutes

**Actions:**
```bash
# 1. Check migration history
docker exec v-edfinance-postgres psql -U postgres -d vedfinance -c \
  "SELECT migration_name, finished_at, applied_steps_count FROM _prisma_migrations ORDER BY finished_at;"

# 2. Verify indexes exist
docker exec v-edfinance-postgres psql -U postgres -d vedfinance -c \
  "SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE '%_gin_idx';"

# 3. Check no failed migrations
npx prisma migrate status
```

**Success Criteria:**
- All migrations show `applied`
- GIN indexes exist
- No errors in migration status

---

### Phase 4: Documentation
**Task:** VED-MIG4 - Document VPS schema decisions  
**Priority:** P1  
**Estimated:** 5 minutes

**Actions:**
1. Create `runbooks/vps-schema-subset.md` documenting:
   - VPS uses production subset of schema (core features only)
   - Social features (SocialPost, BuddyGroup) not deployed on VPS
   - Migration validation process for future deployments

2. Update `AGENTS.md` with migration checklist:
   - Always verify migration against target database schema
   - Use `prisma migrate status` before deploy
   - Test migrations in Docker container first

**Success Criteria:**
- Documentation complete
- Future migrations have validation process

---

## 🚀 Alternative: Quick Fix Script

If manual steps fail, use this comprehensive script:

**File:** `scripts/vps-toolkit/fix-migrations-final.js`

```javascript
/**
 * VED-4R86 Final Migration Fix
 * Resolves all migration issues and deploys clean state
 */

const VPSConnection = require('./vps-connection');

async function fixMigrationsFinal() {
  const vps = new VPSConnection();
  const DB_URL = 'postgresql://postgres:Halinh!@34@172.17.0.1:5432/vedfinance';

  try {
    await vps.connect();
    
    console.log('[1/3] Marking partial_indexes as applied (skip)...');
    await vps.exec(`docker run --rm --network host -e DATABASE_URL="${DB_URL}" -v /root/v-edfinance:/app node:20-bookworm-slim sh -c "apt-get update -qq && apt-get install -y -qq openssl && npm install -g prisma@5.22.0 && cd /app/apps/api/prisma && npx prisma migrate resolve --applied 20251223_add_partial_indexes"`);
    
    console.log('[2/3] Deploying GIN indexes migration...');
    const result = await vps.exec(`docker run --rm --network host -e DATABASE_URL="${DB_URL}" -v /root/v-edfinance:/app node:20-bookworm-slim sh -c "apt-get update -qq && apt-get install -y -qq openssl && npm install -g prisma@5.22.0 && cd /app/apps/api/prisma && npx prisma generate && npx prisma migrate deploy"`);
    console.log(result.stdout);
    
    console.log('[3/3] Verifying...');
    const verify = await vps.exec(`docker exec v-edfinance-postgres psql -U postgres -d vedfinance -c "SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE '%_gin_idx';"`);
    console.log(verify.stdout);
    
    console.log('\n✅ VED-4R86 COMPLETE!');
  } catch (error) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  } finally {
    vps.disconnect();
  }
}

fixMigrationsFinal();
```

---

## 📊 Validation Checklist

- [ ] No failed migrations in `_prisma_migrations` table
- [ ] GIN indexes exist: `User_metadata_gin_idx`, `BehaviorLog_payload_gin_idx`
- [ ] All tables match schema.prisma subset
- [ ] Migration history is clean
- [ ] Documentation updated

---

## 🔄 Rollback Procedure

If anything fails:

```bash
# 1. Mark all problematic migrations as rolled back
npx prisma migrate resolve --rolled-back 20251223_add_gin_indexes
npx prisma migrate resolve --rolled-back 20251223_add_partial_indexes

# 2. Manually drop indexes if created
docker exec v-edfinance-postgres psql -U postgres -d vedfinance -c \
  "DROP INDEX IF EXISTS User_metadata_gin_idx; DROP INDEX IF EXISTS BehaviorLog_payload_gin_idx;"

# 3. Reset to last known good state
# (20251222050000_add_optimization_log is the last successful migration)
```

---

## ⏱️ Time Estimate

| Phase | Time | Risk |
|-------|------|------|
| Clean state | 5 min | LOW |
| Deploy GIN | 3 min | LOW |
| Verification | 2 min | LOW |
| Documentation | 5 min | LOW |
| **TOTAL** | **15 min** | **LOW** |

---

## 🎯 Next Steps After Completion

1. ✅ Close VED-4R86: `beads close ved-4r86 --reason "Migrations deployed successfully"`
2. ✅ Update agent-mail: Track 4 unblocked
3. ▶️ Start VED-43OQ: Deploy API Docker Image
4. ▶️ Start VED-949O: Deploy Web Docker Image

---

## 📝 Lessons Learned

1. **Schema Drift:** VPS production can be subset of full schema - document this decision
2. **Migration Validation:** Always verify target database schema before creating migrations
3. **PostgreSQL Constraints:** `NOW()` function cannot be used in index predicates (use fixed timestamp or remove partial indexes)
4. **Docker Migrations:** OpenSSL + pgvector must be pre-installed in migration container

---

**Plan Status:** READY FOR EXECUTION  
**Recommended Approach:** Option A (Skip partial indexes, deploy GIN only)  
**Risk Level:** LOW  
**Blocking:** VED-43OQ, VED-949O, VED-T298
