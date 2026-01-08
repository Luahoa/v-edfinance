# Quick Start: Optimized Plan C Execution

**Estimated time**: 30 minutes to first automated deployment

---

## Checklist

### Prerequisites (5 minutes)
- [ ] Docker Hub account exists (hub.docker.com)
- [ ] GitHub repository accessible
- [ ] Dokploy running on VPS (103.54.153.248)
- [ ] VPS firewall allows GitHub IPs

---

## Step 1: Generate Docker Hub Token (3 minutes)

1. Visit: https://hub.docker.com/settings/security
2. Click **"New Access Token"**
3. Settings:
   - **Description**: `github-actions-v-edfinance`
   - **Permissions**: Read, Write, Delete
4. Click **"Generate"**
5. **Copy token** (dqp_...)  ⚠️ Save immediately, shown once!

---

## Step 2: Configure GitHub Secrets (5 minutes)

1. Visit: https://github.com/Luahoa/v-edfinance/settings/secrets/actions
2. Click **"New repository secret"** (4 times)

**Secret 1**:
```
Name: DOCKERHUB_USERNAME
Value: luahoa
```

**Secret 2**:
```
Name: DOCKERHUB_TOKEN
Value: dqp_... (paste token from Step 1)
```

**Secret 3** (temporary, will update after Step 3):
```
Name: DOKPLOY_WEBHOOK_URL
Value: http://103.54.153.248:3000/webhook-placeholder
```

**Secret 4**:
```
Name: VPS_IP
Value: 103.54.153.248
```

---

## Step 3: Create Dokploy Webhook (5 minutes)

### Option A: Via Dokploy UI (if installed)

1. Login: http://103.54.153.248:3000
2. Navigate to project: `v-edfinance-staging` (create if not exists)
3. Go to: Settings → Webhooks
4. Click **"Create Webhook"**
5. Configuration:
   - **Name**: `github-actions-auto-deploy`
   - **Services**: Select all (or specific services)
   - **Action**: `Redeploy`
6. Click **"Create"**
7. Copy webhook URL (e.g., `http://103.54.153.248:3000/api/webhooks/abc123`)

### Option B: Manual Setup (if Dokploy not ready)

**Skip for now** - Workflow will build images, manual redeploy in Dokploy UI

Update GitHub secret:
```
Name: DOKPLOY_WEBHOOK_URL
Value: <webhook-url-from-dokploy>
```

---

## Step 4: Push Workflows to GitHub (3 minutes)

**Files already created**:
- `.github/workflows/docker-build.yml`
- `.github/workflows/deploy-dokploy.yml`

**Commit and push**:
```bash
git add .github/workflows/
git commit -m "ci: add optimized GitHub Actions CI/CD pipeline"
git push origin spike/simplified-nav
```

---

## Step 5: Trigger First Build (1 minute)

### Option A: Automatic (just push)
Already triggered by Step 4 push!

### Option B: Manual trigger
1. Visit: https://github.com/Luahoa/v-edfinance/actions
2. Select workflow: **"Build & Push Docker Images"**
3. Click **"Run workflow"**
4. Branch: `spike/simplified-nav`
5. Click **"Run workflow"** (green button)

---

## Step 6: Monitor Build (7-10 minutes)

1. Visit: https://github.com/Luahoa/v-edfinance/actions
2. Click on running workflow
3. Watch jobs:
   - ✅ `detect-changes` (10 sec)
   - 🔄 `build-nginx` (30 sec - 1 min)
   - 🔄 `build-web` (5-7 min first build, 1-2 min cached)
   - 🔄 `build-api` (4-6 min first build, 1-2 min cached)
   - ✅ `notify` (5 sec)

**Expected timeline** (first build):
- 0:00 - Workflow starts
- 0:10 - Change detection complete
- 0:10 - All 3 builds start (parallel)
- 6:00 - Nginx complete
- 7:00 - API complete
- 8:00 - Web complete
- 8:05 - Notify complete

---

## Step 7: Verify Docker Hub (2 minutes)

1. Visit: https://hub.docker.com/u/luahoa
2. Verify repositories exist:
   - `luahoa/v-edfinance-nginx`
   - `luahoa/v-edfinance-web`
   - `luahoa/v-edfinance-api`

3. Check each repository for tags:
   - ✅ `staging`
   - ✅ `latest`
   - ✅ `spike/simplified-nav-<sha>` (e.g., `spike/simplified-nav-a0b0479`)

---

## Step 8: Configure Dokploy Services (10 minutes)

**Create project** (if not exists):
1. Dokploy UI → Projects → Create
2. Name: `v-edfinance-staging`

**Add PostgreSQL service**:
1. Add Service → Docker Compose
2. Name: `postgres`
3. Configuration:
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

volumes:
  postgres_data:
```
4. Environment: `POSTGRES_PASSWORD=Halinh!@34`
5. Deploy

**Add API service**:
1. Add Service → Docker
2. Name: `api`
3. Image: `luahoa/v-edfinance-api:staging`
4. Pull policy: `Always`
5. Port: `3001:3001`
6. Environment variables (copy from `.env.production`):
```
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://postgres:Halinh!@34@postgres:5432/v_edfinance
JWT_SECRET=xJ8tOAE4NLoDzme6IGGn/Cw3bALRklFY3gtjgLyzz60=
ALLOWED_ORIGINS=https://staging.v-edfinance.com
R2_ACCOUNT_ID=687ec1b6150b9e7b80fddf1dd5e382de
R2_ACCESS_KEY_ID=<from .env>
R2_SECRET_ACCESS_KEY=<from .env>
R2_BUCKET_NAME=vedfinance-prod
```
7. Depends on: `postgres`
8. Deploy

**Add Web service**:
1. Add Service → Docker
2. Name: `web`
3. Image: `luahoa/v-edfinance-web:staging`
4. Pull policy: `Always`
5. Port: `3000:3000`
6. Environment variables:
```
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://api:3001
NEXT_PUBLIC_APP_URL=https://staging.v-edfinance.com
```
7. Depends on: `api`
8. Deploy

**Add Nginx service**:
1. Add Service → Docker
2. Name: `nginx`
3. Image: `luahoa/v-edfinance-nginx:staging`
4. Pull policy: `Always`
5. Port: `80:80`
6. Environment variables:
```
API_URL=http://api:3001
WEB_URL=http://web:3000
```
7. Depends on: `web`, `api`
8. Deploy

---

## Step 9: Verify Deployment (3 minutes)

**Health checks**:
```bash
# Nginx
curl http://103.54.153.248/health

# API
curl http://103.54.153.248:3001/health

# Web
curl http://103.54.153.248:3000
```

**Expected responses**:
- Nginx: `200 OK` or proxied API health
- API: `{"status":"ok"}`
- Web: HTML page

**Browser test**:
- http://103.54.153.248 - Should show V-EdFinance homepage

---

## Step 10: Test Automated Workflow (5 minutes)

**Make a test change**:
```bash
# Edit a visible file
echo "<!-- CI/CD test -->" >> apps/web/src/app/layout.tsx

git add apps/web/src/app/layout.tsx
git commit -m "test: verify automated CI/CD pipeline"
git push origin spike/simplified-nav
```

**Watch automation**:
1. GitHub Actions automatically triggers
2. Detects `apps/web/**` changed
3. Builds only Web image (1-2 min with cache)
4. Pushes to Docker Hub
5. (If webhook configured) Triggers Dokploy redeploy
6. (If webhook configured) Dokploy pulls latest image
7. (If webhook configured) Restarts Web container

**Verify**:
```bash
# Check if change deployed
curl http://103.54.153.248:3000 | grep "CI/CD test"
```

---

## Troubleshooting

### Build fails: "denied: requested access to the resource is denied"
**Fix**: Docker Hub token invalid or missing
```bash
# Re-generate token (Step 1)
# Update GitHub secret DOCKERHUB_TOKEN
```

---

### Dokploy not pulling latest image
**Fix**: Pull policy not set to "Always"
1. Dokploy UI → Service settings
2. Pull policy: `Always`
3. Redeploy

---

### Health check fails
**Fix**: Containers not fully started
```bash
# Check logs in Dokploy
# Or via SSH:
ssh -i "C:\Users\luaho\.ssh\vps_new_key" root@103.54.153.248
docker ps
docker logs <container-id>
```

---

### GitHub Actions quota exceeded
**Check usage**:
1. GitHub → Settings → Billing
2. Actions usage: Should be <100 min for ved-et78

---

## Success Criteria

✅ **Build complete when**:
- [ ] All 3 images on Docker Hub with `staging` tag
- [ ] GitHub Actions shows green checkmark
- [ ] Build time <8 min (first build) or <3 min (cached)

✅ **Deployment complete when**:
- [ ] All 4 containers running in Dokploy
- [ ] Health checks pass (200 OK)
- [ ] Web accessible at http://103.54.153.248
- [ ] API accessible at http://103.54.153.248:3001/health

✅ **Automation working when**:
- [ ] Code change triggers build automatically
- [ ] Only changed service rebuilds
- [ ] Dokploy redeploys without manual intervention
- [ ] Total time commit → deployed <5 min

---

## Next Steps (After Success)

1. **Update AGENTS.md** - Document CI/CD commands
2. **Configure domain** - Point staging.v-edfinance.com to VPS
3. **Enable SSL** - Dokploy auto-generates Let's Encrypt cert
4. **Add Slack notifications** - Build status alerts
5. **Close ved-et78** - Epic complete!

---

## Emergency Rollback

**If deployment breaks**:
1. Find last working commit SHA in GitHub
2. Dokploy UI → API service
3. Change image tag:
   ```
   FROM: luahoa/v-edfinance-api:staging
   TO:   luahoa/v-edfinance-api:spike/simplified-nav-<previous-sha>
   ```
4. Redeploy (30 sec)
5. Repeat for Web/Nginx if needed

---

**Estimated total time**: 30-40 minutes from start to automated deployment working

**Ready to begin?** Start with Step 1 (Docker Hub token)
