# Cloudflare Full Stack Deployment Plan (Option 2)

> **Wrangler CLI**: v4.61.0 (latest)  
> **Last Updated**: 2026-01-28

## ✅ Edge Compatibility Status

| Component | Status | Notes |
|-----------|--------|-------|
| Database (Neon) | ✅ Edge-ready | `@neondatabase/serverless` |
| Auth (better-auth) | ✅ Edge-ready | `auth-edge.ts` |
| Email (Resend) | ✅ Edge-ready | `email-edge.ts` - uses fetch API |
| tRPC Routers | ✅ Edge-ready | No Node-specific imports |
| Worker Entry | ✅ Edge-ready | `worker.ts` (93KB bundle) |
| Next.js | ✅ Edge-ready | `@cloudflare/next-on-pages` v1.13.16 |

**Verified**: `wrangler deploy --dry-run` passes ✅

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   Cloudflare Pages  │────▶│  Cloudflare Workers │────▶│    Neon PostgreSQL  │
│      (Next.js)      │     │   (Hono + tRPC)     │     │    (Serverless)     │
│                     │     │                     │     │                     │
│  vedfinance.pages   │     │  vedfinance-api     │     │  DATABASE_URL       │
│         .dev        │     │   .workers.dev      │     │                     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
         │                           │
         └───────────────────────────┘
                     │
              Custom Domains:
         hocchungkhoan.com.vn (frontend)
     api.hocchungkhoan.com.vn (backend)
```

## Pre-requisites Checklist

- [ ] Cloudflare account created
- [ ] API Token with permissions (Workers, Pages, DNS, R2)
- [ ] Neon PostgreSQL database URL
- [ ] Domain `hocchungkhoan.com.vn` added to Cloudflare
- [ ] `.env` configured with `CLOUDFLARE_API_KEY`

---

## Phase 1: Backend (Cloudflare Workers)

### Status: ✅ Already Configured

Files đã có sẵn:
- `apps/server/wrangler.toml` - Workers config
- `apps/server/src/worker.ts` - Edge-compatible entry
- `apps/server/src/trpc/context-edge.ts` - Edge context
- `apps/server/src/lib/auth-edge.ts` - Edge auth

### Step 1.1: Set Secrets

```bash
cd apps/server

# Set required secrets
wrangler secret put DATABASE_URL
# Paste: postgresql://user:pass@host/db?sslmode=require

wrangler secret put BETTER_AUTH_SECRET
# Paste: your-secret-key

wrangler secret put GOOGLE_CLIENT_ID
# Paste: your-google-client-id

wrangler secret put GOOGLE_CLIENT_SECRET
# Paste: your-google-client-secret
```

### Step 1.2: Build & Deploy

```bash
cd apps/server

# Build worker bundle
pnpm build:worker

# Deploy to Cloudflare Workers
wrangler deploy

# Verify deployment
curl https://vedfinance-api.<account>.workers.dev/health
```

### Step 1.3: Configure Custom Domain

```bash
# Already configured in wrangler.toml:
# routes = [{ pattern = "api.hocchungkhoan.com.vn", custom_domain = true }]

# Verify DNS is proxied through Cloudflare
wrangler dns list
```

---

## Phase 2: Frontend (Cloudflare Pages)

### Step 2.1: Install @cloudflare/next-on-pages

```bash
cd apps/web
pnpm add -D @cloudflare/next-on-pages
```

### Step 2.2: Update next.config.ts

The current config is compatible. For Pages, we use `@cloudflare/next-on-pages` which handles the build:

```typescript
// apps/web/next.config.ts
import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // @cloudflare/next-on-pages handles the output
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

export default withNextIntl(nextConfig);
```

### Step 2.3: Create wrangler.toml for Pages

Create `apps/web/wrangler.toml`:

```toml
name = "vedfinance-web"
compatibility_date = "2026-01-01"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = ".vercel/output/static"

[vars]
NEXT_PUBLIC_API_URL = "https://api.hocchungkhoan.com.vn"
```

### Step 2.4: Build & Deploy (Optimized)

```bash
cd apps/web

# Build with @cloudflare/next-on-pages
pnpm exec @cloudflare/next-on-pages

# Deploy to Cloudflare Pages (Wrangler v4.61+)
wrangler pages deploy .vercel/output/static --project-name=vedfinance-web

# Or one-liner:
pnpm exec @cloudflare/next-on-pages && wrangler pages deploy .vercel/output/static --project-name=vedfinance-web
```

### Step 2.5: Set Environment Variables (Wrangler v4 Syntax)

```bash
cd apps/web

# Bulk secrets via wrangler.toml [vars] or:
wrangler pages secret put NEXT_PUBLIC_API_URL --project-name=vedfinance-web
# Value: https://api.hocchungkhoan.com.vn
```

### Step 2.6: Configure Custom Domain

```bash
# Add custom domain (Wrangler v4.61+)
wrangler pages project domains add vedfinance-web hocchungkhoan.com.vn
wrangler pages project domains add vedfinance-web www.hocchungkhoan.com.vn
```

---

## Phase 3: DNS Configuration

### Step 3.1: DNS Records

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | @ | vedfinance-web.pages.dev | ✅ |
| CNAME | www | vedfinance-web.pages.dev | ✅ |
| CNAME | api | vedfinance-api.<account>.workers.dev | ✅ |

### Step 3.2: Apply via Cloudflare Manager

```bash
cd ~/.claude/skills/cloudflare-manager

# Frontend
bun scripts/dns-routes.ts create-dns hocchungkhoan.com.vn CNAME @ vedfinance-web.pages.dev
bun scripts/dns-routes.ts create-dns hocchungkhoan.com.vn CNAME www vedfinance-web.pages.dev

# Backend (Workers handles this via custom_domain in wrangler.toml)
```

---

## Phase 4: CI/CD Setup (Wrangler v4 Actions)

### GitHub Actions Workflow

Create `.github/workflows/cloudflare-deploy.yml`:

```yaml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
  CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v4
        with:
          version: 9
          
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
          
      - run: pnpm install
      
      - name: Build & Deploy Worker
        run: |
          cd apps/server
          pnpm build:worker
          wrangler deploy

  deploy-frontend:
    runs-on: ubuntu-latest
    needs: deploy-backend
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v4
        with:
          version: 9
          
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
          
      - run: pnpm install
      
      - name: Build Next.js for Pages
        run: |
          cd apps/web
          pnpm exec @cloudflare/next-on-pages
        env:
          NEXT_PUBLIC_API_URL: https://api.hocchungkhoan.com.vn
          
      - name: Deploy to Pages
        run: |
          cd apps/web
          wrangler pages deploy .vercel/output/static --project-name=vedfinance-web
```

---

## Phase 5: Verification Checklist

### Backend (Workers)

```bash
# Health check
curl https://api.hocchungkhoan.com.vn/health
# Expected: {"status":"ok","runtime":"cloudflare-workers","timestamp":"..."}

# tRPC endpoint
curl https://api.hocchungkhoan.com.vn/trpc/health

# Auth endpoint
curl https://api.hocchungkhoan.com.vn/api/auth/session
```

### Frontend (Pages)

```bash
# Homepage
curl -I https://hocchungkhoan.com.vn
# Expected: HTTP/2 200

# Check API connectivity (open in browser)
# Login, view courses, etc.
```

---

## Quick Deploy Commands Summary

```bash
# ===== SETUP (one-time) =====
cd apps/web && pnpm add -D @cloudflare/next-on-pages

# ===== BACKEND (Workers) =====
cd apps/server
pnpm build:worker
wrangler deploy

# ===== FRONTEND (Pages) =====
cd apps/web
pnpm exec @cloudflare/next-on-pages
wrangler pages deploy .vercel/output/static --project-name=vedfinance-web

# ===== VERIFY =====
curl https://api.hocchungkhoan.com.vn/health
curl -I https://hocchungkhoan.com.vn
```

---

## Rollback Plan

### Workers Rollback

```bash
cd apps/server

# List deployments
wrangler deployments list

# Rollback to previous
wrangler rollback <deployment-id>
```

### Pages Rollback

```bash
# Via Dashboard: Pages > vedfinance-web > Deployments > Rollback
# Or:
npx wrangler pages deployment list --project-name=vedfinance-web
```

---

## Cost Estimate (Free Tier)

| Service | Free Tier | Expected Usage |
|---------|-----------|----------------|
| Workers | 100K req/day | ~10K req/day (MVP) |
| Pages | Unlimited | Static + SSR |
| Bandwidth | Unlimited | ~50GB/month |
| KV (if needed) | 100K reads/day | ~5K/day |

**Estimated cost: $0/month for MVP**

---

## Next Steps

1. [x] Update Wrangler CLI: v4.61.0 ✅
2. [x] Fix typo in wrangler.toml ✅
3. [ ] Install @cloudflare/next-on-pages: `cd apps/web && pnpm add -D @cloudflare/next-on-pages`
4. [ ] Set secrets on Workers: `DATABASE_URL`, `BETTER_AUTH_SECRET`, etc.
5. [ ] Deploy backend: `cd apps/server && wrangler deploy`
6. [ ] Deploy frontend: `cd apps/web && pnpm exec @cloudflare/next-on-pages && wrangler pages deploy`
7. [ ] Configure custom domains
8. [ ] Set up GitHub Actions CI/CD
9. [ ] Run verification checklist
