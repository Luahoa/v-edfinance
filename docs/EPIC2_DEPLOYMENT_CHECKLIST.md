# Epic 2 Production Deployment Checklist

**Deployment Date:** _________________  
**Deployed By:** ____________________  
**VPS IP:** 103.54.153.248

---

## Pre-Deployment Checklist

### 1. Secrets Preparation
- [ ] Generated production secrets (`./scripts/epic2-generate-secrets.sh`)
- [ ] Saved secrets to password manager
- [ ] Obtained Cloudflare R2 credentials
  - [ ] R2_ACCOUNT_ID
  - [ ] R2_ACCESS_KEY_ID
  - [ ] R2_SECRET_ACCESS_KEY
- [ ] Obtained Gemini API key
- [ ] Verified all secrets are non-empty

### 2. Code Preparation
- [ ] `dokploy.yaml` updated with production config
- [ ] `init-db.sql` created for database initialization
- [ ] All changes committed to git
- [ ] Changes pushed to `main` branch

### 3. Infrastructure Preparation
- [ ] SSH access to VPS verified (`ssh deployer@103.54.153.248`)
- [ ] DNS records configured (Cloudflare):
  - [ ] `api.v-edfinance.com` → A record → 103.54.153.248
  - [ ] `v-edfinance.com` → A record → 103.54.153.248
  - [ ] `www.v-edfinance.com` → CNAME → v-edfinance.com
- [ ] Firewall rules verified (ports 22, 80, 443 open, 3000 closed)
- [ ] Monitoring tools running (Netdata, Uptime Kuma)

---

## Deployment Steps

### Phase 1: Configuration Upload
**Start Time:** _________

- [ ] Uploaded `dokploy.yaml` to VPS
- [ ] Uploaded `init-db.sql` to VPS
- [ ] Verified files in `/tmp/` on VPS

**Status:** ✅ Complete / ❌ Failed  
**Notes:** _______________________________________________________

---

### Phase 2: PostgreSQL Deployment
**Start Time:** _________

- [ ] Stopped old postgres container (if exists)
- [ ] Pulled `pgvector/pgvector:pg17` image
- [ ] Started postgres with pgvector
- [ ] Waited 10 seconds for startup
- [ ] Verified databases created:
  - [ ] `vedfinance_dev`
  - [ ] `vedfinance_staging`
  - [ ] `vedfinance_prod`
- [ ] Verified extensions enabled:
  - [ ] `vector` extension
  - [ ] `pg_stat_statements` extension

**Verification Commands:**
```bash
# Check databases
docker exec postgres-container psql -U postgres -c '\l'

# Check extensions
docker exec postgres-container psql -U postgres -d vedfinance_prod -c '\dx'

# Test vector operations
docker exec postgres-container psql -U postgres -d vedfinance_prod -c "
  CREATE TEMP TABLE test (id serial, vec vector(3));
  INSERT INTO test (vec) VALUES ('[1,2,3]');
  SELECT * FROM test WHERE vec <-> '[1,2,4]' < 2;
"
```

**Status:** ✅ Complete / ❌ Failed  
**pgvector Test Result:** ✅ Pass / ❌ Fail  
**Notes:** _______________________________________________________

---

### Phase 3: Dokploy Configuration
**Start Time:** _________

- [ ] Opened SSH tunnel: `ssh -L 3000:localhost:3000 deployer@103.54.153.248`
- [ ] Accessed Dokploy: `http://localhost:3000`
- [ ] Logged into Dokploy dashboard
- [ ] Navigated to: Settings → Environment Variables
- [ ] Added production secrets:
  - [ ] `POSTGRES_PASSWORD`
  - [ ] `JWT_SECRET_PROD`
  - [ ] `JWT_REFRESH_SECRET_PROD`
  - [ ] `ENCRYPTION_KEY_PROD`
  - [ ] `R2_ACCOUNT_ID`
  - [ ] `R2_ACCESS_KEY_ID`
  - [ ] `R2_SECRET_ACCESS_KEY`
  - [ ] `R2_BUCKET_NAME` = v-edfinance-backup
  - [ ] `GEMINI_API_KEY`
- [ ] Saved environment variables
- [ ] Verified no secrets visible in UI

**Status:** ✅ Complete / ❌ Failed  
**Notes:** _______________________________________________________

---

### Phase 4: API Production Deployment
**Start Time:** _________

- [ ] Applications → api-production
- [ ] Clicked "Deploy" button
- [ ] Watched build logs (no errors)
- [ ] Build completed successfully
- [ ] Container started
- [ ] Health check passed: ✅ Healthy
- [ ] Verified 2 replicas running

**Health Check URL:** https://api.v-edfinance.com/api/health  
**Expected Response:**
```json
{
  "status": "ok",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2025-12-23T..."
}
```

**Actual Response:** ________________________________________

**Status:** ✅ Complete / ❌ Failed  
**Deployment Duration:** _______ minutes  
**Notes:** _______________________________________________________

---

### Phase 5: Web Production Deployment
**Start Time:** _________

- [ ] Applications → web-production
- [ ] Clicked "Deploy" button
- [ ] Watched build logs (no errors)
- [ ] Build completed successfully
- [ ] Container started
- [ ] Health check passed: ✅ Healthy
- [ ] Verified 2 replicas running

**URLs to Test:**
- https://v-edfinance.com → ✅ 200 OK / ❌ Failed
- https://www.v-edfinance.com → ✅ 200 OK / ❌ Failed

**Status:** ✅ Complete / ❌ Failed  
**Deployment Duration:** _______ minutes  
**Notes:** _______________________________________________________

---

### Phase 6: Database Migrations
**Start Time:** _________

- [ ] Identified API container name: `api-production-container`
- [ ] Ran Prisma migration command:
  ```bash
  docker exec api-production-container \
    npx prisma migrate deploy \
    --schema=/app/apps/api/prisma/schema.prisma
  ```
- [ ] Migrations applied successfully
- [ ] Generated Prisma client
- [ ] Verified tables created in `vedfinance_prod`

**Migration Output:** ________________________________________

**Status:** ✅ Complete / ❌ Failed  
**Notes:** _______________________________________________________

---

### Phase 7: Smoke Tests
**Start Time:** _________

#### API Tests
- [ ] Health endpoint: `curl https://api.v-edfinance.com/api/health`
  - Response: ✅ 200 OK / ❌ Failed
  - Body contains: `"status":"ok"` ✅ Yes / ❌ No

- [ ] Database connectivity:
  - Response contains: `"database":"connected"` ✅ Yes / ❌ No

- [ ] Redis connectivity:
  - Response contains: `"redis":"connected"` ✅ Yes / ❌ No

#### Web Tests
- [ ] Homepage: `curl -I https://v-edfinance.com`
  - Status: ✅ 200 OK / ❌ Failed

- [ ] WWW redirect: `curl -I https://www.v-edfinance.com`
  - Status: ✅ 200 or 301 / ❌ Failed

- [ ] API connection from web:
  - Open browser DevTools → Network
  - Visit https://v-edfinance.com
  - API calls to `api.v-edfinance.com`: ✅ Success / ❌ Failed

#### SSL Tests
- [ ] API SSL: `openssl s_client -connect api.v-edfinance.com:443`
  - Certificate valid: ✅ Yes / ❌ No
  - Issuer: Let's Encrypt ✅ Yes / ❌ No

- [ ] Web SSL: `openssl s_client -connect v-edfinance.com:443`
  - Certificate valid: ✅ Yes / ❌ No

**Status:** ✅ All Pass / ⚠️ Some Fail / ❌ Failed  
**Notes:** _______________________________________________________

---

### Phase 8: Performance Verification
**Start Time:** _________

#### Resource Usage
```bash
# Check container stats
docker stats --no-stream
```

**Results:**

| Container | CPU % | Memory Usage | Memory Limit | Status |
|-----------|-------|--------------|--------------|--------|
| api-production-1 | _____% | ______MB | 1536MB | ✅ / ❌ |
| api-production-2 | _____% | ______MB | 1536MB | ✅ / ❌ |
| web-production-1 | _____% | ______MB | 1024MB | ✅ / ❌ |
| web-production-2 | _____% | ______MB | 1024MB | ✅ / ❌ |
| postgres | _____% | ______MB | 1024MB | ✅ / ❌ |
| redis | _____% | ______MB | 256MB | ✅ / ❌ |

**Total RAM Used:** _______MB / 4096MB (____%)

#### Response Time Tests
```bash
# API response time
time curl -s https://api.v-edfinance.com/api/health > /dev/null
```

- API response time: _______ms (Target: <500ms)
- Web response time: _______ms (Target: <1000ms)

**Status:** ✅ Acceptable / ⚠️ Slow / ❌ Failed  
**Notes:** _______________________________________________________

---

### Phase 9: Monitoring Setup
**Start Time:** _________

#### Netdata Configuration
- [ ] Accessed Netdata: http://103.54.153.248:19999
- [ ] Verified production containers visible
- [ ] Checked CPU/RAM metrics
- [ ] Set alerts (if available):
  - [ ] CPU >85% for 5 min
  - [ ] RAM >90% for 5 min
  - [ ] Disk >85%

#### Uptime Kuma Configuration
- [ ] Accessed Uptime Kuma: http://103.54.153.248:3002
- [ ] Added monitors:
  - [ ] https://api.v-edfinance.com/api/health (60s interval)
  - [ ] https://v-edfinance.com (60s interval)
- [ ] Configured notifications (email/Slack)

**Status:** ✅ Complete / ⚠️ Partial / ❌ Failed  
**Notes:** _______________________________________________________

---

### Phase 10: Documentation Update
**Start Time:** _________

- [ ] Updated DEVOPS_GUIDE.md with production URLs
- [ ] Documented production deployment procedure
- [ ] Added disaster recovery notes
- [ ] Updated README.md with production status
- [ ] Created EPIC2_COMPLETION_REPORT.md

**Status:** ✅ Complete / ❌ Failed  
**Notes:** _______________________________________________________

---

## Post-Deployment Checklist

### Immediate (Within 1 hour)
- [ ] Monitor logs for errors
  ```bash
  docker logs -f api-production-container
  docker logs -f web-production-container
  ```
- [ ] Check error rates in Netdata
- [ ] Verify no memory leaks (RAM stable)
- [ ] Test key user flows (signup, login, etc.)

### Within 24 Hours
- [ ] Review Cloudflare Analytics (traffic routing correctly)
- [ ] Check database performance (no slow queries)
- [ ] Verify backups running (R2 sync working)
- [ ] Test disaster recovery procedure (optional)

### Within 1 Week
- [ ] Load testing (simulate user traffic)
- [ ] Performance optimization (if needed)
- [ ] Security audit (verify WAF blocking attacks)
- [ ] Team training (how to deploy/rollback)

---

## Rollback Procedure

**If deployment fails, execute rollback:**

### Quick Rollback (Dokploy)
1. Dokploy Dashboard → Applications → api-production
2. Deployments tab → Previous Version
3. Click "Rollback"
4. Repeat for web-production

### Manual Rollback
```bash
# SSH to VPS
ssh deployer@103.54.153.248

# Stop production containers
docker stop api-production-1 api-production-2
docker stop web-production-1 web-production-2

# Restart staging (temporary production)
docker restart api-staging web-staging

# Update DNS to point to staging
# (Cloudflare Dashboard - manual step)
```

**Rollback Executed:** ✅ Yes / ❌ No  
**Rollback Time:** _______ minutes  
**Reason:** ___________________________________________________

---

## Sign-off

**Deployment Status:** ✅ Success / ⚠️ Partial / ❌ Failed

**Deployed By:** ____________________  
**Date:** ____________________  
**Time:** ____________________

**Issues Encountered:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

**Lessons Learned:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

**Next Epic:** Epic 3 - Monitoring Stack Optimization

**Approved By:** ____________________  
**Date:** ____________________
