# Database Seed Testing - Manual Execution Guide

**Status:** 🔴 AUTO-RUN FAILED - Manual intervention required  
**Date:** 2025-12-23  
**Issue:** PowerShell command execution blocked (cmd.exe ENOENT)

---

## ⚠️ Issue Diagnosis

### Root Cause
PowerShell automation encountered system-level restrictions:
- `cmd.exe ENOENT` error indicates Windows command processor not accessible
- May be due to antivirus, security policy, or path issues
- Automated script execution requires troubleshooting

### Test Results (Auto-Run)
```
Phase1: FAILED (18.7s) - Database reset failed
Phase2: FAILED (3.2s) - Triple-ORM tests failed  
Phase3: FAILED (2.7s) - AI Agent tests failed
```

---

## 🛠️ Manual Execution Steps

### Option 1: Run via IDE Terminal (RECOMMENDED)

**Step 1: Open VSCode/IDE Terminal**
```bash
# Navigate to API directory
cd "c:\Users\luaho\Demo project\v-edfinance\apps\api"

# Generate Prisma client
npx prisma generate

# Reset database
npx prisma migrate reset --force --skip-seed

# Run basic seed
ts-node prisma/seed.ts
```

**Step 2: Verify Data**
```bash
# Connect to database (use your DATABASE_URL)
psql "postgresql://user:pass@localhost:5432/v_edfinance"

# Run verification queries
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Course";
SELECT COUNT(*) FROM "Lesson";
```

**Step 3: Run Dev Scenario**
```bash
ts-node prisma/seeds/index.ts dev
```

**Step 4: Run Test Suites**
```bash
# Triple-ORM tests
pnpm test database.service.seed.spec.ts

# AI Agent tests  
pnpm test ai-agent-data.spec.ts
```

---

### Option 2: Use Simple Batch File

Created: **[SIMPLE_SEED_TEST.bat](file:///c:/Users/luaho/Demo%20project/v-edfinance/SIMPLE_SEED_TEST.bat)**

**Double-click the file or run:**
```cmd
SIMPLE_SEED_TEST.bat
```

This performs:
1. ✅ Prisma installation check
2. ✅ Database connection test
3. ✅ Prisma client generation
4. ✅ Migration deployment
5. ✅ Basic seed execution
6. ✅ Data verification

---

### Option 3: Docker-based Testing (Isolated)

```bash
# Start PostgreSQL in Docker
docker-compose up -d db

# Wait for DB to be ready
timeout /t 5

# Run seed from container
docker-compose exec api npx prisma migrate deploy
docker-compose exec api ts-node prisma/seed.ts
```

---

## 📋 Manual Verification Checklist

After running seed, verify:

### Basic Seed Validation
- [ ] 2 users created (admin@v-edfinance.com, student@example.com)
- [ ] 1 course created (tai-chinh-ca-nhan-101)
- [ ] 2 lessons created (under the course)
- [ ] 1 user checklist created
- [ ] 1 system setting created

### Dev Scenario Validation
- [ ] 50 users created
- [ ] 10 courses created
- [ ] ~50-120 lessons created (5-12 per course)
- [ ] ~350 behavior logs (7 days)
- [ ] 5 buddy groups created

### JSONB Schema Validation
```sql
-- All courses should have vi/en/zh titles
SELECT slug, 
       title->>'vi' as title_vi, 
       title->>'en' as title_en, 
       title->>'zh' as title_zh
FROM "Course" 
LIMIT 5;

-- Check for NULL violations
SELECT COUNT(*) as null_count 
FROM "Course" 
WHERE title->>'vi' IS NULL 
   OR title->>'en' IS NULL 
   OR title->>'zh' IS NULL;
-- Expected: 0
```

---

## 🔧 Troubleshooting Common Issues

### Issue: `Error: P1001: Can't reach database server`

**Solution:**
1. Check if PostgreSQL is running
2. Verify DATABASE_URL in `.env`:
   ```
   DATABASE_URL="postgresql://USER:PASS@localhost:5432/v_edfinance"
   ```
3. Test connection:
   ```bash
   psql "postgresql://USER:PASS@localhost:5432/v_edfinance" -c "SELECT 1;"
   ```

### Issue: `Error: Unique constraint failed`

**Solution:**
```bash
# Drop and recreate database
npx prisma migrate reset --force --skip-seed
```

### Issue: `ts-node: command not found`

**Solution:**
```bash
# Install ts-node globally
npm install -g ts-node

# Or use via pnpm
pnpm exec ts-node prisma/seed.ts
```

### Issue: `Module not found: @prisma/client`

**Solution:**
```bash
# Regenerate Prisma client
npx prisma generate
```

---

## 📊 Expected Database State (After Dev Seed)

| Table | Expected Rows | Notes |
|-------|---------------|-------|
| User | 50 | Mixed roles (STUDENT, ADMIN, INSTRUCTOR) |
| Course | 10 | All with multi-lingual titles |
| Lesson | 50-120 | 5-12 lessons per course |
| BehaviorLog | ~350 | 7 days of activity |
| BuddyGroup | 5 | Each with 4 members |
| CourseProgress | Variable | Depends on enrollment logic |

---

## 🎯 Next Actions

### If Manual Tests Pass ✅

1. **Update test results**
   ```bash
   # Edit DATABASE_SEED_TEST_RESULTS.json manually
   # Mark phases as PASSED
   ```

2. **Commit results**
   ```bash
   git add DATABASE_SEED_TEST_RESULTS.json
   git add apps/api/src/database/*.spec.ts
   git commit -m "test: Manual database seed testing complete"
   git push
   ```

3. **Proceed to next phase**
   - Continue with VPS deployment (VED-9D0)
   - Or benchmark testing if needed

### If Manual Tests Fail ❌

1. **Debug specific failures**
   - Check error logs in terminal
   - Review Prisma schema
   - Verify factory logic

2. **Fix and retry**
   - Update seed factories
   - Fix JSONB structure
   - Regenerate Prisma client

3. **Document fixes**
   - Note what was changed
   - Update seed documentation

---

## 📚 Available Scripts

| Script | Purpose | Command |
|--------|---------|---------|
| **SIMPLE_SEED_TEST.bat** | Basic automated checks | Double-click or `.\SIMPLE_SEED_TEST.bat` |
| **AUTO_RUN_SEED_TESTS.ps1** | Full automation (needs fix) | `powershell -ExecutionPolicy Bypass -File .\AUTO_RUN_SEED_TESTS.ps1` |
| **RUN_SEED_TESTS.bat** | Phase 1 validation (uses psql) | `.\RUN_SEED_TESTS.bat` |
| **RUN_BENCHMARK_TESTS.bat** | Phase 4 performance | `.\RUN_BENCHMARK_TESTS.bat` |

---

## 🔍 System Requirements Check

Before running tests, verify:

- [ ] **PostgreSQL** installed and running
- [ ] **Node.js** 18+ installed
- [ ] **pnpm** installed globally
- [ ] **ts-node** available (or via pnpm exec)
- [ ] **.env file** configured with DATABASE_URL
- [ ] **Prisma CLI** accessible (`npx prisma --version`)

---

**Current Status:** Waiting for manual execution  
**Recommended:** Run SIMPLE_SEED_TEST.bat first for diagnostics
