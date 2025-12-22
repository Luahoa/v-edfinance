# Epic 2: Production Deployment - Execution Guide

**Status:** 🎯 EXECUTING NOW  
**Date:** 2025-12-23  
**Operator:** ___________

---

## ⚠️ Before You Start

**This guide contains commands you'll copy-paste to deploy production.**

**Prerequisites:**
- [ ] VPS access: `ssh deployer@103.54.153.248` works
- [ ] Password manager ready (to save secrets)
- [ ] Cloudflare account access (for R2 credentials)
- [ ] Google AI Studio access (for Gemini API key)
- [ ] ~90 minutes of uninterrupted time

**Safety:**
- ✅ Rollback plan documented
- ✅ Staging environment as fallback
- ✅ All changes in git (can revert)

---

## Step 1: Generate Production Secrets 🔐

**Duration:** 5 minutes

### 1.1 Run Secret Generator

```bash
# Make executable
chmod +x scripts/epic2-generate-secrets.sh

# Generate secrets
./scripts/epic2-generate-secrets.sh
```

**Output will show:**
```
POSTGRES_PASSWORD="..."
JWT_SECRET_PROD="..."
JWT_REFRESH_SECRET_PROD="..."
ENCRYPTION_KEY_PROD="..."
```

### 1.2 Save to Password Manager

**Copy the output and save to your password manager as:**
- Entry name: "V-EdFinance Production Secrets"
- Include all 4 secrets above

**Mark this step complete:** ✅

---

## Step 2: Get External API Credentials 🌐

**Duration:** 10 minutes

### 2.1 Cloudflare R2 Credentials

1. **Login to Cloudflare:** https://dash.cloudflare.com
2. **Navigate:** R2 Object Storage → API Tokens
3. **Create Token:**
   - Name: "v-edfinance-production"
   - Permissions: Object Read & Write
   - Bucket: v-edfinance-backup (or All buckets)
4. **Copy credentials:**
   ```
   R2_ACCOUNT_ID="..."
   R2_ACCESS_KEY_ID="..."
   R2_SECRET_ACCESS_KEY="..."
   ```

### 2.2 Gemini API Key

1. **Login:** https://makersuite.google.com/app/apikey
2. **Create API Key**
3. **Copy:**
   ```
   GEMINI_API_KEY="..."
   ```

### 2.3 Save All to Password Manager

Update your "V-EdFinance Production Secrets" entry with R2 and Gemini keys.

**Mark this step complete:** ✅

---

## Step 3: Push Configuration to VPS 📤

**Duration:** 5 minutes

### 3.1 Commit and Push Changes

```bash
# Check what changed
git status

# Add production config files
git add dokploy.yaml init-db.sql

# Commit
git commit -m "feat(epic2): add production environment with pgvector

- Add api-production and web-production configs
- Upgrade PostgreSQL to pgvector/pgvector:pg17
- Increase resource limits for production
- Add init-db.sql for auto database setup
- Enable vector and pg_stat_statements extensions"

# Push to main
git push origin main
```

**Verify push succeeded:**
```bash
git log -1
# Should show your commit
```

**Mark this step complete:** ✅

---

## Step 4: Deploy PostgreSQL with pgvector 🐘

**Duration:** 15 minutes

### 4.1 SSH to VPS

```bash
ssh deployer@103.54.153.248
```

**You're now on the VPS. All commands below run on VPS.**

### 4.2 Stop Existing PostgreSQL (if running)

```bash
# Check if postgres container exists
docker ps -a | grep postgres

# If exists, stop it
docker stop postgres-container 2>/dev/null || echo "No container to stop"
docker rm postgres-container 2>/dev/null || echo "No container to remove"
```

### 4.3 Pull pgvector Image

```bash
docker pull pgvector/pgvector:pg17
```

**Wait for download to complete (~200MB)**

### 4.4 Upload init-db.sql to VPS

**On your local machine (new terminal):**

```bash
scp init-db.sql deployer@103.54.153.248:/tmp/init-db.sql
```

**Back on VPS terminal:**

```bash
# Verify file uploaded
ls -lh /tmp/init-db.sql
# Should show ~1KB file
```

### 4.5 Start PostgreSQL with pgvector

```bash
# Set your postgres password (use the one from password manager)
export POSTGRES_PASSWORD="<YOUR_PASSWORD_FROM_STEP1>"

# Start postgres
docker run -d \
  --name postgres-container \
  --restart always \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD="${POSTGRES_PASSWORD}" \
  -e POSTGRES_DB=vedfinance \
  -v postgres_data:/var/lib/postgresql/data \
  -v /tmp/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql \
  -p 5432:5432 \
  --health-cmd="pg_isready -U postgres" \
  --health-interval=10s \
  --health-timeout=5s \
  --health-retries=5 \
  pgvector/pgvector:pg17
```

**Wait for container to start:**

```bash
# Watch logs (Ctrl+C to exit)
docker logs -f postgres-container

# Wait for: "database system is ready to accept connections"
```

### 4.6 Verify Databases Created

```bash
# Check databases
docker exec postgres-container psql -U postgres -c '\l'
```

**You should see:**
```
 vedfinance
 vedfinance_dev
 vedfinance_staging
 vedfinance_prod
```

### 4.7 Verify pgvector Extension

```bash
# Check extensions in production DB
docker exec postgres-container psql -U postgres -d vedfinance_prod -c '\dx'
```

**You should see:**
```
 vector | 0.6.0 | public | vector data type
 pg_stat_statements | ... | public | track planning and execution statistics
```

### 4.8 Test pgvector Works

```bash
# Test vector operations
docker exec postgres-container psql -U postgres -d vedfinance_prod -c "
  CREATE TEMP TABLE test_vectors (id serial PRIMARY KEY, embedding vector(3));
  INSERT INTO test_vectors (embedding) VALUES ('[1,2,3]'), ('[4,5,6]');
  SELECT id, embedding FROM test_vectors WHERE embedding <-> '[1,2,4]' < 2;
  DROP TABLE test_vectors;
"
```

**Expected output:** Should return 1 row (the [1,2,3] vector)

**If test passes:** ✅ pgvector working!

**Mark this step complete:** ✅

---

## Step 5: Configure Dokploy Environment Variables 🔧

**Duration:** 15 minutes

### 5.1 Open SSH Tunnel to Dokploy

**On your local machine (new terminal):**

```bash
ssh -L 3000:localhost:3000 deployer@103.54.153.248
```

**Keep this terminal open!**

### 5.2 Access Dokploy Dashboard

**In your browser:**

1. Go to: http://localhost:3000
2. Login with Dokploy credentials

### 5.3 Add Production Secrets

**Navigate:** Settings → Environment Variables → Add

**Add these variables one by one:**

```bash
# Database
POSTGRES_PASSWORD=<YOUR_VALUE_FROM_STEP1>

# JWT Secrets
JWT_SECRET_PROD=<YOUR_VALUE_FROM_STEP1>
JWT_REFRESH_SECRET_PROD=<YOUR_VALUE_FROM_STEP1>

# Encryption
ENCRYPTION_KEY_PROD=<YOUR_VALUE_FROM_STEP1>

# Cloudflare R2
R2_ACCOUNT_ID=<YOUR_VALUE_FROM_STEP2>
R2_ACCESS_KEY_ID=<YOUR_VALUE_FROM_STEP2>
R2_SECRET_ACCESS_KEY=<YOUR_VALUE_FROM_STEP2>
R2_BUCKET_NAME=v-edfinance-backup

# AI Service
GEMINI_API_KEY=<YOUR_VALUE_FROM_STEP2>
```

**Click "Save" after each variable.**

### 5.4 Verify All Variables Added

**Check that all 9 variables are present:**
- [ ] POSTGRES_PASSWORD
- [ ] JWT_SECRET_PROD
- [ ] JWT_REFRESH_SECRET_PROD
- [ ] ENCRYPTION_KEY_PROD
- [ ] R2_ACCOUNT_ID
- [ ] R2_ACCESS_KEY_ID
- [ ] R2_SECRET_ACCESS_KEY
- [ ] R2_BUCKET_NAME
- [ ] GEMINI_API_KEY

**Mark this step complete:** ✅

---

## Step 6: Deploy API Production 🚀

**Duration:** 20 minutes

### 6.1 Navigate to Applications

**In Dokploy Dashboard:**
1. Click "Applications" in sidebar
2. You should see: api-dev, web-dev, api-staging, web-staging

**If you DON'T see api-production:**
- Click "Add Application"
- Select "From YAML"
- Upload your dokploy.yaml file
- Wait for applications to be created

### 6.2 Deploy API Production

1. **Click:** api-production
2. **Click:** "Deploy" button
3. **Watch build logs** (expand "Logs" section)

**Wait for:**
```
✓ Building Docker image...
✓ Pushing to registry...
✓ Deploying containers...
✓ Health check passed
```

**This takes ~10-15 minutes**

### 6.3 Verify API Deployment

**Check container status:**

```bash
# On VPS (SSH terminal)
docker ps | grep api-production

# Should show 2 containers:
# api-production-1  (healthy)
# api-production-2  (healthy)
```

**Check logs for errors:**

```bash
docker logs api-production-container --tail 50
```

**No errors = good!**

### 6.4 Test API Health Endpoint

```bash
# On VPS or local machine
curl https://api.v-edfinance.com/api/health
```

**Expected response:**
```json
{
  "status": "ok",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2025-12-23T..."
}
```

**If you get this response:** ✅ API Production working!

**If connection refused:**
- Wait 2 more minutes (DNS propagation)
- Check SSL certificate issued: https://api.v-edfinance.com

**Mark this step complete:** ✅

---

## Step 7: Deploy Web Production 🌐

**Duration:** 15 minutes

### 7.1 Deploy Web Production

**In Dokploy Dashboard:**
1. **Click:** web-production
2. **Click:** "Deploy" button
3. **Watch build logs**

**Wait for:**
```
✓ Building Next.js...
✓ Optimizing production build...
✓ Deploying containers...
✓ Health check passed
```

**This takes ~10-15 minutes**

### 7.2 Verify Web Deployment

```bash
# On VPS
docker ps | grep web-production

# Should show 2 containers:
# web-production-1  (healthy)
# web-production-2  (healthy)
```

### 7.3 Test Web Endpoints

```bash
# Test main domain
curl -I https://v-edfinance.com

# Expected: HTTP/2 200

# Test WWW redirect
curl -I https://www.v-edfinance.com

# Expected: HTTP/2 200 or 301
```

**If working:** ✅ Web Production live!

**Mark this step complete:** ✅

---

## Step 8: Run Database Migrations 📊

**Duration:** 5 minutes

### 8.1 Get API Container Name

```bash
# On VPS
docker ps | grep api-production | head -1 | awk '{print $NF}'
```

**Copy the container name (e.g., `api-production-1`)**

### 8.2 Run Prisma Migrations

```bash
# Replace CONTAINER_NAME with actual name
docker exec CONTAINER_NAME \
  npx prisma migrate deploy \
  --schema=/app/apps/api/prisma/schema.prisma
```

**Expected output:**
```
✔ All migrations applied successfully
```

### 8.3 Verify Tables Created

```bash
docker exec postgres-container \
  psql -U postgres -d vedfinance_prod \
  -c "\dt"
```

**Should show all tables:** User, Course, Lesson, BehaviorLog, etc.

**Mark this step complete:** ✅

---

## Step 9: Comprehensive Smoke Tests 🧪

**Duration:** 10 minutes

### 9.1 API Tests

```bash
# Health check
curl https://api.v-edfinance.com/api/health

# Database connectivity (should show in health response)
# Expected: "database":"connected"

# Redis connectivity (should show in health response)
# Expected: "redis":"connected"
```

### 9.2 Web Tests

```bash
# Homepage
curl -I https://v-edfinance.com
# Expected: 200 OK

# Check API calls work from web
# Open browser: https://v-edfinance.com
# Open DevTools → Network tab
# Should see successful calls to api.v-edfinance.com
```

### 9.3 SSL Certificate Tests

```bash
# API SSL
openssl s_client -connect api.v-edfinance.com:443 -servername api.v-edfinance.com < /dev/null 2>/dev/null | grep "Verify return code"

# Expected: Verify return code: 0 (ok)

# Web SSL
openssl s_client -connect v-edfinance.com:443 -servername v-edfinance.com < /dev/null 2>/dev/null | grep "Verify return code"

# Expected: Verify return code: 0 (ok)
```

### 9.4 pgvector Integration Test

```bash
# Test from API container
docker exec api-production-container node -e "
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  prisma.\$queryRaw\`SELECT extname FROM pg_extension WHERE extname = 'vector'\`
    .then(r => console.log('pgvector:', r))
    .catch(e => console.error('Error:', e))
    .finally(() => prisma.\$disconnect());
"
```

**Expected:** Shows vector extension

**All tests passing:** ✅ Production fully operational!

**Mark this step complete:** ✅

---

## Step 10: Monitor & Verify 📈

**Duration:** 10 minutes

### 10.1 Check Resource Usage

```bash
# On VPS
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

**Check:**
- [ ] api-production-1: CPU <80%, Memory <1400MB
- [ ] api-production-2: CPU <80%, Memory <1400MB
- [ ] web-production-1: CPU <80%, Memory <800MB
- [ ] web-production-2: CPU <80%, Memory <800MB
- [ ] postgres-container: CPU <50%, Memory <800MB

**Total RAM usage should be <3800MB (95% of 4GB)**

### 10.2 Access Monitoring Dashboards

**Netdata:**
1. Browser: http://103.54.153.248:19999
2. Check: All production containers visible
3. Verify: No critical alerts

**Uptime Kuma:**
1. Browser: http://103.54.153.248:3002
2. Add monitors:
   - https://api.v-edfinance.com/api/health (60s interval)
   - https://v-edfinance.com (60s interval)
3. Verify: Both showing "Up"

### 10.3 Check Application Logs

```bash
# API logs (last 100 lines)
docker logs api-production-container --tail 100

# Look for:
# ✓ No errors
# ✓ "Server listening on port 3000"
# ✓ "Database connected"

# Web logs
docker logs web-production-container --tail 100

# Look for:
# ✓ "ready - started server"
# ✓ No errors
```

**Mark this step complete:** ✅

---

## Step 11: Final Verification Checklist ✅

**Go through this list:**

### Infrastructure
- [ ] PostgreSQL with pgvector running
- [ ] 3 databases created (dev, staging, prod)
- [ ] vector extension enabled
- [ ] pg_stat_statements enabled

### Applications
- [ ] api-production: 2 replicas healthy
- [ ] web-production: 2 replicas healthy
- [ ] All health checks passing

### Endpoints
- [ ] https://api.v-edfinance.com/api/health → 200 OK
- [ ] https://v-edfinance.com → 200 OK
- [ ] https://www.v-edfinance.com → 200 OK or 301

### Security
- [ ] SSL certificates valid (Let's Encrypt)
- [ ] Port 3000 closed (Dokploy via SSH tunnel only)
- [ ] All secrets in environment variables (not hardcoded)

### Performance
- [ ] API response time <500ms
- [ ] Web page load <2s
- [ ] RAM usage <90%
- [ ] CPU usage <80%

### Monitoring
- [ ] Netdata showing all containers
- [ ] Uptime Kuma monitoring endpoints
- [ ] No critical alerts

**All checked:** 🎉 **Production Deployment Complete!**

---

## Step 12: Post-Deployment Tasks 📝

**Within 1 hour:**

1. **Monitor logs for errors:**
   ```bash
   # Watch for 10 minutes
   docker logs -f api-production-container
   ```

2. **Test key user flows:**
   - [ ] Homepage loads
   - [ ] API responds
   - [ ] (If applicable) User can signup/login

3. **Document any issues in:**
   - Create GitHub issue if bugs found
   - Note in [EPIC2_DEPLOYMENT_CHECKLIST.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/docs/EPIC2_DEPLOYMENT_CHECKLIST.md)

**Within 24 hours:**

4. **Check Cloudflare Analytics:**
   - Verify traffic routing to production
   - Check SSL/TLS encryption percentage

5. **Verify backups:**
   ```bash
   # Check if backup cron is running
   docker exec postgres-container cat /etc/crontab | grep backup
   ```

6. **Load testing (optional):**
   ```bash
   # Simple load test
   ab -n 1000 -c 10 https://api.v-edfinance.com/api/health
   ```

---

## Rollback Procedure (If Needed) ⏮️

**If something goes wrong:**

### Quick Rollback

```bash
# SSH to VPS
ssh deployer@103.54.153.248

# Stop production containers
docker stop api-production-1 api-production-2
docker stop web-production-1 web-production-2

# Point DNS back to staging (temporary)
# Cloudflare Dashboard → DNS → Edit records:
# api.v-edfinance.com → api-staging.v-edfinance.com (CNAME)
# v-edfinance.com → staging.v-edfinance.com (CNAME)

# Or restart staging with production DNS
docker restart api-staging web-staging
```

**Recovery time:** <5 minutes

---

## Success! 🎉

**If you've reached this point with all checks passing:**

✅ **Epic 2: Production Environment Deployment COMPLETE**

**What you've achieved:**
- 🚀 Production API live at api.v-edfinance.com
- 🌐 Production Web live at v-edfinance.com
- 🐘 PostgreSQL with pgvector for AI features
- 🔄 High availability (2 replicas per service)
- 📊 Monitoring configured
- 🔒 Secure environment variables
- 🎯 Zero-downtime deployment capability

**Next Epic:** Epic 3 - Monitoring Stack Optimization

**Celebrate your achievement!** 🍾

---

**Deployment completed by:** ___________  
**Date/Time:** ___________  
**Duration:** ___________ minutes  
**Issues encountered:** ___________  
**Status:** ✅ SUCCESS / ⚠️ PARTIAL / ❌ FAILED
