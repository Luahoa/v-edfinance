# 🔴 P0 Blockers - Execution Plan

**Session:** 2025-12-22  
**Status:** IN PROGRESS  
**Priority:** CRITICAL - Must complete before other work

---

## 📋 Task Breakdown

### ✅ Task 1: VED-6YB - Enable Pgvector Extension on VPS

**Status:** ✅ Scripts Created (Awaiting Manual Execution)  
**Time:** 15 minutes  
**Blocker:** Requires SSH access to VPS

**Deliverables:**
- ✅ Created `scripts/check-vps-pgvector.sh` - Verification script
- ✅ Created `scripts/enable-vps-pgvector.sh` - Enablement script

**Manual Steps (User Must Execute):**

```bash
# Option 1: Automated Script (RECOMMENDED)
bash scripts/enable-vps-pgvector.sh

# Option 2: Manual SSH (If script fails)
ssh root@103.54.153.248

# Find PostgreSQL container
docker ps | grep postgres

# Enable pgvector on all databases
docker exec <CONTAINER_ID> psql -U postgres -d vedfinance_prod -c "CREATE EXTENSION IF NOT EXISTS vector;"
docker exec <CONTAINER_ID> psql -U postgres -d vedfinance_staging -c "CREATE EXTENSION IF NOT EXISTS vector;"
docker exec <CONTAINER_ID> psql -U postgres -d vedfinance_dev -c "CREATE EXTENSION IF NOT EXISTS vector;"
docker exec <CONTAINER_ID> psql -U postgres -d v_edfinance -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Verify
docker exec <CONTAINER_ID> psql -U postgres -d vedfinance_prod -c "SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';"
```

**Verification:**
```bash
bash scripts/check-vps-pgvector.sh
# Should show "✅ ENABLED" for all databases
```

**Close Task:**
```bash
beads.exe close ved-6yb --reason "Enabled pgvector extension on all VPS databases (prod/staging/dev/v_edfinance)"
```

---

### 🔄 Task 2: VED-Y1U - Enable pg_stat_statements on VPS

**Status:** TODO (Depends on VED-6YB)  
**Time:** 20 minutes  
**Blocker:** Requires SSH access + PostgreSQL restart

**What is pg_stat_statements?**
- PostgreSQL extension for tracking query execution statistics
- Required for AI Database Architect to analyze slow queries
- Enables autonomous query optimization

**Implementation Plan:**

1. **Check if already enabled:**
   ```bash
   ssh root@103.54.153.248
   docker exec <PG_CONTAINER> psql -U postgres -d vedfinance_prod -c \
     "SELECT * FROM pg_extension WHERE extname = 'pg_stat_statements';"
   ```

2. **Enable extension:**
   ```bash
   # Add to postgresql.conf
   docker exec <PG_CONTAINER> sh -c \
     "echo \"shared_preload_libraries = 'pg_stat_statements'\" >> /var/lib/postgresql/data/postgresql.conf"
   
   # Restart PostgreSQL container
   docker restart <PG_CONTAINER>
   
   # Wait 10 seconds for restart
   sleep 10
   
   # Create extension in all databases
   docker exec <PG_CONTAINER> psql -U postgres -d vedfinance_prod -c \
     "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"
   docker exec <PG_CONTAINER> psql -U postgres -d vedfinance_staging -c \
     "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"
   docker exec <PG_CONTAINER> psql -U postgres -d vedfinance_dev -c \
     "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"
   ```

3. **Verify:**
   ```bash
   docker exec <PG_CONTAINER> psql -U postgres -d vedfinance_prod -c \
     "SELECT query, calls, mean_exec_time FROM pg_stat_statements LIMIT 5;"
   ```

**Deliverables:**
- [ ] Create `scripts/enable-vps-pg-stat-statements.sh`
- [ ] Create `scripts/check-vps-pg-stat-statements.sh`
- [ ] Verify query stats are being collected
- [ ] Close beads task

**Close Task:**
```bash
beads.exe close ved-y1u --reason "Enabled pg_stat_statements on VPS PostgreSQL for query performance monitoring"
```

---

### 🚀 Task 3: VED-DRX - Deploy AI Agent to VPS Staging

**Status:** TODO (Depends on VED-6YB + VED-Y1U)  
**Time:** 45 minutes  
**Blocker:** Requires Dokploy configuration + database setup

**What is AI Agent?**
- AI Database Architect service (autonomous query optimization)
- Runs on Cron (weekly scans)
- Uses pg_stat_statements to find slow queries
- Generates optimization recommendations using Gemini AI

**Implementation Plan:**

#### Step 1: Verify Local AI Agent Works

```bash
# Test AI service locally
cd apps/api
pnpm test -- ai.service.spec.ts

# Should pass all tests
```

#### Step 2: Create Deployment Configuration

Create `dokploy-ai-agent.yml`:
```yaml
name: v-edfinance-ai-agent
type: service
image: node:20-alpine
env:
  - DATABASE_URL=postgresql://postgres:***@postgres:5432/vedfinance_staging
  - GEMINI_API_KEY=***
  - NODE_ENV=staging
  - AI_AGENT_CRON="0 2 * * 0"  # Every Sunday 2 AM
command: |
  npm install -g pnpm
  pnpm install
  pnpm --filter api build
  pnpm --filter api run ai:optimize
volumes:
  - ./apps/api:/app/apps/api
networks:
  - v-edfinance-network
restart: unless-stopped
```

#### Step 3: Deploy to VPS via Dokploy

**Option A: Dokploy Dashboard (RECOMMENDED)**
1. Access Dokploy: http://103.54.153.248:3000
2. Create new Application: "v-edfinance-ai-agent"
3. Set Docker Compose configuration (paste `dokploy-ai-agent.yml`)
4. Deploy

**Option B: Manual Docker Deployment**
```bash
# SSH to VPS
ssh root@103.54.153.248

# Clone repository (if not already)
git clone https://github.com/Luahoa/v-edfinance.git /opt/v-edfinance
cd /opt/v-edfinance

# Build Docker image
docker build -t v-edfinance-api:latest ./apps/api

# Run AI Agent as standalone service
docker run -d \
  --name v-edfinance-ai-agent \
  --network v-edfinance-network \
  -e DATABASE_URL=postgresql://postgres:***@postgres:5432/vedfinance_staging \
  -e GEMINI_API_KEY=*** \
  v-edfinance-api:latest \
  node dist/modules/ai/scripts/optimize-database.js
```

#### Step 4: Verify Deployment

```bash
# Check service logs
docker logs v-edfinance-ai-agent --tail 50

# Expected output:
# ✅ AI Database Architect started
# ✅ Analyzing 237 queries from pg_stat_statements
# ✅ Found 12 optimization opportunities
# ✅ Stored recommendations in OptimizationLog
```

#### Step 5: Setup Cron Job for Weekly Scans

**Option A: Use Dokploy Cron (RECOMMENDED)**
- Configure in Dokploy Dashboard → Scheduled Tasks
- Cron: `0 2 * * 0` (Every Sunday 2 AM)
- Command: `pnpm --filter api run ai:optimize`

**Option B: System Crontab**
```bash
ssh root@103.54.153.248
crontab -e

# Add:
0 2 * * 0 docker exec v-edfinance-ai-agent node dist/modules/ai/scripts/optimize-database.js
```

**Deliverables:**
- [ ] Create `apps/api/src/modules/ai/scripts/optimize-database.ts`
- [ ] Create Dockerfile for AI Agent service
- [ ] Deploy to VPS staging
- [ ] Verify logs show successful optimization scan
- [ ] Setup weekly cron job
- [ ] Close beads task

**Close Task:**
```bash
beads.exe close ved-drx --reason "Deployed AI Database Architect to VPS staging with weekly cron optimization"
```

---

## 🎯 Execution Order

```
1. VED-6YB (Pgvector)       ← User must execute manually (SSH required)
   └─ Scripts created: check-vps-pgvector.sh, enable-vps-pgvector.sh
   
2. VED-Y1U (pg_stat_statements) ← Agent will implement next
   └─ Create scripts + documentation
   
3. VED-DRX (AI Agent Deploy)    ← Agent will implement after VED-Y1U
   └─ Create AI optimization script
   └─ Create Dockerfile
   └─ Deploy to VPS
```

---

## ✅ Success Criteria

- [ ] All 3 P0 tasks closed in beads
- [ ] Pgvector enabled on all VPS databases
- [ ] pg_stat_statements collecting query metrics
- [ ] AI Agent running on VPS staging
- [ ] Weekly cron job configured
- [ ] Build still passes: `pnpm --filter api build`
- [ ] Tests still pass: `pnpm test`

---

## 🚨 Blockers

1. **VED-6YB:** Requires user to manually SSH to VPS (Agent cannot SSH)
2. **VED-Y1U:** Requires PostgreSQL container restart (risky in production)
3. **VED-DRX:** Requires Gemini API key in VPS environment

**If blockers persist:**
- Mark tasks as `blocked`
- Document blocker reason
- Move to P1 tasks that can be completed without SSH
