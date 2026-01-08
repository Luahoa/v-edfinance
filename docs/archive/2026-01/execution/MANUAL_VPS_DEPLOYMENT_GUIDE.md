# Manual VPS Deployment Guide (Track 1)

**Agent**: CrimsonDeploy  
**Status**: Blocked by Windows PowerShell/cmd execution issues  
**Alternative**: Manual step-by-step execution

---

## Prerequisites

```powershell
# 1. Install ssh2 dependency in vps-toolkit
cd "c:\Users\luaho\Demo project\v-edfinance\scripts\vps-toolkit"
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npm install

# 2. Verify VPS connection
node test-connection.js
```

---

## ved-43oq: Deploy API Docker to VPS

### Step 1: Prepare API Docker Build Context

```powershell
# Create deployment directory on VPS
ssh root@103.54.153.248 "mkdir -p /root/v-edfinance/apps/api"

# Upload Dockerfile
scp "apps\api\Dockerfile" root@103.54.153.248:/root/v-edfinance/apps/api/

# Upload package files
scp package.json root@103.54.153.248:/root/v-edfinance/
scp pnpm-lock.yaml root@103.54.153.248:/root/v-edfinance/
scp pnpm-workspace.yaml root@103.54.153.248:/root/v-edfinance/
scp "apps\api\package.json" root@103.54.153.248:/root/v-edfinance/apps/api/
```

### Step 2: Upload Prisma Schema

```powershell
ssh root@103.54.153.248 "mkdir -p /root/v-edfinance/apps/api/prisma"
scp "apps\api\prisma\schema.prisma" root@103.54.153.248:/root/v-edfinance/apps/api/prisma/
```

### Step 3: Upload Source Code

```powershell
# Compress source code
cd apps\api
tar -czf api-src.tar.gz src
scp api-src.tar.gz root@103.54.153.248:/root/v-edfinance/apps/api/

# Extract on VPS
ssh root@103.54.153.248 "cd /root/v-edfinance/apps/api && tar -xzf api-src.tar.gz && rm api-src.tar.gz"
cd ..\..
```

### Step 4: Build Docker Image

```bash
# On VPS
ssh root@103.54.153.248

cd /root/v-edfinance
docker build -f apps/api/Dockerfile -t vedfinance-api:latest .

# Verify image
docker images | grep vedfinance-api
```

### Step 5: Stop Existing Container (if any)

```bash
docker stop vedfinance-api 2>/dev/null || true
docker rm vedfinance-api 2>/dev/null || true
```

### Step 6: Run API Container

```bash
# Connect to PostgreSQL on VPS (172.17.0.1:5432)
docker run -d \
  --name vedfinance-api \
  -p 3001:3000 \
  --network host \
  -e DATABASE_URL="postgresql://postgres:postgres@172.17.0.1:5432/vedfinance?schema=public" \
  -e NODE_ENV=production \
  -e PORT=3000 \
  vedfinance-api:latest

# Check logs
docker logs vedfinance-api --tail 50
```

### Step 7: Verify Health Checks

```bash
# Wait 10 seconds for startup
sleep 10

# Test health endpoints
curl http://localhost:3001/api/health
curl http://localhost:3001/api/health/db

# External access
curl http://103.54.153.248:3001/api/health
```

### Step 8: Close Bead

```powershell
# On local machine
cd "c:\Users\luaho\Demo project\v-edfinance"
.\beads close ved-43oq --reason "API Docker deployed. Health checks passing. Container: vedfinance-api on port 3001" --no-daemon
```

---

## ved-949o: Deploy Web Docker to VPS

### Prerequisites
- ved-43oq must be complete (API running)

### Step 1: Prepare Web Build

```powershell
# Upload Web Dockerfile
ssh root@103.54.153.248 "mkdir -p /root/v-edfinance/apps/web"
scp "apps\web\Dockerfile" root@103.54.153.248:/root/v-edfinance/apps/web/
scp "apps\web\package.json" root@103.54.153.248:/root/v-edfinance/apps/web/
```

### Step 2: Upload Web Source

```powershell
cd apps\web
tar -czf web-src.tar.gz src public next.config.ts tsconfig.json tailwind.config.ts postcss.config.mjs
scp web-src.tar.gz root@103.54.153.248:/root/v-edfinance/apps/web/

# Extract on VPS
ssh root@103.54.153.248 "cd /root/v-edfinance/apps/web && tar -xzf web-src.tar.gz && rm web-src.tar.gz"
cd ..\..
```

### Step 3: Build Web Docker

```bash
# On VPS
cd /root/v-edfinance

# Check if apps/web/Dockerfile exists, if not create it
cat > apps/web/Dockerfile << 'EOF'
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN apk add --no-cache libc6-compat

FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --filter=web...

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .

ENV NEXT_PUBLIC_API_URL=http://103.54.153.248:3001
RUN pnpm --filter web build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/next.config.ts ./apps/web/
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json

USER nextjs
EXPOSE 3000
CMD ["node_modules/.bin/next", "start", "apps/web"]
EOF

# Build
docker build -f apps/web/Dockerfile -t vedfinance-web:latest .
```

### Step 4: Run Web Container

```bash
# Stop existing
docker stop vedfinance-web 2>/dev/null || true
docker rm vedfinance-web 2>/dev/null || true

# Run
docker run -d \
  --name vedfinance-web \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://103.54.153.248:3001 \
  vedfinance-web:latest

# Check logs
docker logs vedfinance-web --tail 50
```

### Step 5: Verify Web Deployment

```bash
# Wait for startup
sleep 15

# Test homepage
curl -I http://localhost:3000
curl -I http://103.54.153.248:3000

# Test i18n routes
curl -I http://localhost:3000/vi
curl -I http://localhost:3000/en
curl -I http://localhost:3000/zh
```

### Step 6: Close Bead

```powershell
.\beads close ved-949o --reason "Web Docker deployed. Homepage loads. i18n working. Container: vedfinance-web on port 3000" --no-daemon
```

---

## ved-4qk5: Fix Beszel Monitoring (OPTIONAL - P2)

### Issue
```
lstat /beszel/data: not a directory
```

### Investigation

```bash
# On VPS
cd /root
docker-compose -f docker-compose.monitoring.yml logs beszel

# Check volume mount
docker inspect vedfinance-beszel | grep -A 10 Mounts
```

### Fix

```yaml
# Edit docker-compose.monitoring.yml
beszel:
  volumes:
    # Change from:
    - /beszel/data:/beszel/data
    # To:
    - beszel-data:/beszel/data

volumes:
  beszel-data:
```

### Restart

```bash
docker-compose -f docker-compose.monitoring.yml down
docker-compose -f docker-compose.monitoring.yml up -d beszel
docker logs vedfinance-beszel
```

---

## Verification Checklist

After all deployments:

- [ ] API health: `curl http://103.54.153.248:3001/api/health`
- [ ] DB health: `curl http://103.54.153.248:3001/api/health/db`
- [ ] Web homepage: `curl -I http://103.54.153.248:3000`
- [ ] i18n routes: `/vi`, `/en`, `/zh` all load
- [ ] API accessible from web (check Network tab in browser)
- [ ] Containers auto-restart: `docker update --restart unless-stopped vedfinance-api vedfinance-web`

---

## Smoke Test Results Template

```markdown
## VPS Deployment Complete

**Endpoints**:
- API: http://103.54.153.248:3001
- Web: http://103.54.153.248:3000

**Health Checks**:
- GET /api/health: [PASS/FAIL]
- GET /api/health/db: [PASS/FAIL]

**Web Tests**:
- Homepage (vi): [PASS/FAIL]
- Homepage (en): [PASS/FAIL]
- Homepage (zh): [PASS/FAIL]
- API connectivity: [PASS/FAIL]

**Issues Encountered**:
- [List any issues]

**Container Status**:
```
docker ps -a | grep vedfinance
```

**Next Steps**:
1. Configure Cloudflare DNS
2. Setup SSL/TLS
3. Configure firewall rules
4. Setup automated backups
```

---

## Troubleshooting

### API won't start
```bash
# Check logs
docker logs vedfinance-api

# Check database connectivity
docker exec vedfinance-api sh -c "nc -zv 172.17.0.1 5432"

# Rebuild without cache
docker build --no-cache -f apps/api/Dockerfile -t vedfinance-api:latest .
```

### Web build fails
```bash
# Check build logs
docker build -f apps/web/Dockerfile -t vedfinance-web:latest . 2>&1 | tee web-build.log

# Common issue: Missing .env variables
docker run --rm -it vedfinance-web:latest sh -c "env | grep NEXT"
```

### Permission denied
```bash
# If upload fails with permission denied
ssh root@103.54.153.248 "chmod 755 /root && chmod -R 755 /root/v-edfinance"
```
