# P0 Incident Runbook: Database Failure

**Severity:** P0 (Critical)  
**MTTR Target:** 10 minutes  
**Status:** Active

---

## 🚨 Detection

### Automated Alerts
- Prometheus: `pg_up == 0` for > 30 seconds
- Application logs: `FATAL: database "vedfinance_staging" does not exist`
- Connection errors: `ECONNREFUSED` on port 5432

### Manual Detection
- All API endpoints return 500 errors
- Dokploy dashboard shows PostgreSQL container stopped
- Cannot connect via `psql`

### Quick Diagnosis Commands
```bash
# Check PostgreSQL container status
ssh root@103.54.153.248
docker ps | grep postgres

# Check database connectivity
docker exec <postgres_container> pg_isready -U postgres

# Check database existence
docker exec <postgres_container> psql -U postgres -lqt | grep vedfinance_staging
```

---

## ⚡ Immediate Actions (First 3 Minutes)

### Step 1: Assess Database Status
```bash
# SSH to VPS
ssh root@103.54.153.248

# Find PostgreSQL container
POSTGRES_CONTAINER=$(docker ps -a --filter "ancestor=postgres:15-alpine" --format "{{.Names}}" | head -n 1)

# Check if container is running
docker ps | grep "$POSTGRES_CONTAINER"

# If stopped, check exit code
docker inspect "$POSTGRES_CONTAINER" | jq '.[0].State'
```

### Step 2: Attempt Container Restart
```bash
# Restart PostgreSQL container
docker restart "$POSTGRES_CONTAINER"

# Wait for startup (15 seconds)
sleep 15

# Verify readiness
docker exec "$POSTGRES_CONTAINER" pg_isready -U postgres
# Expected: "accepting connections"
```

**Success:** If `pg_isready` succeeds → Proceed to verification  
**Failure:** Proceed to Step 3

### Step 3: Check Logs for Corruption
```bash
# Get PostgreSQL logs
docker logs --tail 200 "$POSTGRES_CONTAINER" 2>&1 | grep -i "fatal\|panic\|corrupt"

# Common fatal errors:
# - "data directory has wrong ownership" → Permission issue
# - "could not create lock file" → Stale lock
# - "database files are incompatible" → Version mismatch
# - "could not open file" → Disk corruption
```

---

## 🔧 Recovery Procedures

### Scenario A: Container Stopped Unexpectedly
**Symptoms:** Container exited with code 0 or 1

```bash
# Check Docker daemon logs
journalctl -u docker -n 100

# Check system resources
free -h  # Memory
df -h    # Disk space

# If OOM killed, restart with memory limit
docker update --memory="2g" --memory-swap="2g" "$POSTGRES_CONTAINER"
docker restart "$POSTGRES_CONTAINER"
```

### Scenario B: Database Locked (Stale PID)
**Symptoms:** `FATAL: lock file "postmaster.pid" already exists`

```bash
# Remove stale lock file
docker exec "$POSTGRES_CONTAINER" rm -f /var/lib/postgresql/data/postmaster.pid

# Restart PostgreSQL
docker restart "$POSTGRES_CONTAINER"

# Verify
docker exec "$POSTGRES_CONTAINER" pg_isready -U postgres
```

### Scenario C: Database Corruption
**Symptoms:** `ERROR: could not read block` or `index is corrupted`

```bash
# Emergency: Restore from latest backup
cd /root/backups

# Check available backups
ls -lh *.sql.gz

# Run restore script (USE LATEST BACKUP)
bash /root/v-edfinance/scripts/database/vps-restore.sh /root/backups/latest.sql.gz

# This will:
# 1. Create safety backup of current DB
# 2. Drop corrupted database
# 3. Recreate from backup
# 4. Verify table count
```

### Scenario D: Out of Disk Space
**Symptoms:** `ENOSPC: no space left on device`

```bash
# Check disk usage
df -h

# Emergency cleanup
# 1. Delete old PostgreSQL logs
docker exec "$POSTGRES_CONTAINER" find /var/log/postgresql -name "*.log" -mtime +7 -delete

# 2. Vacuum old data
docker exec "$POSTGRES_CONTAINER" psql -U postgres -d vedfinance_staging -c "VACUUM FULL;"

# 3. Remove old backups (keep last 3)
cd /root/backups
ls -t vedfinance_staging_*.sql.gz | tail -n +4 | xargs rm -f

# 4. Clean Docker logs
truncate -s 0 /var/lib/docker/containers/*/*-json.log
```

### Scenario E: Connection Pool Exhausted
**Symptoms:** `FATAL: sorry, too many clients already`

```bash
# Check current connections
docker exec "$POSTGRES_CONTAINER" psql -U postgres -d vedfinance_staging -c \
  "SELECT COUNT(*) FROM pg_stat_activity WHERE datname = 'vedfinance_staging';"

# Kill idle connections (emergency only)
docker exec "$POSTGRES_CONTAINER" psql -U postgres -d vedfinance_staging -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
   WHERE datname = 'vedfinance_staging' AND state = 'idle' AND state_change < NOW() - INTERVAL '5 minutes';"

# Restart application to reset connection pool
docker restart <api_container>
```

---

## 🛡️ Backup Restore Procedure

### Full Database Restore (Last Resort)
```bash
# CRITICAL: This will DELETE all current data!

# Step 1: Create emergency backup of current state
EMERGENCY_BACKUP="/root/backups/emergency_$(date +%Y%m%d_%H%M%S).sql"
docker exec "$POSTGRES_CONTAINER" pg_dump -U postgres -d vedfinance_staging > "$EMERGENCY_BACKUP"

# Step 2: List available backups
ls -lh /root/backups/vedfinance_staging_*.sql.gz

# Step 3: Restore from latest healthy backup
bash /root/v-edfinance/scripts/database/vps-restore.sh /root/backups/latest.sql.gz

# Step 4: Verify data integrity
docker exec "$POSTGRES_CONTAINER" psql -U postgres -d vedfinance_staging -c \
  "SELECT COUNT(*) FROM \"User\";"
# Should return > 0

# Step 5: Run schema migrations (if needed)
cd /root/v-edfinance/apps/api
npx prisma migrate deploy
```

### Backup File Location Reference
| Environment | Backup Path | Retention |
|-------------|-------------|-----------|
| VPS Local | `/root/backups/*.sql.gz` | 7 days |
| R2 Storage | `s3://vedfinance-backups/` | 30 days |
| Latest Symlink | `/root/backups/latest.sql.gz` | Always current |

---

## 📊 Health Check Commands

### Database Connectivity
```bash
# Test connection
docker exec "$POSTGRES_CONTAINER" pg_isready -U postgres -d vedfinance_staging

# Check active connections
docker exec "$POSTGRES_CONTAINER" psql -U postgres -c \
  "SELECT count(*) as connections FROM pg_stat_activity WHERE datname = 'vedfinance_staging';"
```

### Database Integrity
```bash
# Check table count
docker exec "$POSTGRES_CONTAINER" psql -U postgres -d vedfinance_staging -c \
  "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"

# Check for corrupted indexes
docker exec "$POSTGRES_CONTAINER" psql -U postgres -d vedfinance_staging -c \
  "SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public';" | \
  xargs -I {} docker exec "$POSTGRES_CONTAINER" psql -U postgres -d vedfinance_staging -c "REINDEX INDEX {};"
```

### Performance Check
```bash
# Check query performance
docker exec "$POSTGRES_CONTAINER" psql -U postgres -d vedfinance_staging -c \
  "SELECT query, calls, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# Check database size
docker exec "$POSTGRES_CONTAINER" psql -U postgres -d vedfinance_staging -c \
  "SELECT pg_size_pretty(pg_database_size('vedfinance_staging'));"
```

---

## ✅ Recovery Verification Checklist

### Automated Verification
```bash
# Run full system verification
ssh root@103.54.153.248
cd /root/v-edfinance
bash scripts/verify-all.sh
```

### Manual Verification (Priority Order)
```bash
# 1. Database accessible
docker exec "$POSTGRES_CONTAINER" pg_isready -U postgres
# Expected: "accepting connections"

# 2. Application can connect
docker restart <api_container>
sleep 10
curl http://103.54.153.248:3001/health | jq .database
# Expected: "connected"

# 3. Key tables exist
docker exec "$POSTGRES_CONTAINER" psql -U postgres -d vedfinance_staging -c "\dt"
# Expected: List of tables including User, Course, etc.

# 4. Sample query works
docker exec "$POSTGRES_CONTAINER" psql -U postgres -d vedfinance_staging -c \
  "SELECT COUNT(*) FROM \"User\";"
# Expected: Integer > 0

# 5. Monitor for stability (10 minutes)
watch -n 30 'docker exec "$POSTGRES_CONTAINER" pg_isready -U postgres'
```

---

## 🔄 Failover Procedure (Future)

**NOTE:** Currently no failover replica configured. Priority task for Phase 2.

### Manual Promotion (When Replica Available)
```bash
# Promote standby to primary
docker exec <standby_container> pg_ctl promote -D /var/lib/postgresql/data

# Update application connection string
# Edit dokploy.yaml → DATABASE_URL

# Redeploy application
curl -X POST http://103.54.153.248:3000/api/deploy/<app_id>
```

---

## 📝 Post-Incident Actions

### Immediate (Within 30 Minutes)
1. **Document in Incident Log:** `docs/INCIDENTS.md`
2. **Create Backup Verification Bead:**
   ```bash
   beads create "Verify backup integrity and restore procedure" --type task --priority 0
   ```
3. **Check Backup Recency:**
   ```bash
   ls -lh /root/backups/latest.sql.gz
   # Should be < 24 hours old
   ```

### Short-Term (Within 24 Hours)
1. **Run Full Backup Test:**
   ```bash
   # Test backup creation
   bash /root/v-edfinance/scripts/database/vps-backup.sh
   
   # Test restore in isolated environment
   # (Use separate container for testing)
   ```

2. **Review Monitoring Gaps:**
   - Add alert for disk space < 10GB
   - Add alert for connection pool > 80% utilization
   - Add alert for query performance degradation

3. **RCA Document:** Create `docs/incidents/YYYY-MM-DD-database-failure-rca.md`

---

## 🚀 Escalation Paths

### Level 1: Automated Recovery (0-5 minutes)
- Container restart
- Stale lock removal
- Connection pool reset

### Level 2: Backup Restore (5-15 minutes)
- Restore from latest backup
- Verify data integrity
- Run schema migrations

### Level 3: Senior DBA (15-30 minutes)
- Corruption repair attempts
- Query optimization
- Failover to replica (when available)
- Contact: [Slack: #database-oncall]

### Level 4: Infrastructure Escalation (30+ minutes)
- VPS provider support (disk/network issues)
- PostgreSQL expert consultation
- Consider cloud migration
- Contact: [Slack: #critical-incidents]

---

## 📚 Related Resources
- [Database Backup Guide](../DATABASE_BACKUP_GUIDE.md)
- [VPS Database Setup](../VPS_DATABASE_SETUP_MANUAL.md)
- [Enable pg_stat_statements](../ENABLE_PG_STAT_STATEMENTS_GUIDE.md)
- [Backup Scripts](../../scripts/database/)
- [P0: Service Down](p0-service-down.md)

---

**Last Updated:** 2026-01-04  
**Owner:** Track 4 - PurpleBear  
**Review Frequency:** Monthly  
**Next Drill:** [Schedule quarterly disaster recovery drill]
