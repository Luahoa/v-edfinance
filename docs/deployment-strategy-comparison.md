# V-EdFinance Deployment Strategy Comparison

**Context**: Docker build on Windows with 1.14GB monorepo context is slow and fragile. Need optimal deployment approach for VPS + Dokploy.

---

## Plan A: Pre-built Images via Docker Hub (Recommended)

### Architecture
```
Local Windows → Build Docker images → Push to Docker Hub → Dokploy pulls images → Deploy
```

### Workflow
1. **Local Build** (Windows, one-time setup):
   ```powershell
   # Fix Web Dockerfile (DONE)
   # Build all 3 images locally
   .\scripts\build-docker-images.ps1
   
   # Push to Docker Hub
   docker login
   docker push luahoa/v-edfinance-nginx:staging
   docker push luahoa/v-edfinance-web:staging
   docker push luahoa/v-edfinance-api:staging
   ```
   **Time**: 15-20 minutes (first build), 5-10 min (incremental)

2. **Dokploy Configuration**:
   - Create project: `v-edfinance-staging`
   - Add 4 services:
     - `postgres` (image: `postgres:16-alpine`)
     - `api` (image: `luahoa/v-edfinance-api:staging`)
     - `web` (image: `luahoa/v-edfinance-web:staging`)
     - `nginx` (image: `luahoa/v-edfinance-nginx:staging`)
   - Set environment variables via Dokploy UI
   - Deploy

3. **Continuous Deployment**:
   ```powershell
   # Make code changes locally
   # Rebuild changed service
   docker build -t luahoa/v-edfinance-web:staging -f apps/web/Dockerfile .
   docker push luahoa/v-edfinance-web:staging
   
   # Redeploy in Dokploy (click "Redeploy" button)
   ```

### Pros ✅
- **Fast deployment**: VPS only pulls pre-built images (2-3 min)
- **Reliable**: No build failures on VPS (limited resources)
- **Version control**: Tag images (`v1.0.0`, `staging`, `latest`)
- **Rollback**: Pull previous image version instantly
- **CI/CD ready**: GitHub Actions can automate builds
- **Dokploy native**: Works seamlessly with Dokploy UI

### Cons ❌
- **Initial setup**: Requires local Docker build (15-20 min first time)
- **Docker Hub dependency**: Need public repos or paid account
- **Local resources**: Requires decent Windows machine (8GB+ RAM)
- **Manual push**: Need to run `docker push` after local changes (can automate later)

### Cost
- **Free tier**: Docker Hub allows unlimited public repos
- **Bandwidth**: ~500MB per deployment (acceptable)

### Effort
- **Setup**: 30 minutes (create scripts, test builds, push images)
- **Per deployment**: 5 minutes (build + push + Dokploy redeploy)

---

## Plan B: Git-based Deployment via Dokploy

### Architecture
```
GitHub Repository → Dokploy clones repo → Builds on VPS → Deploy
```

### Workflow
1. **Push code to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy to staging"
   git push origin spike/simplified-nav
   ```

2. **Dokploy Configuration**:
   - Connect GitHub repository
   - Set build context: `/`
   - Set Dockerfile paths:
     - `apps/web/Dockerfile`
     - `apps/api/Dockerfile`
     - `docker/nginx/Dockerfile`
   - Configure build args and env vars
   - Trigger build

3. **Deployment**:
   - Dokploy clones repo on VPS
   - Builds Docker images on VPS (10-15 min)
   - Starts containers

### Pros ✅
- **Simple workflow**: Git push → auto-deploy
- **No local Docker**: Don't need Docker on Windows
- **Git history**: Deployment tied to commits
- **Dokploy native**: UI handles everything

### Cons ❌
- **VPS resource intensive**: Building 3 images on VPS (2 vCPU, 2GB RAM) = slow
- **Long deployment**: 10-15 min per deploy (vs 2-3 min with pre-built)
- **Build failures**: VPS might OOM during build
- **GitHub dependency**: Requires public repo or GitHub webhook setup
- **No build cache**: Each deploy rebuilds from scratch (no Docker layer cache)

### Cost
- **Free**: GitHub public repo
- **VPS resources**: May need upgrade (4GB RAM recommended for builds)

### Effort
- **Setup**: 15 minutes (configure Dokploy GitHub integration)
- **Per deployment**: 15-20 minutes (wait for VPS build)

---

## Plan C: Hybrid - GitHub Actions Build + Docker Hub Push

### Architecture
```
GitHub Push → GitHub Actions CI → Build images → Push to Docker Hub → Dokploy pulls
```

### Workflow
1. **Setup GitHub Actions** (`.github/workflows/docker-build.yml`):
   ```yaml
   name: Build & Push Docker Images
   on:
     push:
       branches: [main, spike/simplified-nav]
   
   jobs:
     build-web:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: docker/login-action@v3
           with:
             username: ${{ secrets.DOCKERHUB_USERNAME }}
             password: ${{ secrets.DOCKERHUB_TOKEN }}
         - run: docker build -t luahoa/v-edfinance-web:${{ github.sha }} -f apps/web/Dockerfile .
         - run: docker push luahoa/v-edfinance-web:${{ github.sha }}
         - run: docker tag luahoa/v-edfinance-web:${{ github.sha }} luahoa/v-edfinance-web:staging
         - run: docker push luahoa/v-edfinance-web:staging
     
     build-api:
       # Similar for API
     
     build-nginx:
       # Similar for nginx
   ```

2. **Development Workflow**:
   ```bash
   # Make changes
   git add .
   git commit -m "feat: new feature"
   git push
   
   # GitHub Actions builds images (5-7 min)
   # Check Actions tab for build status
   ```

3. **Dokploy Deployment**:
   - Webhook or manual "Redeploy" in Dokploy
   - Pulls latest `staging` tag from Docker Hub
   - Starts containers (2-3 min)

### Pros ✅
- **Fully automated**: Git push → CI build → Deploy
- **Fast for developers**: No local Docker build needed
- **Free CI**: GitHub Actions free tier (2000 min/month)
- **Offloads VPS**: Builds happen on GitHub runners (8GB RAM, 2 vCPU)
- **Build cache**: GitHub Actions caches Docker layers
- **Professional workflow**: Industry-standard CI/CD

### Cons ❌
- **Setup complexity**: Need to configure GitHub Actions, secrets, workflows
- **GitHub Actions minutes**: Large builds consume free tier quota
- **Delay**: 5-7 min CI build before deployment
- **Debugging**: Harder to debug CI failures vs local builds

### Cost
- **Free tier**: 2000 min/month GitHub Actions (sufficient for ~200 deploys)
- **Docker Hub**: Free public repos

### Effort
- **Setup**: 1 hour (create workflows, test, configure secrets)
- **Per deployment**: 0 minutes (automated) + 8-10 min wait (CI + deploy)

---

## Comparison Matrix

| Criteria | Plan A (Docker Hub) | Plan B (Git + VPS) | Plan C (GitHub Actions) |
|----------|---------------------|--------------------|-----------------------|
| **Setup Time** | 30 min | 15 min | 60 min |
| **Deploy Time** | 5 min | 15-20 min | 8-10 min (auto) |
| **Local Docker Required** | ✅ Yes | ❌ No | ❌ No |
| **VPS Resource Usage** | Low (pull only) | High (builds) | Low (pull only) |
| **Automation** | Manual | Semi-auto | Fully auto |
| **Reliability** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ (OOM risk) | ⭐⭐⭐⭐ |
| **Cost** | Free | Free (may need VPS upgrade) | Free (GitHub tier) |
| **Debugging** | Easy (local) | Hard (VPS logs) | Medium (CI logs) |
| **Rollback** | Instant (image tags) | Git revert + rebuild | Instant (image tags) |
| **CI/CD Ready** | ⭐⭐⭐ (manual push) | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Best For** | Small teams, quick iteration | Simple apps, low build complexity | Production, teams, automation |

---

## Recommendation by Scenario

### Choose Plan A if:
- ✅ You have Docker installed on Windows
- ✅ You want fast iteration (5 min deploys)
- ✅ You're OK with manual `docker push` step
- ✅ Current epic needs quick testing/validation
- ✅ Team size: 1-2 developers

**Use Case**: **ved-et78 completion** (need to ship fast, validate deployment works)

---

### Choose Plan B if:
- ✅ VPS has 4GB+ RAM
- ✅ You don't have Docker locally
- ✅ You're OK with 15-20 min deploys
- ✅ Simple app with small build context
- ❌ **NOT RECOMMENDED** for V-EdFinance (1.14GB context, 3 services)

**Use Case**: Small single-service apps, prototypes

---

### Choose Plan C if:
- ✅ You want professional CI/CD pipeline
- ✅ You're OK with 1-hour setup investment
- ✅ Multiple developers on team
- ✅ Need automated deployments
- ✅ Long-term production deployment

**Use Case**: **After ved-et78** (migrate to CI/CD for production-grade workflow)

---

## Migration Path (Recommended)

### Phase 1: Ship Epic ved-et78 (This Week)
**Use Plan A** - Fast iteration, manual builds
- Build images locally
- Push to Docker Hub
- Deploy via Dokploy
- **Goal**: Complete epic, validate deployment

### Phase 2: Post-Epic Optimization (Next Sprint)
**Migrate to Plan C** - Automate with GitHub Actions
- Create `.github/workflows/docker-build.yml`
- Configure secrets
- Test CI pipeline
- **Goal**: Production-ready CI/CD

---

## Decision Support

### Quick Decision Tree
```
Do you have Docker on Windows?
├─ YES → Plan A (fast, simple)
└─ NO → Do you want to invest 1 hour in CI/CD setup?
         ├─ YES → Plan C (automated, professional)
         └─ NO → Plan B (slow, but works)
```

### For ved-et78 Epic Completion
**Recommended: Plan A**
- ✅ Fastest path to deployment (30 min setup + 5 min per deploy)
- ✅ You already have Dockerfiles fixed
- ✅ Build scripts created
- ✅ No VPS resource constraints
- ✅ Can migrate to Plan C later (images already on Docker Hub)

---

## Next Steps (After Decision)

### If Plan A Selected:
1. Run `.\scripts\build-docker-images.ps1` (15-20 min)
2. Push images to Docker Hub (5 min)
3. Configure Dokploy services (10 min)
4. Deploy and verify (5 min)
**Total**: ~45 minutes to deployment

### If Plan B Selected:
1. Push code to GitHub
2. Configure Dokploy Git integration
3. Trigger build (wait 15-20 min)
4. Verify deployment
**Total**: ~30 minutes to deployment (but fragile)

### If Plan C Selected:
1. Create GitHub Actions workflow (30 min)
2. Configure secrets (10 min)
3. Test CI build (10 min)
4. Configure Dokploy webhook (10 min)
5. Push and auto-deploy
**Total**: ~60 minutes to first deployment

---

**Current Status**: VPS cleaned, Dockerfiles fixed, ready to execute selected plan.
