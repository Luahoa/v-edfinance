# 📦 V-EdFinance Database Backup & VPS Sync Guide

**Date:** 2025-12-22  
**Target VPS:** `103.54.153.248` (Dokploy Staging)  
**SSH Key:** `temp_pub_key.pub`

---

## 🎯 Quick Overview

This guide covers three backup strategies:

| Strategy | Use Case | Script |
|----------|----------|--------|
| **Local Backup** | Daily snapshots before major changes | `backup-to-vps.bat` |
| **VPS Sync** | Deploy local data to staging | Manual SCP + Docker restore |
| **VPS → Local** | Pull production data for testing | `restore-from-vps.bat` |

---

## 🔐 Prerequisites

### 1. SSH Key Setup

**Current SSH Key:**
- Location: `c:/Users/luaho/Demo project/v-edfinance/temp_pub_key.pub`
- Target: `root@103.54.153.248`

**Setup Steps:**
```bash
# On your Windows machine:
# 1. Copy SSH key to standard location
mkdir %USERPROFILE%\.ssh
copy temp_pub_key.pub %USERPROFILE%\.ssh\vedfinance_vps.pub

# 2. Create private key (if not exists)
# Use PuTTYgen to convert or generate matching private key
# Save as: %USERPROFILE%\.ssh\vedfinance_vps

# 3. Test connection
ssh -i %USERPROFILE%\.ssh\vedfinance_vps root@103.54.153.248
```

**On VPS (First Time Only):**
```bash
# Add your public key to authorized_keys
ssh root@103.54.153.248  # Use password initially
mkdir -p ~/.ssh
nano ~/.ssh/authorized_keys  # Paste temp_pub_key.pub content
chmod 600 ~/.ssh/authorized_keys
exit

# Test key-based login
ssh -i %USERPROFILE%\.ssh\vedfinance_vps root@103.54.153.248
# Should login without password
```

### 2. VPS Database Configuration

**Current Dokploy Setup (from dokploy.yaml):**
```yaml
# Staging Database
DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/vedfinance_staging?schema=public

# Container Name (typically): dokploy-postgres
```

**Verify VPS Database:**
```bash
ssh root@103.54.153.248
docker ps | grep postgres  # Find container name
docker exec -it dokploy-postgres psql -U postgres -l
# Should see: vedfinance_staging, vedfinance_dev
```

---

## 📤 Backup Local Database to VPS

### Option 1: Automated Script (Recommended)

```bash
# Run backup script
.\scripts\database\backup-to-vps.bat

# What it does:
# ✅ Checks Docker status
# ✅ Creates timestamped backup file
# ✅ Dumps local PostgreSQL database
# ✅ Compresses backup (ZIP)
# ✅ Shows upload commands
```

**Output Example:**
```
✅ Database dumped to: backups\database\vedfinance_20251222_143025.sql
✅ Backup compressed: vedfinance_20251222_143025.sql.zip
```

### Option 2: Manual Backup

```bash
# 1. Dump database from Docker
docker exec vedfinance-postgres pg_dump -U postgres -d postgres > backup.sql

# 2. Upload to VPS
scp -i %USERPROFILE%\.ssh\vedfinance_vps backup.sql root@103.54.153.248:/root/backups/

# 3. Restore on VPS
ssh root@103.54.153.248
docker exec -i dokploy-postgres psql -U postgres -d vedfinance_staging < /root/backups/backup.sql
```

---

## 📥 Restore from VPS to Local

### Option 1: Automated Script

```bash
# Run restore script
.\scripts\database\restore-from-vps.bat

# What it does:
# ✅ Prompts for manual download
# ✅ Extracts backup ZIP
# ⚠️  Drops local database
# ✅ Restores from backup
```

### Option 2: Manual Restore

```bash
# 1. Download from VPS
scp -i %USERPROFILE%\.ssh\vedfinance_vps root@103.54.153.248:/root/backups/latest.sql ./backups/database/

# 2. Restore to local Docker
docker exec -i vedfinance-postgres psql -U postgres -c "DROP DATABASE IF EXISTS postgres;"
docker exec -i vedfinance-postgres psql -U postgres -c "CREATE DATABASE postgres;"
docker exec -i vedfinance-postgres psql -U postgres -d postgres < backups\database\latest.sql

# 3. Sync schema
cd apps/api
npx prisma migrate deploy
npx prisma generate
```

---

## 🔄 Sync Strategies

### Strategy 1: Local → VPS (Deploy Seed Data)

**Use Case:** Deploying test seed data to staging for E2E tests

```bash
# 1. Seed local database with demo data
pnpm db:seed:demo  # 50 users, 10 courses

# 2. Backup local database
.\scripts\database\backup-to-vps.bat

# 3. Upload to VPS
scp -i %USERPROFILE%\.ssh\vedfinance_vps backups\database\*.zip root@103.54.153.248:/root/backups/demo.sql.zip

# 4. Restore on VPS staging
ssh root@103.54.153.248
cd /root/backups
unzip demo.sql.zip
docker exec -i dokploy-postgres psql -U postgres -d vedfinance_staging < demo.sql
```

### Strategy 2: VPS → Local (Test Production Data)

**Use Case:** Debugging production issues locally

```bash
# 1. Create backup on VPS
ssh root@103.54.153.248
docker exec dokploy-postgres pg_dump -U postgres -d vedfinance_staging > /root/backups/production_$(date +%Y%m%d).sql

# 2. Download to local
scp -i %USERPROFILE%\.ssh\vedfinance_vps root@103.54.153.248:/root/backups/production_*.sql ./backups/database/

# 3. Restore locally
.\scripts\database\restore-from-vps.bat
```

### Strategy 3: Automated Daily Sync

**Setup Cron on VPS (Already configured in dokploy.yaml):**
```yaml
# From dokploy.yaml:
backups:
  enabled: true
  schedule: "0 3 * * *"  # Daily at 3 AM
  retention: 7  # Keep 7 days
  databases:
    - postgres
```

**Access Backups:**
```bash
ssh root@103.54.153.248
ls -lh /var/lib/dokploy/backups/
# Should see daily snapshots
```

---

## 🛡️ Security Best Practices

### 1. Never Commit Backup Files
```bash
# Already in .gitignore:
backups/
*.sql
*.sql.zip
```

### 2. Encrypt Sensitive Backups
```bash
# Before uploading to cloud storage:
gpg --symmetric --cipher-algo AES256 backup.sql
# Creates: backup.sql.gpg
```

### 3. Rotate SSH Keys Quarterly
```bash
# Generate new keypair every 3 months
ssh-keygen -t ed25519 -f vedfinance_vps_2025Q2
# Update temp_pub_key.pub and VPS authorized_keys
```

---

## 📊 Backup Retention Policy

| Environment | Retention | Location | Automated |
|-------------|-----------|----------|-----------|
| **Local Dev** | 3 days | `backups/database/` | ❌ Manual |
| **VPS Staging** | 7 days | `/var/lib/dokploy/backups/` | ✅ Cron |
| **VPS Production** | 30 days | Cloudflare R2 | ✅ Dokploy |

**Local Cleanup (Run Weekly):**
```bash
# Delete backups older than 3 days
forfiles /p "backups\database" /s /m *.sql /d -3 /c "cmd /c del @path"
```

---

## 🐛 Troubleshooting

### Issue 1: SSH Connection Refused

**Symptoms:**
```
ssh: connect to host 103.54.153.248 port 22: Connection refused
```

**Solutions:**
```bash
# 1. Check VPS firewall
ssh root@103.54.153.248  # Use Hetzner console if SSH fails
ufw status
ufw allow 22/tcp  # Ensure SSH is allowed

# 2. Verify SSH service is running
systemctl status ssh

# 3. Check Cloudflare is not blocking
# Disable proxy for IP-based access in Cloudflare DNS
```

### Issue 2: pg_dump Permission Denied

**Symptoms:**
```
pg_dump: error: connection to server failed: FATAL: role "postgres" does not exist
```

**Solutions:**
```bash
# 1. Verify PostgreSQL user
docker exec vedfinance-postgres psql -U postgres -c "\du"

# 2. Use correct credentials
docker exec vedfinance-postgres pg_dump -U postgres --no-owner --no-acl -d postgres
```

### Issue 3: Restore Hangs/Fails

**Symptoms:**
```
psql: error: connection to server was lost
```

**Solutions:**
```bash
# 1. Check Docker container memory
docker stats vedfinance-postgres

# 2. Increase Docker memory limit
# Docker Desktop → Settings → Resources → Memory: 4GB+

# 3. Restore in smaller chunks
pg_restore --verbose --clean --no-acl --no-owner -d postgres backup.dump
```

---

## 🚀 Integration with Development Workflow

### Daily Development Pattern

```bash
# Morning: Pull latest staging data
.\scripts\database\restore-from-vps.bat

# Development work...
pnpm dev

# Before major refactor: Backup current state
.\scripts\database\backup-to-vps.bat

# End of day: Push tested changes to staging
# (Full deployment process - see DEPLOYMENT_RUNBOOK.md)
```

### Pre-Deployment Checklist

```bash
# ✅ 1. Backup production data
ssh root@103.54.153.248 "docker exec dokploy-postgres pg_dump -U postgres -d vedfinance_staging > /root/backups/pre_deploy_$(date +%Y%m%d_%H%M).sql"

# ✅ 2. Test migrations locally
cd apps/api
npx prisma migrate dev

# ✅ 3. Verify seed data integrity
pnpm db:seed:test
pnpm --filter api test:integration

# ✅ 4. Deploy to staging
# (Use dokploy.yaml auto-deployment)

# ✅ 5. Verify staging database
curl http://103.54.153.248:3001/api/health
```

---

## 📝 Related Documentation

- [DATABASE_OPTIMIZATION_ROADMAP.md](../DATABASE_OPTIMIZATION_ROADMAP.md) - Long-term database strategy
- [DEPLOYMENT_RUNBOOK.md](DEPLOYMENT_RUNBOOK.md) - Full deployment process
- [DEVOPS_GUIDE.md](../DEVOPS_GUIDE.md) - VPS infrastructure setup
- [dokploy.yaml](../dokploy.yaml) - Container orchestration config

---

## 🎯 Next Steps

1. **Setup SSH Key Access**:
   ```bash
   # Copy temp_pub_key.pub to VPS
   # Test passwordless login
   ```

2. **Test Backup Scripts**:
   ```bash
   .\scripts\database\backup-to-vps.bat
   # Verify ZIP file created
   ```

3. **Document VPS Credentials**:
   - Store `POSTGRES_PASSWORD` in team password manager
   - Update SSH keys in team vault

4. **Automate Weekly Reports**:
   - Setup email notifications for backup failures
   - Monitor backup file sizes (detect corruption)

---

**Last Updated:** 2025-12-22  
**Maintainer:** Amp Agent (Orchestration)
