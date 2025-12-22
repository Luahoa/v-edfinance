# 🚀 Thread Handoff - VPS Production Deployment

**Thread Purpose:** Deploy v-edfinance to production VPS infrastructure  
**Epic:** ved-vps - VPS Production Deployment Strategy  
**Timeline:** 6 weeks (parallel execution)  
**Status:** 🎯 READY TO START

---

## 📋 Quick Context

**You are working on:** Deploying the V-EdFinance edtech platform to production on VPS `103.54.153.248`

**Your mission:** Transform from local development to a fully operational production platform with:
- Zero-downtime deployments
- Multi-environment setup (dev/staging/prod)
- CI/CD automation
- Production-grade monitoring
- Disaster recovery

---

## 🎯 Start Here

### Phase 1: Foundation & Security (Week 1-2)

**Your first tasks:**
1. **ved-vps.1** - SSL Certificate Setup (30 min)
2. **ved-vps.2** - Nginx Reverse Proxy (60 min)
3. **ved-vps.3** - Cloudflare CDN Integration (45 min)

**Read this first:**
- [EPIC_VPS_PRODUCTION_DEPLOYMENT.md](EPIC_VPS_PRODUCTION_DEPLOYMENT.md) - Full epic plan
- [DEVOPS_GUIDE.md](DEVOPS_GUIDE.md) - VPS setup history
- [VPS_MANUAL_COMMANDS.md](VPS_MANUAL_COMMANDS.md) - SSH operations

---

## 🔑 VPS Credentials & Access

**VPS IP:** `103.54.153.248`  
**SSH Key:** See `temp_pub_key.pub` (amp-agent)  
**Dokploy Dashboard:** http://103.54.153.248:3000

**SSH Access:**
```bash
ssh root@103.54.153.248
# Or use deployer account:
ssh deployer@103.54.153.248
```

**Current Services:**
```bash
# Check what's running
docker ps

# Expected containers:
# - postgres:15-alpine (vedfinance_staging)
# - redis:7-alpine
# - v-edfinance-api-staging (if deployed)
```

---

## 🗺️ Infrastructure Overview

### What's Already Set Up ✅

**Security:**
- ✅ UFW Firewall (ports: 22, 80, 443, 3000)
- ✅ Fail2Ban (SSH brute-force protection)
- ✅ User `deployer` with sudo access

**Services:**
- ✅ PostgreSQL 15-alpine (3 databases: prod/staging/dev)
- ✅ Redis 7-alpine (200MB, LRU eviction)
- ✅ Dokploy orchestration platform
- ✅ Backup scripts (`/root/scripts/vps-backup.sh`)

### What Needs to Be Done ❌

**Infrastructure:**
- ❌ SSL certificates (Let's Encrypt)
- ❌ Nginx reverse proxy
- ❌ Cloudflare CDN integration
- ❌ Environment variables in Dokploy Secrets

**Deployment:**
- ❌ Multi-environment setup (dev/staging/prod)
- ❌ CI/CD pipeline (GitHub Actions → Dokploy)
- ❌ Docker image optimization

**Monitoring:**
- ❌ Prometheus + Grafana
- ❌ Uptime Kuma health checks
- ❌ Log aggregation (Loki)

**Disaster Recovery:**
- ❌ Automated backups to R2
- ❌ Restoration procedures
- ❌ Runbook documentation

---

## 📊 Task Breakdown (25 tasks total)

### Priority 0 (Must-Have for MVP)
- ved-vps.1: SSL certificates
- ved-vps.2: Nginx reverse proxy
- ved-vps.4: Environment secrets
- ved-vps.6: Dokploy projects structure
- ved-vps.8: Environment configs
- ved-vps.9: Database migration strategy
- ved-vps.10: GitHub Actions workflows
- ved-vps.12: Dokploy webhooks
- ved-vps.15: Uptime monitoring
- ved-vps.18: Automated database backups
- ved-vps.20: Disaster recovery runbook

### Priority 1 (Important)
- ved-vps.3: Cloudflare CDN
- ved-vps.5: Database connection pooling
- ved-vps.7: Dockerfiles optimization
- ved-vps.11: CI/CD quality gates
- ved-vps.13: Rollback strategy
- ved-vps.14: Prometheus + Grafana
- ved-vps.17: Error tracking
- ved-vps.19: R2 backup integration
- ved-vps.22: Redis caching (covered in ved-hyv)
- ved-vps.23: Query optimization (covered in ved-hyv)
- ved-vps.24: CDN asset optimization

### Priority 2 (Nice-to-Have)
- ved-vps.16: Log aggregation
- ved-vps.21: Staging → Prod sync tool
- ved-vps.25: Load testing

---

## 🚀 Your First Session

### Step 1: Verify VPS Access
```bash
# SSH to VPS
ssh root@103.54.153.248

# Check current state
docker ps
docker images
ufw status
systemctl status fail2ban
```

### Step 2: Review Dokploy
```bash
# Open Dokploy dashboard
# URL: http://103.54.153.248:3000

# Check existing projects:
# - Are there any deployed apps?
# - What's the current configuration?
```

### Step 3: Start ved-vps.1 (SSL Setup)
```bash
# Install certbot
apt update && apt install -y certbot python3-certbot-nginx

# Request certificates (requires domain DNS pointed to VPS)
# Example domains:
# - api.v-edfinance.com
# - staging.v-edfinance.com
# - v-edfinance.com

# certbot --nginx -d api.v-edfinance.com
```

**⚠️ Blocker:** Domain DNS must be configured first!

**Decision needed:** Which domains to use? (Check with user)

---

## 🎯 Success Criteria

**Phase 1 Complete When:**
```bash
✅ SSL certificates installed (A+ rating on SSLLabs)
✅ Nginx reverse proxy configured with rate limiting
✅ Cloudflare CDN serving static assets
✅ All secrets moved to Dokploy
✅ Database connection pooling optimized
```

**Full Epic Complete When:**
```bash
✅ All 3 environments deployed (dev, staging, prod)
✅ CI/CD pipeline: git push → auto-deploy
✅ <200ms TTFB (Cloudflare CDN)
✅ 99.5%+ uptime (30 days)
✅ Daily backups to R2
✅ Zero-downtime deployments working
```

---

## 📚 Key Documentation

**Essential Reading:**
1. [EPIC_VPS_PRODUCTION_DEPLOYMENT.md](EPIC_VPS_PRODUCTION_DEPLOYMENT.md) - This epic's master plan
2. [DEVOPS_GUIDE.md](DEVOPS_GUIDE.md) - VPS setup history (Week 1-3 plan)
3. [VPS_MANUAL_COMMANDS.md](VPS_MANUAL_COMMANDS.md) - SSH command reference
4. [dokploy.yaml](dokploy.yaml) - Container orchestration config
5. [AGENTS.md](AGENTS.md) - Project standards & protocols

**Supporting Files:**
- `docker-compose.monitoring.yml` - Grafana/Prometheus setup
- `scripts/database/vps-backup.sh` - Backup automation
- `.github/workflows/` - CI/CD templates (to be created)

---

## ⚠️ Critical Reminders

### Security First
- **NEVER** commit secrets to git
- **ALWAYS** use Dokploy Secrets for environment variables
- **TEST** firewall rules before applying
- **BACKUP** database before migrations

### Deployment Safety
- **DEV first** - Test everything in dev environment
- **STAGING second** - Validate with production-like data
- **PRODUCTION last** - Manual approval required

### Zero-Debt Protocol
- Run `pnpm --filter api build` before deploying
- Fix all build errors locally first
- Never deploy broken code to staging/production

---

## 🔗 Coordination with Database Thread

**This thread (VPS) needs from Database thread:**
- ✅ Phase 2 analytics code (already complete)
- ⏳ VPS performance validation (ved-db-opt.3)
- ⏳ PostgreSQL tuning recommendations (ved-db-opt.4)

**Database thread needs from this thread:**
- ⏳ Staging environment ready (ved-vps.6)
- ⏳ Redis accessible (already done ✅)
- ⏳ PostgreSQL with realistic data

**Sync points:**
- Week 2: Staging environment ready for database performance testing
- Week 4: Production environment ready for final validation

---

## 🛠️ Troubleshooting Quick Reference

### SSH Connection Issues
```bash
# If SSH fails
ssh -vvv root@103.54.153.248  # Debug mode

# Check SSH key
cat temp_pub_key.pub
```

### Dokploy Not Accessible
```bash
# Check Dokploy container
docker ps | grep dokploy
docker logs <dokploy_container>

# Restart if needed
docker restart <dokploy_container>
```

### Database Connection Issues
```bash
# Find PostgreSQL container
POSTGRES_CONTAINER=$(docker ps --filter "ancestor=postgres:15-alpine" --format "{{.Names}}" | head -n 1)

# Test connection
docker exec $POSTGRES_CONTAINER psql -U postgres -l

# Check logs
docker logs $POSTGRES_CONTAINER --tail 50
```

---

## 🎯 Next Steps After This Thread

**When this epic is complete:**
1. User acceptance testing on staging
2. Marketing preparation (staging demos)
3. Investor demos with real metrics
4. Production launch planning
5. Post-launch monitoring & optimization

---

## 📞 Escalation

**If you encounter:**
- Domain DNS configuration issues → Ask user for domain provider access
- Budget decisions (Cloudflare plan, monitoring tools) → Ask user
- Build errors blocking deployment → Coordinate with main development thread
- Database performance issues → Coordinate with Database thread

---

**Created:** 2025-12-22  
**Last Updated:** 2025-12-22  
**Thread Owner:** DevOps + Full Stack Agent  
**Estimated Duration:** 6 weeks

---

## 🚦 Status Tracking

Update this section as you progress:

```
Phase 1: Foundation & Security
[ ] ved-vps.1 - SSL certificates
[ ] ved-vps.2 - Nginx reverse proxy
[ ] ved-vps.3 - Cloudflare CDN
[ ] ved-vps.4 - Environment secrets
[ ] ved-vps.5 - Database pooling

Phase 2: Multi-Environment
[ ] ved-vps.6 - Dokploy projects
[ ] ved-vps.7 - Dockerfiles optimization
[ ] ved-vps.8 - Environment configs
[ ] ved-vps.9 - Migration strategy

Phase 3: CI/CD
[ ] ved-vps.10 - GitHub Actions
[ ] ved-vps.11 - Quality gates
[ ] ved-vps.12 - Dokploy webhooks
[ ] ved-vps.13 - Rollback strategy

Phase 4: Monitoring
[ ] ved-vps.14 - Prometheus + Grafana
[ ] ved-vps.15 - Uptime monitoring
[ ] ved-vps.16 - Log aggregation
[ ] ved-vps.17 - Error tracking

Phase 5: Disaster Recovery
[ ] ved-vps.18 - Automated backups
[ ] ved-vps.19 - R2 integration
[ ] ved-vps.20 - DR runbook
[ ] ved-vps.21 - Staging sync tool

Phase 6: Performance
[ ] ved-vps.22 - Redis caching
[ ] ved-vps.23 - Query optimization
[ ] ved-vps.24 - CDN assets
[ ] ved-vps.25 - Load testing
```

---

**🎯 Your next command:** `ssh root@103.54.153.248` to verify VPS access!
