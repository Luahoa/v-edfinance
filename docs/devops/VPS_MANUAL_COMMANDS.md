# 🔧 VPS Manual Commands - Quick Reference

**VPS IP:** `103.54.153.248`  
**User:** `root`  
**SSH Session:** `amp-agent` (Bitvise saved session)

---

## 📋 Quick Command List

### 1. Connect to VPS
```bash
# Via Bitvise GUI
# Host: 103.54.153.248
# Login: root
# Session: amp-agent

# Or via command line (if SSH key configured)
ssh root@103.54.153.248
```

### 2. Setup Backup Scripts (First Time Only)

```bash
# Create scripts directory
mkdir -p /root/scripts
cd /root/scripts

# Upload scripts from Windows machine
# Method A: Use Bitvise SFTP GUI to upload:
# - scripts/database/vps-backup.sh -> /root/scripts/
# - scripts/database/vps-restore.sh -> /root/scripts/

# Method B: Create files directly on VPS (copy-paste content)
nano /root/scripts/vps-backup.sh
# Paste content from scripts/database/vps-backup.sh
# Ctrl+O to save, Ctrl+X to exit

nano /root/scripts/vps-restore.sh
# Paste content from scripts/database/vps-restore.sh

# Make executable
chmod +x /root/scripts/vps-backup.sh
chmod +x /root/scripts/vps-restore.sh

# Verify
ls -lh /root/scripts/
```

### 3. Database Operations

#### Backup Database
```bash
# Full backup with compression
bash /root/scripts/vps-backup.sh

# Expected output:
# ✅ Backup created: /root/backups/vedfinance_staging_20251222_143025.sql.gz
# 📊 Size: 2.3M
```

#### List Backups
```bash
ls -lh /root/backups/

# Example output:
# -rw-r--r-- 1 root root 2.3M Dec 22 14:30 vedfinance_staging_20251222_143025.sql.gz
# lrwxrwxrwx 1 root root   58 Dec 22 14:30 latest.sql.gz -> vedfinance_staging_20251222_143025.sql.gz
```

#### Restore Database
```bash
# From latest backup
bash /root/scripts/vps-restore.sh

# From specific backup
bash /root/scripts/vps-restore.sh /root/backups/vedfinance_staging_20251222_143025.sql.gz
```

#### Quick Database Check
```bash
# Find PostgreSQL container
docker ps | grep postgres

# List databases
POSTGRES_CONTAINER=$(docker ps --filter "ancestor=postgres:15-alpine" --format "{{.Names}}" | head -n 1)
docker exec $POSTGRES_CONTAINER psql -U postgres -l

# Count tables in staging database
docker exec $POSTGRES_CONTAINER psql -U postgres -d vedfinance_staging -c "\dt"

# Check table row counts
docker exec $POSTGRES_CONTAINER psql -U postgres -d vedfinance_staging -c "
SELECT 
    schemaname,
    tablename,
    n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
"
```

### 4. Docker Container Management

#### List Containers
```bash
docker ps

# Expected containers:
# - postgres:15-alpine (Database)
# - v-edfinance-api-staging (NestJS API)
# - v-edfinance-web-staging (Next.js Web)
# - redis:7-alpine (Cache)
```

#### Check Container Logs
```bash
# API logs
docker logs -f v-edfinance-api-staging --tail 100

# PostgreSQL logs
POSTGRES_CONTAINER=$(docker ps --filter "ancestor=postgres:15-alpine" --format "{{.Names}}" | head -n 1)
docker logs -f $POSTGRES_CONTAINER --tail 50
```

#### Restart Services
```bash
# Restart API
docker restart v-edfinance-api-staging

# Restart PostgreSQL (⚠️ Causes downtime)
POSTGRES_CONTAINER=$(docker ps --filter "ancestor=postgres:15-alpine" --format "{{.Names}}" | head -n 1)
docker restart $POSTGRES_CONTAINER
```

### 5. Download Backups to Windows

#### Via Bitvise SFTP GUI
```
1. Open Bitvise SSH Client
2. Connect to session "amp-agent"
3. Click "New SFTP window"
4. Navigate to: /root/backups/
5. Download latest.sql.gz to: C:\Users\luaho\Demo project\v-edfinance\backups\database\
```

#### Via SCP Command (if configured)
```bash
# From Windows PowerShell/CMD
scp root@103.54.153.248:/root/backups/latest.sql.gz "C:\Users\luaho\Demo project\v-edfinance\backups\database\"
```

### 6. Upload Local Backup to VPS

#### Via Bitvise SFTP GUI
```
1. Open Bitvise SFTP
2. Navigate to: /root/backups/
3. Upload from: C:\Users\luaho\Demo project\v-edfinance\backups\database\*.sql.gz
```

#### Via SCP Command
```bash
# From Windows PowerShell/CMD
scp "C:\Users\luaho\Demo project\v-edfinance\backups\database\local_backup.sql.gz" root@103.54.153.248:/root/backups/
```

---

## 🚨 Emergency Commands

### Database Won't Start
```bash
# Check PostgreSQL container status
docker ps -a | grep postgres

# View container logs
POSTGRES_CONTAINER=$(docker ps -a --filter "ancestor=postgres:15-alpine" --format "{{.Names}}" | head -n 1)
docker logs $POSTGRES_CONTAINER --tail 100

# Restart container
docker restart $POSTGRES_CONTAINER

# If still failing, check disk space
df -h
```

### Out of Disk Space
```bash
# Check disk usage
df -h
du -sh /var/lib/docker/*

# Clean old backups
find /root/backups -name "vedfinance_staging_*.sql.gz" -mtime +7 -delete

# Remove unused Docker images
docker system prune -a --volumes
```

### Database Corrupted
```bash
# Stop API to prevent writes
docker stop v-edfinance-api-staging

# Restore from latest backup
bash /root/scripts/vps-restore.sh

# Restart API
docker start v-edfinance-api-staging
```

---

## 📊 Monitoring Commands

### System Resources
```bash
# CPU and Memory usage
htop

# Or simple version
top

# Disk I/O
iostat -x 1

# Network connections
netstat -tulpn | grep :3000
```

### Database Performance
```bash
POSTGRES_CONTAINER=$(docker ps --filter "ancestor=postgres:15-alpine" --format "{{.Names}}" | head -n 1)

# Active connections
docker exec $POSTGRES_CONTAINER psql -U postgres -d vedfinance_staging -c "
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
"

# Slow queries
docker exec $POSTGRES_CONTAINER psql -U postgres -d vedfinance_staging -c "
SELECT pid, now() - query_start as duration, query 
FROM pg_stat_activity 
WHERE state = 'active' AND now() - query_start > interval '5 seconds';
"

# Database size
docker exec $POSTGRES_CONTAINER psql -U postgres -d vedfinance_staging -c "
SELECT pg_size_pretty(pg_database_size('vedfinance_staging'));
"
```

### Application Health
```bash
# API health check
curl http://localhost:3000/api/health

# Or from external
curl http://103.54.153.248:3001/api/health

# Check API logs for errors
docker logs v-edfinance-api-staging --since 1h | grep ERROR
```

---

## 🔐 Security Commands

### Firewall Status
```bash
# Check UFW status
ufw status verbose

# Allow new port (if needed)
ufw allow 3000/tcp

# Reload firewall
ufw reload
```

### Failed Login Attempts
```bash
# Check auth logs
tail -n 100 /var/log/auth.log | grep "Failed password"

# Block suspicious IPs (if needed)
ufw deny from <IP_ADDRESS>
```

### SSH Key Management
```bash
# View authorized keys
cat ~/.ssh/authorized_keys

# Add new key
echo "ssh-ed25519 AAAA... user@host" >> ~/.ssh/authorized_keys

# Set correct permissions
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

---

## 🎯 Common Workflows

### Daily Backup
```bash
# Run manually or verify cron
bash /root/scripts/vps-backup.sh

# Check backup size
ls -lh /root/backups/latest.sql.gz
```

### Deploy New Code
```bash
# Dokploy auto-deploys from GitHub on push to staging branch
# To manually redeploy:
# 1. Go to http://103.54.153.248:3000 (Dokploy Dashboard)
# 2. Find v-edfinance-api-staging
# 3. Click "Redeploy"

# Or via Docker
docker restart v-edfinance-api-staging
```

### Sync Local to Staging
```bash
# 1. Backup current staging (safety)
bash /root/scripts/vps-backup.sh

# 2. Upload local backup to VPS
# (Use Bitvise SFTP GUI)

# 3. Restore uploaded backup
bash /root/scripts/vps-restore.sh /root/backups/local_backup.sql.gz

# 4. Verify data
docker exec $POSTGRES_CONTAINER psql -U postgres -d vedfinance_staging -c "\dt"
```

---

## 📚 Related Files

- [DATABASE_BACKUP_GUIDE.md](docs/DATABASE_BACKUP_GUIDE.md) - Complete backup guide
- [DEVOPS_GUIDE.md](DEVOPS_GUIDE.md) - VPS infrastructure setup
- [dokploy.yaml](dokploy.yaml) - Container orchestration config
- [VPS_BACKUP_QUICK_START.bat](VPS_BACKUP_QUICK_START.bat) - Windows automation script

---

## 🆘 Support

**If stuck, check these in order:**
1. Container logs: `docker logs <container_name>`
2. Disk space: `df -h`
3. System resources: `top` or `htop`
4. Database connections: See "Monitoring Commands" section
5. Firewall: `ufw status`

**Last Updated:** 2025-12-22  
**Maintainer:** Amp Agent
