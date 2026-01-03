# P0 Incident Runbook: Service Down

**Severity:** P0 (Critical)  
**MTTR Target:** 5 minutes  
**Status:** Active

---

## 🚨 Detection

### Automated Alerts
- Uptime Kuma: Service unavailable (3 consecutive failures)
- Prometheus: `up{job="api"} == 0` for > 1 minute
- Health Check: `http://103.54.153.248:3001/health` returns 5xx

### Manual Detection
- Users report "Cannot access application"
- Staging/Production URL not responding
- Dokploy dashboard shows container as "Stopped"

### Quick Diagnosis Commands
```bash
# Check service status on VPS
ssh root@103.54.153.248
docker ps | grep vedfinance

# Check container logs (last 50 lines)
docker logs --tail 50 <container_name>

# Check Dokploy status
curl http://103.54.153.248:3000/api/health
```

---

## ⚡ Immediate Actions (First 2 Minutes)

### Step 1: Verify Outage Scope
```bash
# Check if issue is local or global
curl -I http://103.54.153.248:3001/health  # API
curl -I http://103.54.153.248:3002         # Web

# Expected healthy response: HTTP/2 200
```

**Escalation:** If both services down → Database/VPS issue → See [p0-database-failure.md](p0-database-failure.md)

### Step 2: Attempt Quick Restart
```bash
# SSH to VPS
ssh root@103.54.153.248

# Find stopped container
CONTAINER=$(docker ps -a --filter "status=exited" --filter "name=vedfinance" --format "{{.Names}}" | head -n 1)

# Restart container
docker restart $CONTAINER

# Verify recovery (wait 10 seconds)
sleep 10
curl http://103.54.153.248:3001/health
```

**Success:** If service responds → Monitor for 5 minutes → Proceed to RCA  
**Failure:** Proceed to Step 3

### Step 3: Check Logs for Error Pattern
```bash
# Get last 100 lines with errors
docker logs --tail 100 $CONTAINER 2>&1 | grep -i "error\|fatal\|exception"

# Common patterns:
# - "ECONNREFUSED" → Database connection issue
# - "Out of memory" → Memory leak → See p0-memory-leak.md
# - "Port already in use" → Conflicting process
# - "ENOSPC" → Disk full
```

---

## 🔧 Recovery Procedures

### Scenario A: Database Connection Failure
**Symptoms:** `ECONNREFUSED` or `Connection refused` in logs

```bash
# Check PostgreSQL container
docker ps | grep postgres

# If not running, restart
POSTGRES_CONTAINER=$(docker ps -a --filter "name=postgres" --format "{{.Names}}" | head -n 1)
docker restart $POSTGRES_CONTAINER

# Wait for DB to be ready (15 seconds)
sleep 15

# Restart application
docker restart $CONTAINER
```

### Scenario B: Port Conflict
**Symptoms:** `EADDRINUSE` or `Port already in use`

```bash
# Find process using port 3001 (API) or 3002 (Web)
netstat -tulpn | grep :3001

# Kill conflicting process
kill -9 <PID>

# Restart service
docker restart $CONTAINER
```

### Scenario C: Disk Full
**Symptoms:** `ENOSPC` or `no space left on device`

```bash
# Check disk usage
df -h

# Emergency cleanup: Delete old Docker logs
truncate -s 0 /var/lib/docker/containers/*/*-json.log

# Remove unused images
docker image prune -a -f

# Restart service
docker restart $CONTAINER
```

### Scenario D: Configuration Error
**Symptoms:** Service crashes immediately after restart

```bash
# Rollback to last working deployment
cd /root/v-edfinance
git log --oneline -5  # Find last commit hash

# Deploy previous version via Dokploy
# Or manual rollback:
git checkout <previous_commit_hash>
docker-compose up -d --build
```

---

## 🛡️ Rollback Procedure

### Manual Rollback (Dokploy)
1. Access Dokploy dashboard: http://103.54.153.248:3000
2. Navigate to application → Deployments
3. Click "Rollback" on last successful deployment
4. Wait for deployment complete (~2 minutes)
5. Verify: `curl http://103.54.153.248:3001/health`

### Emergency Rollback (CLI)
```bash
# SSH to VPS
ssh root@103.54.153.248
cd /root/v-edfinance

# Get last 5 commits
git log --oneline -5

# Rollback to previous commit
git checkout <commit_hash>

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Verify
curl http://103.54.153.248:3001/health
```

---

## 📊 Common Causes (Historical Data)

| Cause | Frequency | Typical Fix Time | Prevention |
|-------|-----------|------------------|------------|
| Database connection timeout | 40% | 2 min | Increase connection pool timeout |
| Memory leak (Node.js) | 25% | 5 min | See p0-memory-leak.md |
| Deployment failure | 20% | 3 min | Run quality gates before deploy |
| Disk full (logs) | 10% | 4 min | Configure log rotation |
| Port conflict | 5% | 1 min | Use Docker networks properly |

---

## ✅ Recovery Verification

### Health Check Checklist
```bash
# 1. API Health
curl http://103.54.153.248:3001/health
# Expected: {"status":"ok","database":"connected","uptime":XXX}

# 2. Web Access
curl -I http://103.54.153.248:3002
# Expected: HTTP/2 200

# 3. Database Connection
docker exec <api_container> npx prisma db pull --preview-feature
# Expected: Success (no errors)

# 4. Monitor for 5 minutes
watch -n 10 'curl -s http://103.54.153.248:3001/health | jq .status'
```

### Full System Verification
```bash
# Run comprehensive verification script
ssh root@103.54.153.248
cd /root/v-edfinance
bash scripts/verify-all.sh
```

---

## 📝 Post-Incident Actions

### Required Documentation (Within 1 Hour)
1. **Update Incident Log:** `docs/INCIDENTS.md`
   ```markdown
   ## INC-YYYY-MM-DD-NNN: Service Down
   - **Date:** YYYY-MM-DD HH:MM UTC
   - **Severity:** P0
   - **Duration:** X minutes
   - **Root Cause:** [Brief description]
   - **Resolution:** [What fixed it]
   - **Action Items:** [Beads created]
   ```

2. **Create Follow-up Beads:**
   ```bash
   # Example: If memory leak found
   beads create "Fix memory leak in auth service" --type task --priority 0
   
   # Example: If monitoring gap found
   beads create "Add alert for database connection pool exhaustion" --type task --priority 1
   ```

### RCA Template (Within 24 Hours)
Create `docs/incidents/YYYY-MM-DD-service-down-rca.md`:
- Timeline of events
- Root cause analysis (5 Whys)
- Contributing factors
- Preventive measures
- Monitoring improvements

---

## 🚀 Escalation Paths

### Level 1: Self-Service (0-5 minutes)
- Run automated recovery scripts
- Restart services via Dokploy
- Check common causes above

### Level 2: On-Call Engineer (5-15 minutes)
- Deep log analysis
- Database integrity check
- Manual rollback if needed
- Contact: [Slack: #ops-oncall]

### Level 3: Senior DevOps (15+ minutes)
- Infrastructure-level issues
- VPS provider problems
- Database corruption
- Contact: [Slack: #critical-incidents]

### Level 4: Vendor Support (30+ minutes)
- Dokploy: support@dokploy.com
- VPS Provider: [Support ticket portal]
- Cloudflare (if DNS): [Dashboard]

---

## 📚 Related Runbooks
- [P0: Database Failure](p0-database-failure.md)
- [P0: Memory Leak](p0-memory-leak.md)
- [P1: Login Failure](p1-login-failure.md)
- [Rollback Procedures](../ROLLBACK_PROCEDURES.md)

---

**Last Updated:** 2026-01-04  
**Owner:** Track 4 - PurpleBear  
**Review Frequency:** Monthly
