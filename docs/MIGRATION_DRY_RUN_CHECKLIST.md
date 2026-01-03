# Migration Dry-Run Checklist

**Date:** 2026-01-03  
**Target:** VPS Staging Database (103.54.153.248)  
**Epic:** ved-e1js (MVP Launch - Track 2 Support)

## Pre-Migration Checks

### 1. Environment Verification
- [ ] SSH access to VPS confirmed: `ssh root@103.54.153.248`
- [ ] Database credentials verified in staging `.env`
- [ ] Current schema version documented
- [ ] Backup storage space available (>500MB)

### 2. Migration Status Audit
```bash
# SSH to staging
ssh root@103.54.153.248

# Navigate to API
cd /var/www/v-edfinance/apps/api

# Check current migration status
npx prisma migrate status

# List pending migrations
ls prisma/migrations/
```

**Expected Output:**
- Current migration: `_____` (record this)
- Pending migrations: `_____` (list all)
- Database schema version: `_____`

## Backup Procedure

### 3. Full Database Backup
```bash
# Create timestamped backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
pg_dump -U v_edfinance_user v_edfinance > /tmp/backup-pre-migration-${TIMESTAMP}.sql

# Verify backup integrity
ls -lh /tmp/backup-pre-migration-${TIMESTAMP}.sql

# Record backup size
du -h /tmp/backup-pre-migration-${TIMESTAMP}.sql
```

**Backup Details:**
- File: `_____`
- Size: `_____`
- Checksum: `sha256sum /tmp/backup-pre-migration-*.sql`

### 4. Schema Diff Preview
```bash
# View migration diff (Prisma 5.x+)
npx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-migrations ./prisma/migrations \
  --script

# Or manually review migration SQL
cat prisma/migrations/<LATEST_MIGRATION>/migration.sql
```

**Review Checklist:**
- [ ] No destructive operations (DROP TABLE, DROP COLUMN)
- [ ] All ALTER TABLE operations have safe defaults
- [ ] Foreign key constraints preserve data integrity
- [ ] Index creation won't lock tables excessively

## Dry-Run Execution

### 5. Apply Migrations (Staging Only)
```bash
# Ensure in API directory
cd /var/www/v-edfinance/apps/api

# Apply pending migrations
npx prisma migrate deploy

# Verify migration success
npx prisma migrate status
```

**Migration Results:**
- Migrations applied: `_____`
- Time elapsed: `_____`
- Warnings/Errors: `_____`

### 6. Data Integrity Verification
```bash
# Start Prisma Studio (browser-based DB viewer)
npx prisma studio --port 5555

# Or manual SQL checks
psql -U v_edfinance_user v_edfinance -c "
  SELECT tablename, n_tup_ins, n_tup_upd, n_tup_del 
  FROM pg_stat_user_tables 
  ORDER BY n_tup_ins DESC 
  LIMIT 10;
"
```

**Verification Checklist:**
- [ ] All existing records intact (count unchanged)
- [ ] New columns have expected defaults
- [ ] No orphaned foreign keys
- [ ] Indexes created successfully

### 7. CRUD Smoke Tests
```bash
# Run API smoke tests against staging
cd /var/www/v-edfinance
pnpm --filter api test:e2e -- --grep "smoke"

# Or manual curl tests
curl http://103.54.153.248:3001/api/health
curl http://103.54.153.248:3001/api/users/me \
  -H "Authorization: Bearer <STAGING_TOKEN>"
```

**Test Results:**
- Health check: `_____`
- User CRUD: `_____`
- Course CRUD: `_____`
- Auth flow: `_____`

## Rollback Procedure (If Issues Found)

### 8. Emergency Rollback
```bash
# ONLY IF CRITICAL ISSUES DETECTED

# 1. Drop current database
dropdb v_edfinance

# 2. Recreate database
createdb v_edfinance

# 3. Restore from backup
psql v_edfinance < /tmp/backup-pre-migration-<TIMESTAMP>.sql

# 4. Verify restoration
psql v_edfinance -c "SELECT COUNT(*) FROM \"User\";"

# 5. Restart API
pm2 restart all
```

**Rollback Verification:**
- [ ] Database restored successfully
- [ ] API health check passes
- [ ] User count matches pre-migration
- [ ] Auth flow functional

## Post-Migration Tasks

### 9. Performance Verification
```bash
# Check query performance (pg_stat_statements required)
psql v_edfinance -c "
  SELECT query, calls, mean_exec_time, stddev_exec_time
  FROM pg_stat_statements
  ORDER BY mean_exec_time DESC
  LIMIT 10;
"

# Monitor memory/CPU
htop
```

**Performance Metrics:**
- Query latency (p95): `_____`
- Memory usage: `_____`
- CPU usage: `_____`

### 10. Documentation Update
```bash
# Record migration in docs
echo "Migration applied: $(date)" >> docs/MIGRATION_HISTORY.md
echo "Status: SUCCESS | ROLLBACK" >> docs/MIGRATION_HISTORY.md
echo "Issues: (if any)" >> docs/MIGRATION_HISTORY.md
```

## Decision Matrix

| Criteria | GO Production | ROLLBACK & Fix |
|----------|---------------|----------------|
| All migrations applied | ✅ | ❌ |
| No data loss | ✅ | ❌ |
| CRUD tests pass | ✅ | ❌ |
| Query latency <500ms | ✅ | ❌ |
| No P0 bugs detected | ✅ | ❌ |

**Final Decision:** `_____` (GO / NO-GO)

## Sign-Off

- **Executed by:** GreenCastle Agent
- **Reviewed by:** (human operator)
- **Date:** 2026-01-03
- **Next Step:** Create production deployment checklist (ved-<next>)

---

## Notes & Lessons Learned

(Add findings here after dry-run completes)

- 
- 
- 
