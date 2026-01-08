# Dokploy Deployment Guide for V-EdFinance

## Architecture

**Deployment Model**: Local Build → Docker Hub Registry → Dokploy VPS Pull

**Services**:
- `luahoa/v-edfinance-nginx:staging` - Nginx reverse proxy
- `luahoa/v-edfinance-web:staging` - Next.js SSR frontend
- `luahoa/v-edfinance-api:staging` - NestJS backend
- `postgres:16-alpine` - PostgreSQL database (managed by Dokploy)

---

## Prerequisites

### 1. Docker Hub Account

Create Docker Hub repository (if not exists):
```bash
# Login to Docker Hub
docker login -u luahoa

# Repositories should be public or Dokploy needs credentials
```

### 2. VPS Setup

**IP**: 103.54.153.248  
**OS**: Ubuntu 22.04.1  
**Docker**: v29.1.3  
**Dokploy**: Installed and accessible at http://103.54.153.248:3000 (or configured port)

---

## Step 1: Build Images Locally (Windows)

### Option A: Using Batch Script (Recommended)

```batch
# Build all images
scripts\build-docker-images.bat

# Build and push to Docker Hub
scripts\build-docker-images.bat --push
```

### Option B: Manual Build

```bash
# 1. Build Nginx
docker build --platform linux/amd64 -t luahoa/v-edfinance-nginx:staging -f docker/nginx/Dockerfile .

# 2. Build Web (5-7 minutes)
docker build --platform linux/amd64 -t luahoa/v-edfinance-web:staging -f apps/web/Dockerfile .

# 3. Build API (4-6 minutes)
docker build --platform linux/amd64 -t luahoa/v-edfinance-api:staging -f apps/api/Dockerfile .
```

### Push to Docker Hub

```bash
docker push luahoa/v-edfinance-nginx:staging
docker push luahoa/v-edfinance-web:staging
docker push luahoa/v-edfinance-api:staging
```

**Verify**:
```bash
docker images | grep v-edfinance
```

---

## Step 2: Configure Dokploy Project

### Access Dokploy Dashboard

1. Navigate to: `http://103.54.153.248:3000` (or your Dokploy URL)
2. Login with admin credentials
3. Create new project: **v-edfinance-staging**

---

## Step 3: Create Services in Dokploy

### Service 1: PostgreSQL Database

**Type**: Docker Compose Service  
**Name**: `postgres`  
**Configuration**:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: v_edfinance
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

volumes:
  postgres_data:
```

**Environment Variables**:
- `POSTGRES_PASSWORD`: `Halinh!@34`

---

### Service 2: API Backend

**Type**: Docker Service  
**Name**: `api`  
**Image**: `luahoa/v-edfinance-api:staging`  
**Port Mapping**: `3001:3001`  

**Environment Variables**:
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://postgres:Halinh!@34@postgres:5432/v_edfinance
JWT_SECRET=xJ8tOAE4NLoDzme6IGGn/Cw3bALRklFY3gtjgLyzz60=
ALLOWED_ORIGINS=https://staging.v-edfinance.com
R2_ACCOUNT_ID=687ec1b6150b9e7b80fddf1dd5e382de
R2_ACCESS_KEY_ID=[YOUR_R2_ACCESS_KEY]
R2_SECRET_ACCESS_KEY=[YOUR_R2_SECRET_KEY]
R2_BUCKET_NAME=vedfinance-prod
NEXT_PUBLIC_R2_PUBLIC_URL=https://r2.v-edfinance.com
```

**Health Check**:
```bash
wget --quiet --tries=1 --spider http://localhost:3001/health
```

**Depends On**: `postgres` (healthy)

---

### Service 3: Web Frontend

**Type**: Docker Service  
**Name**: `web`  
**Image**: `luahoa/v-edfinance-web:staging`  
**Port Mapping**: `3000:3000`  

**Environment Variables**:
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://api:3001
NEXT_PUBLIC_APP_URL=https://staging.v-edfinance.com
```

**Health Check**:
```bash
wget --quiet --tries=1 --spider http://localhost:3000
```

**Depends On**: `api` (healthy)

---

### Service 4: Nginx Reverse Proxy

**Type**: Docker Service  
**Name**: `nginx`  
**Image**: `luahoa/v-edfinance-nginx:staging`  
**Port Mapping**: `80:80`  

**Environment Variables**:
```env
API_URL=http://api:3001
WEB_URL=http://web:3000
```

**Depends On**: `web`, `api`

---

## Step 4: Deploy via Dokploy

### Method A: Using Docker Compose File

1. Upload `docker-compose.production.yml` to Dokploy
2. Set environment variables in Dokploy UI
3. Click **Deploy**

### Method B: Manual Service Creation

1. Create each service individually in Dokploy UI
2. Configure networking (use Dokploy's internal network)
3. Deploy in order: `postgres` → `api` → `web` → `nginx`

---

## Step 5: Run Database Migrations

After API service is running:

```bash
# SSH to VPS
ssh -i "C:\Users\luaho\.ssh\vps_new_key" root@103.54.153.248

# Find API container ID
docker ps | grep v-edfinance-api

# Run migrations
docker exec -it <api-container-id> npx prisma migrate deploy
```

---

## Step 6: Verify Deployment

### Health Checks

```bash
# Nginx
curl http://103.54.153.248/health

# API
curl http://103.54.153.248:3001/health

# Web
curl http://103.54.153.248:3000
```

### Container Status

Via Dokploy UI or SSH:
```bash
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
```

### Logs

```bash
# View API logs
docker logs -f <api-container-id>

# View Web logs
docker logs -f <web-container-id>
```

---

## Step 7: Configure Domain (Optional)

### Cloudflare DNS

**A Records**:
- `staging.v-edfinance.com` → `103.54.153.248` (Proxied: ON)
- `api.staging.v-edfinance.com` → `103.54.153.248` (Proxied: ON)

**SSL/TLS**:
- Mode: **Full (strict)**
- Origin Server Certificate: Generate in Cloudflare dashboard

### Dokploy Domain Mapping

1. Navigate to Service settings in Dokploy
2. Add domain: `staging.v-edfinance.com` → Nginx service
3. Enable SSL (Dokploy auto-generates Let's Encrypt cert)

---

## Updating Deployment

### Option 1: Rebuild & Push (Local)

```bash
# 1. Make code changes
# 2. Rebuild images
scripts\build-docker-images.bat --push

# 3. Restart services in Dokploy
# Via UI: Click "Redeploy" or "Pull Latest Image"
```

### Option 2: Via SSH (Direct)

```bash
# Pull latest images
docker compose -f /path/to/docker-compose.production.yml pull

# Restart services
docker compose up -d
```

---

## Rollback

### To Previous Image Version

```bash
# Tag images with versions before pushing
docker tag luahoa/v-edfinance-api:staging luahoa/v-edfinance-api:v1.0.0
docker push luahoa/v-edfinance-api:v1.0.0

# Rollback in Dokploy: Change image to v1.0.0
```

---

## Monitoring

### Via Dokploy Dashboard

- Container status (CPU, Memory, Network)
- Logs streaming
- Health check status

### Via Prometheus/Grafana (Existing)

Metrics exposed at:
- `http://103.54.153.248:9090` (Prometheus)
- `http://103.54.153.248:3003` (Grafana)

---

## Troubleshooting

### Build Failures

**Issue**: `COPY` file not found  
**Fix**: Ensure Dockerfile paths are relative to monorepo root

**Issue**: Out of memory during build  
**Fix**: Increase Docker Desktop memory limit (Settings → Resources → Memory)

### Deployment Failures

**Issue**: Container exits immediately  
**Check**: `docker logs <container-id>` for error messages

**Issue**: Health check failing  
**Check**: Ensure port is exposed and service is listening

### Database Connection Issues

**Issue**: `ECONNREFUSED` on DATABASE_URL  
**Fix**: Verify postgres service is healthy, check service name in URL (`postgres:5432`)

---

## Security Checklist

- [ ] `.env.production` NOT committed to git
- [ ] Secrets use environment variables (not hardcoded)
- [ ] PostgreSQL password is strong
- [ ] JWT_SECRET is randomly generated
- [ ] Firewall configured (only 80, 443, 22 open)
- [ ] SSH key authentication enabled
- [ ] Docker images use non-root user (where applicable)

---

## Resources

**Documentation**:
- [Dokploy Docs](https://docs.dokploy.com)
- [Docker Compose Spec](https://docs.docker.com/compose/compose-file/)
- [VPS Toolkit README](file:///e:/Demo%20project/v-edfinance/scripts/vps-toolkit/README.md)

**Tools**:
- Build script: `scripts/build-docker-images.bat`
- VPS connection: `scripts/vps-toolkit/test-connection.js`

**Support**:
- Thread: T-019b96be-7220-779a-9015-25bf206c39c4
- Epic: ved-et78 (Application Deployment)
