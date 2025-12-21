# V-EdFinance DevOps & Infrastructure Guide

This guide details the step-by-step setup of the V-EdFinance infrastructure on a Hetzner VPS using Dokploy, based on the `TRACK_3_DEVOPS_PLAN.md`.

**Target VPS IP:** `103.54.153.248`
**Initial Root Password:** `NzYFf8CN`
**SSH Key for `amp-agent` & `deployer`:** `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIQ9zzPL67+KHi9QcgDzVcyabkQDbx9+yuRqnKZsimFp amp-agent`

---

## Week 1: VPS & Dokploy Foundation

### Day 1: VPS Purchase & Initial Setup (Security Hardening)

**Status:** VPS Purchased, Dokploy Installed. Now hardening.

**1. Configure Firewall (UFW):**
   ```bash
   ssh root@103.54.153.248 # (Use password NzYFf8CN)
   apt update && apt install -y ufw
   ufw allow 22/tcp comment 'SSH'
   ufw allow 80/tcp comment 'HTTP'
   ufw allow 443/tcp comment 'HTTPS'
   ufw allow 3000/tcp comment 'Dokploy Dashboard'
   ufw --force enable
   ufw status verbose
   ```

**2. Install and Configure Fail2Ban:**
   ```bash
   apt install -y fail2ban
   echo -e '[DEFAULT]\nbantime = 3600\nfindtime = 600\nmaxretry = 5\n[sshd]\nenabled = true\nport = 22\nlogpath = /var/log/auth.log' > /etc/fail2ban/jail.local
   systemctl enable fail2ban
   systemctl restart fail2ban
   fail2ban-client status
   ```

**3. Create Deploy User (`deployer`):**
   ```bash
   adduser --disabled-password --gecos '' deployer
   # Set password for deployer (generate and save in password manager)
   passwd deployer 
   usermod -aG sudo deployer
   mkdir -p /home/deployer/.ssh
   echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIQ9zzPL67+KHi9QcgDzVcyabkQDbx9+yuRqnKZsimFp amp-agent' > /home/deployer/.ssh/authorized_keys
   chown -R deployer:deployer /home/deployer/.ssh
   chmod 700 /home/deployer/.ssh
   chmod 600 /home/deployer/.ssh/authorized_keys
   # Test login from your machine: ssh deployer@103.54.153.248 (should use key)
   ```

**4. Disable Root Login (After testing `deployer` login):**
   ```bash
   # nano /etc/ssh/sshd_config 
   # Change: PermitRootLogin no
   # Change: PasswordAuthentication no
   # systemctl restart sshd
   ```

### Day 2: Dokploy DNS & SSL Setup

**Status:** Dokploy running on HTTP. Waiting for DNS.

**1. User Task: Configure Cloudflare DNS:**
   - Add A records for `@`, `www`, `api`, `dokploy`, `dev`, `api-dev`, `staging`, `api-staging` pointing to `103.54.153.248` (Proxy ON).
   - Add A record for `monitoring` pointing to `103.54.153.248` (Proxy OFF).

**2. Configure SSL in Dokploy (After DNS propagates):**
   - Access Dokploy: `http://103.54.153.248:3000`
   - Settings → Server → Domains: Add `dokploy.v-edfinance.com`, enable SSL.

**3. Configure Cloudflare SSL:** Full (strict), Always Use HTTPS, Auto Minify, Brotli.

### Day 3-4: Database & Redis Setup

**Status:** `postgres-staging` and `redis-staging` containers are running from previous tests. We will adapt them or recreate via Dokploy for better management.

**1. Recreate/Manage PostgreSQL via Dokploy:**
   - In Dokploy: Databases → Add → PostgreSQL
   - Name: `postgres-main`, Image: `postgres:15-alpine`, Limits: 1.5GB RAM, 0.5 CPU, 20GB Storage.
   - Env: `POSTGRES_USER=postgres`, `POSTGRES_PASSWORD=<generate>`, `POSTGRES_DB=postgres`.
   - Deploy.
   - Connect: `docker exec -it <id> psql -U postgres`
   - Create DBs: `CREATE DATABASE vedfinance_prod; CREATE DATABASE vedfinance_staging; CREATE DATABASE vedfinance_dev;`
   - Add Indexes (in `vedfinance_prod` and `vedfinance_staging`):
     ```sql
     CREATE INDEX idx_user_email ON "User"(email);
     -- Add other indexes from plan --
     ANALYZE;
     ```

**2. Recreate/Manage Redis via Dokploy:**
   - In Dokploy: Databases → Add → Redis
   - Name: `redis-main`, Image: `redis:7-alpine`, Limits: 256MB RAM, 0.1 CPU.
   - Command: `redis-server --maxmemory 200mb --maxmemory-policy allkeys-lru --save 900 1 --save 300 10 --save 60 10000`
   - Deploy.

**3. Configure Backups:**
   - In Dokploy: `postgres-main` → Backups → Daily, 3AM, 7 days, Local `/backups/postgres`.

### Day 5: Monitoring Setup

**1. Deploy Uptime Kuma via Dokploy:**
   - Applications → Create → Docker Image `louislam/uptime-kuma:1`, Port 3001:3001, Volume `/app/data` (5GB), Domain `monitoring.v-edfinance.com` (SSL Auto).

**2. Configure Uptime Kuma:** Add monitors for Dokploy, `postgres-main`, `redis-main`, and setup email notifications.

### Day 6-7: Test Deployment & Document

**1. Test Deploy Nginx:** Deploy `nginx:alpine` to `test.v-edfinance.com` via Dokploy.
**2. Document Infrastructure:** Create `/docs/INFRASTRUCTURE.md` on VPS with server details, services, domains, access info, backup schedule.

---

## Week 2: Integration & Secrets

### Day 8: GitHub Integration

- Dokploy: Settings → Integrations → GitHub → Connect `luaho/v-edfinance`.
- GitHub: Verify webhook to `dokploy.v-edfinance.com`.

### Day 9: Environment Variables & Secrets

- Dokploy: Settings → Secrets → Create Group `v-edfinance-secrets`.
- Add `DATABASE_URL_PROD/STAGING/DEV`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `REDIS_URL`, `NODE_ENV_PROD/STAGING/DEV`, `API_PORT`, `WEB_PORT`, `NEXT_PUBLIC_API_URL_PROD/STAGING/DEV`.

### Day 10: R2 Storage & Gemini API

- Cloudflare: Create R2 bucket `v-edfinance-uploads`, get API token, configure public access.
- Google AI Studio: Get Gemini API key, set quotas/alerts.
- Dokploy: Add R2 & Gemini credentials to `v-edfinance-secrets`.

---

## Week 3: Prepare for Deployment (When apps ready)

### Day 11-12: Dockerfiles

- Create/Verify `apps/api/Dockerfile` and `apps/web/Dockerfile`.
- Test local builds: `docker build -f apps/api/Dockerfile -t api-test .`, `docker build -f apps/web/Dockerfile -t web-test .`

### Day 13: Staging Environment Setup

- Deploy `api-staging` from `staging` branch to `api-staging.v-edfinance.com` via Dokploy, using secrets.
- Deploy `web-staging` from `staging` branch to `staging.v-edfinance.com` via Dokploy, using secrets.

### Day 14: Documentation & Runbooks

- Create Deployment Runbook with pre-deploy checklist, deploy steps, rollback, contacts.
- Final infrastructure documentation check.

---
