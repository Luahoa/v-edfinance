# Discovery Report: Dokploy Debug

## Date: 2026-01-08

## Problem Statement
Dokploy UI shows API, nginx, web with red status (error), only postgres is green (healthy).

## VPS Status

### Docker Services (Swarm Mode)
| Service | Replicas | Status |
|---------|----------|--------|
| dokploy | 1/1 | ✅ Running |
| dokploy-postgres | 1/1 | ✅ Running |
| dokploy-redis | 1/1 | ✅ Running |
| vedfinance-postgres | 1/1 | ✅ Running |
| **vedfinance-api** | ❌ **NOT FOUND** | - |
| **vedfinance-web** | ❌ **NOT FOUND** | - |
| **vedfinance-nginx** | ❌ **NOT FOUND** | - |

### Container Status
- `v-edfinance-postgres`: Up 4 days (healthy) - Legacy container
- No API/Web/Nginx containers exist

### Health Checks
- Dokploy API: `http://localhost:3000/api/health` → `{"ok":true}`
- VEdFinance API: NOT DEPLOYED
- VEdFinance Web: NOT DEPLOYED

## Root Cause Analysis

### Primary Issue
**Services were never deployed** - Dokploy created the project but did not deploy the application services.

### Evidence
1. `docker service ls` shows only postgres, not api/web/nginx
2. `docker ps` shows no vedfinance-api, vedfinance-web, vedfinance-nginx containers
3. Dokploy UI shows "Created 1 day ago" but services are in error state

### Possible Causes
1. **Build failure** - Docker build failed during deployment
2. **Git integration issue** - Dokploy couldn't pull from GitHub
3. **Missing environment variables** - Required secrets not configured
4. **Network configuration** - Services couldn't connect to postgres

## Configuration Files

### docker-compose.production.yml
- Defines 4 services: nginx, web, api, postgres
- Uses images from Docker Hub: `luahoa/v-edfinance-*:staging`
- Dependencies: nginx → web, api; web → api; api → postgres

### Dockerfiles
- API: Node 20 Alpine, pnpm, Prisma migrate on startup
- Web: Node 20 Alpine, Next.js standalone output
- Nginx: Nginx Alpine, custom config

## Technical Constraints
- VPS IP: 103.54.153.248
- Dokploy UI: http://103.54.153.248:3000
- PostgreSQL: Already running (legacy + Dokploy)
- Swarm Mode: Active

## Next Steps (Recommended)
1. Check Dokploy build logs for API/Web/Nginx
2. Verify GitHub integration in Dokploy
3. Check environment variables in Dokploy project
4. Manual deploy trigger from Dokploy UI
