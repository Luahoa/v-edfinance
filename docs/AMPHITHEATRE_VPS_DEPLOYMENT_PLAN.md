# 🚀 VPS Database Deployment - Amphitheatre Orchestration Plan

**Epic:** Enable pg_stat_statements + Deploy AI Automation (VPS 103.54.153.248)  
**Framework:** Amphitheatre Multi-Agent Coordination  
**Estimated Time:** 5-8 minutes (fully automated)

---

## 🎯 Agent Roles Assignment

### Agent 1: DeployCommander (Primary)
**Responsibilities:**
- SSH connection to VPS
- Execute setup script
- Verify deployment success

**Skills Used:** ssh2, docker, bash

### Agent 2: DatabaseArchitect (Support)
**Responsibilities:**
- Enable pg_stat_statements extension
- Verify schema integrity
- Setup database monitoring

**Skills Used:** PostgreSQL DBA Pro, Query Optimizer AI

### Agent 3: BackupKeeper (Support)
**Responsibilities:**
- Deploy backup restore test script
- Schedule R2 sync cron job
- Verify backup reliability

**Skills Used:** Database Reliability Engineering

### Agent 4: MonitoringSentinel (Support)
**Responsibilities:**
- Configure Netdata capacity alerts
- Setup cron job for AI architect weekly scan
- Verify monitoring endpoints

**Skills Used:** DevOps-Toolkit AI

---

## 📊 Orchestration Phases

### Phase 1: Pre-Deployment Validation (Parallel)
**Agents:** All (concurrent execution)

```typescript
await Promise.all([
  DeployCommander.validateVpsConnection(),      // SSH to 103.54.153.248
  DatabaseArchitect.checkPostgresRunning(),     // docker ps | grep postgres
  BackupKeeper.verifyR2Access(),                // rclone ls vedfinance-r2
  MonitoringSentinel.checkNetdataStatus()       // systemctl status netdata
]);
```

**Success Criteria:**
- ✅ SSH connection successful
- ✅ PostgreSQL container running
- ✅ R2 bucket accessible
- ✅ Netdata service active

**If Failed:** Abort deployment + generate diagnostic report

---

### Phase 2: Extension Enablement (Sequential - Blocking)
**Agent:** DatabaseArchitect (solo task)

```bash
# CRITICAL: Must complete before any queries run
docker exec vedfinance-postgres psql -U postgres -d vedfinance \
  -c "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"
```

**Success Criteria:**
- ✅ Extension created (or already exists)
- ✅ Query to pg_stat_statements succeeds

**Why Sequential:** Schema lock required - no parallel operations

---

### Phase 3: Script Deployment (Parallel)
**Agents:** BackupKeeper + MonitoringSentinel

```typescript
await Promise.all([
  // BackupKeeper
  BackupKeeper.deployScript({
    name: 'backup-restore-test.sh',
    path: '/opt/scripts/',
    permissions: 'chmod +x'
  }),
  
  // MonitoringSentinel
  MonitoringSentinel.deployScript({
    name: 'db-architect-weekly.sh',
    path: '/opt/scripts/',
    permissions: 'chmod +x'
  })
]);
```

**Success Criteria:**
- ✅ Both scripts uploaded to VPS:/opt/scripts/
- ✅ Execute permissions granted
- ✅ Scripts syntax validation passed

---

### Phase 4: Cron Job Scheduling (Parallel)
**Agents:** BackupKeeper + MonitoringSentinel

```typescript
await Promise.all([
  // BackupKeeper
  BackupKeeper.scheduleCron({
    schedule: '0 4 * * 0',  // Sundays 4 AM
    command: '/opt/scripts/backup-restore-test.sh'
  }),
  
  // MonitoringSentinel
  MonitoringSentinel.scheduleCron({
    schedule: '0 3 * * 0',  // Sundays 3 AM
    command: '/opt/scripts/db-architect-weekly.sh'
  })
]);
```

**Success Criteria:**
- ✅ Cron jobs added to crontab
- ✅ No duplicate entries
- ✅ Cron service active

---

### Phase 5: Monitoring Configuration (Sequential)
**Agent:** MonitoringSentinel (solo task)

```bash
# Create Netdata alerts
sudo bash -c 'cat > /etc/netdata/health.d/db_capacity.conf << EOF
alarm: database_size
   on: postgres.database_size
 warn: \$this > 40
 crit: \$this > 60
EOF'

sudo systemctl restart netdata
```

**Success Criteria:**
- ✅ Alert config file created
- ✅ Netdata restarted successfully
- ✅ Alerts visible in dashboard

**Why Sequential:** systemctl restart netdata is disruptive

---

### Phase 6: Verification (Parallel)
**Agents:** All (final checks)

```typescript
await Promise.all([
  DatabaseArchitect.verifyExtension(),       // SELECT FROM pg_stat_statements
  BackupKeeper.verifyScripts(),              // ls /opt/scripts/
  MonitoringSentinel.verifyCronJobs(),       // crontab -l
  MonitoringSentinel.verifyNetdataAlerts()   // curl /api/v1/alarms
]);
```

**Success Criteria:**
- ✅ pg_stat_statements returns data
- ✅ 2 scripts exist in /opt/scripts/
- ✅ 2 cron jobs scheduled
- ✅ 3 Netdata alerts configured

---

## 🔄 Agent Communication Flow

```
DeployCommander (Orchestrator)
    ↓ [BROADCAST: Start Deployment]
    ↓
┌───┴────┬──────────┬───────────┐
│        │          │           │
v        v          v           v
DB       Backup     Monitoring  
Architect Keeper    Sentinel    
    ↓        ↓          ↓
[Phase 1: Validate]
    ↓        ↓          ↓
    └────────┴──────────┘
            ↓
    [SIGNAL: Ready]
            ↓
    DB Architect (solo)
            ↓
    [Phase 2: Enable Extension]
            ↓
    [SIGNAL: Extension OK]
            ↓
    ┌───────┴────────┐
    v                v
Backup Keeper   Monitoring Sentinel
    ↓                ↓
[Phase 3-4: Deploy Scripts + Cron]
    ↓                ↓
    └────────────────┘
            ↓
    [SIGNAL: Scripts Ready]
            ↓
    Monitoring Sentinel (solo)
            ↓
    [Phase 5: Configure Netdata]
            ↓
    [SIGNAL: Monitoring OK]
            ↓
    ┌───────┴────────┬───────┐
    v                v       v
[Phase 6: All Agents Verify]
    ↓                ↓       ↓
    └────────────────┴───────┘
            ↓
    [BROADCAST: Deployment Complete]
```

---

## 📊 Execution Timeline (Expected)

| Phase | Duration | Agents | Parallel? |
|-------|----------|--------|-----------|
| 1. Validation | 30s | 4 | ✅ Yes |
| 2. Enable Extension | 10s | 1 | ❌ No |
| 3. Deploy Scripts | 40s | 2 | ✅ Yes |
| 4. Schedule Cron | 20s | 2 | ✅ Yes |
| 5. Configure Netdata | 30s | 1 | ❌ No |
| 6. Verification | 40s | 4 | ✅ Yes |
| **Total** | **~3 min** | **4 agents** | **66% parallel** |

**Traditional (manual):** 15-20 minutes  
**Time Saved:** 80% faster 🚀

---

## 🛡️ Error Handling Strategy

### Agent-Level Failures

```yaml
if: DatabaseArchitect.enableExtension() fails
then:
  - retry: 2 times (exponential backoff)
  - if still fails:
      - capture docker logs
      - check postgresql.conf
      - notify user with diagnostic
      - abort deployment (CRITICAL failure)

if: BackupKeeper.deployScript() fails
then:
  - retry: 1 time
  - if still fails:
      - continue deployment (NON-CRITICAL)
      - log warning
      - create manual task in beads
```

### Rollback Strategy

```bash
# If Phase 2-5 fails, automatic rollback:
- Remove partial cron entries
- Delete /opt/scripts/*.sh
- Revert Netdata config
- Drop extension (if partially created)
```

---

## 🎯 Success Metrics

**Deployment Score:** Pass if ≥ 90% criteria met

| Metric | Target | Weight |
|--------|--------|--------|
| pg_stat_statements enabled | ✅ | 40% |
| Scripts deployed | ✅ | 20% |
| Cron jobs scheduled | ✅ | 20% |
| Netdata alerts configured | ✅ | 15% |
| Verification passed | ✅ | 5% |

**Minimum Passing:** 3.6/4.0 (90%)

---

## 🚀 Execution Command

**Automated (Amphitheatre Orchestrator):**

```bash
npx tsx scripts/amphitheatre-vps-deploy.ts
```

**Manual (DevOps-Toolkit Workflow):**

```bash
VPS_DEPLOY_NOW.bat
```

---

## 📈 Post-Deployment Monitoring

**Agent:** MonitoringSentinel (autonomous)

**Tasks:**
1. Monitor Netdata for 24 hours
2. Verify pg_stat_statements data collection
3. Test AI Database Architect endpoint
4. Generate deployment report

**First Check (24h):**
```bash
curl http://103.54.153.248:3001/api/debug/database/analyze | jq
```

**Expected:**
```json
{
  "success": true,
  "queryAnalysis": {
    "slowQueries": [/* 10+ queries analyzed */],
    "indexRecommendations": [/* AI suggestions */],
    "optimizationsApplied": 0  // First run
  }
}
```

---

## 🎯 Next Epic (Auto-Triggered After Success)

**Epic:** AI Database Architect - Autonomous Weekly Optimization  
**Status:** Scheduled (Sundays 3 AM)  
**Agent:** DatabaseArchitect (autonomous)

**Workflow:**
```yaml
weekly_optimization:
  trigger: cron (0 3 * * 0)
  agent: DatabaseArchitect
  tasks:
    - analyze pg_stat_statements
    - detect slow queries
    - recommend indexes
    - apply safe optimizations (confidence > 90%)
    - log to OptimizationLog table
    - notify if manual intervention needed
```

---

**Ready to execute?** Run: `npx tsx scripts/amphitheatre-vps-deploy.ts`

**Or manual:** Double-click `VPS_DEPLOY_NOW.bat`
