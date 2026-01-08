---
title: "Deployment Documentation"
description: "Production and staging deployment guides for V-EdFinance"
category: "operations"
lastUpdated: 2026-01-09
version: "1.0.0"
---

# Deployment Documentation

> All guides related to deploying V-EdFinance to production and staging environments.

## Quick Links

| Document | Purpose |
|----------|---------|
| [Production Checklist](production-checklist.md) | Pre-deployment verification |
| [Dokploy Setup Guide](dokploy-setup-guide.md) | Dokploy configuration |
| [Service Dependencies](service-dependencies.md) | Service startup order |
| [GitHub Secrets Setup](github-secrets-setup.md) | CI/CD secrets configuration |

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                   Cloudflare                     │
│              (DNS + CDN + Pages)                 │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│                  VPS (Dokploy)                   │
│  ┌─────────┐  ┌─────────┐  ┌─────────────────┐  │
│  │  Nginx  │──│   Web   │  │      API        │  │
│  │  :80    │  │  :3000  │  │     :3001       │  │
│  └─────────┘  └─────────┘  └────────┬────────┘  │
│                                      │          │
│                              ┌───────▼────────┐ │
│                              │   PostgreSQL   │ │
│                              │     :5432      │ │
│                              └────────────────┘ │
└─────────────────────────────────────────────────┘
```

## Deployment Environments

| Environment | Domain | Branch | Auto-Deploy |
|-------------|--------|--------|-------------|
| Production | v-edfinance.com | `main` | No (manual) |
| Staging | staging.v-edfinance.com | `staging` | Yes |
| Development | localhost:3000 | `*` | N/A |

## VPS Information

- **IP:** 103.54.153.248
- **Dokploy UI:** http://103.54.153.248:3000
- **SSH:** `ssh root@103.54.153.248 -i ~/.ssh/vps_new_key`

## Docker Images

| Service | Image | Tag |
|---------|-------|-----|
| API | `luahoa/v-edfinance-api` | staging/production |
| Web | `luahoa/v-edfinance-web` | staging/production |
| Nginx | `luahoa/v-edfinance-nginx` | staging/production |

## Deployment Flow

1. **Code merged to branch**
2. **CI/CD builds Docker images** (GitHub Actions)
3. **Images pushed to Docker Hub**
4. **Dokploy pulls and deploys** (auto for staging)

For manual deployment, use:
```bash
node scripts/vps-toolkit/docker-deploy.js
```

## Troubleshooting

See [Troubleshooting Guide](../troubleshooting.md#dockerdeployment) for common issues.
