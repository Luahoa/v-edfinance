---
title: "Production Deployment Checklist"
description: "Step-by-step verification before deploying to production"
category: "operations"
lastUpdated: 2026-01-09
version: "1.0.0"
---

# Production Deployment Checklist

> **WARNING:** Do not skip steps. Each item prevents real production issues.

## Pre-Deployment Verification

### 1. Code Quality Gates

```bash
# Run all quality checks
pnpm install
pnpm --filter api build
pnpm --filter web build
pnpm --filter web lint
```

- [ ] `pnpm install` succeeds
- [ ] API build passes
- [ ] Web build passes
- [ ] Lint passes (no errors)
- [ ] No TypeScript errors
- [ ] No `any` types in changed files

### 2. Database Verification

```bash
# Verify schema is in sync
cd apps/api
npx prisma generate
npx prisma migrate status
```

- [ ] Prisma client generates without errors
- [ ] No pending migrations
- [ ] JSONB schemas validated
- [ ] Seed data tested (if applicable)

### 3. Environment Variables

- [ ] All required secrets are set in production
- [ ] `JWT_SECRET` is strong (32+ characters)
- [ ] `DATABASE_URL` points to production DB
- [ ] `ALLOWED_ORIGINS` includes production domain
- [ ] No development values in production config

### 4. Docker Images

```bash
# Build and test locally
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up
```

- [ ] All images build successfully
- [ ] Health checks pass locally
- [ ] Images pushed to Docker Hub
- [ ] Image tags are correct (staging/production)

---

## Deployment Steps

### 1. Create Backup

```bash
# Backup database before deployment
pg_dump -U postgres v_edfinance > backup_$(date +%Y%m%d_%H%M%S).sql
```

- [ ] Database backup created
- [ ] Backup verified (can restore)

### 2. Deploy Services

Deploy in order:
1. **Database** (if schema changes)
2. **API** (backend)
3. **Web** (frontend)
4. **Nginx** (reverse proxy)

```bash
# Via VPS Toolkit (non-interactive)
node scripts/vps-toolkit/docker-deploy.js
```

- [ ] Database migrations applied
- [ ] API service healthy
- [ ] Web service healthy
- [ ] Nginx routing correctly

### 3. Verify Deployment

```bash
# Check all services
curl -s https://api.v-edfinance.com/health | jq
curl -s https://v-edfinance.com
```

- [ ] API `/health` returns 200
- [ ] Web homepage loads
- [ ] Authentication works
- [ ] Critical user flows tested

---

## Post-Deployment

### 1. Monitor

- [ ] Check Grafana dashboards for anomalies
- [ ] Review error logs for first 15 minutes
- [ ] Monitor response times

### 2. Document

- [ ] Update deployment status in `docs/devops/deployment-status.md`
- [ ] Close related beads
- [ ] Notify team of deployment

### 3. Rollback Plan

If issues arise, see [Rollback Procedures](../operations/ROLLBACK_PROCEDURES.md)

Quick rollback:
```bash
# Revert to previous image
docker service update --image luahoa/v-edfinance-api:previous vedfinance-api
```

---

## Emergency Contacts

| Role | Contact |
|------|---------|
| VPS Provider | Hosting panel @ provider |
| Database | Backup scripts in `scripts/vps-toolkit/` |
| Domain/DNS | Cloudflare dashboard |

---

## Required Secrets

| Secret | Location | Purpose |
|--------|----------|---------|
| `POSTGRES_PASSWORD` | VPS `.env.production` | Database access |
| `JWT_SECRET` | VPS `.env.production` | Token signing |
| `JWT_REFRESH_SECRET` | VPS `.env.production` | Refresh token signing |
| `DOCKERHUB_TOKEN` | GitHub Secrets | CI/CD image push |
| `VPS_SSH_KEY` | GitHub Secrets | Deployment SSH |
