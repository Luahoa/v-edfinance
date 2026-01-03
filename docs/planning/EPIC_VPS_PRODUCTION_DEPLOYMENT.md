# 🚀 EPIC: VPS Production Deployment Strategy

**Epic ID:** `ved-vps`  
**Priority:** P0 - CRITICAL PATH TO PRODUCTION  
**Timeline:** 6 weeks (Parallel with Database Optimization)  
**Owner:** DevOps + Full Stack Team  
**Target:** Full production deployment on `103.54.153.248`

---

## 🎯 Epic Vision

**Transform v-edfinance from local development to a fully operational production platform on VPS with:**
- ✅ Zero-downtime deployments via Dokploy
- ✅ Automated CI/CD pipeline
- ✅ Multi-environment setup (dev, staging, production)
- ✅ Cloudflare CDN integration
- ✅ Production-grade monitoring & alerting
- ✅ Disaster recovery & backup automation

---

## 📊 Epic Metrics

| Metric | Current | Target |
|--------|---------|--------|
| **Deployment Time** | Manual (30min) | Automated (<5min) |
| **Uptime SLA** | N/A | 99.5% |
| **TTFB (Time to First Byte)** | N/A | <200ms (Cloudflare) |
| **Build Success Rate** | 0% (33 errors) | 95%+ |
| **Environment Parity** | 0% | 100% (dev=staging=prod) |
| **Backup Frequency** | Manual | Automated (daily) |

---

## 🗺️ Infrastructure Overview

### Current VPS Setup (103.54.153.248)

**Installed Components:**
- ✅ Dokploy (Dashboard: `http://103.54.153.248:3000`)
- ✅ PostgreSQL 15-alpine (3 databases: prod/staging/dev)
- ✅ Redis 7-alpine (200MB, LRU eviction)
- ✅ UFW Firewall (ports: 22, 80, 443, 3000)
- ✅ Fail2Ban (SSH brute-force protection)
- ✅ Backup scripts (`/root/scripts/vps-backup.sh`)
- ✅ User `deployer` (SSH key: `ssh-ed25519 AAAA...amp-agent`)

**Pending Components:**
- ❌ Nginx reverse proxy configuration
- ❌ SSL certificates (Let's Encrypt)
- ❌ Cloudflare CDN integration
- ❌ Monitoring stack (Prometheus/Grafana)
- ❌ Log aggregation (Loki/Promtail)
- ❌ Automated backup to R2/S3

---

## 🏗️ Phase Breakdown

### Phase 1: Foundation & Security (Week 1-2)
**Goal:** Production-grade security & infrastructure hardening

#### Tasks:
- **ved-vps.1** - SSL Certificate Setup via Let's Encrypt (30 min) - P0
  - Domains: `api.v-edfinance.com`, `v-edfinance.com`, `staging.v-edfinance.com`
  - Auto-renewal with certbot
  
- **ved-vps.2** - Nginx Reverse Proxy Configuration (60 min) - P0
  - Rate limiting (100 req/min per IP)
  - WebSocket support for real-time features
  - Gzip/Brotli compression
  
- **ved-vps.3** - Cloudflare CDN Integration (45 min) - P1
  - DNS setup (A records, CNAME)
  - SSL mode: Full (strict)
  - Page rules for caching
  
- **ved-vps.4** - Environment Variables Security Audit (30 min) - P0
  - Move secrets from `.env` to Dokploy Secrets
  - Rotate all API keys (Database, Redis, Gemini, R2)
  - JWT secret regeneration
  
- **ved-vps.5** - Database Connection Pooling (40 min) - P1
  - Prisma connection limit: 10
  - PgBouncer setup (optional, if needed)

---

### Phase 2: Multi-Environment Setup (Week 2-3)
**Goal:** Dev → Staging → Production pipeline with environment parity

#### Tasks:
- **ved-vps.6** - Create Dokploy Projects Structure (60 min) - P0
  ```
  v-edfinance-dev     → dev.v-edfinance.com
  v-edfinance-staging → staging.v-edfinance.com
  v-edfinance-prod    → v-edfinance.com
  ```
  
- **ved-vps.7** - Dockerfiles Optimization (90 min) - P1
  - Multi-stage builds for smaller images
  - Layer caching for faster rebuilds
  - Health checks in Dockerfile
  
- **ved-vps.8** - Environment-Specific Configs (45 min) - P0
  - `config/dev.yml`, `config/staging.yml`, `config/prod.yml`
  - Feature flags per environment
  - Database migration strategy (staging → prod)
  
- **ved-vps.9** - Database Migration Strategy (60 min) - P0
  - Staging migrations run automatically
  - Production migrations require manual approval
  - Rollback procedures documented

---

### Phase 3: CI/CD Pipeline (Week 3-4)
**Goal:** Automated testing → building → deployment

#### Tasks:
- **ved-vps.10** - GitHub Actions Workflows (120 min) - P0
  - `.github/workflows/deploy-dev.yml` (on push to `dev` branch)
  - `.github/workflows/deploy-staging.yml` (on push to `staging` branch)
  - `.github/workflows/deploy-prod.yml` (on manual trigger + tag)
  
- **ved-vps.11** - Quality Gates in CI (60 min) - P1
  - TypeScript type-check (must pass)
  - Linting (must pass)
  - Unit tests (70% coverage required)
  - Integration tests (staging only)
  
- **ved-vps.12** - Dokploy Webhooks Integration (30 min) - P0
  - GitHub → Dokploy webhook setup
  - Auto-deploy on git push
  - Slack notifications on deploy success/failure
  
- **ved-vps.13** - Rollback Strategy (45 min) - P1
  - Docker image tagging with git SHA
  - One-click rollback in Dokploy
  - Database migration rollback scripts

---

### Phase 4: Monitoring & Observability (Week 4-5)
**Goal:** Real-time visibility into production health

#### Tasks:
- **ved-vps.14** - Prometheus + Grafana Setup (90 min) - P1
  - Metrics: CPU, RAM, disk, network
  - NestJS metrics (request rate, response time)
  - PostgreSQL metrics (connections, slow queries)
  
- **ved-vps.15** - Uptime Monitoring (30 min) - P0
  - Uptime Kuma setup (`monitoring.v-edfinance.com`)
  - Health check endpoints: `/api/health`, `/api/db-health`
  - Email/Telegram alerts on downtime
  
- **ved-vps.16** - Log Aggregation with Loki (60 min) - P2
  - Centralized logging for all containers
  - Promtail → Loki → Grafana pipeline
  - Log retention: 7 days
  
- **ved-vps.17** - Error Tracking Integration (40 min) - P1
  - Sentry or self-hosted error tracking
  - Source maps for stack traces
  - Error grouping & deduplication

---

### Phase 5: Disaster Recovery (Week 5-6)
**Goal:** Zero data loss, <1 hour RTO (Recovery Time Objective)

#### Tasks:
- **ved-vps.18** - Automated Database Backups (60 min) - P0
  - Daily backups at 3 AM UTC
  - Retention: 7 days local + 30 days remote (R2)
  - Backup verification script
  
- **ved-vps.19** - Cloudflare R2 Backup Integration (45 min) - P1
  - `rclone` setup for R2 sync
  - Automated upload after each backup
  - Restore procedure documentation
  
- **ved-vps.20** - Disaster Recovery Runbook (60 min) - P0
  - VPS failure scenarios
  - Database corruption recovery
  - DNS failover procedures
  
- **ved-vps.21** - Staging → Production Sync Tool (45 min) - P2
  - One-command data sync (for demos)
  - Anonymize user data (GDPR compliance)
  - Exclude sensitive tables

---

### Phase 6: Performance & Scale (Week 6)
**Goal:** Sub-200ms TTFB, handle 1000 concurrent users

#### Tasks:
- **ved-vps.22** - Redis Caching Strategy (covered in ved-hyv.11) - P1
  - Already implemented: Leaderboard caching
  - Extend to: Course catalog, user profiles
  
- **ved-vps.23** - Database Query Optimization (covered in ved-hyv) - P0
  - Already done: Composite indexes
  - Monitor slow queries with pg_stat_statements
  
- **ved-vps.24** - CDN Asset Optimization (60 min) - P1
  - Next.js static assets → Cloudflare CDN
  - Image optimization (WebP conversion)
  - Cache headers configuration
  
- **ved-vps.25** - Load Testing with Vegeta (45 min) - P2
  - Target: 1000 RPS for 5 minutes
  - Identify bottlenecks
  - Auto-scaling strategy (if needed)

---

## 🔄 Continuous Tasks

**Throughout the Epic:**
- Weekly VPS health checks
- Security updates (OS packages)
- SSL certificate renewal monitoring
- Backup restoration tests (monthly)
- Performance regression testing

---

## 📋 Handoff Context for VPS Thread

### Current State Summary
```bash
# VPS Credentials
IP: 103.54.153.248
SSH Key: temp_pub_key.pub (amp-agent)
Dokploy: http://103.54.153.248:3000

# Installed Services
✅ PostgreSQL 15-alpine (vedfinance_staging, vedfinance_dev, vedfinance_prod)
✅ Redis 7-alpine (200MB LRU)
✅ UFW + Fail2Ban (security hardened)
✅ Backup scripts (/root/scripts/)

# Pending Work
❌ SSL certificates
❌ Nginx reverse proxy
❌ CI/CD pipeline
❌ Monitoring stack
❌ Production deployment
```

### Essential Files to Know
- `DEVOPS_GUIDE.md` - VPS setup history
- `VPS_MANUAL_COMMANDS.md` - SSH operations reference
- `dokploy.yaml` - Container orchestration config
- `docker-compose.monitoring.yml` - Grafana/Prometheus setup
- `scripts/database/vps-backup.sh` - Backup automation
- `temp_pub_key.pub` - SSH key for authentication

### Critical Decisions Needed
1. **Domain Strategy:** Use Cloudflare DNS or direct A records?
2. **Deployment Model:** Dokploy auto-deploy or manual approval for production?
3. **Monitoring Budget:** Self-hosted Grafana or paid service (Datadog/New Relic)?
4. **Backup Storage:** Cloudflare R2 or AWS S3?
5. **Error Tracking:** Sentry cloud or self-hosted?

### Success Criteria for VPS Epic
```bash
✅ All environments deployed (dev, staging, prod)
✅ CI/CD pipeline: git push → auto-deploy
✅ SSL A+ rating (SSLLabs)
✅ <200ms TTFB (Cloudflare CDN)
✅ 99.5%+ uptime (30 days)
✅ Daily backups to R2
✅ Zero-downtime deployments
```

---

## 🚨 Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| VPS single point of failure | 🔴 High | Weekly backups to R2, documented restore procedure |
| SSL certificate expiry | 🟡 Medium | Certbot auto-renewal + monitoring |
| Database migration failure | 🔴 High | Staging migration testing + rollback scripts |
| Dokploy unavailable | 🟡 Medium | Fallback to manual Docker commands |
| Cloudflare outage | 🟢 Low | Direct IP access documented |

---

## 📊 Dependencies with Other Epics

**Depends On:**
- `ved-hyv` (Database Optimization) - Phase 2 complete for production deployment
- Build fixes (33 errors) - Must be resolved before deploying

**Blocks:**
- User acceptance testing
- Investor demos
- Marketing launch

---

## 🎯 Quick Start for VPS Thread

**First Session Commands:**
```bash
# 1. Verify VPS access
ssh root@103.54.153.248

# 2. Check current deployments
docker ps

# 3. Review Dokploy dashboard
# Open: http://103.54.153.248:3000

# 4. Start with ved-vps.1 (SSL Setup)
# Read: DEVOPS_GUIDE.md sections on SSL
```

---

**Created:** 2025-12-22  
**Next Review:** After Phase 1 completion  
**Estimated Completion:** 6 weeks (parallel execution)
