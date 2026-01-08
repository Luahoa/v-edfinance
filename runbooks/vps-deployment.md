# VPS Deployment Runbook

**Last Updated:** 2026-01-05  
**Maintainer:** V-EdFinance DevOps Team  
**VPS Provider:** Dokploy on VPS (103.54.153.248)

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Infrastructure Setup](#infrastructure-setup)
4. [Database Deployment](#database-deployment)
5. [Monitoring Stack](#monitoring-stack)
6. [Application Deployment](#application-deployment)
7. [Backup Configuration](#backup-configuration)
8. [Troubleshooting](#troubleshooting)

---

## Overview

This runbook provides step-by-step instructions for deploying V-EdFinance to production VPS infrastructure using Dokploy orchestration.

**Deployment Architecture:**
- **Frontend:** Next.js on Cloudflare Pages (auto-deploy from main branch)
- **Backend:** NestJS API on VPS via Docker
- **Database:** PostgreSQL 17 + pgvector on VPS
- **Monitoring:** 6-tool stack (Grafana, Prometheus, Netdata, Uptime Kuma, Glances, Beszel)
- **Backup:** Daily automated PostgreSQL backups to Cloudflare R2

---

## Prerequisites

### Local Machine Requirements
- SSH key configured: `C:\Users\luaho\.ssh\vps_new_key`
- VPS toolkit installed: `scripts/vps-toolkit/`
- Node.js 20+ installed
- Git access to repository

### VPS System Information
- **IP:** 103.54.153.248
- **OS:** Ubuntu 22.04.1 LTS
- **RAM:** 4GB
- **Disk:** 30GB
- **Docker:** v29.1.3
- **SSH User:** root (deployer user setup pending)

### Credentials Needed
- PostgreSQL password (stored in `/root/.env`)
- Cloudflare R2 credentials (Account ID, Access Key, Secret Key)
- Dokploy admin credentials
- Monitoring tool admin passwords

---

## Infrastructure Setup

### 1. Docker Installation

```bash
# Connect to VPS
ssh root@103.54.153.248 -i C:\Users\luaho\.ssh\vps_new_key

# Install Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker
docker --version  # Should show v29.1.3+

# Install Docker Compose plugin
apt-get update
apt-get install -y docker-compose-plugin
docker compose version  # Should show v2.x.x
```

### 2. Firewall Configuration

```bash
# Install UFW
apt-get install -y ufw

# Allow required ports
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw allow 3000/tcp    # Dokploy
ufw allow 19999/tcp   # Netdata
ufw allow 3002/tcp    # Uptime Kuma
ufw allow 61208/tcp   # Glances
ufw allow 8090/tcp    # Beszel
ufw allow 9090/tcp    # Prometheus
ufw allow 3003/tcp    # Grafana

# Enable firewall
ufw --force enable
ufw status verbose
```

### 3. Deployer User Setup

```bash
# Create deployer user
adduser --disabled-password --gecos '' deployer
usermod -aG sudo deployer
usermod -aG docker deployer

# Setup SSH keys
mkdir -p /home/deployer/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGyK1L0sWfKZXKIYDzi0YCQjOZzIPms29NiEBpkWct9b amp-agent@v-edfinance" > /home/deployer/.ssh/authorized_keys
chown -R deployer:deployer /home/deployer/.ssh
chmod 700 /home/deployer/.ssh
chmod 600 /home/deployer/.ssh/authorized_keys

# Test SSH access
ssh deployer@103.54.153.248 "echo OK"
```

---

## Database Deployment

### 1. Upload Database Init Script

```bash
# From local machine
scp init-db.sql root@103.54.153.248:/root/
```

**init-db.sql contents:**
```sql
-- Enable performance monitoring extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Configure query tracking
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET pg_stat_statements.track = 'all';
```

### 2. Deploy PostgreSQL Container

```bash
ssh root@103.54.153.248

# Generate strong password
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
echo "POSTGRES_PASSWORD=${POSTGRES_PASSWORD}" >> /root/.env

# Deploy PostgreSQL with pgvector
docker run -d \
  --name v-edfinance-postgres \
  --restart unless-stopped \
  -p 5432:5432 \
  -v /root/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql:ro \
  -v postgres_data:/var/lib/postgresql/data \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=${POSTGRES_PASSWORD} \
  -e POSTGRES_DB=postgres \
  pgvector/pgvector:pg17

# Verify container is running
docker ps | grep postgres
```

### 3. Enable pg_stat_statements Extension

```bash
# Restart container to load shared_preload_libraries
docker restart v-edfinance-postgres

# Wait 10 seconds
sleep 10

# Create extension in vedfinance database
docker exec v-edfinance-postgres psql -U postgres -d vedfinance -c \
  "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"

# Verify extension is loaded
docker exec v-edfinance-postgres psql -U postgres -d vedfinance -c \
  "SELECT COUNT(*) FROM pg_stat_statements;"
```

**Automated Script:** Use `scripts/vps-toolkit/enable-pg-stat-statements.js`

### 4. Run Prisma Migrations

**Note:** VPS uses production schema subset (core features only). Social features (SocialPost, BuddyGroup, etc.) are not deployed.

```bash
# Upload migration files
scp -r apps/api/prisma/migrations root@103.54.153.248:/root/v-edfinance/apps/api/prisma/

# Run migrations in Docker container
docker run --rm \
  --network host \
  -e DATABASE_URL="postgresql://postgres:${POSTGRES_PASSWORD}@172.17.0.1:5432/vedfinance" \
  -v /root/v-edfinance:/app \
  node:20-bookworm-slim \
  sh -c "apt-get update -qq && apt-get install -y -qq openssl && npm install -g prisma@5.22.0 && cd /app/apps/api/prisma && npx prisma generate && npx prisma migrate deploy"
```

**Known Issues:**
- Migration `20251223_add_partial_indexes` uses `NOW()` function (not IMMUTABLE) - mark as applied without executing:
  ```bash
  npx prisma migrate resolve --applied 20251223_add_partial_indexes
  ```
- Migration `20251223_add_gin_indexes` references `SocialPost` table - use simplified version with only `User` and `BehaviorLog` tables

**Verification:**
```bash
# Check migration history
docker exec v-edfinance-postgres psql -U postgres -d vedfinance -c \
  "SELECT migration_name, finished_at, applied_steps_count FROM _prisma_migrations ORDER BY finished_at;"

# Verify GIN indexes exist
docker exec v-edfinance-postgres psql -U postgres -d vedfinance -c \
  "SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE '%_gin_idx';"
```

---

## Monitoring Stack

### 1. Deploy Monitoring Tools

```bash
# Upload docker-compose.monitoring.yml
scp docker-compose.monitoring.yml root@103.54.153.248:/root/v-edfinance/

# Deploy monitoring stack
cd /root/v-edfinance
docker compose -f docker-compose.monitoring.yml up -d

# Verify all containers are running
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### 2. Access Monitoring Dashboards

| Tool | URL | Default Credentials |
|------|-----|---------------------|
| **Grafana** | http://103.54.153.248:3003 | admin/admin |
| **Prometheus** | http://103.54.153.248:9090 | - |
| **Netdata** | http://103.54.153.248:19999 | - |
| **Uptime Kuma** | http://103.54.153.248:3002 | Setup wizard |
| **Glances** | http://103.54.153.248:61208 | - |
| **Beszel** | Agent only (connects to external hub) | - |

### 3. Configure Grafana Dashboards

```bash
# Create PostgreSQL data source
curl -X POST http://103.54.153.248:3003/api/datasources \
  -H "Content-Type: application/json" \
  -u admin:admin \
  -d '{
    "name": "VedFinance PostgreSQL",
    "type": "postgres",
    "url": "v-edfinance-postgres:5432",
    "database": "vedfinance",
    "user": "postgres",
    "secureJsonData": {
      "password": "'${POSTGRES_PASSWORD}'"
    }
  }'
```

### 4. Verify Monitoring Stack

**Automated Script:** Use `scripts/vps-toolkit/verify-monitoring-stack.js`

**Manual Verification:**
```bash
# Health check all endpoints
curl -I http://103.54.153.248:3003  # Grafana: 200 OK
curl -I http://103.54.153.248:9090  # Prometheus: 200 OK
curl -I http://103.54.153.248:19999 # Netdata: 200 OK
curl -I http://103.54.153.248:3002  # Uptime Kuma: 302 Redirect
```

---

## Application Deployment

### 1. Environment Variables

Create `.env` file on VPS at `/root/v-edfinance/apps/api/.env`:

```env
# Database
DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@v-edfinance-postgres:5432/vedfinance

# JWT
JWT_SECRET=<generated-secret>
JWT_EXPIRATION=7d

# Cloudflare Tunnel (if using)
CLOUDFLARE_TUNNEL_TOKEN=<tunnel-token>

# Feature Flags
ENABLE_DEBUG_ENDPOINTS=true
ENABLE_SOCIAL_FEATURES=false  # Not deployed on VPS
```

### 2. Deploy API Backend

```bash
# Upload API codebase
rsync -avz --exclude node_modules --exclude dist apps/api/ root@103.54.153.248:/root/v-edfinance/apps/api/

# Build API Docker image
ssh root@103.54.153.248 "cd /root/v-edfinance/apps/api && docker build -t v-edfinance-api:staging ."

# Run API container
docker run -d \
  --name v-edfinance-api-staging \
  --restart unless-stopped \
  -p 3001:3000 \
  --network host \
  --env-file /root/v-edfinance/apps/api/.env \
  v-edfinance-api:staging

# Verify API health
curl http://103.54.153.248:3001/api/health
# Expected: {"status":"ok"}
```

### 3. Deploy Web Frontend (Optional - VPS Staging)

**Note:** Production frontend auto-deploys to Cloudflare Pages from main branch.

```bash
# Upload Web codebase
rsync -avz --exclude node_modules --exclude .next apps/web/ root@103.54.153.248:/root/v-edfinance/apps/web/

# Build Web Docker image
ssh root@103.54.153.248 "cd /root/v-edfinance/apps/web && docker build -t v-edfinance-web:staging ."

# Run Web container
docker run -d \
  --name v-edfinance-web-staging \
  --restart unless-stopped \
  -p 3100:3000 \
  -e NEXT_PUBLIC_API_URL=http://103.54.153.248:3001 \
  v-edfinance-web:staging

# Verify Web is accessible
curl http://103.54.153.248:3100
```

### 4. Smoke Tests

```bash
# From local machine
API_URL=http://103.54.153.248:3001 pnpm smoke:staging

# Or manual tests
curl http://103.54.153.248:3001/api/health
curl http://103.54.153.248:3001/api/courses
curl http://103.54.153.248:3001/api/debug/diagnostics/verify-integrity
```

---

## Backup Configuration

### 1. Install Rclone

```bash
ssh root@103.54.153.248

# Install Rclone
curl https://rclone.org/install.sh | sudo bash
rclone version  # Should show v1.72.1+
```

### 2. Configure Cloudflare R2 Remote

**Automated Configuration:**
```bash
rclone config create r2 s3 \
  provider=Cloudflare \
  access_key_id=${R2_ACCESS_KEY_ID} \
  secret_access_key=${R2_SECRET_ACCESS_KEY} \
  endpoint=https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com

# Test connection
rclone lsd r2:
```

**Interactive Configuration:**
```bash
rclone config

# Follow prompts:
# - Name: r2
# - Type: s3
# - Provider: Cloudflare
# - Access Key ID: <from Cloudflare dashboard>
# - Secret Access Key: <from Cloudflare dashboard>
# - Endpoint: https://<account-id>.r2.cloudflarestorage.com
```

### 3. Create Backup Script

Upload `scripts/backup-to-r2.sh` to VPS at `/opt/scripts/backup-to-r2.sh`:

```bash
#!/bin/bash
# Daily PostgreSQL backup to Cloudflare R2

set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="/tmp/vedfinance_backup_${TIMESTAMP}.sql"
R2_BUCKET="r2:v-edfinance-backups"

# Dump database
docker exec v-edfinance-postgres pg_dump -U postgres vedfinance | gzip > "${BACKUP_FILE}.gz"

# Upload to R2
rclone copy "${BACKUP_FILE}.gz" "${R2_BUCKET}/"

# Keep only last 30 days locally
find /tmp -name "vedfinance_backup_*.sql.gz" -mtime +30 -delete

echo "[$(date)] Backup completed: ${BACKUP_FILE}.gz uploaded to R2"
```

**Make executable:**
```bash
chmod +x /opt/scripts/backup-to-r2.sh
```

### 4. Setup Cron Job

```bash
# Edit crontab
crontab -e

# Add daily backup at 3 AM
0 3 * * * /opt/scripts/backup-to-r2.sh >> /var/log/backup.log 2>&1

# Verify cron job
crontab -l
```

### 5. Test Backup

```bash
# Run backup manually
/opt/scripts/backup-to-r2.sh

# Verify R2 upload
rclone ls r2:v-edfinance-backups/ | tail -5

# Test restore (do NOT run in production without snapshot)
# rclone copy r2:v-edfinance-backups/latest.sql.gz /tmp/
# gunzip /tmp/latest.sql.gz
# docker exec -i v-edfinance-postgres psql -U postgres vedfinance < /tmp/latest.sql
```

---

## Troubleshooting

### PostgreSQL Connection Issues

**Symptom:** API cannot connect to database

**Solution:**
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Test connection from container network
docker run --rm --network host postgres:17 psql -h 172.17.0.1 -U postgres -d vedfinance -c "SELECT 1;"

# Check firewall
ufw status | grep 5432

# Verify environment variables
docker exec v-edfinance-api-staging env | grep DATABASE_URL
```

### Prisma Migration Failures

**Symptom:** `prisma migrate deploy` fails with "table does not exist"

**Root Cause:** VPS uses production schema subset - some migrations reference tables not deployed

**Solution:**
```bash
# Skip problematic migrations
docker run --rm --network host \
  -e DATABASE_URL="postgresql://postgres:${POSTGRES_PASSWORD}@172.17.0.1:5432/vedfinance" \
  -v /root/v-edfinance:/app \
  node:20-bookworm-slim \
  sh -c "npm install -g prisma@5.22.0 && cd /app/apps/api/prisma && npx prisma migrate resolve --applied 20251223_add_partial_indexes"

# Verify migration status
npx prisma migrate status
```

**Reference:** See [MIGRATION_FIX_PLAN.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/history/vps-deployment/MIGRATION_FIX_PLAN.md)

### Monitoring Tools Not Accessible

**Symptom:** Cannot access Grafana/Prometheus dashboards

**Solution:**
```bash
# Check containers are running
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Check logs for errors
docker logs v-edfinance-grafana
docker logs v-edfinance-prometheus

# Verify ports are open
ufw status | grep -E "(3003|9090|19999)"

# Restart monitoring stack
docker compose -f docker-compose.monitoring.yml restart
```

### Beszel Agent Restart Loop

**Symptom:** Beszel agent container continuously restarting

**Investigation:**
```bash
# Check logs
docker logs v-edfinance-beszel-agent --tail 50

# Common issues:
# 1. Missing HUB_URL environment variable
# 2. Invalid agent key
# 3. Network connectivity to Beszel hub

# Fix: Update docker-compose.monitoring.yml with correct HUB_URL
```

### R2 Backup Upload Fails

**Symptom:** Backup script completes but files not in R2

**Solution:**
```bash
# Test rclone connection
rclone lsd r2:

# Check credentials
rclone config show r2

# Manual test upload
echo "test" > /tmp/test.txt
rclone copy /tmp/test.txt r2:v-edfinance-backups/
rclone ls r2:v-edfinance-backups/

# Check backup log
tail -f /var/log/backup.log
```

### Out of Disk Space

**Symptom:** Docker containers failing to start, "no space left on device"

**Solution:**
```bash
# Check disk usage
df -h

# Clean Docker resources
docker system prune -a -f
docker volume prune -f

# Remove old backups
find /tmp -name "vedfinance_backup_*.sql.gz" -mtime +7 -delete

# Check large log files
du -sh /var/lib/docker/containers/*
```

---

## Quick Reference Commands

### VPS Connection
```bash
# SSH as root
ssh root@103.54.153.248 -i C:\Users\luaho\.ssh\vps_new_key

# SSH as deployer
ssh deployer@103.54.153.248 -i C:\Users\luaho\.ssh\vps_new_key

# VPS Toolkit (automated scripts)
node scripts/vps-toolkit/vps-connection.js
```

### Container Management
```bash
# List all containers
docker ps -a

# View logs
docker logs <container-name> --tail 100 -f

# Restart container
docker restart <container-name>

# Remove and recreate container
docker stop <container-name>
docker rm <container-name>
# Then run deployment command again
```

### Database Operations
```bash
# Connect to PostgreSQL
docker exec -it v-edfinance-postgres psql -U postgres -d vedfinance

# Check database size
docker exec v-edfinance-postgres psql -U postgres -d vedfinance -c \
  "SELECT pg_size_pretty(pg_database_size('vedfinance'));"

# View active connections
docker exec v-edfinance-postgres psql -U postgres -d vedfinance -c \
  "SELECT COUNT(*) FROM pg_stat_activity;"

# Monitor slow queries
docker exec v-edfinance-postgres psql -U postgres -d vedfinance -c \
  "SELECT query, calls, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

---

## Related Documentation

- [MIGRATION_FIX_PLAN.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/history/vps-deployment/MIGRATION_FIX_PLAN.md) - Prisma migration troubleshooting
- [DEPLOYMENT_MASTER_PLAN.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/history/vps-deployment/DEPLOYMENT_MASTER_PLAN.md) - Full deployment orchestration
- [VPS_DEPLOYMENT_SESSION_REPORT.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/history/vps-deployment/VPS_DEPLOYMENT_SESSION_REPORT.md) - Latest deployment session results
- [AGENTS.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/AGENTS.md) - Project conventions and quality checklist

---

**Document Version:** 1.0  
**Last Deployed:** 2026-01-05  
**Next Review:** 2026-02-05
