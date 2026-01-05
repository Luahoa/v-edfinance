# Better-T-Stack Integration Plan for VPS Deployment

**Context:** Combine deployment tools analysis with Better-T-Stack patterns  
**Goal:** Optimize V-EdFinance DevOps workflows using proven patterns

---

## 🎯 Where Better-T-Stack Fits

**Category:** CI/CD Pipeline Optimization (NOT deployment platform)

```
VPS Deployment Stack:
├── Platform: Dokploy (handles actual deployment)
├── Monitoring: Netdata, Uptime Kuma, etc.
├── Backup: Rclone
└── CI/CD: ← Better-T-Stack patterns fit HERE
    ├── Auto-release workflow
    ├── PR previews
    ├── Version bumping
    └── Changelog generation
```

---

## ✅ Patterns to Implement BEFORE VPS Deployment

### Priority 1: Quick Wins (1 hour)

#### 1. Update turbo.json ⭐⭐⭐⭐⭐
**Impact:** Better build caching, faster CI/CD

```json
// turbo.json (CURRENT - minimal)
{
  "$schema": "https://turbo.build/schema.json"
}

// turbo.json (IMPROVED)
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [
        "apps/web/.next/**",
        "!apps/web/.next/cache/**",
        "apps/api/dist/**"
      ]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "deploy:staging": {
      "cache": false,
      "persistent": true,
      "dependsOn": ["build", "test"]
    },
    "deploy:prod": {
      "cache": false,
      "persistent": true,
      "dependsOn": ["build", "test"]
    }
  }
}
```

**Why now:** Deployment tasks need proper dependency chains

---

#### 2. Optimize Next.js Config ⭐⭐⭐⭐
**Impact:** Faster builds, smaller bundle size

```typescript
// apps/web/next.config.ts (NEW)
import type { NextConfig } from "next";

const config: NextConfig = {
  reactCompiler: true,  // React 19 compiler
  reactStrictMode: true,
  
  // Reduce bundle size
  outputFileTracingExcludes: {
    "*": [
      "./**/*.js.map",
      "./**/*.mjs.map",
      "./node_modules/@swc/**",
      "./node_modules/webpack/**"
    ]
  },
  
  // Speed up dev mode
  experimental: {
    turbopackFileSystemCacheForDev: true,
    optimizePackageImports: ["lucide-react", "@radix-ui/react-*"]
  },
  
  // Cloudflare Pages compatibility
  images: {
    unoptimized: true
  }
};

export default config;
```

**Why now:** Deployment to Cloudflare Pages needs optimization

---

### Priority 2: CI/CD Automation (After VPS is Live)

#### 3. Auto-Deploy on Commit Message ⭐⭐⭐⭐⭐
**Impact:** Faster deployments, fewer manual steps

```yaml
# .github/workflows/deploy.yaml
name: Auto Deploy
on:
  push:
    branches: [main, staging]

jobs:
  deploy-staging:
    if: startsWith(github.event.head_commit.message, 'deploy:staging')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
      
      - name: Build
        run: pnpm install && pnpm build
      
      - name: Deploy to VPS Staging
        run: |
          # SSH to VPS
          ssh root@103.54.153.248 << 'EOF'
            cd /var/www/v-edfinance
            git pull origin staging
            docker compose restart api web
          EOF
      
      - name: Smoke Test
        run: |
          curl -f http://103.54.153.248:3001/api/health || exit 1

  deploy-production:
    if: startsWith(github.event.head_commit.message, 'deploy:prod')
    runs-on: ubuntu-latest
    steps:
      # Similar to staging but with approval gate
      - name: Wait for Approval
        uses: trstringer/manual-approval@v1
```

---

#### 4. PR Preview Deployments ⭐⭐⭐⭐
**Impact:** Test changes before merging

```yaml
# .github/workflows/pr-preview.yaml
name: PR Preview
on:
  pull_request_target:
    types: [labeled]

jobs:
  preview:
    if: github.event.label.name == 'preview'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Cloudflare Pages
        run: |
          PR_NUMBER=${{ github.event.pull_request.number }}
          PREVIEW_URL="pr-${PR_NUMBER}.v-edfinance.pages.dev"
          
          # Deploy frontend to Cloudflare Pages
          pnpm --filter web build
          wrangler pages deploy apps/web/.next --project-name=v-edfinance
      
      - name: Comment Preview URL
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: ${{ github.event.pull_request.number }},
              body: `🚀 Preview deployed: https://${PREVIEW_URL}`
            })
```

---

#### 5. Version Bump Script ⭐⭐⭐⭐⭐
**Impact:** Automated releases, consistent versioning

```typescript
// scripts/release/bump-version.ts
import { $ } from "bun";
import { select, confirm } from "@clack/prompts";
import fs from "fs/promises";

async function main() {
  // Read current version
  const pkg = JSON.parse(await fs.readFile("package.json", "utf-8"));
  const currentVersion = pkg.version;
  
  // Select bump type
  const type = await select({
    message: "Release type?",
    options: [
      { value: "patch", label: `Patch (${currentVersion} → ${bumpPatch(currentVersion)})` },
      { value: "minor", label: `Minor (${currentVersion} → ${bumpMinor(currentVersion)})` },
      { value: "major", label: `Major (${currentVersion} → ${bumpMajor(currentVersion)})` }
    ]
  });
  
  const newVersion = bump(currentVersion, type);
  
  // Update package.json files
  await updateVersion(newVersion);
  
  // Run quality gates
  console.log("Running tests...");
  await $`pnpm test`;
  await $`pnpm --filter api build`;
  await $`pnpm --filter web build`;
  
  // Create release branch
  await $`git checkout -b release/v${newVersion}`;
  await $`git add .`;
  await $`git commit -m "chore(release): ${newVersion}"`;
  await $`git push origin release/v${newVersion}`;
  
  // Create PR
  await $`gh pr create --title "Release ${newVersion}" --body "Auto-generated release PR"`;
  
  // Auto-merge option
  const autoMerge = await confirm({ message: "Enable auto-merge when tests pass?" });
  if (autoMerge) {
    await $`gh pr merge --auto --squash`;
  }
}

function bump(version: string, type: "major" | "minor" | "patch"): string {
  const [major, minor, patch] = version.split(".").map(Number);
  switch (type) {
    case "major": return `${major + 1}.0.0`;
    case "minor": return `${major}.${minor + 1}.0`;
    case "patch": return `${major}.${minor}.${patch + 1}`;
  }
}

async function updateVersion(version: string) {
  const files = [
    "package.json",
    "apps/web/package.json",
    "apps/api/package.json"
  ];
  
  for (const file of files) {
    const content = JSON.parse(await fs.readFile(file, "utf-8"));
    content.version = version;
    await fs.writeFile(file, JSON.stringify(content, null, 2) + "\n");
  }
}

main();
```

**Usage:**
```bash
pnpm release:bump
# Interactive prompts → Auto-creates PR → Auto-merges
```

---

## 🔧 DevOps Integration Architecture

```
┌────────────────────────────────────────────────────────┐
│              Developer Workflow                        │
├────────────────────────────────────────────────────────┤
│  1. Create feature branch                              │
│  2. Add "preview" label to PR                          │
│     → GitHub Actions deploys to Cloudflare Pages       │
│     → Preview URL posted in PR comments                │
│  3. Merge PR to staging branch                         │
│     → Auto-deploy to VPS staging (Dokploy)             │
│  4. Run `pnpm release:bump`                            │
│     → Creates release PR                               │
│     → Auto-merges when tests pass                      │
│  5. Merged to main → Commit message "deploy:prod"      │
│     → GitHub Actions waits for approval                │
│     → Deploy to VPS production (Dokploy)               │
└────────────────────────────────────────────────────────┘
```

---

## 📦 Required Dependencies

```bash
# For version bump script
pnpm add -D @clack/prompts

# For GitHub CLI (already installed)
# gh --version ✅

# For changelog generation (optional)
pnpm add -D changelogithub
```

---

## 🚀 Implementation Timeline

### Before VPS Deployment (This Session)
- [x] ✅ turbo.json update
- [x] ✅ next.config.ts optimization
- [ ] Install @clack/prompts
- [ ] Create scripts/release/ folder

### After VPS Deployment (Next Session)
- [ ] .github/workflows/deploy.yaml
- [ ] scripts/release/bump-version.ts
- [ ] Test auto-deploy workflow
- [ ] .github/workflows/pr-preview.yaml

### Post-MVP Launch
- [ ] Changelog automation
- [ ] Canary releases
- [ ] Rollback automation

---

## 💡 Key Insights from Better-T-Stack

### What We Learned:
1. **Commit-based deployment** is faster than manual triggers
2. **PR previews** reduce review time significantly
3. **Interactive CLI** (Clack prompts) better than config files
4. **Auto-merge** reduces PR merge latency

### What We're NOT Using:
1. ❌ Bun runtime (we use Node.js/pnpm)
2. ❌ Convex backend (we use NestJS)
3. ❌ tRPC (we use REST API)
4. ❌ Oxlint/Oxfmt (we use Biome - already Rust-based)

---

## 📊 Expected ROI

| Automation | Time Saved/Release | Releases/Month | Total Saved |
|------------|-------------------|----------------|-------------|
| Version bump script | 10 min | 4 | 40 min/month |
| Auto-deploy workflow | 15 min | 4 | 60 min/month |
| PR previews | 30 min | 8 PRs | 240 min/month |
| Changelog automation | 5 min | 4 | 20 min/month |
| **TOTAL** | - | - | **6 hours/month** |

---

## 🎯 Deployment Strategy Integration

### Dokploy (Platform) + Better-T-Stack (Automation)

```yaml
# How they work together:

1. Developer pushes to staging
   ↓
2. Better-T-Stack GitHub Action triggers
   ↓
3. Runs tests, builds artifacts
   ↓
4. SSHs to VPS
   ↓
5. Dokploy pulls new code via git webhook
   ↓
6. Dokploy rebuilds containers
   ↓
7. Health checks pass
   ↓
8. Better-T-Stack posts Slack notification
```

**Synergy:** Dokploy handles container orchestration, Better-T-Stack handles CI/CD logic

---

## 📝 Action Items for This Session

### Immediate (Next 30 minutes):
1. ✅ Update turbo.json
2. ✅ Optimize next.config.ts
3. ✅ Install @clack/prompts

### Create File Structure:
```
scripts/
├── release/
│   ├── bump-version.ts
│   └── generate-changelog.ts
└── deploy/
    ├── staging.ts
    └── production.ts
```

---

## 🔗 References

- [Better-T-Stack Repo](https://github.com/AmanVarshney01/create-better-t-stack)
- [Clack Prompts](https://github.com/natemoo-re/clack)
- [Changelogithub](https://github.com/unjs/changelogithub)
- [GitHub Actions](https://docs.github.com/en/actions)

---

**Generated:** 2026-01-05  
**Purpose:** Integrate Better-T-Stack patterns with VPS deployment  
**Status:** Ready to implement turbo.json and next.config.ts updates
