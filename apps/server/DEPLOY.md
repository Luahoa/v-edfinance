# Cloudflare Workers Deployment Guide

## Prerequisites

1. Cloudflare account with Workers plan
2. Neon PostgreSQL database (for edge-compatible connections)
3. `wrangler` CLI authenticated: `npx wrangler login`

## Setup

### 1. Configure Secrets

```bash
cd apps/server

# Set production secrets
npx wrangler secret put DATABASE_URL
# Paste your Neon connection string (pooled, with ?sslmode=require)

npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put BETTER_AUTH_SECRET
```

### 2. Database Setup

Use Neon PostgreSQL for edge-compatible connections:

1. Create a Neon project at https://neon.tech
2. Copy the **pooled** connection string
3. Run migrations:
   ```bash
   DATABASE_URL="your-neon-url" pnpm db:push
   ```

### 3. Deploy

```bash
# Build and deploy to production
pnpm deploy

# Or deploy to staging
pnpm deploy:staging
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Edge                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Hono Worker (vedfinance-api)                       │    │
│  │  - /health           → Health check                 │    │
│  │  - /api/auth/**      → better-auth (edge)           │    │
│  │  - /trpc/*           → tRPC routers                 │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Neon PostgreSQL                          │
│  - Serverless driver (@neondatabase/serverless)             │
│  - Connection pooling via HTTP                              │
│  - Same schema as local development                         │
└─────────────────────────────────────────────────────────────┘
```

## Files

| File | Purpose |
|------|---------|
| `src/worker.ts` | Cloudflare Workers entry point |
| `src/lib/db-edge.ts` | Edge-compatible Neon database |
| `src/lib/auth-edge.ts` | Edge-compatible better-auth |
| `src/trpc/context-edge.ts` | Edge-compatible tRPC context |
| `wrangler.toml` | Cloudflare Workers configuration |

## Local Development

```bash
# Node.js server (uses postgres driver)
pnpm dev

# Wrangler local (uses Neon serverless)
npx wrangler dev
```

## Custom Domain

Uncomment in `wrangler.toml`:

```toml
routes = [
  { pattern = "api.vedfinance.com", custom_domain = true }
]
```

Then configure DNS in Cloudflare dashboard.

## Monitoring

Observability is enabled in `wrangler.toml`. View logs:

```bash
npx wrangler tail
```

Or use Cloudflare dashboard → Workers → Logs.
