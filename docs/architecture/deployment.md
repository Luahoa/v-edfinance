# Deployment Architecture

**Infrastructure**: VPS + Cloudflare  
**Backend**: NestJS on VPS (PM2/Docker)  
**Frontend**: Next.js on Cloudflare Pages  
**Database**: PostgreSQL on VPS

---

## Table of Contents

- [Infrastructure Overview](#infrastructure-overview)
- [Deployment Environments](#deployment-environments)
- [VPS Setup](#vps-setup)
- [Cloudflare Configuration](#cloudflare-configuration)
- [Deployment Process](#deployment-process)
- [Monitoring & Logging](#monitoring--logging)
- [Disaster Recovery](#disaster-recovery)

---

## Infrastructure Overview

```
┌───────────────────────────────────────────────────────────┐
│                   Internet Users                          │
└──────────────┬────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────┐
│              Cloudflare Network                          │
│  ┌────────────────────┐  ┌──────────────────────────┐   │
│  │  CDN + Caching     │  │  Pages (Next.js SSG)     │   │
│  │  DDoS Protection   │  │  Static Assets           │   │
│  └────────────────────┘  └──────────────────────────┘   │
└────────────┬─────────────────────────────────────────────┘
             │
             │ HTTPS (443)
             │
┌────────────▼─────────────────────────────────────────────┐
│              VPS (Ubuntu 22.04 LTS)                      │
│  ┌─────────────────────────────────────────────────┐    │
│  │  NestJS API (Port 3001)                         │    │
│  │  - PM2 process manager                          │    │
│  │  - Node.js 18+                                  │    │
│  │  - Environment: .env (secrets)                  │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │  PostgreSQL 16 (Port 5432)                      │    │
│  │  - Database: v_edfinance                        │    │
│  │  - Daily backups (cron)                         │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Monitoring Stack                               │    │
│  │  - Prometheus (Port 9090)                       │    │
│  │  - Grafana (Port 3001)                          │    │
│  │  - Node Exporter (Port 9100)                    │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Nginx (Reverse Proxy)                          │    │
│  │  - SSL/TLS termination                          │    │
│  │  - Rate limiting                                │    │
│  └─────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

---

## Deployment Environments

### Development (Local)

```bash
# Frontend: http://localhost:3000
cd apps/web
pnpm dev

# Backend: http://localhost:3001
cd apps/api
pnpm dev

# Database: PostgreSQL on localhost:5432
```

### Staging (VPS)

- **Frontend**: https://staging.v-edfinance.com (Cloudflare Pages)
- **Backend**: https://staging-api.v-edfinance.com (VPS)
- **Database**: PostgreSQL on VPS (separate staging DB)

### Production (VPS + Cloudflare)

- **Frontend**: https://v-edfinance.com (Cloudflare Pages)
- **Backend**: https://api.v-edfinance.com (VPS)
- **Database**: PostgreSQL on VPS (production DB)

---

## VPS Setup

### Server Specifications

**Provider**: [DigitalOcean/Vultr/Hetzner]  
**OS**: Ubuntu 22.04 LTS  
**CPU**: 2 vCPUs  
**RAM**: 4 GB  
**Disk**: 80 GB SSD  
**Network**: 1 Gbps

### Initial Setup

**1. SSH Key Authentication**
```bash
# Generate SSH key (local)
ssh-keygen -t ed25519 -C "deploy@v-edfinance.com"

# Copy to VPS
ssh-copy-id -i ~/.ssh/id_ed25519.pub root@vps-ip

# Test connection
ssh root@vps-ip
```

**2. Install Dependencies**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PostgreSQL 16
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget -qO- https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt install -y postgresql-16

# Install PM2
npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Docker (optional)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

**3. Database Setup**
```bash
# Create database
sudo -u postgres psql
postgres=# CREATE DATABASE v_edfinance;
postgres=# CREATE USER ved_user WITH ENCRYPTED PASSWORD 'secure_password';
postgres=# GRANT ALL PRIVILEGES ON DATABASE v_edfinance TO ved_user;
postgres=# \q

# Test connection
psql -h localhost -U ved_user -d v_edfinance
```

**4. Application Setup**
```bash
# Clone repository
cd /var/www
git clone https://github.com/Luahoa/v-edfinance.git
cd v-edfinance

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
nano .env  # Edit with production secrets

# Run migrations
cd apps/api
npx prisma migrate deploy
npx prisma db seed

# Build backend
pnpm build

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup  # Generate startup script
```

**5. Nginx Configuration**
```nginx
# /etc/nginx/sites-available/v-edfinance-api
server {
    listen 80;
    server_name api.v-edfinance.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/v-edfinance-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Cloudflare Configuration

### DNS Setup

**A Records** (Point to VPS IP):
- `api.v-edfinance.com` → VPS IP (Proxied ✅)
- `staging-api.v-edfinance.com` → VPS IP (Proxied ✅)

**CNAME Records** (Point to Cloudflare Pages):
- `www.v-edfinance.com` → `v-edfinance.pages.dev` (Proxied ✅)
- `v-edfinance.com` → `v-edfinance.pages.dev` (Proxied ✅)

### Cloudflare Pages Setup

**1. Connect GitHub Repository**
- Go to Cloudflare Pages dashboard
- Select repository: `Luahoa/v-edfinance`
- Branch: `main`
- Root directory: `apps/web`

**2. Build Settings**
```yaml
Build command: pnpm --filter web build
Build output: apps/web/.next
Framework preset: Next.js
Node version: 18
```

**3. Environment Variables**
```env
NEXT_PUBLIC_API_URL=https://api.v-edfinance.com
NEXT_PUBLIC_STRIPE_KEY=pk_live_...
```

**4. Auto-Deploy**
- Cloudflare Pages auto-deploys on `git push main`
- Preview deployments for PRs

### Cloudflare Security

**1. SSL/TLS**
- Enable "Full (strict)" SSL mode
- Force HTTPS redirects

**2. Firewall Rules**
```
Block bots: (cf.bot_management.score lt 30)
Rate limit: (http.request.uri.path contains "/api/auth/login") and (rate > 5/min)
```

**3. Page Rules**
- Cache static assets: `*.js`, `*.css`, `*.png` (1 month)
- Browser cache: 4 hours

---

## Deployment Process

### Backend Deployment (VPS)

**1. SSH to VPS**
```bash
ssh root@vps-ip
cd /var/www/v-edfinance
```

**2. Pull Latest Code**
```bash
git pull origin main
```

**3. Install Dependencies**
```bash
pnpm install --frozen-lockfile
```

**4. Run Migrations**
```bash
cd apps/api
npx prisma migrate deploy
```

**5. Build Backend**
```bash
pnpm --filter api build
```

**6. Restart PM2**
```bash
pm2 restart all
pm2 logs  # Check for errors
```

**7. Verify Deployment**
```bash
curl https://api.v-edfinance.com/api/health
# Expected: {"status":"ok"}
```

### Frontend Deployment (Cloudflare Pages)

**Auto-deploy on push**:
```bash
git push origin main
# Cloudflare Pages auto-builds and deploys
```

**Manual trigger**:
- Go to Cloudflare Pages dashboard
- Click "Retry deployment"

---

## Monitoring & Logging

### Prometheus + Grafana

**Start Monitoring Stack**:
```bash
cd monitoring
docker-compose -f docker-compose.monitoring.yml up -d
```

**Access**:
- Prometheus: http://vps-ip:9090
- Grafana: http://vps-ip:3001

**Metrics Collected**:
- CPU/Memory/Disk usage (Node Exporter)
- API response times (NestJS metrics)
- Database connections (PostgreSQL exporter)
- Error rates (Winston logs)

### Log Aggregation

**Backend Logs** (Winston):
```bash
# PM2 logs
pm2 logs api

# Winston log files
tail -f /var/www/v-edfinance/apps/api/logs/combined.log
tail -f /var/www/v-edfinance/apps/api/logs/error.log
```

**Frontend Logs** (Sentry):
- Errors logged to Sentry.io
- Configure in `apps/web/next.config.js`

---

## Disaster Recovery

### Database Backups

**Automated Daily Backups** (Cron):
```bash
# /etc/cron.daily/pg_backup.sh
#!/bin/bash
BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U ved_user v_edfinance | gzip > $BACKUP_DIR/v_edfinance_$DATE.sql.gz

# Keep last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete
```

**Manual Backup**:
```bash
pg_dump -U ved_user v_edfinance > backup.sql
```

**Restore from Backup**:
```bash
psql -U ved_user v_edfinance < backup.sql
```

### VPS Snapshots

**DigitalOcean/Vultr**:
- Enable weekly snapshots in control panel
- Snapshots stored offsite

### Code Repository

**GitHub as Source of Truth**:
- All code pushed to GitHub
- Can redeploy from scratch using git clone

---

## Related Documentation

- [Frontend Architecture](frontend.md)
- [Backend Architecture](backend.md)
- [Database Schema](database.md)
- [VPS Toolkit Scripts](../../scripts/vps-toolkit/)

---

**Last Updated**: 2026-01-05  
**Maintained by**: V-EdFinance Team
