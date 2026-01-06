# 🔴 Schema Drift Risk - Audit & Fix Plan
**Date:** 2026-01-03 17:30  
**Priority:** P0 CRITICAL  
**Task:** ved-gdvp (Drizzle Schema Out of Sync)  
**Impact:** Runtime CRUD failures if not fixed

---

## 🎯 EXECUTIVE SUMMARY

### Current Risk: 🔴 HIGH
```
Issue:     Drizzle schema out of sync with Prisma
Impact:    Triple-ORM integrity broken
Timeline:  Last Prisma migration (VED-7I9) completed
           Drizzle schema NOT regenerated since then
Risk:      CRUD operations via Drizzle may fail at runtime
```

### Available Tools & Skills

Chúng ta có **4 database skills** mạnh mẽ để xử lý:

1. ✅ **prisma-drizzle-hybrid-agent** - Triple-ORM coordination
2. ✅ **postgresql-dba-pro** - Database health checks
3. ✅ **query-optimizer-ai** - Query analysis & optimization
4. ✅ **database-reliability-engineering** - Backup & disaster recovery

### Independent Libraries (Indie Tools)

Ngoài skills, chúng ta có các công cụ này trong project:

1. ✅ **Drizzle Kit** - Schema generation & migration
   - `drizzle-kit generate:pg` - Generate from Prisma
   - `drizzle-kit push` - Apply to database
   - `drizzle-kit introspect` - Reverse engineer from DB

2. ✅ **Prisma Migrate** - Source of truth migrations
   - `prisma migrate dev` - Create migrations
   - `prisma generate` - Generate types
   - `prisma db push` - Quick schema sync

3. ✅ **Kysely Codegen** - Type generation
   - `kysely-codegen` - Generate TypeScript types from DB

4. ✅ **pg_stat_statements** - PostgreSQL query monitoring
5. ✅ **Netdata + Grafana** - Real-time monitoring

---

## 🛠️ AUDIT & FIX WORKFLOW (30 Minutes)

### Phase 1: Schema Health Check (5 min)

**Tool:** `prisma-drizzle-hybrid-agent` skill

```bash
# Step 1: Check current Prisma schema
cd apps/api
cat prisma/schema.prisma | grep -A 5 "model User"

# Step 2: Check Drizzle schema
cat src/database/drizzle-schema.ts | grep -A 10 "export const users"

# Step 3: Compare field counts
# Prisma should have: password → passwordHash
# Drizzle should have: passwordHash (NOT password)
```

**Expected Issues:**
- ❌ Drizzle schema has `password` instead of `passwordHash`
- ❌ Missing fields: `preferredLocale`, `preferredLanguage`, `failedLoginAttempts`, `lockedUntil`
- ❌ Wrong default: `role` default should be `STUDENT` not `USER`

**Documentation:** [.agents/skills/prisma-drizzle-hybrid-agent.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/.agents/skills/prisma-drizzle-hybrid-agent.md) (lines 33-136)

---

### Phase 2: Database Integrity Verification (5 min)

**Tool:** `postgresql-dba-pro` skill

```bash
# Step 1: Verify actual DB schema matches Prisma
psql postgresql://postgres@103.54.153.248:5432/v_edfinance <<EOF
\d "User"
\d "BehaviorLog"
\d "SocialPost"
EOF

# Step 2: Check for orphaned columns
SELECT 
  table_name, 
  column_name 
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name IN ('User', 'BehaviorLog', 'SocialPost')
ORDER BY table_name, ordinal_position;

# Step 3: Verify indexes exist
SELECT 
  tablename, 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

**Expected Output:**
- ✅ DB should have `passwordHash` (Prisma migration already applied)
- ✅ All Prisma models should exist in DB
- ⚠️ Drizzle schema needs to sync with this reality

**Documentation:** [.agents/skills/postgresql-dba-pro.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/.agents/skills/postgresql-dba-pro.md) (lines 104-197)

---

### Phase 3: Schema Drift Detection (5 min)

**Tool:** Custom script using `prisma-drizzle-hybrid-agent` logic

```typescript
// scripts/audit-schema-drift.ts
import { PrismaClient } from '@prisma/client';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

async function detectSchemaDrift() {
  const prisma = new PrismaClient();
  
  // 1. Get Prisma models
  const prismaModels = await parsePrismaSchema('prisma/schema.prisma');
  
  // 2. Get actual DB schema
  const dbSchema = await prisma.$queryRaw`
    SELECT table_name, column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `;
  
  // 3. Parse Drizzle schema
  const drizzleSchema = await parseDrizzleSchema('src/database/drizzle-schema.ts');
  
  // 4. Compare all three
  const issues = [];
  
  for (const model of prismaModels) {
    const dbTable = dbSchema.filter(t => t.table_name === model.name);
    const drizzleTable = drizzleSchema[model.name];
    
    // Check Prisma vs DB
    for (const field of model.fields) {
      const dbCol = dbTable.find(c => c.column_name === field.name);
      if (!dbCol) {
        issues.push({
          severity: 'HIGH',
          type: 'prisma_db_mismatch',
          message: `Prisma field ${model.name}.${field.name} missing in DB`,
          fix: 'Run: prisma migrate dev'
        });
      }
    }
    
    // Check Drizzle vs Prisma
    if (drizzleTable) {
      const prismaFields = model.fields.map(f => f.name);
      const drizzleFields = Object.keys(drizzleTable.columns);
      
      const missingInDrizzle = prismaFields.filter(f => !drizzleFields.includes(f));
      const extraInDrizzle = drizzleFields.filter(f => !prismaFields.includes(f));
      
      if (missingInDrizzle.length > 0) {
        issues.push({
          severity: 'CRITICAL',
          type: 'drizzle_outdated',
          message: `Drizzle missing fields: ${missingInDrizzle.join(', ')}`,
          fix: 'Run: pnpm drizzle-kit generate:pg'
        });
      }
      
      if (extraInDrizzle.length > 0) {
        issues.push({
          severity: 'MEDIUM',
          type: 'drizzle_extra',
          message: `Drizzle has extra fields: ${extraInDrizzle.join(', ')}`,
          fix: 'Remove from drizzle-schema.ts or add to Prisma'
        });
      }
    }
  }
  
  return issues;
}

// Run audit
detectSchemaDrift().then(issues => {
  console.log('🔍 Schema Drift Report:\n');
  
  if (issues.length === 0) {
    console.log('✅ No drift detected - all schemas in sync');
  } else {
    console.log(`⚠️ Found ${issues.length} issues:\n`);
    
    for (const issue of issues) {
      const emoji = {
        CRITICAL: '🔴',
        HIGH: '🟠',
        MEDIUM: '🟡',
        LOW: '🟢'
      }[issue.severity];
      
      console.log(`${emoji} [${issue.severity}] ${issue.type}`);
      console.log(`   ${issue.message}`);
      console.log(`   Fix: ${issue.fix}\n`);
    }
  }
});
```

**Run Audit:**
```bash
npx tsx scripts/audit-schema-drift.ts
```

**Expected Issues:**
```
🔴 [CRITICAL] drizzle_outdated
   Drizzle missing fields: preferredLocale, preferredLanguage, failedLoginAttempts, lockedUntil
   Fix: Run: pnpm drizzle-kit generate:pg

🟡 [MEDIUM] drizzle_extra
   Drizzle has extra fields: password
   Fix: Remove from drizzle-schema.ts (should be passwordHash)
```

---

### Phase 4: Fix Schema Drift (10 min)

**Tool:** `drizzle-kit` + manual verification

```bash
# Step 1: Backup current Drizzle schema
cd apps/api
cp src/database/drizzle-schema.ts src/database/drizzle-schema.ts.backup

# Step 2: Regenerate Drizzle schema from Prisma
pnpm drizzle-kit generate:pg

# Step 3: Review generated schema
git diff src/database/drizzle-schema.ts

# Expected changes:
# - password → passwordHash
# + preferredLocale
# + preferredLanguage  
# + failedLoginAttempts
# + lockedUntil
# - role default: 'USER' → 'STUDENT'

# Step 4: Apply to Drizzle (metadata only - DB already migrated)
pnpm drizzle-kit push --force

# Step 5: Verify build passes
pnpm build

# Expected output: ✅ Build successful, 0 TypeScript errors
```

**Critical Check:**
```bash
# Verify no data migration needed (Prisma already did this)
psql postgresql://postgres@103.54.153.248:5432/v_edfinance -c "
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'User' 
  ORDER BY ordinal_position;
"

# Should show:
# - passwordHash (NOT password) ✅
# - preferredLocale ✅
# - preferredLanguage ✅
```

**Rollback Plan (if needed):**
```bash
# If anything goes wrong:
cp src/database/drizzle-schema.ts.backup src/database/drizzle-schema.ts
pnpm build
```

---

### Phase 5: Verify Triple-ORM Sync (5 min)

**Tool:** `prisma-drizzle-hybrid-agent` verification script

```typescript
// scripts/verify-triple-orm-sync.ts
import { PrismaClient } from '@prisma/client';
import { db } from './src/database/drizzle';
import { kysely } from './src/database/kysely.service';
import { users } from './src/database/drizzle-schema';
import { eq } from 'drizzle-orm';

async function verifyTripleOrmSync() {
  const testUserId = 'test-sync-' + Date.now();
  
  console.log('🔍 Verifying Triple-ORM sync...\n');
  
  try {
    // Test 1: Prisma write
    console.log('1️⃣ Testing Prisma write...');
    const prisma = new PrismaClient();
    const prismaUser = await prisma.user.create({
      data: {
        id: testUserId,
        email: 'test@sync.com',
        passwordHash: 'test123',
        role: 'STUDENT',
        preferredLocale: 'vi'
      }
    });
    console.log('   ✅ Prisma write OK\n');
    
    // Test 2: Drizzle read (should see same fields)
    console.log('2️⃣ Testing Drizzle read...');
    const drizzleUser = await db
      .select()
      .from(users)
      .where(eq(users.id, testUserId))
      .limit(1);
    
    if (!drizzleUser[0]) {
      throw new Error('Drizzle cannot read Prisma-created record');
    }
    
    if (!drizzleUser[0].passwordHash) {
      throw new Error('Drizzle schema missing passwordHash field');
    }
    
    if (!drizzleUser[0].preferredLocale) {
      throw new Error('Drizzle schema missing preferredLocale field');
    }
    
    console.log('   ✅ Drizzle read OK\n');
    
    // Test 3: Kysely read
    console.log('3️⃣ Testing Kysely read...');
    const kyselyUser = await kysely
      .selectFrom('User')
      .selectAll()
      .where('id', '=', testUserId)
      .executeTakeFirst();
    
    if (!kyselyUser) {
      throw new Error('Kysely cannot read record');
    }
    
    console.log('   ✅ Kysely read OK\n');
    
    // Test 4: Cross-ORM consistency
    console.log('4️⃣ Checking field consistency...');
    const fields = ['email', 'passwordHash', 'role', 'preferredLocale'];
    
    for (const field of fields) {
      if (prismaUser[field] !== drizzleUser[0][field]) {
        throw new Error(`Field mismatch: ${field}`);
      }
      if (prismaUser[field] !== kyselyUser[field]) {
        throw new Error(`Field mismatch (Kysely): ${field}`);
      }
    }
    
    console.log('   ✅ All fields consistent\n');
    
    // Cleanup
    await prisma.user.delete({ where: { id: testUserId } });
    
    console.log('✅ Triple-ORM sync verification PASSED\n');
    console.log('📊 Summary:');
    console.log('   Prisma: ✅ Write OK');
    console.log('   Drizzle: ✅ Read OK');
    console.log('   Kysely: ✅ Read OK');
    console.log('   Consistency: ✅ All fields match\n');
    
    return true;
  } catch (error) {
    console.error('❌ Triple-ORM sync verification FAILED:', error);
    return false;
  }
}

verifyTripleOrmSync();
```

**Run Verification:**
```bash
npx tsx scripts/verify-triple-orm-sync.ts
```

**Expected Output:**
```
🔍 Verifying Triple-ORM sync...

1️⃣ Testing Prisma write...
   ✅ Prisma write OK

2️⃣ Testing Drizzle read...
   ✅ Drizzle read OK

3️⃣ Testing Kysely read...
   ✅ Kysely read OK

4️⃣ Checking field consistency...
   ✅ All fields consistent

✅ Triple-ORM sync verification PASSED

📊 Summary:
   Prisma: ✅ Write OK
   Drizzle: ✅ Read OK
   Kysely: ✅ Read OK
   Consistency: ✅ All fields match
```

---

## 🔧 AUTOMATED AUDIT TOOLS

### Tool 1: Weekly Schema Health Check (Cron)

**File:** `scripts/cron/weekly-schema-audit.sh`

```bash
#!/bin/bash
# Runs every Monday 9AM

echo "📋 Weekly Schema Health Audit"
echo "=============================="

# 1. Run drift detection
echo "1️⃣ Detecting schema drift..."
npx tsx scripts/audit-schema-drift.ts > /tmp/drift-report.txt

# 2. Compare Prisma vs DB
echo "2️⃣ Comparing Prisma vs Database..."
npx prisma migrate status

# 3. Verify Triple-ORM sync
echo "3️⃣ Verifying Triple-ORM sync..."
npx tsx scripts/verify-triple-orm-sync.ts

# 4. Check for unused indexes
echo "4️⃣ Checking index health..."
psql $DATABASE_URL -c "
  SELECT 
    schemaname, tablename, indexname, idx_scan
  FROM pg_stat_user_indexes
  WHERE idx_scan = 0
  ORDER BY pg_relation_size(indexrelid) DESC
  LIMIT 10;
"

# 5. Generate report
echo "5️⃣ Generating report..."
cat /tmp/drift-report.txt

# 6. Create Beads task if issues found
if grep -q "CRITICAL\|HIGH" /tmp/drift-report.txt; then
  bd create "Schema drift detected - urgent fix needed" --type bug --priority 0
fi

echo "✅ Weekly audit complete"
```

**Schedule:**
```bash
# Add to crontab
0 9 * * 1 /path/to/weekly-schema-audit.sh
```

---

### Tool 2: Pre-Deployment Gate (GitHub Actions)

**File:** `.github/workflows/schema-validation.yml`

```yaml
name: Schema Validation

on:
  pull_request:
    paths:
      - 'apps/api/prisma/schema.prisma'
      - 'apps/api/src/database/drizzle-schema.ts'

jobs:
  validate-schema:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Check schema drift
        run: |
          cd apps/api
          npx tsx ../../scripts/audit-schema-drift.ts
          
          # Fail if CRITICAL issues found
          if grep -q "CRITICAL" /tmp/drift-report.txt; then
            echo "❌ Critical schema drift detected"
            exit 1
          fi
      
      - name: Verify Triple-ORM sync
        run: |
          cd apps/api
          npx tsx ../../scripts/verify-triple-orm-sync.ts
      
      - name: Build test
        run: |
          cd apps/api
          pnpm build
```

---

### Tool 3: Real-Time Monitoring (Grafana Dashboard)

**Metrics to Track:**

```sql
-- Dashboard: Triple-ORM Health

-- Panel 1: Schema version mismatch
SELECT 
  'Prisma' as orm,
  (SELECT version FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 1) as version
UNION ALL
SELECT 
  'Drizzle' as orm,
  (SELECT metadata->>'lastSync' FROM drizzle_metadata LIMIT 1) as version;

-- Panel 2: Query distribution by ORM
SELECT 
  CASE 
    WHEN query LIKE '%prisma%' THEN 'Prisma'
    WHEN query LIKE '%drizzle%' THEN 'Drizzle'
    WHEN query LIKE '%kysely%' THEN 'Kysely'
    ELSE 'Other'
  END as orm,
  count(*) as queries,
  avg(mean_exec_time) as avg_time
FROM pg_stat_statements
GROUP BY orm;

-- Panel 3: Failed queries by ORM
SELECT 
  date_trunc('hour', timestamp) as hour,
  count(*) FILTER (WHERE error LIKE '%prisma%') as prisma_errors,
  count(*) FILTER (WHERE error LIKE '%drizzle%') as drizzle_errors,
  count(*) FILTER (WHERE error LIKE '%kysely%') as kysely_errors
FROM error_log
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY hour;
```

**Alert Rules:**
```yaml
# Grafana Alert: Schema Drift Detected
- alert: SchemaDriftDetected
  expr: drift_issues_critical > 0
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: Critical schema drift detected
    description: Drizzle schema out of sync with Prisma

# Grafana Alert: ORM Query Failures
- alert: ORMQueryFailures
  expr: rate(drizzle_query_errors[5m]) > 0.01
  for: 10m
  labels:
    severity: high
  annotations:
    summary: High Drizzle query failure rate
    description: Possible schema mismatch causing runtime errors
```

---

## 📊 SUCCESS CRITERIA

### Before Fix:
```
❌ Drizzle schema has 'password' field (should be 'passwordHash')
❌ Drizzle missing 4 fields (preferredLocale, preferredLanguage, etc)
❌ Build may pass but runtime CRUD failures likely
⚠️ Triple-ORM integrity: BROKEN
```

### After Fix:
```
✅ Drizzle schema has 'passwordHash' field
✅ All Prisma fields present in Drizzle
✅ Build passes with 0 TypeScript errors
✅ Triple-ORM verification test: PASSING
✅ No runtime CRUD errors
```

---

## 🚀 EXECUTION PLAN (30 Minutes)

**NOW (30 min total):**

```bash
# Minute 0-5: Audit current state
npx tsx scripts/audit-schema-drift.ts

# Minute 5-10: Fix Drizzle schema
cd apps/api
cp src/database/drizzle-schema.ts src/database/drizzle-schema.ts.backup
pnpm drizzle-kit generate:pg
pnpm drizzle-kit push --force

# Minute 10-15: Verify build
pnpm build  # Must pass

# Minute 15-20: Run verification tests
npx tsx scripts/verify-triple-orm-sync.ts

# Minute 20-25: Close Beads task
bd close ved-gdvp --reason "Drizzle schema synced with Prisma - all tests passing"

# Minute 25-30: Document in ZERO_DEBT_CERTIFICATE.md
# Update certification status: Schema drift RESOLVED
```

---

## 📚 DOCUMENTATION REFERENCES

1. **Prisma-Drizzle Hybrid Agent:**
   - [.agents/skills/prisma-drizzle-hybrid-agent.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/.agents/skills/prisma-drizzle-hybrid-agent.md)
   - Lines 33-136: Schema sync workflow
   - Lines 239-330: Migration safety checks

2. **PostgreSQL DBA Pro:**
   - [.agents/skills/postgresql-dba-pro.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/.agents/skills/postgresql-dba-pro.md)
   - Lines 104-197: Index recommendations
   - Lines 345-415: Weekly DBA health checks

3. **Database Reliability Engineering:**
   - [.agents/skills/database-reliability-engineering.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/.agents/skills/database-reliability-engineering.md)
   - Lines 9-188: Backup automation
   - Lines 342-416: Capacity planning

4. **Triple-ORM Strategy:**
   - [docs/database/PRISMA_DRIZZLE_HYBRID_STRATEGY.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/docs/PRISMA_DRIZZLE_HYBRID_STRATEGY.md)
   - Decision matrix for ORM selection
   - Performance benchmarks

---

## ⚠️ RISK MITIGATION

### If Schema Fix Breaks Something:

**Rollback Plan:**
```bash
# Step 1: Restore Drizzle schema backup
cp src/database/drizzle-schema.ts.backup src/database/drizzle-schema.ts

# Step 2: Verify build
pnpm build

# Step 3: Investigate what broke
git diff src/database/drizzle-schema.ts.backup src/database/drizzle-schema.ts

# Step 4: Fix manually or revert
git checkout HEAD -- src/database/drizzle-schema.ts
```

### If Runtime Errors Occur:

**Debug Workflow:**
```bash
# 1. Check error logs
tail -f apps/api/logs/error.log | grep -i drizzle

# 2. Compare actual DB schema
psql $DATABASE_URL -c "\d User"

# 3. Verify Prisma migrations applied
npx prisma migrate status

# 4. Re-sync if needed
pnpm drizzle-kit introspect  # Pull from actual DB
```

---

## ✅ NEXT STEPS AFTER FIX

1. **Add to CI/CD:**
   - ✅ Schema validation workflow (pre-deployment gate)
   - ✅ Automated drift detection (weekly cron)

2. **Monitoring:**
   - ✅ Grafana dashboard for Triple-ORM health
   - ✅ Alerts for schema drift

3. **Documentation:**
   - ✅ Update ZERO_DEBT_CERTIFICATE.md
   - ✅ Add to AGENTS.md mandatory checks

4. **Prevention:**
   - ✅ Never run `drizzle-kit push` without Prisma sync
   - ✅ Always `pnpm sync-triple-orm` after Prisma migrations

---

**Status:** 🔴 READY TO EXECUTE  
**Priority:** P0 CRITICAL (ved-gdvp)  
**Estimated Time:** 30 minutes  
**Risk Level:** LOW (Prisma already migrated DB, just syncing Drizzle metadata)

**Executor:** AI Agent (you!)  
**Date:** 2026-01-03 17:30
