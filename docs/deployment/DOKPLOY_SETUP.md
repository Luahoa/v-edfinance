# Dokploy Setup Guide

Complete guide for setting up Dokploy as your development and staging deployment platform for V-EdFinance.

## Prerequisites

- **VPS Requirements:**
  - Minimum: 2 vCPU, 4GB RAM, 40GB SSD
  - Recommended: Hetzner CPX21 (3 vCPU, 4GB RAM) - €5.99/mo
  - OS: Ubuntu 22.04 LTS or Debian 11+
  - SSH access with root user

- **Domain Setup:**
  - `dokploy.v-edfinance.com` → Dokploy dashboard
  - `dev.v-edfinance.com` → Development frontend
  - `api-dev.v-edfinance.com` → Development API
  - `staging.v-edfinance.com` → Staging frontend
  - `api-staging.v-edfinance.com` → Staging API
  - `monitoring.v-edfinance.com` → Uptime Kuma

---

## Installation

### Step 1: Setup VPS

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Update system
apt update && apt upgrade -y

# Install required packages
apt install -y curl git
```

### Step 2: Install Dokploy

```bash
# Run the official Dokploy installer
curl -sSL https://dokploy.com/install.sh | sh

# Installation will take 3-5 minutes
# It will automatically install:
#   - Docker & Docker Compose
#   - Dokploy server
#   - Traefik (reverse proxy)
```

### Step 3: Access Dokploy Dashboard

```bash
# After installation completes, you'll see:
# ✅ Dokploy installed successfully!
# 🌐 Access at: http://your-vps-ip:3000

# Open in browser:
http://your-vps-ip:3000

# Complete initial setup:
# 1. Create admin account
# 2. Set admin password (save this!)
# 3. Configure SSL (Let's Encrypt)
```

### Step 4: Configure Domain & SSL

1. **In your DNS provider (Cloudflare):**
   ```
   Type  Name        Value           Proxy
   A     dokploy     your-vps-ip     ✅
   A     dev         your-vps-ip     ✅
   A     api-dev     your-vps-ip     ✅  
   A     staging     your-vps-ip     ✅
   A     api-staging your-vps-ip     ✅
   A     monitoring  your-vps-ip     ✅
   ```

2. **In Dokploy dashboard:**
   - Go to Settings → Domains
   - Add domain: `dokploy.v-edfinance.com`
   - Enable SSL (Let's Encrypt)
   - Wait 2-3 minutes for certificate

---

## Project Setup

### Step 5: Connect GitHub Repository

1. **In Dokploy Dashboard:**
   - Click "Create Project"
   - Name: `v-edfinance`
   - Click "Create"

2. **Add GitHub Integration:**
   - Settings → Integrations → GitHub
   - Click "Connect GitHub"
   - Authorize Dokploy to access your repo
   - Select `luaho/v-edfinance`

3. **Generate Deploy Token:**
   - GitHub → Settings → Developer settings
   - Personal access tokens → Generate new token
   - Scopes: `repo`, `read:packages`
   - Copy token (save securely!)

### Step 6: Configure Environment Variables

1. **In Dokploy:**
   - Project: `v-edfinance` → Settings → Environment
   - Click "Add Environment Variable Group"
   - Name: `shared-secrets`

2. **Add Variables:**
   ```bash
   POSTGRES_PASSWORD=<generate strong password>
   JWT_SECRET_DEV=<openssl rand -base64 32>
   JWT_SECRET_STAGING=<openssl rand -base64 32>
   R2_ACCOUNT_ID=<from Cloudflare>
   R2_ACCESS_KEY_ID=<from Cloudflare>
   R2_SECRET_ACCESS_KEY=<from Cloudflare>
   R2_BUCKET_NAME=v-edfinance-uploads
   GOOGLE_AI_API_KEY=<your key>
   ```

### Step 7: Deploy PostgreSQL

1. **Create Database Service:**
   - In project → Add Service → Database
   - Type: PostgreSQL 15
   - Name: `postgres`
   - Memory: 512MB
   - Storage: 10GB

2. **Configure:**
   ```yaml
   Port: 5432
   User: postgres
   Password: ${POSTGRES_PASSWORD}
   Database: vedfinance
   ```

3. **Create databases:**
   ```sql
   -- Connect to postgres
   CREATE DATABASE vedfinance_dev;
   CREATE DATABASE vedfinance_staging;
   ```

### Step 8: Deploy Redis

1. **Add Service → Cache**
   - Type: Redis 7
   - Name: `redis`
   - Memory: 256MB
   - Port: 6379

---

## Deploy Applications

### Step 9: Deploy Development API

1. **Add Application:**
   - Type: Application
   - Name: `api-dev`
   - Source: GitHub
   - Repository: `luaho/v-edfinance`
   - Branch: `develop`

2. **Build Configuration:**
   ```yaml
   Build Type: Dockerfile
   Dockerfile Path: apps/api/Dockerfile
   Context Path: .
   ```

3. **Environment:**
   ```bash
   NODE_ENV=development
   DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/vedfinance_dev?schema=public
   REDIS_URL=redis://redis:6379
   JWT_SECRET=${JWT_SECRET_DEV}
   # ... copy from .env.dokploy.example
   ```

4. **Networking:**
   ```yaml
   Internal Port: 3000
   Domain: api-dev.v-edfinance.com
   SSL: Enabled (Let's Encrypt)
   ```

5. **Health Check:**
   ```yaml
   Path: /api/health
   Interval: 30s
   Timeout: 10s
   ```

6. **Click "Deploy"** → Wait 3-5 minutes

### Step 10: Deploy Development Frontend

1. **Similar setup as API:**
   ```yaml
   Name: web-dev
   Branch: develop
   Dockerfile: apps/web/Dockerfile
   Port: 3000
   Domain: dev.v-edfinance.com
   
   Environment:
     NODE_ENV=development
     NEXT_PUBLIC_API_URL=https://api-dev.v-edfinance.com
   ```

### Step 11: Deploy Staging (Repeat for staging)

Same as dev, but:
- Branch: `staging`
- Domains: `staging.v-edfinance.com`, `api-staging.v-edfinance.com`
- Database: `vedfinance_staging`
- Use `JWT_SECRET_STAGING`

---

## Monitoring Setup

### Step 12: Deploy Uptime Kuma

1. **Add Service → Application**
   ```yaml
   Name: uptime-kuma
   Type: Docker Image
   Image: louislam/uptime-kuma:1
   Port: 3001
   Domain: monitoring.v-edfinance.com
   Volume: /app/data (10GB)
   ```

2. **Setup Monitors:**
   - API Dev: https://api-dev.v-edfinance.com/api/health
   - Web Dev: https://dev.v-edfinance.com
   - API Staging: https://api-staging.v-edfinance.com/api/health
   - Web Staging: https://staging.v-edfinance.com

---

## Auto-Deployment

### Step 13: Configure Webhooks

Dokploy automatically creates GitHub webhooks when you connect a repo:

1. **Verify webhook:**
   - GitHub repo → Settings → Webhooks
   - Should see Dokploy webhook

2. **Test auto-deploy:**
   ```bash
   git checkout develop
   echo "test" >> README.md
   git commit -am "Test auto-deploy"
   git push origin develop
   
   # Watch deployment in Dokploy dashboard
   ```

---

## Cost Summary

```
Hetzner CPX21 VPS:              €5.99/mo
Domain (.com):                  ~€1/mo
Cloudflare R2 (dev/staging):    ~€0.50/mo
─────────────────────────────────────────
Total:                          ~€7.50/mo (~180k VND)
```

### Resources Allocation:

```
PostgreSQL:    512MB RAM    (2 databases)
Redis:         256MB RAM
API Dev:       512MB RAM
Web Dev:       512MB RAM
API Staging:   768MB RAM
Web Staging:   768MB RAM
Uptime Kuma:   256MB RAM
Dokploy:       512MB RAM
─────────────────────────────
Total Used:    ~3.6GB / 4GB available
```

---

## Troubleshooting

### Build Failures

```bash
# View build logs in Dokploy dashboard
# Or SSH to VPS:
ssh root@your-vps-ip

# Check Docker logs
docker ps
docker logs <container-id>

# Check Dokploy logs
journalctl -u dokploy -f
```

### SSL Certificate Issues

```bash
# Force renewal
docker exec dokploy-traefik traefik cert renew

# Check Traefik logs
docker logs dokploy-traefik
```

### Database Connection Issues

```bash
# Connect to Postgres container
docker exec -it dokploy-postgres psql -U postgres

# Check connections
SELECT * FROM pg_stat_activity;
```

### Out of Memory

```bash
# Check memory usage
free -h

# Restart services
# In Dokploy dashboard: Service → Restart
```

---

## Backup Strategy

### Automated Backups

Dokploy includes automated backup (configured in dokploy.yaml):

```yaml
backups:
  schedule: "0 3 * * *"  # Daily 3 AM
  retention: 7 days
```

### Manual Backup

```bash
# Backup PostgreSQL
docker exec dokploy-postgres pg_dumpall -U postgres > backup_$(date +%Y%m%d).sql

# Backup to remote
scp root@your-vps-ip:~/backup_*.sql ./backups/
```

---

## Next Steps

1. ✅ Verify all services are running
2. ✅ Test development deployment
3. ✅ Test staging deployment  
4. ✅ Configure monitoring alerts
5. ✅ Setup backup verification
6. 📝 Move to [Kamal production setup](./KAMAL_SETUP.md)

---

## Support

- **Dokploy Docs:** https://dokploy.com/docs
- **Discord:** https://discord.gg/dokploy
- **GitHub Issues:** https://github.com/dokploy/dokploy/issues
