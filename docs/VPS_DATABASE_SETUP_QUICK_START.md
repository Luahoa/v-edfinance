# 🚀 VPS Database Setup - Quick Start Guide

**Goal:** Enable pg_stat_statements + Deploy AI automation + Setup monitoring alerts

**Time:** 5-15 minutes (depending on method)

---

## 🎯 Choose Your Method

### ✅ **Option A: E2B Automated (Recommended)**
**Best for:** Hands-off automation, repeatable deployments  
**Requirements:** E2B API key  
**Time:** 5 minutes

### ✅ **Option B: Bitvise SSH Manual**
**Best for:** Step-by-step control, learning the setup  
**Requirements:** Bitvise SSH Client, VPS credentials  
**Time:** 15 minutes

### ✅ **Option C: Direct VPS Script**
**Best for:** Already SSH'd into VPS, one-line setup  
**Requirements:** VPS SSH access  
**Time:** 3 minutes

---

## 📦 Option A: E2B Automated Deployment

### 1. Setup E2B Credentials

**Copy .env.e2b.example to .env.e2b:**
```bash
copy .env.e2b.example .env.e2b
```

**Edit .env.e2b and add your credentials:**
```env
E2B_API_KEY=e2b_xxxxxxxxxxxxxxxxxxxxxxxx
VPS_HOST=103.54.153.248
VPS_USER=deployer
VPS_PASSWORD=your_password
```

### 2. Install Dependencies

```bash
cd "c:/Users/luaho/Demo project/v-edfinance"
pnpm add @e2b/code-interpreter
```

### 3. Run E2B Deployment

```bash
npx tsx scripts/e2b-vps-database-setup.ts
```

**Expected output:**
```
🚀 E2B VPS Database Setup - Starting...
📦 Creating E2B sandbox...
✅ Sandbox created: sbx_xxxxxxxx
✅ Loaded vps-database-setup.sh
📤 Uploading setup script to sandbox...
✅ Script uploaded

🔧 Task 1: Enable pg_stat_statements...
✅ pg_stat_statements enabled

🔧 Task 2: Deploy cron jobs (AI architect + backup testing)...
  ✅ Uploaded db-architect-weekly.sh
  ✅ Uploaded backup-restore-test.sh
✅ Cron jobs deployed

🔧 Task 3: Setup Netdata capacity alerts...
✅ Netdata alerts configured

🔍 Task 4: Verification...
✅ Verification passed

🧹 Sandbox terminated

═════════════════════════════════════════════════════════════
📊 DEPLOYMENT SUMMARY
═════════════════════════════════════════════════════════════
✅ Enable pg_stat_statements: SUCCESS
✅ Deploy cron jobs: SUCCESS
✅ Setup Netdata alerts: SUCCESS
✅ Verification: SUCCESS
═════════════════════════════════════════════════════════════
Total: 4 tasks | Success: 4 | Failed: 0
═════════════════════════════════════════════════════════════

🎉 All tasks completed successfully!

📈 Next steps:
  1. Wait 24 hours for pg_stat_statements data
  2. Test AI Database Architect: GET /api/debug/database/analyze
  3. Monitor Netdata alerts: http://103.54.153.248:19999
```

**Done!** ✅

---

## 📦 Option B: Bitvise SSH Manual

**Follow step-by-step guide:**

📖 [VPS_DATABASE_SETUP_MANUAL.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/docs/VPS_DATABASE_SETUP_MANUAL.md)

**Summary:**
1. Connect to VPS via Bitvise
2. Copy-paste 7 commands
3. Verify setup
4. Done! ✅

---

## 📦 Option C: Direct VPS Script

**If you're already SSH'd into VPS:**

### 1. Upload Setup Script to VPS

**From local machine:**
```bash
# Using SCP
scp scripts/vps-database-setup.sh deployer@103.54.153.248:/tmp/

# Or using Bitvise SFTP
# Drag vps-database-setup.sh to /tmp/ on VPS
```

### 2. Run Setup Script on VPS

**SSH into VPS:**
```bash
ssh deployer@103.54.153.248
```

**Run setup:**
```bash
bash /tmp/vps-database-setup.sh
```

**Expected output:**
```
═══════════════════════════════════════════════════════════
🔧 V-EdFinance VPS Database Setup
═══════════════════════════════════════════════════════════

📋 Checking prerequisites...
✅ Docker installed
✅ PostgreSQL container running

═══════════════════════════════════════════════════════════
🚀 Task 1: Enable pg_stat_statements Extension
═══════════════════════════════════════════════════════════
✅ pg_stat_statements extension enabled
✅ Extension verification passed

═══════════════════════════════════════════════════════════
🚀 Task 2: Create Scripts Directory
═══════════════════════════════════════════════════════════
✅ Scripts directory created: /opt/scripts

═══════════════════════════════════════════════════════════
🚀 Task 3: Deploy AI Database Architect Weekly Script
═══════════════════════════════════════════════════════════
✅ AI architect script deployed

═══════════════════════════════════════════════════════════
🚀 Task 4: Deploy Backup Restore Test Script
═══════════════════════════════════════════════════════════
✅ Backup restore test script deployed

═══════════════════════════════════════════════════════════
🚀 Task 5: Deploy Cron Jobs
═══════════════════════════════════════════════════════════
✅ Cron jobs deployed

═══════════════════════════════════════════════════════════
🚀 Task 6: Setup Netdata Capacity Alerts
═══════════════════════════════════════════════════════════
✅ Netdata alerts configured

═══════════════════════════════════════════════════════════
🔍 Task 7: Verification
═══════════════════════════════════════════════════════════
Checking pg_stat_statements... ✅ Working
Checking scripts... ✅ All scripts present
Checking cron jobs... ✅ Cron jobs configured
Checking Netdata alerts... ✅ Alerts configured

═══════════════════════════════════════════════════════════
🎉 VPS Database Setup Complete!
═══════════════════════════════════════════════════════════

📊 Summary:
  ✅ pg_stat_statements extension enabled
  ✅ AI Database Architect script deployed
  ✅ Backup restore test script deployed
  ✅ Cron jobs scheduled (Sundays 3AM & 4AM)
  ✅ Netdata capacity alerts configured

📈 Next Steps:
  1. Wait 24 hours for pg_stat_statements to collect data
  2. Test AI Database Architect:
     curl http://localhost:3001/api/debug/database/analyze | jq

  3. Monitor logs:
     tail -f /var/log/db-architect-weekly.log
     tail -f /var/log/backup-restore-test.log

  4. Check Netdata alerts:
     http://103.54.153.248:19999

═══════════════════════════════════════════════════════════
```

**Done!** ✅

---

## 🔍 Verification (All Methods)

After deployment, verify everything works:

### 1. Check pg_stat_statements

**From VPS:**
```bash
docker exec vedfinance-postgres psql -U postgres -d vedfinance -c "\dx pg_stat_statements"
```

**Expected:**
```
                                      List of installed extensions
       Name        | Version | Schema |                        Description
-------------------+---------+--------+-----------------------------------------------------------
 pg_stat_statements | 1.10    | public | track planning and execution statistics of all SQL statements
```

### 2. Check Cron Jobs

**From VPS:**
```bash
crontab -l
```

**Expected:**
```
# V-EdFinance Database Automation
# AI Database Architect - Weekly scan (Sundays 3 AM)
0 3 * * 0 /opt/scripts/db-architect-weekly.sh

# Backup Restore Test - Weekly (Sundays 4 AM)
0 4 * * 0 /opt/scripts/backup-restore-test.sh
```

### 3. Check Scripts

**From VPS:**
```bash
ls -lh /opt/scripts/
```

**Expected:**
```
-rwxr-xr-x 1 deployer deployer 1.2K Dec 23 12:00 db-architect-weekly.sh
-rwxr-xr-x 1 deployer deployer 2.3K Dec 23 12:00 backup-restore-test.sh
```

### 4. Test AI Database Architect

**From local machine:**
```bash
curl http://103.54.153.248:3001/api/debug/database/analyze | jq
```

**Expected (JSON response):**
```json
{
  "success": true,
  "queryAnalysis": {
    "slowQueries": [],
    "indexRecommendations": [],
    "optimizationsApplied": 0
  }
}
```

### 5. Check Netdata Alerts

**Open in browser:**
```
http://103.54.153.248:19999
```

**Navigate to:** Alarms tab → Look for:
- `database_size`
- `connection_pool_saturation`
- `disk_space_database`

---

## 📊 Success Criteria

✅ pg_stat_statements extension enabled  
✅ 2 cron jobs scheduled (db-architect-weekly, backup-restore-test)  
✅ 2 scripts in /opt/scripts/  
✅ 3 Netdata alerts configured  
✅ AI Database Architect endpoint responds  
✅ No errors in verification steps

**If all ✅, setup is COMPLETE!** 🎉

---

## 🛠️ Troubleshooting

### Issue: E2B fails with "connection refused"
**Fix:** Check VPS_PASSWORD in .env.e2b is correct

### Issue: "pg_stat_statements does not exist"
**Fix:** Ensure shared_preload_libraries includes it:
```bash
docker exec vedfinance-postgres psql -U postgres -c "SHOW shared_preload_libraries;"
```

### Issue: Cron jobs not visible
**Fix:** Check cron service:
```bash
sudo systemctl status cron
```

### Issue: Netdata not showing database alerts
**Fix:** Restart Netdata:
```bash
sudo systemctl restart netdata
```

---

## 📈 What Happens Next?

**After 24 hours of pg_stat_statements data collection:**

1. **AI Database Architect** will analyze slow queries
2. **Weekly cron job** (Sundays 3AM) will auto-optimize database
3. **Backup test** (Sundays 4AM) will verify restore reliability
4. **Netdata alerts** will notify if capacity thresholds breached

**You can relax** - the system is now **autonomous** ✅

---

## 📚 References

- **E2B Script:** [scripts/e2b-vps-database-setup.ts](file:///c:/Users/luaho/Demo%20project/v-edfinance/scripts/e2b-vps-database-setup.ts)
- **Manual Guide:** [docs/VPS_DATABASE_SETUP_MANUAL.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/docs/VPS_DATABASE_SETUP_MANUAL.md)
- **VPS Script:** [scripts/vps-database-setup.sh](file:///c:/Users/luaho/Demo%20project/v-edfinance/scripts/vps-database-setup.sh)
- **Audit Report:** [COMPREHENSIVE_DATABASE_AUDIT_4_SKILLS.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/COMPREHENSIVE_DATABASE_AUDIT_4_SKILLS.md)

---

**Choose your method and go!** 🚀
