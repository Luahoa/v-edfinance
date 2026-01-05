# Production Deployment Checklist

**Epic:** ved-e1js (MVP Launch - Week 2)  
**Owner:** GreenCastle Agent  
**Last Updated:** 2026-01-03

---

## Pre-Deployment (Day Before - T-24h)

### Code Quality Gate
- [ ] **All PR reviews completed** - No open PRs in main branch
- [ ] **Main branch builds pass** - Run: `pnpm --filter api build && pnpm --filter web build`
- [ ] **All tests passing** - Target: 98%+ pass rate
  ```bash
  pnpm test
  # Expected: 1811+ passing tests
  ```
- [ ] **No P0/P1 bugs in backlog** - Check: `.\beads.exe list --priority 0,1 --status open`
- [ ] **Dependency audit clean** - Run: `pnpm audit --audit-level=high`
  - [ ] No critical vulnerabilities
  - [ ] No high-risk dependencies

### Database Verification
- [ ] **Migrations tested on staging** - Reference: `docs/MIGRATION_DRY_RUN_CHECKLIST.md`
  - [ ] All migrations applied successfully
  - [ ] No data loss detected
  - [ ] CRUD smoke tests passed
- [ ] **Production backup taken**
  ```bash
  pg_dump -U prod_user v_edfinance_prod > /backups/pre-deploy-$(date +%Y%m%d).sql
  ```
- [ ] **Rollback plan documented** - See "Rollback Procedures" section below
- [ ] **Schema changes reviewed** - Check: `npx prisma migrate diff`
  - [ ] No destructive operations (DROP TABLE/COLUMN)
  - [ ] All ALTER TABLE have safe defaults
  - [ ] Foreign keys preserve integrity

### Environment Configuration
- [ ] **Production .env vars validated**
  ```bash
  # Required vars (check apps/api/.env.production):
  DATABASE_URL=postgresql://...
  JWT_SECRET=<256-bit secret>
  CLOUDFLARE_API_KEY=<key>
  R2_BUCKET_NAME=v-edfinance-prod
  CORS_ORIGINS=https://v-edfinance.com,https://www.v-edfinance.com
  ```
- [ ] **Secrets rotated (if scheduled)** - Last rotation: `_____`
  - [ ] JWT_SECRET rotated (quarterly)
  - [ ] Database password rotated (quarterly)
  - [ ] API keys rotated (annually)
- [ ] **CORS origins updated**
  - [ ] Production domain whitelisted
  - [ ] Staging domains removed
- [ ] **API rate limits configured**
  - [ ] Auth endpoints: 5 req/min per IP
  - [ ] General API: 100 req/min per user
  - [ ] Public routes: 30 req/min per IP

### Monitoring & Observability
- [ ] **Grafana dashboards ready** - Check: http://103.54.153.248:3001 (if using VPS Grafana)
  - [ ] API latency dashboard configured
  - [ ] Database query dashboard configured
  - [ ] Error rate dashboard configured
- [ ] **Alert rules configured**
  - [ ] Error rate >5% triggers alert
  - [ ] Response time p95 >1000ms triggers alert
  - [ ] Database CPU >80% triggers alert
  - [ ] Memory usage >90% triggers alert
- [ ] **Log aggregation working** - Verify logs visible in Grafana Loki or equivalent
- [ ] **Uptime monitoring active** - External service pinging `/api/health` every 5min

---

## Deployment Day (D-Day)

### Before Deploy (T-30min)

#### Team Coordination
- [ ] **Notify team of deployment** - Post in team channel:
  ```
  🚀 Production deployment starting in 30 minutes
  - Expected downtime: 5-10 minutes
  - Deployment window: [Time] UTC
  - Contact: [Your contact info]
  ```
- [ ] **Backup current production database**
  ```bash
  ssh root@103.54.153.248
  pg_dump v_edfinance_prod > /backups/emergency-backup-$(date +%Y%m%d_%H%M%S).sql
  ```
- [ ] **Backup current production code**
  ```bash
  ssh root@103.54.153.248
  cd /var/www/v-edfinance
  git rev-parse HEAD > /backups/pre-deploy-commit.txt
  tar -czf /backups/v-edfinance-$(date +%Y%m%d).tar.gz .
  ```
- [ ] **Health checks passing on staging**
  ```bash
  curl http://103.54.153.248:3001/api/health
  # Expected: {"status":"ok","database":"connected"}
  ```

### Deploy Backend (T+0) - VPS Deployment

```bash
# SSH to production VPS
ssh root@103.54.153.248

# Navigate to app directory
cd /var/www/v-edfinance

# Pull latest code from main
git fetch origin
git checkout main
git pull origin main

# Install dependencies
pnpm install --frozen-lockfile

# Apply database migrations
cd apps/api
npx prisma migrate deploy
npx prisma generate

# Build backend
cd /var/www/v-edfinance
pnpm --filter api build

# Restart API services
pm2 restart all

# Verify processes running
pm2 status
```

**Backend Deploy Checklist:**
- [ ] Git pull successful (no conflicts)
- [ ] Dependencies installed (no errors)
- [ ] Migrations applied (verify with `npx prisma migrate status`)
- [ ] Build successful (no TypeScript errors)
- [ ] PM2 restart successful (all processes online)

### Deploy Frontend (T+15min) - Cloudflare Pages

**Option 1: Git-based Deploy**
```bash
# From local machine
git push origin main
# Cloudflare Pages auto-deploys from main branch
```

**Option 2: Manual Upload (if auto-deploy disabled)**
```bash
# Build locally
cd apps/web
pnpm build

# Upload to Cloudflare Pages via dashboard
# Navigate to: https://dash.cloudflare.com/pages
# Select v-edfinance project → Upload .next folder
```

**Frontend Deploy Checklist:**
- [ ] Build artifact generated (check `apps/web/.next/`)
- [ ] Cloudflare Pages deploy triggered
- [ ] Deploy status: Success (check dashboard)
- [ ] Production URL accessible: https://v-edfinance.com

---

## Post-Deploy Verification (T+15min)

### Smoke Tests
Run critical user flows manually or via automated scripts:

```bash
# Health check
curl https://v-edfinance.com/api/health

# Auth flow
curl -X POST https://v-edfinance.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# User profile fetch
curl https://v-edfinance.com/api/users/me \
  -H "Authorization: Bearer <TOKEN>"

# Course list
curl https://v-edfinance.com/api/courses
```

**Smoke Test Results:**
- [ ] Health check returns 200 OK
- [ ] Login returns JWT token
- [ ] User profile fetch succeeds
- [ ] Course list returns data
- [ ] Frontend homepage loads (<3s)
- [ ] Dashboard accessible for logged-in users

### Log Inspection
```bash
# Check production logs (VPS)
ssh root@103.54.153.248
pm2 logs --lines 100

# Check Cloudflare Pages logs
# Navigate to: Cloudflare Dashboard → Pages → v-edfinance → Functions → Logs
```

**Log Checks:**
- [ ] No ERROR level logs in last 10 minutes
- [ ] No database connection errors
- [ ] No authentication failures (except expected invalid logins)
- [ ] Request latency within expected range (<500ms p95)

### Critical User Flow Tests
- [ ] **Registration:** New user can sign up
- [ ] **Login:** Existing user can log in
- [ ] **Dashboard:** Dashboard loads with user data
- [ ] **Course Enrollment:** User can enroll in a course
- [ ] **Lesson Access:** User can view lesson content
- [ ] **Logout:** User can log out successfully

---

## Monitoring Phase (T+1 hour)

### Metrics to Watch
- [ ] **Error rate** - Should be <1% (check Grafana)
- [ ] **Response times** - p95 <500ms, p99 <1000ms
- [ ] **Database queries** - No slow queries (>1000ms)
- [ ] **Memory usage** - Stable (no leaks)
- [ ] **CPU usage** - <70% average
- [ ] **Active users** - Tracking concurrent users

### User Feedback Monitoring
- [ ] Check support channels (email, Discord, etc.)
- [ ] Monitor social media for user reports
- [ ] Review error tracking (Sentry/equivalent) for unhandled exceptions

---

## Rollback Procedures

### Rollback Triggers

**Initiate rollback immediately if:**
- [ ] Smoke tests fail >2 times consecutively
- [ ] Error rate >5%
- [ ] P0 bug discovered (data corruption, auth bypass, etc.)
- [ ] Data corruption detected
- [ ] Services unresponsive >5 minutes
- [ ] Database migration failed

### Backend Rollback

```bash
# SSH to VPS
ssh root@103.54.153.248

# 1. Revert code to previous commit
cd /var/www/v-edfinance
PREV_COMMIT=$(cat /backups/pre-deploy-commit.txt)
git checkout $PREV_COMMIT

# 2. Reinstall dependencies
pnpm install --frozen-lockfile

# 3. Rollback database (if migrations applied)
# CAUTION: This will lose data created after deployment!
dropdb v_edfinance_prod
createdb v_edfinance_prod
psql v_edfinance_prod < /backups/emergency-backup-<TIMESTAMP>.sql

# 4. Rebuild API
pnpm --filter api build

# 5. Restart services
pm2 restart all

# 6. Verify rollback
curl http://103.54.153.248:3001/api/health
```

### Frontend Rollback

**Cloudflare Pages:**
- Navigate to: Cloudflare Dashboard → Pages → v-edfinance
- Go to "Deployments" tab
- Find previous successful deployment
- Click "Rollback to this deployment"
- Verify: https://v-edfinance.com loads correctly

### Post-Rollback Verification
- [ ] Health checks passing
- [ ] User count matches pre-deployment
- [ ] Auth flow functional
- [ ] Critical user flows working
- [ ] No data corruption (verify via SQL queries)

### Rollback Communication
```
⚠️ Production rollback initiated
- Reason: [Specific issue]
- Status: Rolled back to commit [COMMIT_HASH]
- Impact: [Any data loss or downtime]
- Next steps: [Investigation plan]
```

---

## Post-Deployment Tasks (Next Day - T+24h)

### Deployment Review
- [ ] Review deployment metrics (latency, errors, throughput)
- [ ] Analyze user feedback (support tickets, social mentions)
- [ ] Document issues encountered (see "Lessons Learned")
- [ ] Update runbooks if procedures changed

### Documentation Updates
- [ ] Update `docs/MIGRATION_HISTORY.md` with applied migrations
- [ ] Update `AGENTS.md` with new environment variables (if any)
- [ ] Create deployment report: `docs/DEPLOY_REPORT_<DATE>.md`
- [ ] Close deployment epic in beads:
  ```bash
  .\beads.exe close ved-e1js --reason "MVP Launch complete. Deployment successful on <DATE>."
  ```

### Performance Baseline
Record post-deployment metrics for future comparison:

```markdown
## Production Metrics Baseline (Post-Deploy)

**Date:** 2026-01-03  
**Deployment:** MVP Launch (ved-e1js)

### API Performance
- Response time (p50): _____ms
- Response time (p95): _____ms
- Response time (p99): _____ms
- Error rate: _____%
- Requests/second: _____

### Database Performance
- Query latency (p95): _____ms
- Active connections: _____
- Database size: _____GB
- Cache hit ratio: _____%

### Resource Usage
- API CPU: _____%
- API Memory: _____MB
- Database CPU: _____%
- Database Memory: _____GB

### User Metrics
- Daily Active Users: _____
- Peak concurrent users: _____
- Average session duration: _____min
```

---

## Emergency Contacts

**VPS Support:**
- Provider: [VPS provider name]
- Support URL: [Support dashboard link]
- Emergency phone: [If available]

**Database Admin:**
- Contact: [DBA or senior dev]
- Backup location: `/backups/` on VPS

**DevOps/SRE:**
- Contact: [DevOps lead]
- On-call rotation: [Link to schedule]

**Cloudflare Support:**
- Dashboard: https://dash.cloudflare.com
- Support docs: https://developers.cloudflare.com/pages

---

## Lessons Learned Template

After each deployment, update this section:

### Deployment [DATE]

**What went well:**
- 
- 

**What went wrong:**
- 
- 

**Action items:**
- [ ] Issue ID: [Description]
- [ ] Issue ID: [Description]

---

## Sign-Off

**Checklist completed by:** GreenCastle Agent  
**Review required by:** [Human operator/Tech Lead]  
**Deployment authorized by:** [Product Owner/CTO]  
**Scheduled deployment time:** [YYYY-MM-DD HH:MM UTC]

**Go/No-Go Decision:** `_____` (GO / NO-GO / POSTPONE)

**Final approval signature:** `_____`  
**Date:** `_____`
