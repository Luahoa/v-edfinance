# Execution Plan: Epic ved-et78 - GitHub Actions CI/CD Deployment (Plan C Optimized)

**Epic ID**: ved-et78  
**Priority**: P0  
**Approach**: GitHub Actions CI/CD → Docker Hub → Dokploy  
**Timeline**: 1-2 hours  
**Beads**: 6 (focused on automation)

---

## Architecture

```
Developer → Git Push → GitHub Actions → Build Images (Parallel) → Docker Hub → Dokploy Webhook → VPS Deploy
```

**Key Components**:
1. **GitHub Actions** - Build Docker images (smart change detection)
2. **Docker Hub** - Image registry (public repos, free)
3. **Dokploy** - VPS deployment manager
4. **VPS** - Runtime environment (103.54.153.248)

---

## Track Assignments

### Track 1: CI/CD Setup (BlueLake)
**Agent**: BlueLake  
**File Scope**: `.github/workflows/`, `docs/`  
**Beads**: 3

#### Bead 1: GitHub Secrets Configuration
**ID**: ved-et78-gh-secrets  
**Files**: GitHub repository settings (web UI)  
**Tasks**:
1. Generate Docker Hub token: https://hub.docker.com/settings/security
2. Configure GitHub secrets (4 secrets):
   - `DOCKERHUB_USERNAME=luahoa`
   - `DOCKERHUB_TOKEN=<token>`
   - `DOKPLOY_WEBHOOK_URL=<webhook-url>`
   - `VPS_IP=103.54.153.248`
3. Verify secrets configured
**Verification**: GitHub settings shows 4 secrets

#### Bead 2: Workflow Files Validation
**ID**: ved-et78-workflow-validation  
**Files**: `.github/workflows/docker-build.yml`, `.github/workflows/deploy-dokploy.yml`  
**Tasks**:
1. Verify workflow syntax (YAML valid)
2. Test change detection paths
3. Verify Docker build context paths
4. Confirm image naming convention
**Verification**: YAML linter passes, paths correct

#### Bead 3: Documentation Updates
**ID**: ved-et78-cicd-docs  
**Files**: `docs/optimized-plan-c-cicd.md`, `docs/plan-c-quick-start.md`, `AGENTS.md`  
**Tasks**:
1. Update AGENTS.md with CI/CD deployment commands
2. Create troubleshooting runbook
3. Document rollback procedure
**Verification**: Documentation complete and linked

---

### Track 2: Dokploy Configuration (GreenCastle)
**Agent**: GreenCastle  
**File Scope**: VPS Dokploy UI, `docker-compose.production.yml`  
**Beads**: 2

#### Bead 4: Dokploy Project Setup
**ID**: ved-et78-dokploy-project  
**Tasks**:
1. Create Dokploy project: `v-edfinance-staging`
2. Generate webhook URL
3. Configure 4 services:
   - PostgreSQL (postgres:16-alpine)
   - API (luahoa/v-edfinance-api:staging)
   - Web (luahoa/v-edfinance-web:staging)
   - Nginx (luahoa/v-edfinance-nginx:staging)
4. Set pull policy: `Always`
5. Configure environment variables from `.env.production`
**Verification**: All 4 services configured in Dokploy

#### Bead 5: Service Dependencies
**ID**: ved-et78-dokploy-deps  
**Tasks**:
1. Configure dependencies:
   - API depends on PostgreSQL
   - Web depends on API
   - Nginx depends on Web + API
2. Set health check endpoints
3. Configure internal networking
**Verification**: Dependency graph correct

---

### Track 3: CI/CD Validation (RedStone)
**Agent**: RedStone  
**File Scope**: GitHub Actions, Docker Hub  
**Beads**: 1

#### Bead 6: End-to-End Pipeline Test
**ID**: ved-et78-e2e-pipeline  
**Tasks**:
1. Trigger first build (manual workflow dispatch)
2. Monitor build progress (7-10 min)
3. Verify Docker Hub images:
   - `luahoa/v-edfinance-nginx:staging`
   - `luahoa/v-edfinance-web:staging`
   - `luahoa/v-edfinance-api:staging`
4. Trigger Dokploy deployment (manual or webhook)
5. Run health checks:
   - `curl http://103.54.153.248/health`
   - `curl http://103.54.153.248:3001/health`
   - `curl http://103.54.153.248:3000`
6. Test automated workflow:
   - Make test change to `apps/web/src/app/page.tsx`
   - Verify only Web rebuilds (smart detection)
   - Verify deployment updates
**Verification**: All health checks pass, automation works

---

## Execution Sequence

```
PHASE 1: Setup (Parallel)
├── Track 1 (BlueLake): GitHub secrets + workflows
└── Track 2 (GreenCastle): Dokploy configuration

PHASE 2: Validation
└── Track 3 (RedStone): E2E pipeline test

PHASE 3: Landing
├── Git push (all changes)
├── Close beads
└── Update AGENTS.md
```

**Timeline**:
- Phase 1: 20 minutes
- Phase 2: 15 minutes (first build + deploy)
- Phase 3: 5 minutes

**Total**: ~40 minutes

---

## Dependencies

### External Dependencies
- Docker Hub account (luahoa) - ✅ Exists
- GitHub repository access - ✅ Exists
- VPS access (103.54.153.248) - ✅ Verified
- Dokploy installed on VPS - ⚠️ TBD (check in Bead 4)

### File Dependencies
- `.github/workflows/docker-build.yml` - ✅ Created
- `.github/workflows/deploy-dokploy.yml` - ✅ Created
- `apps/web/Dockerfile` - ✅ Fixed
- `apps/api/Dockerfile` - ✅ Exists
- `docker/nginx/Dockerfile` - ✅ Fixed
- `docker-compose.production.yml` - ✅ Updated (uses image: instead of build:)

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Docker Hub rate limits | Low | Medium | Use authenticated pulls |
| GitHub Actions quota | Low | Low | Free tier: 2000 min/month |
| Dokploy not installed | Medium | High | Verify in Bead 4, fallback to manual docker-compose |
| VPS firewall blocks GitHub | Low | Medium | Whitelist GitHub IPs |
| First build timeout | Low | Low | GitHub runners have 6 hours limit |

---

## Success Criteria

Epic complete when:
- ✅ All 6 beads closed
- ✅ GitHub Actions workflow runs successfully
- ✅ Docker images on Docker Hub (3 images)
- ✅ Dokploy services deployed and healthy
- ✅ Health checks pass (Nginx, API, Web)
- ✅ Automated deployment tested (change → build → deploy)
- ✅ Documentation updated (AGENTS.md + runbooks)
- ✅ Git pushed to remote

---

## Rollback Plan

If deployment fails:
1. Use previous Docker image tags (immutable SHA tags)
2. Dokploy UI → Change image to `<service>:<branch>-<previous-sha>`
3. Redeploy (30 seconds)

---

## Agent Mail Coordination

**Not required** - All tracks have isolated scopes (GitHub vs Dokploy vs Validation)

---

## Quality Gates

### Pre-merge
- [ ] YAML lint passes
- [ ] Dockerfiles build locally (optional)
- [ ] Documentation complete

### Post-deployment
- [ ] All health checks pass
- [ ] No container restarts (check Dokploy logs)
- [ ] Automated workflow triggers successfully

---

## Knowledge to Capture

**Learnings**:
- GitHub Actions optimization patterns
- Docker Hub workflow
- Dokploy configuration best practices
- Webhook integration patterns

**Update**:
- `AGENTS.md` - CI/CD deployment section
- `docs/runbooks/deployment-cicd.md` - Complete runbook

---

## Next Steps (After Epic)

1. **Domain configuration** - Point staging.v-edfinance.com to VPS
2. **SSL certificate** - Dokploy auto-generates Let's Encrypt
3. **Production workflow** - Create separate workflow for main branch
4. **Monitoring** - Integrate Prometheus/Grafana alerts
5. **Slack notifications** - Build status to team channel

---

**Plan created**: 2026-01-07  
**Estimated completion**: 1-2 hours  
**Status**: Ready for execution
