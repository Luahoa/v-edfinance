# Dokploy Setup Guide for V-EdFinance

**Epic**: ved-et78 (CI/CD Deployment)  
**Track**: 2 (GreenCastle - Dokploy Configuration)  
**Status**: ⚠️ Dokploy NOT installed on VPS (103.54.153.248)

---

## Verification Results

✅ **Checked**: 2026-01-07  
❌ **Dokploy Status**: NOT installed

**Check command**:
```bash
cd scripts/vps-toolkit
node check-dokploy.js
```

---

## Option A: Install Dokploy (Recommended for Production)

### Why Dokploy?

- **Web UI** for easy deployment management
- **Webhook integration** with GitHub Actions
- **Auto-deployment** on image updates
- **Service orchestration** with dependency management
- **Zero-downtime deployments**

### Prerequisites

- Ubuntu 22.04+ (✅ VPS verified)
- Docker installed (✅ VPS verified)
- Port 3000 available (✅ VPS verified)
- Root access (✅ VPS has)

### Installation Steps

#### 1. Install Dokploy (Manual on VPS)

```bash
# SSH into VPS
ssh root@103.54.153.248

# Install Dokploy
curl -sSL https://dokploy.com/install.sh | sh

# Verify installation
dokploy version
docker ps | grep dokploy
```

**Expected output**:
```
Dokploy v0.x.x
dokploy-traefik   Up 2 minutes
dokploy-postgres  Up 2 minutes
dokploy-redis     Up 2 minutes
```

#### 2. Access Dokploy UI

1. Navigate to: `http://103.54.153.248:3000`
2. Create admin account (first-time setup)
3. Login with credentials

#### 3. Create Project

1. Dashboard → **New Project**
2. **Project Name**: `v-edfinance-staging`
3. **Project Type**: Docker Compose
4. Click **Create**

#### 4. Configure Services

##### Service 1: PostgreSQL

- **Service Name**: `postgres`
- **Image**: `postgres:16-alpine`
- **Pull Policy**: `Always`
- **Environment Variables**:
  ```env
  POSTGRES_USER=postgres
  POSTGRES_PASSWORD=<from .env.production>
  POSTGRES_DB=v_edfinance
  ```
- **Volumes**:
  - `/var/lib/postgresql/data:/var/lib/postgresql/data`
- **Network**: `v-edfinance-network`
- **Health Check**:
  - Command: `pg_isready -U postgres`
  - Interval: 10s
  - Timeout: 5s
  - Retries: 5

##### Service 2: API

- **Service Name**: `api`
- **Image**: `luahoa/v-edfinance-api:staging`
- **Pull Policy**: `Always`
- **Depends On**: `postgres` (healthy)
- **Environment Variables**:
  ```env
  DATABASE_URL=postgresql://postgres:<password>@postgres:5432/v_edfinance
  NODE_ENV=production
  PORT=3001
  JWT_SECRET=<from .env.production>
  JWT_REFRESH_SECRET=<from .env.production>
  ```
- **Ports**: `3001:3001`
- **Network**: `v-edfinance-network`
- **Health Check**:
  - URL: `http://localhost:3001/health`
  - Interval: 30s
  - Timeout: 10s
  - Retries: 3

##### Service 3: Web

- **Service Name**: `web`
- **Image**: `luahoa/v-edfinance-web:staging`
- **Pull Policy**: `Always`
- **Depends On**: `api` (healthy)
- **Environment Variables**:
  ```env
  NEXT_PUBLIC_API_URL=http://103.54.153.248:3001
  NODE_ENV=production
  ```
- **Ports**: `3000:3000`
- **Network**: `v-edfinance-network`
- **Health Check**:
  - URL: `http://localhost:3000`
  - Interval: 30s
  - Timeout: 10s
  - Retries: 3

##### Service 4: Nginx

- **Service Name**: `nginx`
- **Image**: `luahoa/v-edfinance-nginx:staging`
- **Pull Policy**: `Always`
- **Depends On**: `web`, `api`
- **Ports**: `80:80`
- **Network**: `v-edfinance-network`
- **Health Check**:
  - URL: `http://localhost/health`
  - Interval: 30s
  - Timeout: 5s
  - Retries: 3

#### 5. Configure Dependencies

**Dependency Graph**:
```
PostgreSQL
    ↓ (healthy)
   API
    ↓ (healthy)
   Web
    ↓
  Nginx
```

In Dokploy UI:
1. Go to each service → **Dependencies** tab
2. Set startup order as shown above
3. Enable **Wait for healthy** status

#### 6. Generate Webhook URL

1. Project Settings → **Webhooks**
2. Click **Generate Webhook**
3. **Webhook Name**: `github-actions-deploy`
4. **Trigger Events**: `Image Update`
5. Copy webhook URL (format: `https://dokploy.example.com/webhooks/<token>`)
6. Save to GitHub Secrets as `DOKPLOY_WEBHOOK_URL`

#### 7. Test Deployment

**Manual Deploy**:
```bash
# In Dokploy UI
Project: v-edfinance-staging → Deploy

# Monitor logs
Services → View Logs
```

**Expected timeline**:
- PostgreSQL: 30 seconds
- API: 1 minute (waits for DB)
- Web: 1 minute (waits for API)
- Nginx: 30 seconds

**Total**: ~3 minutes

---

## Option B: Docker Compose Fallback (Current Epic)

### Why This Approach?

- **No Dokploy dependency** - Uses existing docker-compose
- **Faster setup** - Works with existing VPS setup
- **GitHub Actions integration** - Already configured
- **Webhook alternative** - Use SSH deploy trigger

### Architecture

```
GitHub Actions → Build Images → Docker Hub → VPS pulls & redeploys
```

### Implementation

#### 1. Verify docker-compose.production.yml

File: `docker-compose.production.yml`

**Key changes needed**:
- ✅ Use `image:` instead of `build:`
- ✅ Pull from Docker Hub registry
- ✅ Configure health checks
- ✅ Set restart policies

**Example**:
```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    image: luahoa/v-edfinance-api:staging
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  web:
    image: luahoa/v-edfinance-web:staging
    depends_on:
      api:
        condition: service_healthy
    restart: unless-stopped

  nginx:
    image: luahoa/v-edfinance-nginx:staging
    depends_on:
      - web
      - api
    restart: unless-stopped
```

#### 2. Create VPS Deployment Script

File: `scripts/vps-toolkit/deploy-via-compose.js`

```javascript
#!/usr/bin/env node

const VPSConnection = require('./vps-connection');

async function deployViaCompose() {
  const vps = new VPSConnection();
  
  try {
    await vps.connect();
    
    console.log('1. Pulling latest images from Docker Hub...');
    await vps.exec('cd /root/v-edfinance && docker-compose -f docker-compose.production.yml pull');
    
    console.log('2. Restarting services...');
    await vps.exec('cd /root/v-edfinance && docker-compose -f docker-compose.production.yml up -d');
    
    console.log('3. Verifying health...');
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10s
    
    const health = await vps.exec('curl -f http://localhost/health || echo "FAILED"');
    if (health.stdout.includes('FAILED')) {
      throw new Error('Health check failed');
    }
    
    console.log('✅ Deployment successful!');
    
  } finally {
    vps.disconnect();
  }
}

deployViaCompose().catch(console.error);
```

#### 3. Configure GitHub Actions Deployment

File: `.github/workflows/deploy-dokploy.yml`

**Modify to use SSH instead of webhook**:

```yaml
name: Deploy to VPS via SSH

on:
  workflow_run:
    workflows: ["Build and Push Docker Images"]
    types:
      - completed
    branches:
      - staging

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd scripts/vps-toolkit
          npm install
      
      - name: Create .env file
        run: |
          cd scripts/vps-toolkit
          cat > .env << EOF
          VPS_HOST=${{ secrets.VPS_IP }}
          VPS_PORT=22
          VPS_USER=root
          VPS_KEY_PATH=/tmp/vps_key
          EOF
      
      - name: Setup SSH key
        run: |
          echo "${{ secrets.VPS_SSH_KEY }}" > /tmp/vps_key
          chmod 600 /tmp/vps_key
      
      - name: Deploy to VPS
        run: |
          cd scripts/vps-toolkit
          node deploy-via-compose.js
```

#### 4. Add VPS_SSH_KEY Secret

1. Go to: `https://github.com/Luahoa/v-edfinance/settings/secrets/actions`
2. Click **New repository secret**
3. **Name**: `VPS_SSH_KEY`
4. **Value**: Copy private key from `C:\Users\luaho\.ssh\vps_new_key`
5. Save

---

## Service Dependencies Configuration

### Health Check Endpoints

| Service | Endpoint | Expected Response |
|---------|----------|-------------------|
| PostgreSQL | `pg_isready -U postgres` | `accepting connections` |
| API | `http://localhost:3001/health` | `{"status":"ok"}` |
| Web | `http://localhost:3000` | HTTP 200 |
| Nginx | `http://localhost/health` | HTTP 200 (proxies to API) |

### Network Configuration

**Network Name**: `v-edfinance-network`

**Service Communication**:
- API → PostgreSQL: `postgres:5432`
- Web → API: `api:3001`
- Nginx → Web: `web:3000`
- Nginx → API: `api:3001`

**External Access**:
- Nginx: `http://103.54.153.248:80` (public)
- API: `http://103.54.153.248:3001` (public for testing)
- Web: `http://103.54.153.248:3000` (public for testing)
- PostgreSQL: `localhost:5432` (internal only)

### Startup Sequence

1. **PostgreSQL** starts
2. Wait for healthy (10s interval, 5 retries = max 50s)
3. **API** starts
4. Wait for healthy (30s interval, 3 retries = max 90s)
5. **Web** starts
6. Wait for startup (no health check dependency)
7. **Nginx** starts

**Total cold start**: ~3-4 minutes

---

## Verification Checklist

### After Dokploy Setup (Option A)

- [ ] Dokploy UI accessible at `http://103.54.153.248:3000`
- [ ] Project `v-edfinance-staging` created
- [ ] 4 services configured (PostgreSQL, API, Web, Nginx)
- [ ] Webhook URL generated and saved to GitHub Secrets
- [ ] Dependencies configured (API → PostgreSQL, Web → API)
- [ ] Health checks configured for all services
- [ ] Manual deployment successful
- [ ] All services running (`docker ps` shows 4 containers)
- [ ] Nginx health check: `curl http://103.54.153.248/health` → 200
- [ ] API health check: `curl http://103.54.153.248:3001/health` → 200
- [ ] Web health check: `curl http://103.54.153.248:3000` → 200

### After Docker Compose Setup (Option B)

- [ ] `docker-compose.production.yml` updated with `image:` tags
- [ ] Health checks configured in compose file
- [ ] `deploy-via-compose.js` script created
- [ ] `VPS_SSH_KEY` secret added to GitHub
- [ ] `.github/workflows/deploy-dokploy.yml` updated for SSH
- [ ] Manual test: `node scripts/vps-toolkit/deploy-via-compose.js` → Success
- [ ] All services running: `docker-compose -f docker-compose.production.yml ps`
- [ ] Health checks passing
- [ ] GitHub Actions workflow triggered → Deployment successful

---

## Troubleshooting

### Dokploy Installation Issues

**Problem**: `curl: command not found`
```bash
apt-get update && apt-get install -y curl
```

**Problem**: Port 3000 already in use
```bash
# Check what's using port 3000
netstat -tuln | grep 3000

# Stop conflicting service
docker stop <container-name>
```

### Docker Compose Issues

**Problem**: `docker-compose: command not found`
```bash
# Install docker-compose
curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

**Problem**: Services fail to start
```bash
# Check logs
docker-compose -f docker-compose.production.yml logs <service-name>

# Restart specific service
docker-compose -f docker-compose.production.yml restart <service-name>
```

### Health Check Failures

**Problem**: API health check fails
```bash
# Check if API is listening
docker exec v-edfinance-api curl -f http://localhost:3001/health

# Check logs
docker logs v-edfinance-api
```

**Problem**: Database connection timeout
```bash
# Verify PostgreSQL is healthy
docker exec v-edfinance-postgres pg_isready -U postgres

# Check DATABASE_URL in API container
docker exec v-edfinance-api env | grep DATABASE_URL
```

---

## Recommendation for ved-et78

**Use Option B (Docker Compose)** for this epic because:

1. ✅ **Faster delivery** - No Dokploy installation time
2. ✅ **Lower risk** - Uses existing docker-compose patterns
3. ✅ **Already integrated** - GitHub Actions workflow ready
4. ✅ **Easier rollback** - `docker-compose pull <tag>` for specific version
5. ✅ **Sufficient for staging** - Dokploy better for production multi-env

**Future improvement** (Post ved-et78):
- Install Dokploy for production environment
- Migrate staging to Dokploy for consistency
- Use Dokploy for domain management + SSL

---

## Next Steps

### If using Option A (Dokploy)
1. Manual install Dokploy on VPS (30 min)
2. Complete [ved-et78-dokploy-project](#option-a-install-dokploy-recommended-for-production)
3. Complete [ved-et78-dokploy-deps](#service-dependencies-configuration)

### If using Option B (Docker Compose) ✅ RECOMMENDED
1. ✅ Update docker-compose.production.yml
2. ✅ Create deploy-via-compose.js script
3. ✅ Update GitHub Actions workflow
4. ✅ Test deployment pipeline

---

**Document created**: 2026-01-07  
**Epic**: ved-et78  
**Track**: 2 (GreenCastle)  
**Status**: Ready for implementation
