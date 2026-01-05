# VPS Deployment Issues - Resolution Plan

**Created:** 2026-01-05  
**Beads Tasks:** ved-k90x, ved-4qk5, ved-8yqm, ved-f23s, ved-v6mu  
**Priority:** P1 (Critical Path)

---

## 📊 Issue Analysis (via Beads Trinity)

### Graph Insights:
- **ved-f23s** → **ved-v6mu** (dependency chain)
- All issues are independent (can be parallelized)
- No blocking dependencies on existing work

### Recommended Order (bv --robot-next):
1. **ved-8yqm** (P1) - PostgreSQL verification
2. **ved-k90x** (P1) - Grafana mount fix
3. **ved-f23s** (P2) - R2 configuration
4. **ved-v6mu** (P2) - Test backup script (blocked by ved-f23s)
5. **ved-4qk5** (P2) - Beszel volume fix

---

## 🎯 Issues Catalog

### Issue 1: ved-k90x - Grafana Mount Issue (P1)

**Symptom:**
```
Error: read-only file system
Failed to mount /etc/grafana/provisioning/dashboards/dashboards.yml
```

**Root Cause:**
Docker compose trying to mount file before directory exists in container.

**Solution:**
- Option A: Use volume mounts instead of file mounts
- Option B: Create init container to setup directories
- Option C: **RECOMMENDED** - Use bind mount for entire provisioning directory

**Implementation:**
```yaml
# docker-compose.monitoring.yml
grafana:
  volumes:
    - grafana-data:/var/lib/grafana
    - ./monitoring/grafana:/etc/grafana/provisioning:ro  # Directory mount
```

**Beads Command:**
```bash
bd update ved-k90x --status in_progress
# Fix implementation
bd close ved-k90x --reason "Fixed Grafana mount by using directory bind mount"
```

---

### Issue 2: ved-4qk5 - Beszel Volume Issue (P2)

**Symptom:**
```
Error: lstat /var/lib/docker/rootfs/overlayfs/.../beszel/data: not a directory
```

**Root Cause:**
Docker volume path conflict with existing file/directory.

**Solution:**
- Skip Beszel deployment (non-critical tool)
- Alternative: Use different volume path
- **RECOMMENDED:** Comment out Beszel from docker-compose

**Implementation:**
```yaml
# docker-compose.monitoring.yml
# Comment out beszel and beszel-agent services
# beszel:
#   ...
# beszel-agent:
#   ...
```

**Beads Command:**
```bash
bd update ved-4qk5 --status in_progress
bd close ved-4qk5 --reason "Skipped Beszel deployment - non-critical, volume conflict"
```

---

### Issue 3: ved-8yqm - PostgreSQL Verification (P1)

**Symptom:**
PostgreSQL config uploaded but container not started.

**Root Cause:**
dokploy.yaml references PostgreSQL but we haven't deployed via Dokploy yet.

**Solution:**
Deploy PostgreSQL standalone first, then migrate to Dokploy.

**Implementation:**
```bash
# Create standalone PostgreSQL container
docker run -d \
  --name v-edfinance-postgres \
  --network v-edfinance-monitoring \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  -v /root/v-edfinance/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql \
  -e POSTGRES_PASSWORD=<strong-password> \
  pgvector/pgvector:pg17

# Verify extensions
docker exec v-edfinance-postgres psql -U postgres -d vedfinance_staging -c "\dx"
```

**Verification:**
```sql
SELECT * FROM pg_extension WHERE extname IN ('pgvector', 'pg_stat_statements');
SELECT COUNT(*) FROM pg_stat_statements;
```

**Beads Command:**
```bash
bd update ved-8yqm --status in_progress
# Deploy PostgreSQL
bd close ved-8yqm --reason "PostgreSQL deployed with pgvector + pg_stat_statements verified"
```

---

### Issue 4: ved-f23s - Configure Cloudflare R2 (P2)

**Symptom:**
Rclone installed but not configured.

**Solution:**
Configure Rclone with Cloudflare R2 credentials.

**Implementation:**
```bash
# SSH into VPS
ssh vps

# Configure rclone interactively (or via config file)
rclone config create r2 s3 \
  provider=Cloudflare \
  access_key_id=<R2_ACCESS_KEY> \
  secret_access_key=<R2_SECRET_KEY> \
  endpoint=https://<ACCOUNT_ID>.r2.cloudflarestorage.com

# Test connection
rclone lsd r2:v-edfinance-backups
```

**Beads Command:**
```bash
bd update ved-f23s --status in_progress
# Configure R2
bd close ved-f23s --reason "Rclone configured with R2 credentials, connection verified"
```

---

### Issue 5: ved-v6mu - Test Backup Script (P2)

**Symptom:**
Backup script uploaded but not tested.

**Dependencies:**
- **BLOCKED BY:** ved-f23s (needs R2 configured)

**Solution:**
Manually execute backup script and verify upload to R2.

**Implementation:**
```bash
# SSH into VPS
ssh vps

# Make script executable (already done)
chmod +x /root/v-edfinance/scripts/backup-to-r2.sh

# Run backup manually
/root/v-edfinance/scripts/backup-to-r2.sh

# Verify upload
rclone ls r2:v-edfinance-backups/
```

**Verification:**
- Check backup file exists in R2
- Verify file size > 0
- Test restore (download and inspect)

**Beads Command:**
```bash
bd update ved-v6mu --status in_progress --deps blocks:ved-f23s
# Test backup
bd close ved-v6mu --reason "Backup script tested, verified upload to R2"
```

---

## 📋 Execution Plan

### Phase 1: Critical Fixes (P1) - 30 minutes

```bash
# 1. Fix Grafana (ved-k90x)
bd update ved-k90x --status in_progress
# Edit docker-compose.monitoring.yml (use directory mount)
# Redeploy: docker compose -f docker-compose.monitoring.yml up -d grafana
bd close ved-k90x --reason "Grafana deployed successfully"

# 2. Deploy PostgreSQL (ved-8yqm)
bd update ved-8yqm --status in_progress
# Deploy standalone PostgreSQL container
# Verify extensions with psql
bd close ved-8yqm --reason "PostgreSQL + extensions verified"
```

### Phase 2: Backup Setup (P2) - 20 minutes

```bash
# 3. Configure R2 (ved-f23s)
bd update ved-f23s --status in_progress
# rclone config with R2 credentials
bd close ved-f23s --reason "R2 configured and tested"

# 4. Test Backup (ved-v6mu)
bd update ved-v6mu --status in_progress
# Execute backup-to-r2.sh manually
bd close ved-v6mu --reason "Backup tested and verified"
```

### Phase 3: Cleanup (P2) - 10 minutes

```bash
# 5. Skip Beszel (ved-4qk5)
bd update ved-4qk5 --status in_progress
# Comment out in docker-compose.monitoring.yml
bd close ved-4qk5 --reason "Beszel skipped - non-critical"
```

**Total Time:** ~60 minutes

---

## ✅ Success Criteria

### Must Have:
- [x] 4/6 monitoring tools running (Prometheus, Netdata, Uptime Kuma, Glances)
- [ ] 5/6 monitoring tools running (+ Grafana)
- [ ] PostgreSQL running with pgvector + pg_stat_statements
- [ ] R2 backup tested and verified

### Nice to Have:
- [ ] Beszel running (optional)
- [ ] All monitoring dashboards configured
- [ ] Automated backup cron verified

---

## 🔄 Beads Sync Protocol

After completing all tasks:

```bash
# Verify all tasks closed
bd ready

# Check for blockers
bd doctor

# Sync to git
bd sync

# Verify sync
git status
```

---

## 📊 Monitoring Status After Fixes

**Target State:**
- ✅ Prometheus: http://103.54.153.248:9090
- ✅ Netdata: http://103.54.153.248:19999
- ✅ Uptime Kuma: http://103.54.153.248:3002
- ✅ Glances: http://103.54.153.248:61208
- ⏳ Grafana: http://103.54.153.248:3003 (pending fix)
- ❌ Beszel: Skipped (non-critical)

---

**Generated by:** Beads Trinity Analysis  
**Next:** Execute Phase 1 tasks
