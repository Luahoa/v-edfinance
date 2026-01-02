# 🚀 V-EdFinance - VPS Deployment Quick Guide
**Date:** 2025-12-23  
**Target:** root@103.54.153.248  
**Mission:** Deploy 4-Skills Database Optimization to VPS

---

## ⚡ One-Command Deployment

```bash
# From Git Bash or WSL
bash scripts/deploy-4-skills-optimization.sh
```

**What it does:**
1. ✅ Checks SSH connection to VPS
2. ✅ Enables pg_stat_statements (Query Optimizer AI)
3. ✅ Verifies query tracking is working
4. ✅ Deploys Netdata capacity alerts (7 alerts)
5. ✅ Tests Query Optimizer API endpoints

**Expected Duration:** 5-10 minutes (includes PostgreSQL restart)

---

## 📋 Manual Step-by-Step (If Script Fails)

### **Step 1: Test SSH Connection**

```bash
# Test SSH access
ssh root@103.54.153.248

# Should see VPS shell prompt
# Type 'exit' to return
```

**If fails:**
- Check VPS is online: `ping 103.54.153.248`
- Verify SSH key is in `~/.ssh/`
- Check firewall allows port 22

---

### **Step 2: Enable pg_stat_statements** (P0 - Critical)

```bash
# From local machine (Git Bash/WSL)
bash scripts/enable-vps-pg-stat-statements.sh
```

**What it does:**
```
📦 Finding PostgreSQL container...
✅ Found container: abc123
   Name: vedfinance-postgres

📋 Checking current configuration...
   Current: shared_preload_libraries = 
   ⚠️  Not configured, will add and restart

📝 Adding pg_stat_statements to postgresql.conf...
   ✅ Configuration updated

🔄 Restarting PostgreSQL container...
   ⏳ Waiting 15 seconds...
   ✅ PostgreSQL restarted successfully

📝 Creating extension in databases...
   ✅ vedfinance_prod: Enabled (pg_stat_statements | 1.10)
   ✅ vedfinance_staging: Enabled (pg_stat_statements | 1.10)

📊 Verifying query stats collection...
   Currently tracking: 0 queries
   ⚠️  No queries yet (normal for fresh install)

✅ pg_stat_statements enablement complete!
```

**Downtime:** ~15 seconds (PostgreSQL restart)

---

### **Step 3: Verify Query Tracking**

```bash
# Wait 5 minutes for queries to accumulate
sleep 300

# Check tracking
bash scripts/check-vps-pg-stat-statements.sh
```

**Expected Output:**
```
✅ Extension enabled (version 1.10)
📊 Tracking 47 queries
🔝 Top 3 slowest queries:
   1. SELECT * FROM BehaviorLog... (avg: 145ms)
   2. SELECT COUNT(*) FROM User... (avg: 78ms)
   3. INSERT INTO BehaviorLog... (avg: 12ms)
```

---

### **Step 4: Deploy Netdata Alerts** (P1 - High Priority)

```bash
# From local machine
bash scripts/deploy-netdata-alerts.sh
```

**What it deploys:**

| Alert Name | Threshold | Action |
|------------|-----------|--------|
| **vedfinance_db_size_warn** | >40GB | Email alert |
| **vedfinance_db_size_critical** | >60GB | Critical alert |
| **behaviorlog_growth_rate** | >500MB/h | Check logging |
| **pg_connection_usage_high** | >80% | Scale connections |
| **pg_slow_queries** | >1s avg | Optimize queries |
| **pg_cache_hit_ratio_low** | <90% | Tune buffers |
| **vps_disk_usage_warn** | >70% | Cleanup disk |

**Access Dashboard:**
```
http://103.54.153.248:19999
Navigate to: Alarms → Database Capacity
```

---

### **Step 5: Test Query Optimizer API**

```bash
# Test all endpoints
curl http://103.54.153.248:3001/debug/query-optimizer/analyze?threshold=100

curl http://103.54.153.248:3001/debug/query-optimizer/indexes/usage

curl http://103.54.153.248:3001/debug/query-optimizer/indexes/unused

curl http://103.54.153.248:3001/debug/query-optimizer/capacity/tables
```

**Expected Response (analyze):**
```json
{
  "analyzed": 47,
  "threshold": "100ms",
  "recommendations": [
    {
      "query": "SELECT * FROM BehaviorLog WHERE userId = $1...",
      "metrics": {
        "calls": 1250,
        "meanTime": 145,
        "totalTime": 181250,
        "cacheHitRatio": 87
      },
      "issues": [
        {
          "type": "low_cache_hit",
          "severity": "medium",
          "message": "Cache hit ratio: 87% (target: >90%)"
        }
      ],
      "recommendations": [
        {
          "action": "create_index",
          "description": "Consider index on: userId, timestamp"
        }
      ]
    }
  ],
  "timestamp": "2025-12-23T..."
}
```

---

## 🔍 Verification Checklist

**After deployment, verify:**

- [ ] **pg_stat_statements enabled**
  ```bash
  ssh root@103.54.153.248 "docker exec vedfinance-postgres psql -U postgres -d vedfinance_prod -c 'SELECT COUNT(*) FROM pg_stat_statements;'"
  # Should show: count > 0
  ```

- [ ] **Query Optimizer API working**
  ```bash
  curl http://103.54.153.248:3001/debug/query-optimizer/analyze | jq
  # Should show: JSON response with analyzed queries
  ```

- [ ] **Netdata alerts loaded**
  ```
  Open: http://103.54.153.248:19999
  Navigate to: Alarms
  Search for: "vedfinance" or "pg_"
  # Should see: 7 database alerts
  ```

- [ ] **Connection pool optimized**
  ```bash
  # Check API logs
  ssh root@103.54.153.248 "docker logs vedfinance-api 2>&1 | grep 'optimized connection pool'"
  # Should show: "Drizzle ORM initialized with optimized connection pool (max: 20, idle: 30s)"
  ```

---

## 🚨 Troubleshooting

### **Issue 1: SSH Connection Failed**

```bash
# Check VPS is reachable
ping 103.54.153.248

# Test SSH with verbose
ssh -v root@103.54.153.248

# Check SSH key exists
ls ~/.ssh/ | grep vedfinance
```

**Fix:**
- Ensure SSH key is in `~/.ssh/`
- Add to SSH config: `ssh-add ~/.ssh/vedfinance_vps`
- Check VPS firewall allows port 22

---

### **Issue 2: PostgreSQL Container Not Found**

```bash
# SSH to VPS
ssh root@103.54.153.248

# List containers
docker ps | grep postgres

# If not running
docker start <container_id>
```

---

### **Issue 3: pg_stat_statements Not Tracking Queries**

**Cause:** Extension enabled but no queries executed yet

**Fix:**
```bash
# Wait 5-10 minutes
# Then run some queries manually
curl http://103.54.153.248:3001/api/courses
curl http://103.54.153.248:3001/api/health

# Check again
bash scripts/check-vps-pg-stat-statements.sh
```

---

### **Issue 4: Netdata Not Installed**

**Symptoms:** `deploy-netdata-alerts.sh` fails with "netdata not found"

**Fix:**
```bash
# SSH to VPS
ssh root@103.54.153.248

# Install Netdata
bash <(curl -Ss https://my-netdata.io/kickstart.sh)

# Reload script
bash scripts/deploy-netdata-alerts.sh
```

---

### **Issue 5: Query Optimizer API Returns 404**

**Cause:** API not deployed yet or module not loaded

**Fix:**
```bash
# Check API is running
ssh root@103.54.153.248 "docker ps | grep api"

# If running, restart API to load new module
ssh root@103.54.153.248 "docker restart vedfinance-api"

# Wait 30 seconds
sleep 30

# Test again
curl http://103.54.153.248:3001/debug/query-optimizer/analyze
```

---

## 📊 Post-Deployment Monitoring

### **Daily Checks (First Week)**

```bash
# Check slow queries
curl http://103.54.153.248:3001/debug/query-optimizer/analyze?threshold=200 | jq '.recommendations | length'

# Check index usage
curl http://103.54.153.248:3001/debug/query-optimizer/indexes/usage | jq

# Check database size
curl http://103.54.153.248:3001/debug/query-optimizer/capacity/tables | jq
```

### **Weekly Review**

```bash
# Generate weekly optimization report
curl http://103.54.153.248:3001/debug/query-optimizer/analyze?threshold=100 > weekly-optimization-$(date +%Y%m%d).json

# Check for unused indexes
curl http://103.54.153.248:3001/debug/query-optimizer/indexes/unused | jq

# Review Netdata alerts
# Open: http://103.54.153.248:19999/alarms
```

---

## 📚 Related Documentation

- **Main Report:** [4_SKILLS_DATABASE_OPTIMIZATION_COMPLETE.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/4_SKILLS_DATABASE_OPTIMIZATION_COMPLETE.md)
- **Audit Report:** [COMPREHENSIVE_AUDIT_AND_OPTIMIZATION_ROADMAP_2025-12-23.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/COMPREHENSIVE_AUDIT_AND_OPTIMIZATION_ROADMAP_2025-12-23.md)
- **Phase 2 Report:** [PHASE2_DATABASE_OPTIMIZATION_REPORT.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/PHASE2_DATABASE_OPTIMIZATION_REPORT.md)

---

## ✅ Success Criteria

**Deployment is successful when:**

1. ✅ pg_stat_statements tracking > 20 queries
2. ✅ Query Optimizer API returns JSON (not 404)
3. ✅ Netdata shows 7 database alerts
4. ✅ API logs show "optimized connection pool (max: 20)"
5. ✅ No PostgreSQL errors in `docker logs`

**Database Score Projection:**
- **Before:** 8.6/10
- **After deployment:** 9.5/10

---

**Deployment Guide Created:** 2025-12-23  
**VPS Target:** root@103.54.153.248  
**Estimated Time:** 10-15 minutes  
**Downtime:** ~15 seconds (PostgreSQL restart only)
