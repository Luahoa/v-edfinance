# Execution Plan: Epic ved-et78 (Application Deployment - API + Web Staging)

**Epic ID**: ved-et78  
**Priority**: P0  
**Approach**: BALANCED (Oracle recommendation)  
**Timeline**: 3-4 days  
**Beads**: 16 (estimated)  
**Expected Outcome**: Production-ready staging deployment with basic CI/CD automation

---

## Executive Summary

### Discovery Findings
- **Infrastructure**: VPS Toolkit ready, Docker setup complete, PostgreSQL ready (ved-y1u dependency satisfied)
- **Application**: Both builds PASS ✅ (API: 0 errors, Web: 0 errors, 68 pages generated)
- **Cloudflare**: SSR mode requires `output: 'export'` fix for Cloudflare Pages compatibility
- **Risks**: 4 HIGH (1 resolved via build verification), 6 MEDIUM, 4 LOW

### Oracle Risk Analysis
**HIGH Risks**:
- ✅ H2: Build verification - RESOLVED (both builds pass)
- ❌ H1: Next.js SSR incompatible with Cloudflare Pages (needs `output: 'export'`)
- ❌ H3: Production .env not configured (secrets needed)
- ❌ H4: SSH lockout potential (must use safe-deploy.js)

**MEDIUM Risks**: Cloudflare API token, port conflicts, CORS, TypeScript errors, build output dir, CI/CD integration

### Execution Strategy
- **Approach**: BALANCED (3-4 days, 16 beads)
- **Tracks**: 4 parallel tracks with file scope isolation
- **Critical Path**: Fix Next.js config → Deploy backend → Deploy frontend → Automation
- **Deferred**: TypeScript/ESLint fixes (document for future epic), monitoring stack fixes, R2 backup setup

---

## Track Assignments

### Track 1: GreenLeaf (Frontend Configuration & Build)
**Agent**: GreenLeaf  
**File Scope**: `apps/web/next.config.mjs`, `apps/web/package.json`  
**Beads**: 4  
**Dependencies**: None (can start immediately)

#### Bead 1: ved-et78-web-config (Next.js Static Export)
**Priority**: P0 (Critical - H1 blocker)  
**File**: `apps/web/next.config.mjs`  
**Tasks**:
1. Add static export configuration:
   ```javascript
   const nextConfig = {
     output: 'export',
     images: {
       unoptimized: true // Required for static export
     },
     trailingSlash: true, // Better Cloudflare Pages compatibility
     // Keep existing i18n, experimental config
   }
   ```
2. Verify build output changes from `.next/` to `out/`
3. Test build: `pnpm --filter web build`
4. Check `out/` directory contains static files

**Validation**: Build succeeds, `out/` directory created with index.html  
**Estimate**: 30 minutes

---

#### Bead 2: ved-et78-web-env (Production Environment Variables)
**Priority**: P0 (H3 blocker)  
**Files**: `apps/web/.env.production` (create new)  
**Tasks**:
1. Copy from `.env.example`:
   ```env
   NEXT_PUBLIC_API_URL=https://api.staging.v-edfinance.com
   NEXT_PUBLIC_APP_URL=https://staging.v-edfinance.com
   ```
2. Add to `.gitignore` if not already present
3. Document required variables in `env-examples/web.env.example`

**Validation**: File created, gitignored, documented  
**Estimate**: 15 minutes

---

#### Bead 3: ved-et78-web-build-verify (Static Build Verification)
**Priority**: P1  
**File**: N/A (verification task)  
**Tasks**:
1. Clean build: `rm -rf apps/web/out apps/web/.next`
2. Fresh build: `pnpm --filter web build`
3. Verify static files:
   - `out/index.html` exists
   - `out/_next/static/` contains assets
   - No `.next/server/` directory (should not exist in static export)
4. Test pages:
   - Check `out/vi/index.html`, `out/en/index.html`, `out/zh/index.html` (i18n)
   - Check `out/vi/dashboard.html`

**Validation**: All pages render as static HTML  
**Estimate**: 30 minutes

---

#### Bead 4: ved-et78-web-images (Image Optimization Audit)
**Priority**: P2 (Post-deployment)  
**File**: Multiple component files  
**Tasks**:
1. Search for `next/image` usage: `Grep "next/image" apps/web/src`
2. Document images that need manual optimization
3. Create follow-up epic for image optimization (Cloudflare Images)
4. Note: `unoptimized: true` works but degrades performance

**Validation**: Documentation created for future optimization  
**Estimate**: 30 minutes

---

### Track 2: BlueSky (Backend Deployment)
**Agent**: BlueSky  
**File Scope**: `apps/api/`, `scripts/vps-toolkit/`, `docker-compose.yml`  
**Beads**: 5  
**Dependencies**: None (can start immediately)

#### Bead 5: ved-et78-api-env (Production Environment Variables)
**Priority**: P0 (H3 blocker)  
**File**: `apps/api/.env.production` (create on VPS)  
**Tasks**:
1. Create production .env template:
   ```env
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=postgresql://user:pass@localhost:5432/v_edfinance
   JWT_SECRET=<generate-random-256-bit>
   JWT_EXPIRES_IN=7d
   ALLOWED_ORIGINS=https://staging.v-edfinance.com
   CORS_CREDENTIALS=true
   ```
2. Generate JWT secret: `openssl rand -base64 32`
3. Upload to VPS: Use VPS Toolkit uploadFile()
4. Set permissions: `chmod 600 .env.production`

**Validation**: .env.production on VPS, secure permissions  
**Estimate**: 30 minutes

---

#### Bead 6: ved-et78-api-dockerfile (Dockerfile Optimization)
**Priority**: P1  
**File**: `apps/api/Dockerfile`  
**Tasks**:
1. Read existing Dockerfile
2. Verify multi-stage build (builder + production)
3. Add health check:
   ```dockerfile
   HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
     CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); });"
   ```
4. Ensure Prisma generate in build stage
5. Set NODE_ENV=production

**Validation**: Dockerfile builds successfully  
**Estimate**: 45 minutes

---

#### Bead 7: ved-et78-api-deploy (VPS Deployment via Safe Deploy)
**Priority**: P0 (Critical)  
**Files**: `scripts/vps-toolkit/deploy-api-safe.js` (create new), `docker-compose.production.yml` (create new)  
**Tasks**:
1. Create safe deployment script using VPS Toolkit:
   ```javascript
   const VPSConnection = require('./vps-connection');
   const vps = new VPSConnection();
   await vps.connect();
   
   // Upload docker-compose.production.yml
   await vps.uploadFile('./docker-compose.production.yml', '/root/v-edfinance/');
   
   // Upload .env.production
   await vps.uploadFile('./apps/api/.env.production', '/root/v-edfinance/');
   
   // Run Prisma migrations
   await vps.exec('cd /root/v-edfinance && docker-compose exec api npx prisma migrate deploy');
   
   // Restart containers
   await vps.exec('cd /root/v-edfinance && docker-compose up -d --build api');
   
   vps.disconnect();
   ```
2. Follow AGENT_PROTOCOL.md safety rules (H4 mitigation):
   - NEVER enable firewall before SSH config
   - Use safe-deploy.js wrapper
   - Verify SSH after changes
3. Create docker-compose.production.yml:
   ```yaml
   services:
     api:
       build: ./apps/api
       ports:
         - "3001:3001"
       environment:
         - NODE_ENV=production
       env_file:
         - .env.production
       depends_on:
         - postgres
       restart: unless-stopped
   ```

**Validation**: API responds at `http://VPS_IP:3001/health`  
**Estimate**: 2 hours

---

#### Bead 8: ved-et78-api-health (Health Check & Smoke Tests)
**Priority**: P0  
**File**: N/A (testing task)  
**Tasks**:
1. Test health endpoint: `curl http://VPS_IP:3001/health`
2. Test Swagger docs: `curl http://VPS_IP:3001/api`
3. Test CORS: `curl -H "Origin: https://staging.v-edfinance.com" http://VPS_IP:3001/health`
4. Test database connection: Check Prisma client initialization in logs
5. Verify Prometheus metrics: `curl http://VPS_IP:3001/metrics`

**Validation**: All endpoints return 200, CORS headers present  
**Estimate**: 30 minutes

---

#### Bead 9: ved-et78-monitoring (Monitoring Stack Verification)
**Priority**: P2 (Post-deployment)  
**File**: `docker-compose.monitoring.yml`  
**Tasks**:
1. Start monitoring stack: `docker-compose -f docker-compose.monitoring.yml up -d`
2. Verify services:
   - Prometheus: http://VPS_IP:9090
   - Grafana: http://VPS_IP:3002 (change from 3001 to avoid API conflict - M2 mitigation)
3. Configure Grafana dashboards for API metrics
4. Document Beszel Agent restart loop issue (L2 - defer fix)

**Validation**: Prometheus scraping API metrics, Grafana accessible  
**Estimate**: 1 hour

---

### Track 3: RedWave (Frontend Deployment & Cloudflare)
**Agent**: RedWave  
**File Scope**: `.github/workflows/`, `wrangler.toml` (create), Cloudflare dashboard  
**Beads**: 4  
**Dependencies**: Track 1 Bead 1 (Next.js static export must complete first)

#### Bead 10: ved-et78-cloudflare-setup (Cloudflare Pages Project)
**Priority**: P0  
**File**: Manual Cloudflare dashboard setup (document in runbook)  
**Tasks**:
1. Create Cloudflare Pages project:
   - Name: `v-edfinance-staging`
   - Connect to GitHub repo
   - Branch: `spike/simplified-nav` (or `main`)
   - Build command: `cd apps/web && pnpm build`
   - Build output directory: `apps/web/out`
   - Environment variables:
     - `NEXT_PUBLIC_API_URL=https://api.staging.v-edfinance.com`
     - `NEXT_PUBLIC_APP_URL=https://staging.v-edfinance.com`
2. Configure custom domain: `staging.v-edfinance.com`
3. Test Git auto-deploy: Push to branch, verify build triggers

**Validation**: Cloudflare Pages build succeeds, site accessible at staging.v-edfinance.com  
**Estimate**: 1 hour

---

#### Bead 11: ved-et78-cloudflare-token (Cloudflare Pages API Token)
**Priority**: P1 (M1 mitigation)  
**File**: `.env` (add `CLOUDFLARE_PAGES_API_TOKEN`)  
**Tasks**:
1. Create API token in Cloudflare dashboard:
   - Permissions: Cloudflare Pages - Edit
   - Zone: v-edfinance.com
2. Add to `.env` (gitignored):
   ```env
   CLOUDFLARE_PAGES_API_TOKEN=<token>
   CLOUDFLARE_ACCOUNT_ID=<account-id>
   ```
3. Test token with wrangler: `npx wrangler pages project list`

**Validation**: Wrangler lists projects successfully  
**Estimate**: 15 minutes

---

#### Bead 12: ved-et78-wrangler-config (Wrangler Configuration)
**Priority**: P1 (M6 mitigation)  
**File**: `wrangler.toml` (create new in root)  
**Tasks**:
1. Create wrangler.toml:
   ```toml
   name = "v-edfinance-staging"
   compatibility_date = "2024-01-01"
   pages_build_output_dir = "apps/web/out"
   
   [env.staging]
   name = "v-edfinance-staging"
   
   [env.production]
   name = "v-edfinance"
   ```
2. Add to `.gitignore` if contains secrets (optional - no secrets in this config)
3. Test deploy: `npx wrangler pages deploy apps/web/out --project-name=v-edfinance-staging`

**Validation**: Manual wrangler deploy succeeds  
**Estimate**: 30 minutes

---

#### Bead 13: ved-et78-ci-cd (GitHub Actions CI/CD)
**Priority**: P1 (M6 mitigation)  
**File**: `.github/workflows/deploy-staging.yml` (create new)  
**Tasks**:
1. Create GitHub Actions workflow:
   ```yaml
   name: Deploy Staging
   on:
     push:
       branches: [spike/simplified-nav]
   jobs:
     deploy-frontend:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: pnpm/action-setup@v2
         - run: pnpm install
         - run: pnpm --filter web build
         - run: npx wrangler pages deploy apps/web/out --project-name=v-edfinance-staging
           env:
             CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_PAGES_API_TOKEN }}
   ```
2. Add GitHub secret: `CLOUDFLARE_PAGES_API_TOKEN`
3. Test workflow: Push commit, verify action runs

**Validation**: GitHub Actions deploys to Cloudflare Pages on push  
**Estimate**: 45 minutes

---

### Track 4: OrangeWave (Documentation & Verification)
**Agent**: OrangeWave  
**File Scope**: `docs/`, `runbooks/`, AGENTS.md  
**Beads**: 3  
**Dependencies**: All other tracks (runs last)

#### Bead 14: ved-et78-runbook (Deployment Runbook)
**Priority**: P1  
**File**: `runbooks/deployment-staging.md` (create new)  
**Tasks**:
1. Document complete deployment process:
   - Pre-requisites (secrets, VPS access, Cloudflare access)
   - Backend deployment steps (VPS Toolkit script)
   - Frontend deployment steps (Cloudflare Pages)
   - Verification steps (health checks, smoke tests)
   - Rollback procedure
2. Include troubleshooting section:
   - SSH lockout recovery (H4)
   - Build failures
   - Database migration failures
   - CORS issues (M3)
3. Reference safety protocols from AGENT_PROTOCOL.md

**Validation**: Runbook complete, peer-reviewed  
**Estimate**: 1.5 hours

---

#### Bead 15: ved-et78-agents-update (AGENTS.md Deployment Section)
**Priority**: P2  
**File**: `AGENTS.md`  
**Tasks**:
1. Add "Deployment" section after "VPS Deployment Automation":
   ```markdown
   ## Deployment Workflows
   
   ### Staging Deployment
   - **Backend**: VPS via Docker Compose (Port 3001)
   - **Frontend**: Cloudflare Pages (staging.v-edfinance.com)
   - **CI/CD**: GitHub Actions auto-deploy on push
   
   ### Commands
   ```bash
   # Backend deployment
   node scripts/vps-toolkit/deploy-api-safe.js
   
   # Frontend deployment (manual)
   npx wrangler pages deploy apps/web/out --project-name=v-edfinance-staging
   ```
   
   ### Health Checks
   - API: http://VPS_IP:3001/health
   - Web: https://staging.v-edfinance.com
   - Swagger: http://VPS_IP:3001/api
   ```
2. Update VPS Deployment Automation section with deployment script reference

**Validation**: AGENTS.md updated with deployment workflows  
**Estimate**: 30 minutes

---

#### Bead 16: ved-et78-e2e-smoke (End-to-End Smoke Tests)
**Priority**: P0 (Critical - final verification)  
**File**: N/A (testing task)  
**Tasks**:
1. **Frontend smoke tests**:
   - Homepage loads: https://staging.v-edfinance.com
   - i18n switching works: /vi, /en, /zh routes
   - Dashboard renders: /vi/dashboard
   - API calls succeed (check Network tab)
2. **Backend smoke tests**:
   - Health check: `curl http://VPS_IP:3001/health`
   - CORS headers: Verify Origin header in response
   - Swagger docs: Navigate to /api
3. **Integration tests**:
   - Frontend → Backend communication
   - Database queries work (check API logs)
   - Prisma migrations applied (check `_prisma_migrations` table)
4. **Performance checks**:
   - Lighthouse score (target: >70)
   - First Contentful Paint <2s
   - Time to Interactive <3s

**Validation**: All tests pass, performance targets met  
**Estimate**: 1 hour

---

## File Scope Isolation (Prevent Conflicts)

| Track | Agent | File Scope | Beads | Conflicts? |
|-------|-------|------------|-------|------------|
| 1 | GreenLeaf | `apps/web/next.config.mjs`, `apps/web/.env.production` | 4 | ✅ No overlaps |
| 2 | BlueSky | `apps/api/**`, `scripts/vps-toolkit/**`, `docker-compose*.yml` | 5 | ✅ No overlaps |
| 3 | RedWave | `.github/workflows/**`, `wrangler.toml` | 4 | ✅ No overlaps |
| 4 | OrangeWave | `docs/**`, `runbooks/**`, `AGENTS.md` | 3 | ✅ No overlaps |

**No conflicts** - All tracks can run in parallel except Track 3 (depends on Track 1 Bead 1).

---

## Cross-Track Dependencies

```mermaid
graph TD
    T1B1[Track 1 Bead 1: Next.js static export] --> T3B1[Track 3 Bead 10: Cloudflare setup]
    T1B1 --> T1B3[Track 1 Bead 3: Build verify]
    T2B5[Track 2 Bead 5: API env] --> T2B7[Track 2 Bead 7: VPS deploy]
    T2B6[Track 2 Bead 6: Dockerfile] --> T2B7
    T2B7 --> T2B8[Track 2 Bead 8: Health checks]
    T3B2[Track 3 Bead 11: CF token] --> T3B3[Track 3 Bead 12: Wrangler]
    T3B3 --> T3B4[Track 3 Bead 13: CI/CD]
    T1B3 -.-> T4B3[Track 4 Bead 16: E2E tests]
    T2B8 -.-> T4B3
    T3B1 -.-> T4B3

    style T1B1 fill:#90EE90
    style T2B7 fill:#87CEEB
    style T3B1 fill:#FFB6C1
    style T4B3 fill:#FFD700
```

**Legend**:
- Solid line: Hard dependency (MUST complete first)
- Dashed line: Soft dependency (should complete before, not blocking)

**Execution Order**:
1. **Phase 1**: Track 1 Bead 1 (Next.js config) - CRITICAL BLOCKER
2. **Phase 2**: Track 1 Beads 2-4, Track 2 Beads 5-6 (parallel)
3. **Phase 3**: Track 2 Bead 7 (VPS deploy), Track 3 Bead 10 (Cloudflare)
4. **Phase 4**: Track 2 Bead 8-9, Track 3 Beads 11-13 (parallel)
5. **Phase 5**: Track 4 (Documentation + E2E verification)

---

## Quality Gates

### Pre-Execution
- [x] All 3 discovery docs exist
- [x] Build verification complete (both builds PASS)
- [ ] Oracle risk analysis reviewed
- [ ] Production secrets available (H3 - user confirms)
- [ ] Cloudflare dashboard access confirmed (user confirms)

### Per-Bead Self-Correction Loop
Each worker MUST run after every bead:
```bash
# Track 1 (Web)
pnpm --filter web build
# IF FAILS: Read error, fix, re-run until PASS

# Track 2 (API)
pnpm --filter api build
# IF FAILS: Read error, fix, re-run until PASS
```

### Post-Execution
- [ ] All 16 beads closed
- [ ] `pnpm --filter api build`: 0 errors
- [ ] `pnpm --filter web build`: 0 errors (static export)
- [ ] API health check: 200 OK
- [ ] Web homepage: loads successfully
- [ ] E2E smoke tests: PASS
- [ ] Runbook created and reviewed

---

## Success Metrics

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Deployment process | Manual, undocumented | Automated CI/CD | Automated |
| API deployment time | N/A | <10 minutes | <15 minutes |
| Web deployment time | N/A | <5 minutes | <10 minutes |
| Health check pass rate | N/A | 100% | 100% |
| Uptime SLA | N/A | 99%+ | 95%+ |
| CORS configuration | Localhost only | Production origins | Production-ready |

---

## Risk Mitigation

### HIGH Risks (All Mitigated)
- ✅ **H1 (Next.js SSR)**: Track 1 Bead 1 adds `output: 'export'`
- ✅ **H2 (Build verification)**: Pre-verified (both builds PASS)
- ✅ **H3 (Production .env)**: Track 1 Bead 2 + Track 2 Bead 5 create production env files
- ✅ **H4 (SSH lockout)**: Track 2 Bead 7 uses safe-deploy.js, follows AGENT_PROTOCOL.md

### MEDIUM Risks (Addressed in BALANCED Approach)
- ✅ **M1 (CF API token)**: Track 3 Bead 11 creates token
- ✅ **M2 (Port conflict)**: Track 2 Bead 9 changes Grafana to port 3002
- ✅ **M3 (CORS)**: Track 2 Bead 5 sets ALLOWED_ORIGINS
- ⏸️ **M4 (TypeScript errors)**: DEFERRED (documented for future epic)
- ✅ **M5 (Build output dir)**: Track 1 Bead 1 changes to `out/`
- ✅ **M6 (Frontend CI/CD)**: Track 3 Bead 13 adds GitHub Actions

### Deferred Risks (Future Epic)
- **L1 (R2 backup)**: Document in runbook, defer to ved-8yqm
- **L2 (Monitoring fixes)**: Document Beszel Agent issue, defer to maintenance epic
- **L3 (DNS verification)**: Manual check in Track 4 Bead 16
- **M4 (TypeScript errors)**: Create follow-up epic for code quality

---

## Worker Instructions

### For All Workers

**Setup**:
1. Read AGENTS.md for tool preferences
2. Read this execution plan
3. Read discovery docs:
   - [discovery-infrastructure.md](file:///e:/Demo%20project/v-edfinance/history/ved-et78/discovery-infrastructure.md)
   - [discovery-application.md](file:///e:/Demo%20project/v-edfinance/history/ved-et78/discovery-application.md)
   - [discovery-cloudflare.md](file:///e:/Demo%20project/v-edfinance/history/ved-et78/discovery-cloudflare.md)

**Protocol per Bead**:
1. **START**: `beads update <bead-id> --status in_progress`
2. **WORK**: Implement requirements per bead description
3. **VERIFY**: Run appropriate build/test command (fix until PASS)
4. **COMPLETE**: `beads close <bead-id> --reason "Summary"` + `beads sync --no-daemon`
5. **NEXT**: Continue to next bead in track

**Communication**:
- Use Agent Mail for blockers: `.beads/agent-mail/<track-name>-<issue>.json`
- Update bead comments for progress: `beads comment <bead-id> "Progress update"`

### GreenLeaf (Track 1)
**Focus**: Next.js static export configuration  
**Critical**: Bead 1 MUST complete before Track 3 starts  
**Pattern**: Test build after every config change  
**Validation**: `pnpm --filter web build` → check `out/` directory created

### BlueSky (Track 2)
**Focus**: Backend deployment to VPS  
**Critical**: Use VPS Toolkit (non-interactive), follow AGENT_PROTOCOL.md safety rules  
**Pattern**: Never enable firewall before SSH config, always use safe-deploy.js  
**Validation**: API responds at http://VPS_IP:3001/health

### RedWave (Track 3)
**Focus**: Cloudflare Pages setup and CI/CD  
**Critical**: Wait for Track 1 Bead 1 completion (Next.js static export)  
**Pattern**: Test wrangler deploy manually before CI/CD automation  
**Validation**: Cloudflare Pages build succeeds, site accessible

### OrangeWave (Track 4)
**Focus**: Documentation and E2E verification  
**Critical**: Runs last (depends on all other tracks)  
**Pattern**: Document WHAT + WHY, include troubleshooting  
**Validation**: Runbook complete, all E2E tests pass

---

## Estimated Timeline

| Day | Phase | Beads | Workers | Status |
|-----|-------|-------|---------|--------|
| 1 | Next.js config + Env setup | T1B1, T1B2, T2B5 | GreenLeaf, BlueSky | Foundation |
| 1 | Build verification | T1B3, T2B6 | GreenLeaf, BlueSky | Parallel |
| 2 | Backend deployment | T2B7, T2B8 | BlueSky | Critical path |
| 2 | Frontend deployment | T3B1, T3B2 | RedWave | Parallel with backend |
| 3 | Automation | T3B3, T3B4, T2B9 | RedWave, BlueSky | CI/CD |
| 3-4 | Documentation + Verification | T1B4, T4B1, T4B2, T4B3 | OrangeWave | Final phase |

**Critical Path**: Track 1 Bead 1 → Track 2 Bead 7 → Track 3 Bead 10 → Track 4 Bead 16  
**Total**: 3-4 days (BALANCED approach)

---

## Deliverables

### Infrastructure Changes
- VPS: API running on Docker Compose (Port 3001)
- PostgreSQL: Prisma migrations applied
- Monitoring: Prometheus + Grafana operational
- Cloudflare Pages: v-edfinance-staging project

### Code Changes
- `apps/web/next.config.mjs`: Static export configuration
- `apps/web/.env.production`: Production environment variables
- `apps/api/.env.production`: Backend secrets (on VPS)
- `docker-compose.production.yml`: Production Docker setup
- `scripts/vps-toolkit/deploy-api-safe.js`: Safe deployment script
- `wrangler.toml`: Cloudflare Pages configuration
- `.github/workflows/deploy-staging.yml`: CI/CD automation

### Documentation
- `runbooks/deployment-staging.md`: Complete deployment runbook
- `AGENTS.md`: Deployment workflows section
- Knowledge extraction: `docs/ved-et78-knowledge-extraction.md`

### Endpoints Live
- **API**: http://VPS_IP:3001/health
- **Web**: https://staging.v-edfinance.com
- **Swagger**: http://VPS_IP:3001/api
- **Prometheus**: http://VPS_IP:9090
- **Grafana**: http://VPS_IP:3002

---

## Execution Plan Complete

**Status**: READY FOR PHASE 2 (Execution)  
**Next Step**: Spawn 4 parallel workers (GreenLeaf, BlueSky, RedWave, OrangeWave)  
**Epic Thread**: ved-et78  
**Approval**: APPROVED (Oracle recommendation: BALANCED)  

**User Confirmation Required**:
- [ ] Production secrets available (DATABASE_URL, JWT_SECRET, etc.)
- [ ] Cloudflare dashboard access confirmed
- [ ] VPS SSH access verified
- [ ] Ready to proceed with deployment

---

**Document Version**: 1.0  
**Created**: 2026-01-07  
**Author**: Ralph Planning Phase  
**Last Updated**: 2026-01-07
