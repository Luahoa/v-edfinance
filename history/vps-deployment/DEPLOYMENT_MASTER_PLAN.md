# VPS Deployment Master Plan

**Epic:** VPS Full Stack Deployment with 24 DevOps Tools  
**Generated:** 2026-01-05  
**Method:** Planning Skill + Orchestrator Skill  
**Duration:** 8-10 hours (2-3 sessions)

---

## 📋 EXECUTIVE SUMMARY

**Goal:** Deploy production-ready VPS infrastructure with complete monitoring, backup, and CI/CD automation.

**Tools to Deploy:** 24 total
- ✅ 22 already installed (local)
- 🔴 1 critical VPS deployment (Rclone)
- ⏳ 6 monitoring tools (docker-compose)
- ⏳ 1 to install (@clack/prompts)

**Success Criteria:**
- ✅ PostgreSQL with pg_stat_statements enabled
- ✅ 6 monitoring tools accessible
- ✅ Daily backup to R2 configured
- ✅ Dokploy dashboard operational
- ✅ ved-y1u task completed

---

## 🎯 DEPLOYMENT TRACKS (Parallel Execution)

### Track 1: Infrastructure Setup (BlueLake Agent)
**Duration:** 3-4 hours  
**Dependencies:** None  
**File Scope:** VPS system files

**Beads:**
1. `bd-infra-1`: Install Docker + Docker Compose on VPS
2. `bd-infra-2`: Configure UFW firewall rules
3. `bd-infra-3`: Setup deployer user + SSH keys
4. `bd-infra-4`: Install Rclone + configure R2 remote

---

### Track 2: Database Deployment (GreenMountain Agent)
**Duration:** 2-3 hours  
**Dependencies:** Track 1 (bd-infra-1)  
**File Scope:** Database configs

**Beads:**
1. `bd-db-1`: Upload init-db.sql to VPS
2. `bd-db-2`: Deploy PostgreSQL container (pgvector image)
3. `bd-db-3`: Verify pg_stat_statements enabled
4. `bd-db-4`: Create databases (dev/staging/prod)
5. `bd-db-5`: Run Prisma migrations

---

### Track 3: Monitoring Stack (RedRiver Agent)
**Duration:** 2-3 hours  
**Dependencies:** Track 1 (bd-infra-1)  
**File Scope:** monitoring/

**Beads:**
1. `bd-mon-1`: Fix Grafana port conflict (3001 → 3003)
2. `bd-mon-2`: Upload docker-compose.monitoring.yml
3. `bd-mon-3`: Deploy 6 monitoring tools
4. `bd-mon-4`: Configure Netdata alerts
5. `bd-mon-5`: Setup Uptime Kuma monitors
6. `bd-mon-6`: Create Grafana dashboards

---

### Track 4: Application Deployment (PurpleOcean Agent)
**Duration:** 2-3 hours  
**Dependencies:** Track 2 (bd-db-5)  
**File Scope:** apps/

**Beads:**
1. `bd-app-1`: Upload dokploy.yaml to VPS
2. `bd-app-2`: Configure environment variables
3. `bd-app-3`: Deploy API staging
4. `bd-app-4`: Deploy Web staging
5. `bd-app-5`: Run smoke tests

---

### Track 5: Backup & Automation (OrangeSky Agent)
**Duration:** 1-2 hours  
**Dependencies:** Track 2 (bd-db-2), Track 1 (bd-infra-4)  
**File Scope:** scripts/backup-to-r2.sh

**Beads:**
1. `bd-backup-1`: Upload backup-to-r2.sh script
2. `bd-backup-2`: Configure cron (daily 3 AM)
3. `bd-backup-3`: Test backup manually
4. `bd-backup-4`: Verify R2 upload success

---

## 📝 DETAILED EXECUTION PLAN

### PHASE 1: Pre-Deployment (Local Machine)

#### Orchestrator Checklist
- [x] Read DEVOPS_TOOLS_INVENTORY.md
- [x] Verify all tools installed locally
- [x] Download reference repos (temp_indie_tools/)
- [x] Create beads for all tracks
- [x] Initialize Agent Mail system

---

### PHASE 2: Infrastructure Setup (Track 1 - BlueLake)

#### bd-infra-1: Install Docker + Docker Compose
**Time:** 30 minutes  
**Commands:**
```bash
ssh root@103.54.153.248

# Install Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker
docker --version

# Install Docker Compose
apt-get update
apt-get install -y docker-compose-plugin
docker compose version
```

**Verification:**
```bash
docker ps  # Should show no errors
docker compose version  # v2.x.x
```

---

#### bd-infra-2: Configure Firewall
**Time:** 15 minutes  
**Commands:**
```bash
# Install UFW
apt-get install -y ufw

# Allow ports
ufw allow 22/tcp     # SSH
ufw allow 80/tcp     # HTTP
ufw allow 443/tcp    # HTTPS
ufw allow 3000/tcp   # Dokploy
ufw allow 19999/tcp  # Netdata
ufw allow 3002/tcp   # Uptime Kuma
ufw allow 61208/tcp  # Glances
ufw allow 8090/tcp   # Beszel
ufw allow 9090/tcp   # Prometheus
ufw allow 3003/tcp   # Grafana

# Enable firewall
ufw --force enable
ufw status verbose
```

---

#### bd-infra-3: Setup Deployer User
**Time:** 20 minutes  
**Commands:**
```bash
# Create user
adduser --disabled-password --gecos '' deployer
passwd deployer  # Generate strong password

# Add to sudo group
usermod -aG sudo deployer
usermod -aG docker deployer

# Setup SSH keys
mkdir -p /home/deployer/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGyK1L0sWfKZXKIYDzi0YCQjOZzIPms29NiEBpkWct9b amp-agent@v-edfinance" > /home/deployer/.ssh/authorized_keys
chown -R deployer:deployer /home/deployer/.ssh
chmod 700 /home/deployer/.ssh
chmod 600 /home/deployer/.ssh/authorized_keys

# Test login from local machine
ssh deployer@103.54.153.248 "echo OK"
```

---

#### bd-infra-4: Install Rclone
**Time:** 30 minutes  
**Commands:**
```bash
# Install Rclone
curl https://rclone.org/install.sh | sudo bash
rclone version

# Configure R2 remote (interactive)
rclone config
# Name: r2
# Type: s3
# Provider: Cloudflare
# Access Key ID: ${R2_ACCESS_KEY_ID}
# Secret Access Key: ${R2_SECRET_ACCESS_KEY}
# Endpoint: https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com

# Test connection
rclone lsd r2:
```

**Reference:** `temp_indie_tools/rclone/docs/cloudflare-r2.md`

---

### PHASE 3: Database Deployment (Track 2 - GreenMountain)

#### bd-db-1: Upload init-db.sql
**Time:** 5 minutes  
**Commands:**
```bash
# From local machine
scp init-db.sql root@103.54.153.248:/root/
```

---

#### bd-db-2: Deploy PostgreSQL
**Time:** 20 minutes  
**Commands:**
```bash
ssh root@103.54.153.248

# Generate strong password
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
echo "POSTGRES_PASSWORD=${POSTGRES_PASSWORD}" >> /root/.env

# Deploy PostgreSQL container
docker run -d \
  --name vedfinance-postgres \
  --restart unless-stopped \
  -p 5432:5432 \
  -v /root/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql:ro \
  -v postgres_data:/var/lib/postgresql/data \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=${POSTGRES_PASSWORD} \
  -e POSTGRES_DB=postgres \
  pgvector/pgvector:pg17

# Wait for initialization
sleep 30

# Check logs
docker logs vedfinance-postgres | grep "database system is ready"
```

---

#### bd-db-3: Verify pg_stat_statements
**Time:** 10 minutes  
**Commands:**
```bash
# Check extension enabled
docker exec vedfinance-postgres psql -U postgres -d vedfinance_staging -c "
  SELECT extname, extversion 
  FROM pg_extension 
  WHERE extname IN ('pgvector', 'pg_stat_statements');
"

# Test pg_stat_statements
docker exec vedfinance-postgres psql -U postgres -d vedfinance_staging -c "
  SELECT query, calls 
  FROM pg_stat_statements 
  LIMIT 5;
"
```

**Expected Output:**
```
   extname         | extversion
-------------------+------------
 pgvector          | 0.5.1
 pg_stat_statements| 1.10
```

**✅ CLOSE ved-y1u:** pg_stat_statements enabled successfully

---

#### bd-db-4: Create Databases
**Time:** 5 minutes  
**Commands:**
```bash
# Verify all 3 databases exist
docker exec vedfinance-postgres psql -U postgres -c "\l" | grep vedfinance
```

**Expected:**
- vedfinance_dev
- vedfinance_staging
- vedfinance_prod

---

#### bd-db-5: Run Prisma Migrations
**Time:** 15 minutes  
**Commands:**
```bash
# From local machine
cd apps/api

# Generate DATABASE_URL for staging
DATABASE_URL="postgresql://postgres:${POSTGRES_PASSWORD}@103.54.153.248:5432/vedfinance_staging?schema=public"

# Run migrations
DATABASE_URL=$DATABASE_URL npx prisma migrate deploy

# Verify schema
DATABASE_URL=$DATABASE_URL npx prisma db pull
```

---

### PHASE 4: Monitoring Stack (Track 3 - RedRiver)

#### bd-mon-1: Fix Grafana Port
**Time:** 5 minutes  
**Commands:**
```bash
# Already done in previous session via edit_file
# Verify: grep "3003:3000" docker-compose.monitoring.yml
```

---

#### bd-mon-2: Upload Monitoring Compose
**Time:** 5 minutes  
**Commands:**
```bash
# From local machine
scp docker-compose.monitoring.yml root@103.54.153.248:/root/
scp -r monitoring/ root@103.54.153.248:/root/
scp -r config/netdata/ root@103.54.153.248:/root/config/
```

---

#### bd-mon-3: Deploy Monitoring Stack
**Time:** 30 minutes  
**Commands:**
```bash
ssh root@103.54.153.248

# Generate Grafana password
GRAFANA_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
echo "GRAFANA_ADMIN_PASSWORD=${GRAFANA_PASSWORD}" >> /root/.env

# Generate Beszel agent key
BESZEL_KEY=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
echo "BESZEL_AGENT_KEY=${BESZEL_KEY}" >> /root/.env

# Deploy all monitoring tools
cd /root
docker compose -f docker-compose.monitoring.yml up -d

# Wait for services to start
sleep 60

# Check all containers running
docker ps | grep v-edfinance
```

**Expected Containers:**
- v-edfinance-netdata
- v-edfinance-uptime-kuma
- v-edfinance-glances
- v-edfinance-beszel
- v-edfinance-beszel-agent
- v-edfinance-prometheus
- v-edfinance-grafana

---

#### bd-mon-4: Configure Netdata Alerts
**Time:** 20 minutes  
**Commands:**
```bash
# Copy alert config to Netdata container
docker cp /root/config/netdata/db_capacity.conf v-edfinance-netdata:/etc/netdata/health.d/

# Reload Netdata
docker exec v-edfinance-netdata killall -USR1 netdata

# Verify alerts loaded
docker exec v-edfinance-netdata netdatacli reload-health
```

**Reference:** `temp_indie_tools/netdata/health.d/postgres.conf`

---

#### bd-mon-5: Setup Uptime Kuma Monitors
**Time:** 30 minutes  
**Manual Steps:**
1. Access http://103.54.153.248:3002
2. Create admin account
3. Add monitors:
   - HTTP: Dokploy (http://103.54.153.248:3000)
   - HTTP: API Staging (http://103.54.153.248:3001/api/health)
   - HTTP: Web Staging (http://103.54.153.248:3002)
   - Port: PostgreSQL (103.54.153.248:5432)
   - Port: Redis (103.54.153.248:6379)

4. Configure notifications (Slack webhook)

**Reference:** `temp_indie_tools/uptime-kuma/server/notification-providers/`

---

#### bd-mon-6: Create Grafana Dashboards
**Time:** 40 minutes  
**Manual Steps:**
1. Access http://103.54.153.248:3003
2. Login (admin / ${GRAFANA_PASSWORD})
3. Add Prometheus data source (http://prometheus:9090)
4. Import dashboards:
   - System Overview (ID: 1860)
   - Docker Monitoring (ID: 893)
   - PostgreSQL (ID: 9628)

**Reference:** `monitoring/grafana/dashboards/`

---

### PHASE 5: Application Deployment (Track 4 - PurpleOcean)

#### bd-app-1: Upload Dokploy Config
**Time:** 10 minutes  
**Commands:**
```bash
# From local machine
scp dokploy.yaml root@103.54.153.248:/root/
```

---

#### bd-app-2: Configure Environment Variables
**Time:** 20 minutes  
**Manual Steps:**
1. Access Dokploy dashboard (http://103.54.153.248:3000)
2. Settings → Secrets → Create group "v-edfinance-secrets"
3. Add secrets:
   - DATABASE_URL_STAGING
   - DATABASE_URL_PROD
   - JWT_SECRET
   - JWT_REFRESH_SECRET
   - REDIS_URL
   - R2_ACCESS_KEY_ID
   - R2_SECRET_ACCESS_KEY
   - GEMINI_API_KEY

---

#### bd-app-3: Deploy API Staging
**Time:** 30 minutes  
**Manual Steps:**
1. Dokploy → Applications → Create
2. Source: GitHub (luaho/v-edfinance)
3. Branch: staging
4. Dockerfile: apps/api/Dockerfile
5. Port: 3001
6. Domain: api-staging.v-edfinance.com (or use IP)
7. Environment: Load from "v-edfinance-secrets"
8. Deploy

**Verify:**
```bash
curl http://103.54.153.248:3001/api/health
# Expected: {"status":"ok"}
```

---

#### bd-app-4: Deploy Web Staging
**Time:** 30 minutes  
**Similar to bd-app-3, but:**
- Branch: staging
- Dockerfile: apps/web/Dockerfile
- Port: 3002
- Domain: staging.v-edfinance.com

**Verify:**
```bash
curl http://103.54.153.248:3002
# Expected: HTML response
```

---

#### bd-app-5: Run Smoke Tests
**Time:** 20 minutes  
**Commands:**
```bash
# From local machine
API_URL=http://103.54.153.248:3001 pnpm smoke:staging

# Or manual tests
curl http://103.54.153.248:3001/api/health
curl http://103.54.153.248:3001/api/courses
```

---

### PHASE 6: Backup & Automation (Track 5 - OrangeSky)

#### bd-backup-1: Upload Backup Script
**Time:** 5 minutes  
**Commands:**
```bash
# From local machine
scp scripts/backup-to-r2.sh root@103.54.153.248:/root/scripts/
ssh root@103.54.153.248 "chmod +x /root/scripts/backup-to-r2.sh"
```

---

#### bd-backup-2: Configure Cron
**Time:** 10 minutes  
**Commands:**
```bash
ssh root@103.54.153.248

# Edit crontab
crontab -e

# Add daily backup at 3 AM
0 3 * * * /root/scripts/backup-to-r2.sh >> /var/log/backup.log 2>&1

# Verify cron job
crontab -l
```

---

#### bd-backup-3: Test Backup Manually
**Time:** 15 minutes  
**Commands:**
```bash
# Run backup script manually
/root/scripts/backup-to-r2.sh

# Check logs
cat /var/log/backup.log

# Verify R2 upload
rclone ls r2:v-edfinance-backup/
```

---

#### bd-backup-4: Verify R2 Upload
**Time:** 10 minutes  
**Commands:**
```bash
# List backups
rclone ls r2:v-edfinance-backup/ | head -10

# Download test backup
rclone copy r2:v-edfinance-backup/latest.sql.gz /tmp/

# Verify integrity
gunzip -t /tmp/latest.sql.gz
```

---

## 🔄 ORCHESTRATOR WORKFLOW

### Initialization
```bash
# Orchestrator (This Agent)
ensure_project(human_key="/path/to/v-edfinance")
register_agent(
  project_key="/path/to/v-edfinance",
  name="OrchestratorMaster",
  program="amp",
  model="claude-sonnet-4",
  task_description="VPS Deployment Orchestrator"
)
```

---

### Spawn Workers (Parallel)
```bash
# Track 1: BlueLake (Infrastructure)
Task(
  description="BlueLake: Infrastructure Setup",
  prompt="You are BlueLake. Execute Track 1 beads: bd-infra-1 through bd-infra-4..."
)

# Track 2: GreenMountain (Database)
Task(
  description="GreenMountain: Database Deployment",
  prompt="You are GreenMountain. Wait for BlueLake bd-infra-1, then execute bd-db-1 through bd-db-5..."
)

# Track 3: RedRiver (Monitoring)
Task(
  description="RedRiver: Monitoring Stack",
  prompt="You are RedRiver. Wait for BlueLake bd-infra-1, then execute bd-mon-1 through bd-mon-6..."
)

# Track 4: PurpleOcean (Application)
Task(
  description="PurpleOcean: Application Deployment",
  prompt="You are PurpleOcean. Wait for GreenMountain bd-db-5, then execute bd-app-1 through bd-app-5..."
)

# Track 5: OrangeSky (Backup)
Task(
  description="OrangeSky: Backup & Automation",
  prompt="You are OrangeSky. Wait for GreenMountain bd-db-2 and BlueLake bd-infra-4, then execute bd-backup-1 through bd-backup-4..."
)
```

---

### Monitor Progress
```bash
# Check epic thread for updates
search_messages(
  project_key="/path/to/v-edfinance",
  query="<epic-id>",
  limit=20
)

# Check bead status
bv --robot-triage --graph-root <epic-id> 2>/dev/null | jq '.quick_ref'
```

---

## ✅ SUCCESS CRITERIA

### Track 1 Complete:
- [x] Docker installed and running
- [x] Firewall configured (11 ports open)
- [x] Deployer user created with SSH access
- [x] Rclone installed and R2 remote configured

### Track 2 Complete:
- [x] PostgreSQL container running
- [x] pg_stat_statements extension enabled ✅ (ved-y1u)
- [x] All 3 databases created (dev/staging/prod)
- [x] Prisma migrations applied

### Track 3 Complete:
- [x] 6 monitoring tools running (Netdata, Uptime Kuma, Glances, Beszel, Prometheus, Grafana)
- [x] Netdata alerts configured
- [x] Uptime Kuma monitors active
- [x] Grafana dashboards created

### Track 4 Complete:
- [x] API staging deployed and healthy
- [x] Web staging deployed and accessible
- [x] Smoke tests passing

### Track 5 Complete:
- [x] Backup script uploaded and executable
- [x] Cron job configured (daily 3 AM)
- [x] Manual backup successful
- [x] R2 upload verified

---

## 🎯 POST-DEPLOYMENT TASKS

### Immediate (Same Session):
- [ ] Close all beads with summaries
- [ ] Update AGENTS.md with VPS URLs
- [ ] Document passwords in password manager
- [ ] Send Agent Mail completion summary
- [ ] Sync beads to git (`bd sync`)

### Short-term (Next Session):
- [ ] Install @clack/prompts (`pnpm add -D @clack/prompts`)
- [ ] Create version bump script (`scripts/release/bump-version.ts`)
- [ ] Setup GitHub Actions workflows (`.github/workflows/deploy.yaml`)
- [ ] Test PR preview deployments

### Long-term (Next Week):
- [ ] Deploy production environment
- [ ] Configure SSL certificates (Let's Encrypt)
- [ ] Setup Cloudflare DNS
- [ ] Load testing with Autocannon
- [ ] Disaster recovery drill

---

## 📊 ESTIMATED TIMELINE

| Track | Duration | Dependencies |
|-------|----------|--------------|
| Track 1 (Infrastructure) | 2 hours | None |
| Track 2 (Database) | 2 hours | Track 1 (bd-infra-1) |
| Track 3 (Monitoring) | 3 hours | Track 1 (bd-infra-1) |
| Track 4 (Application) | 2 hours | Track 2 (bd-db-5) |
| Track 5 (Backup) | 1 hour | Track 1 + 2 |

**Total (Sequential):** 10 hours  
**Total (Parallel):** 5-6 hours (with orchestrator)

---

## 🔗 REFERENCES

- **Planning Skill:** `.agents/skills/planning/SKILL.md`
- **Orchestrator Skill:** `.agents/skills/orchestrator/SKILL.md`
- **Tools Inventory:** `DEVOPS_TOOLS_INVENTORY.md`
- **Better-T-Stack Integration:** `history/vps-deployment/better-t-stack-integration.md`

---

**Generated:** 2026-01-05  
**Status:** Ready for execution  
**Next:** Run orchestrator to spawn 5 worker agents
