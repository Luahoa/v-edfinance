# P1 Incident Runbook: Slow Queries

**Severity:** P1 (High)  
**MTTR Target:** 30 minutes  
**Status:** Active

---

## 🚨 Detection

### Automated Alerts
- Prometheus: `pg_stat_statements_mean_time{query_type="SELECT"} > 1000ms`
- Application logs: Query timeout warnings (>5 seconds)
- User reports: "App is slow" or "Loading forever"
- APM: P95 latency > 2 seconds on database queries

### Manual Detection
- API endpoints taking >3 seconds to respond
- Database CPU usage >80%
- Connection pool exhausted (waiting for connections)

### Quick Diagnosis Commands
```bash
# Check current long-running queries
ssh root@103.54.153.248
docker exec <postgres_container> psql -U postgres -d vedfinance_staging -c \
  "SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
   FROM pg_stat_activity 
   WHERE state = 'active' AND query NOT LIKE '%pg_stat_activity%'
   ORDER BY duration DESC LIMIT 10;"

# Check pg_stat_statements (top 10 slowest queries)
docker exec <postgres_container> psql -U postgres -d vedfinance_staging -c \
  "SELECT query, calls, mean_exec_time, total_exec_time 
   FROM pg_stat_statements 
   ORDER BY mean_exec_time DESC LIMIT 10;"

# Check database load
docker exec <postgres_container> psql -U postgres -c \
  "SELECT count(*) as active_connections 
   FROM pg_stat_activity 
   WHERE state = 'active';"
```

---

## ⚡ Immediate Actions (First 5 Minutes)

### Step 1: Identify Slow Query Pattern
```bash
# Get currently executing slow queries (>5 seconds)
docker exec <postgres_container> psql -U postgres -d vedfinance_staging -c \
  "SELECT pid, usename, state, 
          now() - query_start AS duration, 
          substring(query, 1, 100) AS query_preview
   FROM pg_stat_activity 
   WHERE state = 'active' 
   AND now() - query_start > interval '5 seconds'
   ORDER BY duration DESC;"

# If multiple similar queries → N+1 problem or missing index
# If one long query → Complex join or table scan
```

### Step 2: Check for Blocking Queries
```bash
# Find queries waiting on locks
docker exec <postgres_container> psql -U postgres -d vedfinance_staging -c \
  "SELECT blocked_locks.pid AS blocked_pid,
          blocking_locks.pid AS blocking_pid,
          blocked_activity.query AS blocked_query,
          blocking_activity.query AS blocking_query
   FROM pg_catalog.pg_locks blocked_locks
   JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
   JOIN pg_catalog.pg_locks blocking_locks 
     ON blocking_locks.locktype = blocked_locks.locktype
     AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
     AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
     AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
     AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
     AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
     AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
     AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
     AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
     AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
     AND blocking_locks.pid != blocked_locks.pid
   JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
   WHERE NOT blocked_locks.granted;"

# If locks found → Kill blocking query (emergency only)
```

### Step 3: Assess User Impact
```bash
# Check API response times (last 5 minutes)
docker logs <api_container> --tail 1000 | \
  grep -o "duration=[0-9]*ms" | \
  sed 's/duration=//;s/ms//' | \
  awk '{sum+=$1; count++} END {print "Average: " sum/count "ms"}'

# If average >1000ms → Critical impact
# If average 500-1000ms → Degraded performance
# If average <500ms → Isolated issue
```

---

## 🔧 Diagnosis & Resolution

### Scenario A: Missing Index (Table Scan)
**Symptoms:** Query takes 5+ seconds on small table (<100k rows)

```bash
# Enable query timing
docker exec <postgres_container> psql -U postgres -d vedfinance_staging -c "SET log_min_duration_statement = 1000;"

# Analyze slow query
docker exec <postgres_container> psql -U postgres -d vedfinance_staging -c \
  "EXPLAIN (ANALYZE, BUFFERS) 
   SELECT * FROM \"BehaviorLog\" WHERE user_id = '123' AND action = 'click';"

# Look for "Seq Scan" in output → Missing index
# Look for "rows=" much larger than "actual rows=" → Poor statistics

# Create index (example)
docker exec <postgres_container> psql -U postgres -d vedfinance_staging -c \
  "CREATE INDEX CONCURRENTLY idx_behaviorlog_user_action 
   ON \"BehaviorLog\" (user_id, action);"

# Verify index used
docker exec <postgres_container> psql -U postgres -d vedfinance_staging -c \
  "EXPLAIN SELECT * FROM \"BehaviorLog\" WHERE user_id = '123' AND action = 'click';"
# Should now show "Index Scan using idx_behaviorlog_user_action"
```

**Common Tables Needing Indexes:**
| Table | Column(s) | Usage Pattern |
|-------|-----------|---------------|
| BehaviorLog | (user_id, created_at) | User activity timeline |
| BehaviorLog | (session_id, created_at) | Session analysis |
| OptimizationLog | (analyzed_at) | Recent optimizations |
| Transaction | (user_id, status) | User payment history |
| Course | (published, category) | Course browsing |

### Scenario B: N+1 Query Problem
**Symptoms:** Hundreds of similar queries in pg_stat_statements

```bash
# Check for repeated queries with high call count
docker exec <postgres_container> psql -U postgres -d vedfinance_staging -c \
  "SELECT query, calls, mean_exec_time, calls * mean_exec_time as total_time
   FROM pg_stat_statements 
   WHERE query LIKE 'SELECT%FROM%'
   ORDER BY calls DESC LIMIT 10;"

# If calls >1000/min for simple SELECT → N+1 problem

# Example: Loading courses with instructors
# BAD (N+1):
#   SELECT * FROM "Course";  -- 1 query
#   SELECT * FROM "User" WHERE id = ?;  -- N queries (one per course)

# GOOD (with join):
#   SELECT c.*, u.* FROM "Course" c 
#   LEFT JOIN "User" u ON c.instructor_id = u.id;  -- 1 query
```

**Fix in Code:**
```typescript
// apps/api/src/modules/courses/courses.service.ts

// Before (N+1)
async getAllCourses() {
  const courses = await this.prisma.course.findMany();
  // Each course triggers separate query for instructor
  return courses;
}

// After (with include)
async getAllCourses() {
  return this.prisma.course.findMany({
    include: {
      instructor: true,  // Single join query
      enrollments: true,
    },
  });
}
```

### Scenario C: Outdated Statistics
**Symptoms:** Query plan changed after deployment, now slow

```bash
# Check table statistics freshness
docker exec <postgres_container> psql -U postgres -d vedfinance_staging -c \
  "SELECT schemaname, tablename, last_analyze, last_autoanalyze
   FROM pg_stat_user_tables 
   ORDER BY last_analyze NULLS FIRST LIMIT 10;"

# If last_analyze > 7 days ago → Statistics outdated

# Manually analyze tables
docker exec <postgres_container> psql -U postgres -d vedfinance_staging -c \
  "ANALYZE \"BehaviorLog\";"

docker exec <postgres_container> psql -U postgres -d vedfinance_staging -c \
  "ANALYZE \"OptimizationLog\";"

# Verify query plan improved
docker exec <postgres_container> psql -U postgres -d vedfinance_staging -c \
  "EXPLAIN (ANALYZE) [your slow query here];"
```

### Scenario D: Lock Contention
**Symptoms:** Queries waiting for lock release

```bash
# Kill blocking query (EMERGENCY ONLY)
# First, identify blocking PID from Step 2
BLOCKING_PID=12345

# Terminate the connection
docker exec <postgres_container> psql -U postgres -c \
  "SELECT pg_terminate_backend($BLOCKING_PID);"

# Monitor if lock clears
docker exec <postgres_container> psql -U postgres -d vedfinance_staging -c \
  "SELECT count(*) FROM pg_locks WHERE granted = false;"
# Should be 0 after termination
```

**Common Lock Causes:**
- Long-running transaction not committed
- ALTER TABLE without CONCURRENTLY
- Backup running during peak hours
- Foreign key constraint checks on large tables

### Scenario E: Connection Pool Exhaustion
**Symptoms:** Queries queued waiting for connections

```bash
# Check Prisma connection pool (in code)
# Default: 10 connections per instance

# Check total active connections
docker exec <postgres_container> psql -U postgres -c \
  "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"

# Check max connections
docker exec <postgres_container> psql -U postgres -c \
  "SHOW max_connections;"

# If active connections near max_connections → Need to scale pool

# Update Prisma connection URL
# DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20"
```

---

## 🛡️ Query Optimization Workflow

### Step 1: Capture Slow Query
```bash
# Get full query from pg_stat_statements
docker exec <postgres_container> psql -U postgres -d vedfinance_staging -c \
  "SELECT query, mean_exec_time, stddev_exec_time 
   FROM pg_stat_statements 
   WHERE mean_exec_time > 1000 
   ORDER BY mean_exec_time DESC LIMIT 1;" \
  > /tmp/slow-query.sql
```

### Step 2: Analyze Execution Plan
```bash
# Run EXPLAIN ANALYZE
docker exec <postgres_container> psql -U postgres -d vedfinance_staging -c \
  "EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) 
   [paste query from slow-query.sql];" \
  > /tmp/query-plan.json

# Upload to https://explain.dalibo.com/ for visualization
```

### Step 3: Create Index (if needed)
```bash
# Template for creating index
docker exec <postgres_container> psql -U postgres -d vedfinance_staging -c \
  "CREATE INDEX CONCURRENTLY idx_<table>_<columns> 
   ON \"<Table>\" (<column1>, <column2>);"

# CONCURRENTLY = non-blocking, safe for production
```

### Step 4: Rewrite Query (if index doesn't help)
```sql
-- Example: Convert correlated subquery to JOIN

-- SLOW (correlated subquery)
SELECT c.*, 
       (SELECT COUNT(*) FROM "Enrollment" e WHERE e.course_id = c.id) as enrollment_count
FROM "Course" c;

-- FAST (JOIN + GROUP BY)
SELECT c.*, COUNT(e.id) as enrollment_count
FROM "Course" c
LEFT JOIN "Enrollment" e ON e.course_id = c.id
GROUP BY c.id;
```

### Step 5: Verify Improvement
```bash
# Compare execution times
docker exec <postgres_container> psql -U postgres -d vedfinance_staging -c \
  "EXPLAIN (ANALYZE) [optimized query];"

# Target: <100ms for simple queries, <500ms for complex analytics
```

---

## 📊 pg_stat_statements Analysis

### Enable pg_stat_statements (if not enabled)
```bash
# Check if enabled
docker exec <postgres_container> psql -U postgres -c \
  "SELECT * FROM pg_available_extensions WHERE name = 'pg_stat_statements';"

# Enable
docker exec <postgres_container> psql -U postgres -d vedfinance_staging -c \
  "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"

# Verify
docker exec <postgres_container> psql -U postgres -d vedfinance_staging -c \
  "SELECT query, calls, mean_exec_time FROM pg_stat_statements LIMIT 5;"
```

### Top 10 Queries by Total Time
```bash
docker exec <postgres_container> psql -U postgres -d vedfinance_staging -c \
  "SELECT 
     substring(query, 1, 80) as query_preview,
     calls,
     round(mean_exec_time::numeric, 2) as avg_ms,
     round(total_exec_time::numeric, 2) as total_ms
   FROM pg_stat_statements 
   ORDER BY total_exec_time DESC 
   LIMIT 10;"
```

### Reset Statistics (after optimization)
```bash
# Reset pg_stat_statements to track new baseline
docker exec <postgres_container> psql -U postgres -d vedfinance_staging -c \
  "SELECT pg_stat_statements_reset();"
```

---

## ✅ Recovery Verification

### Performance Benchmarks
```bash
# Run query performance test suite
cd /root/v-edfinance/scripts/tests

# Test common queries
cat > test-queries.sh << 'EOF'
#!/bin/bash
CONTAINER="<postgres_container>"

# Test 1: User lookup by ID
docker exec $CONTAINER psql -U postgres -d vedfinance_staging -c \
  "\timing on" -c "SELECT * FROM \"User\" WHERE id = 'test-user-1';"

# Test 2: Recent behavior logs
docker exec $CONTAINER psql -U postgres -d vedfinance_staging -c \
  "\timing on" -c "SELECT * FROM \"BehaviorLog\" 
   WHERE created_at > NOW() - INTERVAL '1 hour' LIMIT 100;"

# Test 3: Course list with enrollments
docker exec $CONTAINER psql -U postgres -d vedfinance_staging -c \
  "\timing on" -c "SELECT c.id, c.title, COUNT(e.id) as enrollments 
   FROM \"Course\" c 
   LEFT JOIN \"Enrollment\" e ON e.course_id = c.id 
   GROUP BY c.id LIMIT 20;"

EOF

chmod +x test-queries.sh
./test-queries.sh

# Target: All queries <100ms
```

### Monitor for Regression
```bash
# Watch slow query log for 10 minutes
watch -n 60 'docker exec <postgres_container> psql -U postgres -d vedfinance_staging -c \
  "SELECT count(*) as slow_queries 
   FROM pg_stat_statements 
   WHERE mean_exec_time > 1000;"'

# Should stay at 0 or low single digits
```

---

## 📝 Post-Incident Actions

### Immediate (Within 1 Hour)
1. **Document Slow Query:**
   ```bash
   # Save to incident log
   echo "## INC-$(date +%Y%m%d): Slow Query" >> docs/INCIDENTS.md
   echo "- Query: [paste query]" >> docs/INCIDENTS.md
   echo "- Before: XXXms, After: YYms" >> docs/INCIDENTS.md
   echo "- Fix: [index/rewrite/etc]" >> docs/INCIDENTS.md
   ```

2. **Create Optimization Bead:**
   ```bash
   beads create "Add missing index to BehaviorLog table" --type task --priority 1
   ```

3. **Update Query Monitoring:**
   - Add new slow query alert if pattern found
   - Update Grafana dashboard with new metric

### Short-Term (Within 1 Week)
1. **Add Query Performance Tests:**
   ```typescript
   // apps/api/test/performance/queries.spec.ts
   describe('Query Performance', () => {
     it('should fetch user profile in <100ms', async () => {
       const start = Date.now();
       await prisma.user.findUnique({ where: { id: testUserId } });
       const duration = Date.now() - start;
       expect(duration).toBeLessThan(100);
     });
   });
   ```

2. **Database Maintenance Schedule:**
   ```bash
   # Add to cron (weekly VACUUM ANALYZE)
   0 2 * * 0 docker exec <postgres_container> psql -U postgres -d vedfinance_staging -c "VACUUM ANALYZE;"
   ```

3. **Query Audit:**
   - Review all Prisma queries in codebase
   - Check for missing includes (N+1 prevention)
   - Verify indexes exist for common WHERE clauses

---

## 🚀 Escalation Paths

### Level 1: Self-Service (0-15 minutes)
- Check pg_stat_statements
- Create missing indexes
- Kill blocking queries
- Analyze tables

### Level 2: Backend Engineer (15-45 minutes)
- Rewrite inefficient queries
- Optimize Prisma usage
- Adjust connection pool settings
- Contact: [Slack: #backend-oncall]

### Level 3: DBA Specialist (45-120 minutes)
- Advanced query tuning
- Partitioning strategies
- Database parameter tuning
- Read replica setup
- Contact: [Slack: #database-experts]

### Level 4: Architecture Review (120+ minutes)
- Caching layer (Redis)
- Query result materialization
- Database sharding
- Consider PostgreSQL upgrade
- Contact: [Slack: #architecture]

---

## 📚 Related Resources
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [pg_stat_statements Documentation](https://www.postgresql.org/docs/current/pgstatstatements.html)
- [Prisma Query Optimization](https://www.prisma.io/docs/guides/performance-and-optimization)
- [EXPLAIN Guide](https://www.postgresql.org/docs/current/using-explain.html)
- [Enable pg_stat_statements Guide](../ENABLE_PG_STAT_STATEMENTS_GUIDE.md)

---

**Last Updated:** 2026-01-04  
**Owner:** Track 4 - PurpleBear  
**Review Frequency:** Monthly  
**Next Audit:** [Schedule monthly slow query review]
