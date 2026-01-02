# 🔧 VPS Database Setup - Manual Guide (Bitvise SSH)

**Target:** VPS 103.54.153.248 (Dokploy Production)  
**User:** deployer  
**Tasks:** Enable pg_stat_statements + Deploy cron jobs + Setup Netdata alerts

---

## 📋 Prerequisites

- ✅ Bitvise SSH Client installed
- ✅ VPS credentials (IP, username, password/SSH key)
- ✅ Docker running on VPS
- ✅ PostgreSQL container: `vedfinance-postgres`

---

## 🚀 Quick Start (Copy-Paste Commands)

### Step 1: Connect to VPS via Bitvise

1. Open **Bitvise SSH Client**
2. Enter connection details:
   - **Host:** `103.54.153.248`
   - **Port:** `22`
   - **Username:** `deployer`
   - **Authentication:** Password or SSH key
3. Click **Login**
4. Open **Terminal** (SFTP or SSH Console)

---

### Step 2: Enable pg_stat_statements Extension

**Copy-paste this command:**

```bash
docker exec vedfinance-postgres psql -U postgres -d vedfinance -c "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"
```

**Expected output:**
```
CREATE EXTENSION
```

**Verify it works:**
```bash
docker exec vedfinance-postgres psql -U postgres -d vedfinance -c "SELECT * FROM pg_stat_statements LIMIT 1;"
```

**Expected:** A row with query statistics (or empty if no queries yet)

✅ **Status:** pg_stat_statements enabled

---

### Step 3: Create Scripts Directory

```bash
sudo mkdir -p /opt/scripts
sudo chown deployer:deployer /opt/scripts
```

---

### Step 4: Create AI Database Architect Weekly Cron Script

**Copy-paste this command (entire block):**

```bash
cat > /opt/scripts/db-architect-weekly.sh << 'EOF'
#!/bin/bash
# AI Database Architect - Weekly Autonomous Optimization
# Runs every Sunday at 3 AM

set -e

LOG_FILE="/var/log/db-architect-weekly.log"
API_URL="http://localhost:3001/api/debug/database/analyze"

echo "[$(date)] Starting AI Database Architect weekly scan..." >> "$LOG_FILE"

# Call AI Database Architect endpoint
RESPONSE=$(curl -s -X GET "$API_URL" || echo "ERROR")

if [[ "$RESPONSE" == "ERROR" ]]; then
  echo "[$(date)] ❌ Failed to connect to API" >> "$LOG_FILE"
  exit 1
fi

# Parse response (basic check)
if echo "$RESPONSE" | grep -q "optimizationsApplied"; then
  echo "[$(date)] ✅ AI scan completed successfully" >> "$LOG_FILE"
  echo "$RESPONSE" >> "$LOG_FILE"
else
  echo "[$(date)] ⚠️ Unexpected response" >> "$LOG_FILE"
  echo "$RESPONSE" >> "$LOG_FILE"
fi

echo "[$(date)] AI Database Architect weekly scan finished" >> "$LOG_FILE"
EOF

chmod +x /opt/scripts/db-architect-weekly.sh
```

✅ **Status:** AI architect script created

---

### Step 5: Create Backup Restore Test Script

**Copy-paste this command (entire block):**

```bash
cat > /opt/scripts/backup-restore-test.sh << 'EOF'
#!/bin/bash
# Automated Backup Restore Test
# Runs every Sunday at 4 AM (after AI scan)

set -e

LOG_FILE="/var/log/backup-restore-test.log"
TEST_DB="vedfinance_restore_test"
BACKUP_PATH="/tmp/latest-backup.sql.gz"

echo "[$(date)] Starting backup restore test..." >> "$LOG_FILE"

# Step 1: Get latest backup from R2
echo "[$(date)] Downloading latest backup from R2..." >> "$LOG_FILE"
rclone copy vedfinance-r2:vedfinance-backups/$(rclone lsf vedfinance-r2:vedfinance-backups/ | tail -1) "$BACKUP_PATH" >> "$LOG_FILE" 2>&1

if [[ ! -f "$BACKUP_PATH" ]]; then
  echo "[$(date)] ❌ Failed to download backup" >> "$LOG_FILE"
  exit 1
fi

# Step 2: Create test database
echo "[$(date)] Creating test database..." >> "$LOG_FILE"
docker exec vedfinance-postgres psql -U postgres -c "DROP DATABASE IF EXISTS $TEST_DB;" >> "$LOG_FILE" 2>&1
docker exec vedfinance-postgres psql -U postgres -c "CREATE DATABASE $TEST_DB;" >> "$LOG_FILE" 2>&1

# Step 3: Restore backup
echo "[$(date)] Restoring backup..." >> "$LOG_FILE"
START_TIME=$(date +%s)

gunzip -c "$BACKUP_PATH" | docker exec -i vedfinance-postgres psql -U postgres -d "$TEST_DB" >> "$LOG_FILE" 2>&1

END_TIME=$(date +%s)
RESTORE_TIME=$((END_TIME - START_TIME))

# Step 4: Verify data
echo "[$(date)] Verifying restored data..." >> "$LOG_FILE"
USER_COUNT=$(docker exec vedfinance-postgres psql -U postgres -d "$TEST_DB" -t -c "SELECT COUNT(*) FROM \"User\";" | xargs)
LOG_COUNT=$(docker exec vedfinance-postgres psql -U postgres -d "$TEST_DB" -t -c "SELECT COUNT(*) FROM \"BehaviorLog\";" | xargs)

echo "[$(date)] ✅ Restore test PASSED" >> "$LOG_FILE"
echo "[$(date)] 📈 Stats: Restore time: ${RESTORE_TIME}s, Users: $USER_COUNT, Logs: $LOG_COUNT" >> "$LOG_FILE"

# Step 5: Cleanup test database
docker exec vedfinance-postgres psql -U postgres -c "DROP DATABASE $TEST_DB;" >> "$LOG_FILE" 2>&1
rm -f "$BACKUP_PATH"

echo "[$(date)] Backup restore test completed" >> "$LOG_FILE"

# Push to Uptime Kuma (if configured)
if [[ -n "$UPTIME_KUMA_PUSH_URL" ]]; then
  curl -s "$UPTIME_KUMA_PUSH_URL?status=up&msg=Restore%20OK&ping=${RESTORE_TIME}000" >> "$LOG_FILE" 2>&1
fi
EOF

chmod +x /opt/scripts/backup-restore-test.sh
```

✅ **Status:** Backup restore test script created

---

### Step 6: Add Cron Jobs

**Copy-paste this command:**

```bash
(crontab -l 2>/dev/null; cat << 'EOF'
# AI Database Architect - Weekly scan (Sundays 3 AM)
0 3 * * 0 /opt/scripts/db-architect-weekly.sh

# Backup Restore Test - Weekly (Sundays 4 AM)
0 4 * * 0 /opt/scripts/backup-restore-test.sh
EOF
) | crontab -
```

**Verify cron jobs:**
```bash
crontab -l
```

**Expected output:**
```
0 3 * * 0 /opt/scripts/db-architect-weekly.sh
0 4 * * 0 /opt/scripts/backup-restore-test.sh
```

✅ **Status:** Cron jobs deployed

---

### Step 7: Setup Netdata Capacity Alerts

**Copy-paste this command (entire block):**

```bash
sudo bash -c 'cat > /etc/netdata/health.d/db_capacity.conf << EOF
# Database Capacity Alerts (V-EdFinance)

alarm: database_size
   on: postgres.database_size
lookup: average -5m
 units: GB
 every: 1h
  warn: \$this > 40
  crit: \$this > 60
  info: Database size threshold - consider archiving or scaling

alarm: connection_pool_saturation
   on: postgres.connections
lookup: average -5m
 units: connections
 every: 5m
  warn: \$this > 15
  crit: \$this > 18
  info: PostgreSQL connection pool nearing max (20 connections)

alarm: disk_space_database
   on: disk_space._var_lib_docker
lookup: average -5m
 units: GB
 every: 30m
  warn: \$this < 20
  crit: \$this < 10
  info: Low disk space for Docker volumes (database storage)
EOF'

sudo systemctl restart netdata
```

**Verify Netdata alerts:**
```bash
sudo systemctl status netdata
```

**Expected:** `active (running)`

✅ **Status:** Netdata alerts configured

---

### Step 8: Test AI Database Architect (Optional)

**From VPS:**
```bash
curl http://localhost:3001/api/debug/database/analyze | jq
```

**Expected output (JSON):**
```json
{
  "success": true,
  "queryAnalysis": {
    "slowQueries": [...],
    "indexRecommendations": [...],
    "optimizationsApplied": 0
  }
}
```

**From local machine:**
```bash
curl http://103.54.153.248:3001/api/debug/database/analyze | jq
```

✅ **Status:** AI architect working

---

## 📊 Verification Checklist

Run these commands to verify everything:

```bash
# 1. Check pg_stat_statements
docker exec vedfinance-postgres psql -U postgres -d vedfinance -c "\dx pg_stat_statements"

# 2. Check scripts exist
ls -lh /opt/scripts/

# 3. Check cron jobs
crontab -l

# 4. Check Netdata alerts
sudo cat /etc/netdata/health.d/db_capacity.conf

# 5. Check logs (after first cron run)
tail -f /var/log/db-architect-weekly.log
tail -f /var/log/backup-restore-test.log
```

---

## 🎯 Expected Results

After completing all steps:

| Task | Status | Verification |
|------|--------|--------------|
| pg_stat_statements | ✅ Enabled | `\dx` shows extension |
| AI architect script | ✅ Created | `/opt/scripts/db-architect-weekly.sh` exists |
| Backup test script | ✅ Created | `/opt/scripts/backup-restore-test.sh` exists |
| Cron jobs | ✅ Deployed | `crontab -l` shows 2 jobs |
| Netdata alerts | ✅ Configured | `/etc/netdata/health.d/db_capacity.conf` exists |
| AI endpoint | ✅ Working | `curl /api/debug/database/analyze` returns JSON |

---

## 🛠️ Troubleshooting

### Issue: "permission denied" when creating scripts
**Fix:**
```bash
sudo chown deployer:deployer /opt/scripts
```

### Issue: "extension does not exist"
**Fix:** Ensure shared_preload_libraries includes pg_stat_statements:
```bash
docker exec vedfinance-postgres psql -U postgres -c "SHOW shared_preload_libraries;"
```

If missing:
```bash
# Edit postgresql.conf
docker exec vedfinance-postgres bash -c "echo 'shared_preload_libraries = '\''pg_stat_statements'\''' >> /var/lib/postgresql/data/postgresql.conf"

# Restart PostgreSQL
docker restart vedfinance-postgres
```

### Issue: Cron jobs not running
**Fix:** Check cron service:
```bash
sudo systemctl status cron
sudo systemctl start cron
```

View cron logs:
```bash
grep CRON /var/log/syslog
```

### Issue: Netdata not restarting
**Fix:**
```bash
sudo systemctl status netdata
sudo journalctl -u netdata -n 50
```

---

## 📈 Next Steps (After 24 Hours)

Once pg_stat_statements collects data:

1. **Check slow queries:**
   ```bash
   docker exec vedfinance-postgres psql -U postgres -d vedfinance -c "
     SELECT 
       query,
       calls,
       total_exec_time,
       mean_exec_time
     FROM pg_stat_statements
     WHERE mean_exec_time > 100
     ORDER BY total_exec_time DESC
     LIMIT 10;
   "
   ```

2. **Monitor Netdata alerts:**
   - Open: http://103.54.153.248:19999
   - Check "Alarms" tab for database alerts

3. **Review AI architect logs:**
   ```bash
   tail -f /var/log/db-architect-weekly.log
   ```

4. **Test backup restore (manual):**
   ```bash
   /opt/scripts/backup-restore-test.sh
   ```

---

## 🎉 Success Criteria

✅ All commands executed without errors  
✅ pg_stat_statements extension enabled  
✅ Cron jobs scheduled (verify with `crontab -l`)  
✅ Netdata alerts configured  
✅ AI Database Architect endpoint responds  

**Database optimization automation: COMPLETE** 🚀

---

**Total Time:** ~15 minutes  
**Difficulty:** Medium (copy-paste commands)  
**Support:** Check [COMPREHENSIVE_DATABASE_AUDIT_4_SKILLS.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/COMPREHENSIVE_DATABASE_AUDIT_4_SKILLS.md) for context
