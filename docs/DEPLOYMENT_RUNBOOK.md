# Deployment Runbook

This document outlines the procedures for deploying, maintaining, and recovering the V-EdFinance platform.

## 1. Daily Deployment Workflow

The platform uses a decoupled deployment strategy:
- **Frontend**: Automatically deployed to Cloudflare Pages on push to the `main` branch.
- **Backend**: Dockerized NestJS API managed by Dokploy on a VPS.

### Step-by-Step Process:
1. **Pre-flight Checks**:
   - Run local tests: `pnpm test`
   - Run linting: `pnpm --filter web lint`
   - Ensure Beads tasks are synchronized: `bd sync`
2. **Commit & Push**:
   - Commit changes using standard naming: `git commit -m "(ved-XXX) description"`
   - Push to origin: `git push origin main`
3. **Verification**:
   - Monitor Dokploy dashboard ([http://103.54.153.248:3000](http://103.54.153.248:3000)) for build status.
   - Verify API health: `GET http://103.54.153.248:3001/api/health`
   - Check Cloudflare Pages dashboard for frontend deployment status.

## 2. Hotfix Procedures

Hotfixes skip the standard feature branch cycle but must maintain quality gates.

1. **Isolation**: Create a branch from `main` named `hotfix/description`.
2. **Fix & Verify**: Apply fix and run targeted unit tests.
3. **Emergency Merge**: Merge directly into `main`.
4. **Manual Trigger**: If auto-deploy fails, manually trigger a redeploy in Dokploy or Cloudflare.

## 3. Manual Rollback Steps

### Via Git (Code Rollback)
If a deployment is unstable, revert the `main` branch:
```bash
git revert HEAD
git push origin main
```

### Via Dokploy (Container Rollback)
1. Access the Dokploy Dashboard.
2. Select the `api` service.
3. Navigate to **Deployments**.
4. Select the previous successful build and click **Redeploy**.

## 4. Database Schema Migration Protocol (Prisma)

Migrations must be handled carefully to avoid data loss.

1. **Development**:
   - Run `npx prisma migrate dev --name describe_change` to generate migration files.
2. **Production**:
   - Migrations are applied automatically during the Dokploy build process via `npx prisma migrate deploy`.
3. **Safety Check**:
   - ALWAYS run `npx prisma generate` after a migration.
   - Verify JSONB schema enforcement via `ValidationService`.

## 5. Disaster Recovery

### Restoring from /backups/postgres
Backups are generated daily at 02:00 AM via Dokploy/Cron.

1. **Locate Backup**: Identify the latest stable dump in `/backups/postgres/`.
2. **Stop API**: Scale the NestJS service to 0 in Dokploy to prevent write operations.
3. **Restore Command**:
   ```bash
   cat /backups/postgres/latest_dump.sql | docker exec -i postgres_container psql -U [USER] -d [DB_NAME]
   ```
4. **Verify**: Restart services and check `/api/debug/diagnostics/verify-integrity`.

## 6. Emergency Contact List Structure

| Role | Contact Method | Responsibility |
| :--- | :--- | :--- |
| **System Admin** | Slack: #ops / Email | VPS & Dokploy Infrastructure |
| **Backend Lead** | Slack: #dev-api | API & Database Integrity |
| **Frontend Lead** | Slack: #dev-web | UI & Cloudflare Availability |
| **Security Officer**| Email: security@v-edfinance.com | Breach Response |

---
*Last Updated: December 21, 2025*
