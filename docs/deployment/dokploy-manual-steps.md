# Manual Dokploy Configuration Steps

**Epic**: ved-et78  
**Bead**: ved-et78-dokploy-project  
**Track**: 2 (GreenCastle)  
**Prerequisites**: Dokploy installed on VPS (see [dokploy-setup-guide.md](../deployment/dokploy-setup-guide.md))

---

## IMPORTANT: Dokploy Status

⚠️ **Dokploy is NOT currently installed on VPS (103.54.153.248)**

**Verified**: 2026-01-07 via `scripts/vps-toolkit/check-dokploy.js`

### Options

1. **Option A** - Install Dokploy (requires manual VPS access)
   - Follow [Dokploy Installation Guide](../deployment/dokploy-setup-guide.md#option-a-install-dokploy-recommended-for-production)
   - Then return here to complete configuration

2. **Option B** - Use Docker Compose (✅ RECOMMENDED for ved-et78)
   - Skip Dokploy configuration
   - Use automated deployment: `node scripts/vps-toolkit/deploy-via-compose.js`
   - GitHub Actions already configured for this approach

---

## If Dokploy Is Installed: UI Configuration Steps

### Step 1: Access Dokploy UI

1. Open browser: `http://103.54.153.248:3000`
2. Login with admin credentials (created during installation)
3. Dashboard should appear

**Expected screen**: Dokploy Projects Dashboard

---

### Step 2: Create New Project

**Location**: Dashboard → **New Project** button (top-right)

**Fields**:
- **Project Name**: `v-edfinance-staging`
- **Project Type**: Docker Compose
- **Description**: `V-EdFinance staging environment - automated CI/CD`

**Click**: Create Project

**Expected result**: Redirected to project page

---

### Step 3: Add PostgreSQL Service

**Location**: Project Page → **Add Service** → **Database**

**Configuration**:

| Field | Value |
|-------|-------|
| Service Name | `postgres` |
| Database Type | PostgreSQL |
| Version | 16 (alpine) |
| Database Name | `v_edfinance` |
| Username | `postgres` |
| Password | `<from .env.production>` |
| Port | 5432 |
| Pull Policy | Always |

**Volumes**:
- Mount: `/var/lib/postgresql/data`
- Persistent: ✅ Yes

**Health Check**:
- Command: `pg_isready -U postgres`
- Interval: 10s
- Timeout: 5s
- Retries: 5

**Click**: Save Service

---

### Step 4: Add API Service

**Location**: Project Page → **Add Service** → **Application**

**Configuration**:

| Field | Value |
|-------|-------|
| Service Name | `api` |
| Image | `luahoa/v-edfinance-api:staging` |
| Registry | Docker Hub (public) |
| Pull Policy | Always |
| Port | 3001 |

**Environment Variables** (click **Add Variable** for each):

```env
DATABASE_URL=postgresql://postgres:<password>@postgres:5432/v_edfinance
NODE_ENV=production
PORT=3001
JWT_SECRET=<from .env.production>
JWT_REFRESH_SECRET=<from .env.production>
ALLOWED_ORIGINS=https://staging.v-edfinance.com,http://103.54.153.248
```

**Dependencies**:
- Depends on: `postgres`
- Wait for: ✅ Healthy

**Health Check**:
- Type: HTTP
- Path: `/health`
- Port: 3001
- Interval: 30s
- Timeout: 10s
- Retries: 3

**Click**: Save Service

---

### Step 5: Add Web Service

**Location**: Project Page → **Add Service** → **Application**

**Configuration**:

| Field | Value |
|-------|-------|
| Service Name | `web` |
| Image | `luahoa/v-edfinance-web:staging` |
| Registry | Docker Hub (public) |
| Pull Policy | Always |
| Port | 3000 |

**Environment Variables**:

```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://api:3001
NEXT_PUBLIC_APP_URL=https://staging.v-edfinance.com
```

**Dependencies**:
- Depends on: `api`
- Wait for: ✅ Healthy

**Health Check**:
- Type: HTTP
- Path: `/`
- Port: 3000
- Interval: 30s
- Timeout: 10s
- Retries: 3

**Click**: Save Service

---

### Step 6: Add Nginx Service

**Location**: Project Page → **Add Service** → **Application**

**Configuration**:

| Field | Value |
|-------|-------|
| Service Name | `nginx` |
| Image | `luahoa/v-edfinance-nginx:staging` |
| Registry | Docker Hub (public) |
| Pull Policy | Always |
| Port | 80 |

**Environment Variables**:

```env
API_URL=http://api:3001
WEB_URL=http://web:3000
```

**Dependencies**:
- Depends on: `web`, `api`
- Wait for: ❌ No (nginx starts immediately)

**Port Mapping**:
- Host: 80
- Container: 80

**Health Check**:
- Type: HTTP
- Path: `/health`
- Port: 80
- Interval: 30s
- Timeout: 5s
- Retries: 3

**Click**: Save Service

---

### Step 7: Configure Networking

**Location**: Project Settings → **Network**

**Network Configuration**:

| Setting | Value |
|---------|-------|
| Network Name | `v-edfinance-network` |
| Driver | bridge |
| Internal | ❌ No |

**Attach all services** to `v-edfinance-network`

**Click**: Save Network Settings

---

### Step 8: Generate Webhook URL

**Location**: Project Settings → **Webhooks** tab

**Steps**:
1. Click **Generate New Webhook**
2. **Webhook Name**: `github-actions-deploy`
3. **Trigger Events**: Select:
   - ✅ Image Updated
   - ✅ Manual Trigger
4. **Services to Deploy**: Select all 4 services
5. Click **Generate**

**Expected output**: Webhook URL (format: `https://dokploy.example.com/webhooks/<token>`)

**IMPORTANT**: Copy this URL immediately!

**Action**: Save to GitHub Secrets
1. Go to: `https://github.com/Luahoa/v-edfinance/settings/secrets/actions`
2. Click **New repository secret**
3. **Name**: `DOKPLOY_WEBHOOK_URL`
4. **Value**: Paste webhook URL
5. Save

---

### Step 9: Configure Auto-Deploy Settings

**Location**: Project Settings → **Deployment**

**Settings**:

| Setting | Value |
|---------|-------|
| Auto-deploy on webhook | ✅ Enabled |
| Pull before deploy | ✅ Enabled |
| Prune old images | ✅ Enabled |
| Max concurrent deploys | 1 |
| Deployment timeout | 300s (5 minutes) |

**Rollback Strategy**:
- On failure: Keep previous version running
- Max rollback versions: 3

**Click**: Save Deployment Settings

---

### Step 10: Test Manual Deployment

**Location**: Project Page → **Deploy** button (top-right)

**Steps**:
1. Click **Deploy Now**
2. Confirm deployment
3. Watch deployment logs in real-time

**Expected Timeline**:
- PostgreSQL: 30s (pulls image + starts)
- API: 90s (waits for DB healthy + starts)
- Web: 60s (waits for API healthy + starts)
- Nginx: 30s (starts after Web/API)

**Total**: ~3-4 minutes

**Expected Result**: All 4 services show **Running** status

---

### Step 11: Verify Deployment

**Health Check URLs** (open in browser or use curl):

1. **Nginx Health** (should proxy to API):
   ```bash
   curl http://103.54.153.248/health
   # Expected: {"status":"ok"}
   ```

2. **API Health**:
   ```bash
   curl http://103.54.153.248:3001/health
   # Expected: {"status":"ok"}
   ```

3. **Web Frontend**:
   ```bash
   curl http://103.54.153.248:3000
   # Expected: HTML content
   ```

4. **Database** (from Dokploy UI):
   - Go to postgres service → **Logs**
   - Should see: `database system is ready to accept connections`

---

### Step 12: Configure Monitoring (Optional)

**Location**: Project Settings → **Monitoring**

**Settings**:
- Enable metrics: ✅ Yes
- Prometheus endpoint: `/metrics`
- Scrape interval: 30s

**Alerts** (optional):
- Service down: Email notification
- Health check failed 3 times: Email notification

---

## Verification Checklist

After completing all steps, verify:

- [ ] Dokploy UI accessible at `http://103.54.153.248:3000`
- [ ] Project `v-edfinance-staging` visible in dashboard
- [ ] 4 services configured (postgres, api, web, nginx)
- [ ] All services show **Running** status
- [ ] Webhook URL generated and saved to GitHub Secrets
- [ ] Manual deployment successful (all services started)
- [ ] Health checks passing:
  - [ ] Nginx: `http://103.54.153.248/health` → 200
  - [ ] API: `http://103.54.153.248:3001/health` → 200
  - [ ] Web: `http://103.54.153.248:3000` → 200
- [ ] Dependencies configured (API → PostgreSQL, Web → API)
- [ ] Auto-deploy enabled
- [ ] Deployment logs show no errors

---

## Environment Variables Reference

**Required from `.env.production`** (DO NOT commit these):

```env
# Database
POSTGRES_PASSWORD=<secret>

# JWT Secrets
JWT_SECRET=<secret>
JWT_REFRESH_SECRET=<secret>

# API Configuration
ALLOWED_ORIGINS=https://staging.v-edfinance.com,http://103.54.153.248

# Web Configuration
NEXT_PUBLIC_API_URL=http://103.54.153.248:3001
NEXT_PUBLIC_APP_URL=https://staging.v-edfinance.com
```

**Where to find these**:
1. Ask user for values OR
2. Check VPS: `ssh root@103.54.153.248 cat /root/v-edfinance/.env.production`

---

## Troubleshooting

### Issue: Cannot access Dokploy UI

**Check**:
```bash
ssh root@103.54.153.248 "docker ps | grep dokploy"
```

**Fix**: Restart Dokploy container

### Issue: Service fails to start

**Steps**:
1. Go to service → **Logs** tab
2. Check error messages
3. Common issues:
   - Missing environment variable
   - Database connection timeout (increase health check retries)
   - Port conflict (change host port)

### Issue: Health check fails

**Check** from VPS:
```bash
# API health
docker exec v-edfinance-api curl http://localhost:3001/health

# Database
docker exec v-edfinance-postgres pg_isready -U postgres
```

### Issue: Webhook not triggering deployment

**Verify**:
1. Webhook URL saved correctly in GitHub Secrets
2. Webhook enabled in Dokploy
3. Check GitHub Actions logs for webhook call
4. Check Dokploy logs for webhook received

---

## Next Steps After Configuration

1. ✅ Close bead `ved-et78-dokploy-project`
2. ✅ Move to bead `ved-et78-dokploy-deps` (service dependencies)
3. Test automated deployment:
   - Push change to `staging` branch
   - GitHub Actions builds images
   - Webhook triggers Dokploy
   - Services auto-update

---

**Document created**: 2026-01-07  
**Epic**: ved-et78  
**Bead**: ved-et78-dokploy-project  
**Status**: Ready for manual execution
