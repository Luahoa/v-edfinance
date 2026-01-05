# Discovery Report: VPS Full Stack Deployment

**Date:** 2026-01-05  
**Epic:** Fresh VPS deployment with complete monitoring stack  
**Context:** User has clean VPS at 103.54.153.248, wants full redeploy

---

## Architecture Snapshot

### Existing Infrastructure Files
- `dokploy.yaml` - Dokploy orchestration config (PostgreSQL + 3 environments)
- `docker-compose.monitoring.yml` - Full monitoring stack (6 tools)
- `apps/api/Dockerfile` - NestJS API container
- `apps/web/Dockerfile` - Next.js frontend container
- `init-db.sql` - PostgreSQL initialization (referenced in dokploy.yaml)

### VPS Details
- **IP:** 103.54.153.248
- **User:** root
- **SSH Access:** ✅ Configured (ED25519 key at C:\Users\luaho\.ssh\amp_vps_key)
- **OS:** Ubuntu (assumed based on scripts)

---

## Existing Patterns

### 1. Dokploy Configuration (dokploy.yaml)
**Services:**
- PostgreSQL (pgvector/pgvector:pg17) - shared for dev/staging/prod
- Redis - shared cache
- API (dev/staging/prod) - 3 separate deployments
- Web (dev/staging/prod) - 3 separate deployments
- Uptime Kuma - uptime monitoring

**Key Features:**
- Auto-deployment on git push (develop/staging/main branches)
- Health checks configured
- Resource limits defined
- SSL via Let's Encrypt
- Daily backups (3 AM)

### 2. Monitoring Stack (docker-compose.monitoring.yml)
**6 Tools:**
1. **Netdata** (19999) - Real-time metrics (1s intervals)
2. **Uptime Kuma** (3002) - Uptime monitoring + status page
3. **Glances** (61208) - System monitoring (Python)
4. **Beszel** (8090) - Lightweight Docker stats
5. **Prometheus** (9090) - Time series metrics
6. **Grafana** (3001) - Visualization dashboards

### 3. DevOps Tools (package.json)
**Installed:**
- **Biome** - Linter/formatter
- **Vitest** - Testing framework (+ UI + coverage)
- **Autocannon** - HTTP load testing
- **MSW** - API mocking
- **Uppy** - File upload (multi-part S3)
- **Unstorage** - Universal storage abstraction
- **Playwright** - E2E testing
- **Husky** - Git hooks

**External CLI Tools (scripts/):**
- **Rclone** - R2 backup sync (scripts/backup-to-r2.sh)
- **Dokploy** - Deployment orchestration

---

## Technical Constraints

### Node Environment
- **Node:** 20 (Alpine in Docker)
- **Package Manager:** pnpm@9.15.0
- **Monorepo:** Turborepo
- **Database:** PostgreSQL 17 + pgvector extension

### Required Extensions
- **pg_stat_statements** - Database query analytics (ved-y1u task)
- **pgvector** - Vector similarity search

### Port Allocations
**Main Services:**
- 3000 - Dokploy Dashboard
- 3001 - API (staging/prod)
- 3002 - Web (staging)
- 5432 - PostgreSQL

**Monitoring:**
- 19999 - Netdata
- 3002 - Uptime Kuma (monitoring compose)
- 61208 - Glances
- 8090 - Beszel
- 9090 - Prometheus
- 3001 - Grafana (monitoring compose)

**Note:** Port conflict - Grafana (3001) vs API staging (3001)

### Environment Variables
**Required:**
- POSTGRES_PASSWORD
- JWT_SECRET_{DEV,STAGING,PROD}
- JWT_REFRESH_SECRET_PROD
- ENCRYPTION_KEY_PROD
- R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
- GEMINI_API_KEY
- STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET
- NETDATA_CLAIM_TOKEN (optional)
- GRAFANA_ADMIN_USER, GRAFANA_ADMIN_PASSWORD
- BESZEL_AGENT_KEY

---

## External References

### Dokploy
- **GitHub:** https://github.com/dokploy/dokploy
- **Purpose:** Heroku-like deployment on VPS
- **Features:** Git-based auto-deploy, env management, health checks

### Monitoring Tools
1. **Netdata:** https://github.com/netdata/netdata
   - Real-time system/app metrics
   - Alert system configured (db_capacity.conf)
   
2. **Uptime Kuma:** https://github.com/louislam/uptime-kuma
   - Beautiful uptime monitoring UI
   - Multi-notification channels
   
3. **Glances:** https://github.com/nicolargo/glances
   - Python-based system monitoring
   - Web + Terminal UI
   
4. **Beszel:** https://github.com/henrygd/beszel
   - Lightweight Docker container stats
   - Agent-based architecture

### Backup Tools
- **Rclone:** https://github.com/rclone/rclone
  - Sync PostgreSQL backups to Cloudflare R2
  - Script: scripts/backup-to-r2.sh (daily 3 AM cron)

---

## Deployment Patterns

### Existing Scripts
1. **scripts/epic2-deploy-production.sh**
   - Uploads dokploy.yaml to VPS
   - Creates PostgreSQL container
   - Guides manual Dokploy setup
   
2. **scripts/backup-to-r2.sh**
   - Automated daily backup
   - Configured for rclone → Cloudflare R2
   
3. **scripts/deploy-netdata-alerts.sh**
   - Deploys custom Netdata health checks
   - Monitors DB capacity

### Init Scripts
- **init-db.sql** - Referenced in dokploy.yaml line 17
  - Auto-creates databases on PostgreSQL startup
  - **STATUS:** File not found in project (need to create)

---

## Key Gaps Identified

### Missing Files
1. ❌ **init-db.sql** - Referenced but doesn't exist
   - Should create: vedfinance_dev, vedfinance_staging, vedfinance_prod databases
   - Should enable extensions: pgvector, pg_stat_statements

2. ⚠️ **Port Conflict**
   - Grafana (monitoring): 3001
   - API Staging (dokploy): 3001
   - **Resolution:** Change Grafana to 3003 in monitoring compose

3. ⚠️ **monitoring/ config files**
   - prometheus.yml referenced but may not exist
   - alerts.yml referenced but may not exist
   - grafana/ dashboards referenced

---

## Security Considerations

### Secrets Management
- ✅ Git hooks via Husky (prevent commit secrets)
- ✅ .gitignore patterns for .env files
- ⚠️ Need to generate secrets on VPS (not in repo)

### SSH Access
- ✅ ED25519 key (secure, modern)
- ✅ Public key added to VPS authorized_keys
- ✅ Documented in docs/VPS_SSH_CONFIG.md

---

## Recommended Deployment Approach

### Phase 1: VPS Preparation
1. SSH to VPS (already done)
2. Install Docker + Docker Compose
3. Install Dokploy (if not present)
4. Install Rclone for backups

### Phase 2: Database Setup
1. Create init-db.sql with pg_stat_statements
2. Deploy PostgreSQL container with pgvector image
3. Verify extensions enabled

### Phase 3: Monitoring Stack
1. Fix port conflict (Grafana 3001 → 3003)
2. Create missing prometheus/grafana configs
3. Deploy monitoring compose stack
4. Verify all 6 tools accessible

### Phase 4: Application Deployment
1. Generate production secrets
2. Upload dokploy.yaml + environment variables
3. Deploy staging environment first
4. Smoke test staging
5. Deploy production

### Phase 5: Automation
1. Setup cron for daily backups (backup-to-r2.sh)
2. Deploy Netdata alerts
3. Configure Uptime Kuma monitors

---

## Tools Inventory

### Already Installed (Local)
- ✅ Biome - Linter/formatter
- ✅ Vitest - Testing
- ✅ Autocannon - Load testing
- ✅ Playwright - E2E testing
- ✅ Rclone - Backup sync (via scripts/install-rclone.ps1)

### Need to Install (VPS)
- ❓ Docker (verify)
- ❓ Docker Compose (verify)
- ❓ Dokploy (verify)
- ❓ Rclone (for backup-to-r2.sh)

---

## Success Criteria

### Must Have (ved-y1u completion)
- ✅ PostgreSQL with pg_stat_statements enabled
- ✅ Can query: `SELECT * FROM pg_stat_statements LIMIT 5;`

### Should Have (Complete deployment)
- ✅ All 6 monitoring tools accessible
- ✅ API staging responding on :3001
- ✅ Web staging responding on :3002
- ✅ Dokploy dashboard on :3000
- ✅ Daily backup cron configured

### Nice to Have
- ✅ Production environment deployed
- ✅ SSL certificates via Let's Encrypt
- ✅ Netdata alerts configured
- ✅ Grafana dashboards pre-loaded

---

## Next Steps

1. **Immediate:** Create init-db.sql with pg_stat_statements
2. **Phase 2:** Oracle synthesis for deployment approach
3. **Phase 3:** Create deployment beads (file-beads skill)
4. **Phase 4:** Execute with orchestrator (parallel deployment)

---

**Generated by:** Planning Skill - Phase 1 Discovery  
**Ready for:** Oracle synthesis (Phase 2)
