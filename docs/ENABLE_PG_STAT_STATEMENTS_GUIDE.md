# Enable pg_stat_statements on VPS

## Purpose
Enable PostgreSQL query performance tracking extension required for:
- AI Database Architect autonomous optimization
- Slow query detection and analysis
- Query performance monitoring

## Prerequisites
- VPS access: `ssh deployer@103.54.153.248`
- PostgreSQL 17 installed ✅ (upgraded in Phase 1)
- Superuser or database admin access

---

## Step 1: SSH to VPS

```bash
ssh deployer@103.54.153.248
# Or use root if deployer doesn't have sudo
```

---

## Step 2: Enable Extension

### Option A: Via psql (Recommended)

```bash
# Connect to PostgreSQL
docker exec -it vedfinance-postgres psql -U postgres -d vedfinance

# Enable extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

# Verify installation
SELECT * FROM pg_stat_statements LIMIT 1;

# If successful, you'll see query statistics
# Exit psql
\q
```

### Option B: Via Docker Exec (One-liner)

```bash
docker exec -it vedfinance-postgres psql -U postgres -d vedfinance -c "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"
```

---

## Step 3: Configure Extension (If Not Using Defaults)

**Only needed if you want custom settings:**

```bash
# Edit postgresql.conf (inside container)
docker exec -it vedfinance-postgres bash

# Install text editor
apk add nano

# Edit config
nano /var/lib/postgresql/data/postgresql.conf

# Add these lines:
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.track = 'all'
pg_stat_statements.max = 10000

# Save and exit (Ctrl+X, Y, Enter)

# Restart PostgreSQL container
exit
docker restart vedfinance-postgres
```

**⚠️ NOTE:** Most modern PostgreSQL distributions (including Docker images) have `pg_stat_statements` pre-loaded. Just creating the extension is usually enough.

---

## Step 4: Verify Extension Works

```bash
# Check extension is active
docker exec -it vedfinance-postgres psql -U postgres -d vedfinance -c "SELECT * FROM pg_available_extensions WHERE name = 'pg_stat_statements';"

# Sample query to generate stats
docker exec -it vedfinance-postgres psql -U postgres -d vedfinance -c "SELECT COUNT(*) FROM \"User\";"

# Check pg_stat_statements captured it
docker exec -it vedfinance-postgres psql -U postgres -d vedfinance -c "SELECT query, calls, total_exec_time FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 5;"
```

**Expected Output:**
```
                 query                  | calls | total_exec_time
----------------------------------------|-------|----------------
 SELECT COUNT(*) FROM "User"            |     1 |           12.34
 SELECT * FROM "BehaviorLog" WHERE ...  |    15 |          234.56
```

---

## Step 5: Grant Access to Application User (If Needed)

```sql
-- If using non-superuser application account
GRANT pg_read_all_stats TO postgres;
```

---

## Step 6: Test with AI Database Architect

**Create test endpoint:**

```typescript
// apps/api/src/database/optimization.controller.ts

@Get('analyze-slow-queries')
async analyzeSlowQueries() {
  const slowQueries = await this.db.executeRawQuery<any>(`
    SELECT 
      query,
      calls,
      total_exec_time,
      mean_exec_time,
      stddev_exec_time,
      rows
    FROM pg_stat_statements
    WHERE mean_exec_time > 100  -- Queries slower than 100ms
    ORDER BY total_exec_time DESC
    LIMIT 20
  `);
  
  return { slowQueries, count: slowQueries.length };
}
```

**Test via curl:**
```bash
curl http://103.54.153.248:3001/api/database/analyze-slow-queries
```

---

## Troubleshooting

### Error: "extension 'pg_stat_statements' does not exist"

**Cause:** Extension not available in PostgreSQL build.

**Solution:**
```bash
# Check PostgreSQL version (should be 17)
docker exec -it vedfinance-postgres psql -U postgres -c "SELECT version();"

# Check available extensions
docker exec -it vedfinance-postgres psql -U postgres -c "SELECT * FROM pg_available_extensions WHERE name LIKE '%stat%';"
```

If `pg_stat_statements` is listed, try:
```sql
CREATE EXTENSION pg_stat_statements CASCADE;
```

---

### Error: "shared_preload_libraries requires restart"

**Solution:**
```bash
# Restart PostgreSQL container
docker restart vedfinance-postgres

# Wait 10 seconds
sleep 10

# Retry creating extension
docker exec -it vedfinance-postgres psql -U postgres -d vedfinance -c "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"
```

---

### Error: "permission denied for schema public"

**Solution:**
```sql
-- Grant permissions
GRANT ALL ON SCHEMA public TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
```

---

## Success Criteria

✅ Extension created without errors  
✅ `SELECT * FROM pg_stat_statements LIMIT 1;` returns data  
✅ Test endpoint returns slow query list  
✅ No PostgreSQL errors in logs  

---

## Next Steps After Setup

1. **Create automated monitoring cron:**
   ```bash
   # Weekly slow query analysis (Sundays 3AM)
   0 3 * * 0 curl http://localhost:3001/api/database/analyze-slow-queries
   ```

2. **Integrate with AI Database Architect:**
   - Agent will auto-analyze pg_stat_statements weekly
   - Generate optimization recommendations
   - Store in `OptimizationLog` table
   - Auto-apply high-confidence optimizations (>90%)

3. **Setup Grafana dashboard:**
   - Visualize query performance trends
   - Alert on queries exceeding 500ms average
   - Track optimization success rate

---

## References

- [PostgreSQL pg_stat_statements Documentation](https://www.postgresql.org/docs/current/pgstatstatements.html)
- [Triple-ORM Strategy](file:///c:/Users/luaho/Demo%20project/v-edfinance/docs/PRISMA_DRIZZLE_HYBRID_STRATEGY.md)
- [AI Database Architect Tasks](file:///c:/Users/luaho/Demo%20project/v-edfinance/docs/AI_DB_ARCHITECT_TASKS.md)

---

**Setup Time:** ~10 minutes  
**Manual Steps:** Yes (requires VPS SSH access)  
**Automation:** After setup, fully autonomous
