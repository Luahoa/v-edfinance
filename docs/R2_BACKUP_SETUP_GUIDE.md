# R2 Backup Setup Guide

## Prerequisites

1. **Cloudflare R2 Bucket Created:** `v-edfinance-backup`
2. **R2 API Token:** With read/write access to bucket
3. **rclone Installed:** On VPS or local machine

---

## Step 1: Install rclone (VPS)

```bash
# SSH to VPS
ssh deployer@103.54.153.248

# Install rclone
curl https://rclone.org/install.sh | sudo bash

# Verify installation
rclone version
```

---

## Step 2: Configure R2 Remote

```bash
rclone config

# Choose: n (New remote)
# Name: r2
# Storage: 5 (S3 compatible)
# Provider: 4 (Cloudflare R2)
# env_auth: false
# access_key_id: <YOUR_R2_ACCESS_KEY>
# secret_access_key: <YOUR_R2_SECRET_KEY>
# region: auto
# endpoint: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
# acl: private
# Edit advanced config: n
# Keep this remote: y
# Quit config: q
```

---

## Step 3: Test R2 Connection

```bash
# List buckets
rclone lsd r2:

# Should show: v-edfinance-backup

# Test upload
echo "test" > /tmp/test.txt
rclone copy /tmp/test.txt r2:v-edfinance-backup/test/

# Verify upload
rclone ls r2:v-edfinance-backup/test/

# Clean up test
rclone delete r2:v-edfinance-backup/test/
```

---

## Step 4: Setup Automated Backup (VPS via Dokploy)

### Option A: Docker Cron Container (Recommended)

Create `docker-compose.backup.yml`:

```yaml
version: '3.8'

services:
  backup-cron:
    image: alpine:latest
    container_name: vedfinance-backup-cron
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./scripts/backup-to-r2.sh:/backup-to-r2.sh:ro
      - ./backups:/backups
      - ~/.config/rclone:/root/.config/rclone:ro
    environment:
      - TZ=Asia/Ho_Chi_Minh
    command: >
      sh -c "apk add --no-cache docker-cli rclone gzip &&
             echo '0 3 * * * /backup-to-r2.sh >> /var/log/backup.log 2>&1' | crontab - &&
             crond -f -l 2"
```

Deploy:

```bash
# On VPS
docker-compose -f docker-compose.backup.yml up -d

# Check logs
docker logs vedfinance-backup-cron
```

---

### Option B: Dokploy Scheduled Task

In Dokploy dashboard:

1. Go to **Scheduled Tasks**
2. **Create New Task:**
   - Name: `postgres-backup-to-r2`
   - Schedule: `0 3 * * *` (Daily 3AM)
   - Command: `/opt/scripts/backup-to-r2.sh`
   - Container: Link to postgres container

---

## Step 5: Manual Backup Test

```bash
# On VPS
cd /opt/v-edfinance
chmod +x scripts/backup-to-r2.sh
./scripts/backup-to-r2.sh

# Check output
cat /backups/postgres/last_backup.log

# Verify R2
rclone ls r2:v-edfinance-backup/postgres/
```

---

## Step 6: Restore Test (CRITICAL)

```bash
# Download latest backup from R2
LATEST=$(rclone ls r2:v-edfinance-backup/postgres/ | tail -n 1 | awk '{print $2}')
rclone copy "r2:v-edfinance-backup/postgres/$LATEST" /tmp/

# Test restore to temporary database
gunzip -c "/tmp/$LATEST" | docker exec -i vedfinance-postgres psql -U postgres -d postgres

# Verify data integrity
docker exec -it vedfinance-postgres psql -U postgres -c "SELECT count(*) FROM \"User\";"
```

---

## Step 7: Windows Local Backup (Development)

```powershell
# Install rclone (Windows)
# Download from: https://rclone.org/downloads/
# Add to PATH

# Configure R2 (same as Linux)
rclone config

# Run backup
.\scripts\backup-to-r2.ps1

# Schedule with Task Scheduler (optional)
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-File C:\path\to\backup-to-r2.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 3am
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "VEdFinance-Backup"
```

---

## Monitoring & Alerts

### Check Backup Health

```bash
# On VPS (weekly check)
cat /backups/postgres/last_backup.log

# R2 backup count (should be ~30 files for 30-day retention)
rclone ls r2:v-edfinance-backup/postgres/ | wc -l
```

### Uptime Kuma Integration

Add HTTP check to Uptime Kuma:
- **URL:** `http://103.54.153.248:3000/api/backup/health` (custom endpoint)
- **Expected:** `{"status":"ok","lastBackup":"2025-12-23T03:00:00Z"}`
- **Alert:** If last backup > 48 hours old

---

## Disaster Recovery Procedure

### Full Database Restore

```bash
# 1. Download backup
RESTORE_DATE="20251223_030000"  # Adjust to desired backup
rclone copy "r2:v-edfinance-backup/postgres/vedfinance_all_${RESTORE_DATE}.sql.gz" /tmp/

# 2. Stop API (prevent writes)
docker-compose stop api

# 3. Restore database
gunzip -c "/tmp/vedfinance_all_${RESTORE_DATE}.sql.gz" | \
  docker exec -i vedfinance-postgres psql -U postgres

# 4. Verify data
docker exec -it vedfinance-postgres psql -U postgres -c "\dt"

# 5. Restart API
docker-compose start api

# 6. Health check
curl http://localhost:3000/api/health
```

**Expected RTO (Recovery Time Objective):** < 15 minutes  
**Expected RPO (Recovery Point Objective):** < 24 hours (daily backups)

---

## Cost Estimation

### Cloudflare R2 Pricing

- **Storage:** $0.015/GB/month
- **Class A Operations (uploads):** $4.50/million
- **Class B Operations (downloads):** $0.36/million

**Monthly Estimate:**
- Backup size: ~500 MB/day (compressed)
- Monthly storage: 15 GB × $0.015 = $0.225
- Daily uploads: 30 × $0.0000045 = $0.000135
- **Total:** ~$0.23/month (negligible)

---

## Troubleshooting

### Error: "rclone config not found"
```bash
# Re-run rclone config
rclone config
```

### Error: "Permission denied"
```bash
# Fix script permissions
chmod +x scripts/backup-to-r2.sh
```

### Error: "PostgreSQL container not found"
```bash
# Check container name
docker ps | grep postgres

# Update script if name differs
# Edit: POSTGRES_CONTAINER="your-container-name"
```

---

## Success Criteria

- ✅ Daily backups running automatically at 3AM
- ✅ Backups uploaded to R2 within 5 minutes
- ✅ 30-day retention enforced (old backups deleted)
- ✅ Weekly restore test passes (verifies backup integrity)
- ✅ Monitoring alert if backup fails

---

**Setup Time:** 30-45 minutes  
**Next:** Monitor `/backups/postgres/last_backup.log` daily for first week
