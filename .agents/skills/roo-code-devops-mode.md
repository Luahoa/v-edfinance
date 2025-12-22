# Roo-Code DevOps Pro Mode

## Mục Đích
Tạo "DevOps Agent" chuyên biệt với context hạ tầng V-EdFinance được pre-loaded. AI không cần hỏi lại về infrastructure stack, cloud providers, hay deployment workflow.

## Pre-loaded Infrastructure Context

### Cloud Stack
```yaml
Platform: Hybrid Multi-Cloud
- Frontend: Cloudflare Pages (Global CDN)
- Backend: VPS Dokploy (103.54.153.248)
- Database: PostgreSQL 17 + pgvector
- Storage: Cloudflare R2 (S3-compatible)
- Monitoring: Grafana + Prometheus
- Backup: Automated R2 sync
```

### Deployment Topology
```
┌─────────────────────────────────────┐
│ Cloudflare Edge (Global)           │
│ - Pages (Frontend)                  │
│ - R2 (Object Storage)               │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ VPS Dokploy (103.54.153.248)        │
│ - API: :3001                        │
│ - Web Staging: :3002                │
│ - Dashboard: :3000                  │
│ - PostgreSQL: :5432                 │
│ - Grafana: :3001 (monitoring)       │
│ - Prometheus: :9090                 │
└─────────────────────────────────────┘
```

### Tech Stack Memorization
```typescript
// AI "thuộc lòng" stack này:
const V_EDFINANCE_STACK = {
  monorepo: "Turborepo",
  frontend: {
    framework: "Next.js 15.1.2",
    react: "18.3.1",
    i18n: "next-intl (vi/en/zh)",
    deployment: "Cloudflare Pages"
  },
  backend: {
    framework: "NestJS",
    orm: ["Prisma", "Drizzle", "Kysely"], // Triple-ORM hybrid
    database: "PostgreSQL 17 + pgvector",
    deployment: "Dokploy VPS"
  },
  devops: {
    containers: "Docker + docker-compose",
    orchestration: "Dokploy (lightweight K8s alternative)",
    monitoring: "Grafana + Prometheus",
    ci_cd: "GitHub Actions",
    backup: "Cloudflare R2 (rclone)"
  },
  testing: {
    unit: "Vitest",
    integration: "AVA",
    e2e: "Playwright",
    stress: "E2B + Vegeta"
  }
};
```

## Custom Mode Behaviors

### 1. Infrastructure Questions → Auto-Answered
```typescript
// ❌ AI sẽ KHÔNG BAO GIỜ hỏi:
"What cloud provider are you using?"
"Do you have monitoring setup?"
"Which ORM do you prefer?"

// ✅ AI TỰ ĐỘNG BIẾT:
"Deploying to Dokploy VPS at 103.54.153.248:3001"
"Using Grafana dashboard at :3001 for monitoring"
"Triple-ORM: Prisma migrations, Drizzle CRUD, Kysely analytics"
```

### 2. Smart Deployment Routing
```bash
# AI tự động phân biệt deployment targets:

# Frontend changes → Cloudflare Pages
git push origin main  # Auto-deploy via GitHub Actions

# Backend changes → Dokploy VPS
./scripts/deploy-api-vps.sh

# Database schema → Prisma migration
npx prisma migrate deploy

# Config changes → Both environments
./scripts/sync-config-all.sh
```

### 3. Context-Aware Debugging
```typescript
// Khi có lỗi deployment, AI tự động biết check:
const DEBUG_CHECKLIST = [
  "VPS health: http://103.54.153.248:3001/health",
  "Dokploy logs: ssh root@103.54.153.248 'docker logs api'",
  "Database connection: psql -h 103.54.153.248 -U postgres",
  "Grafana metrics: http://103.54.153.248:3001",
  "R2 backup status: rclone ls r2:v-edfinance-backup"
];
```

### 4. Pre-configured Commands
```bash
# AI biết các shortcuts này không cần hỏi:

# Start dev environment
START_DEV.bat

# Run full test suite
pnpm test

# Deploy to VPS staging
./scripts/deploy-staging-vps.sh

# Backup to R2
R2_SYNC.bat

# View monitoring
VIEW_MONITORING_STATUS.bat

# Fix P0 blockers
FIX_P0_BLOCKERS.bat
```

## Integration với AGENTS.md

DevOps Mode tự động load context từ:
```markdown
# Files AI đã "thuộc lòng":
- AGENTS.md (Project overview)
- DEVOPS_GUIDE.md (Deployment procedures)
- VPS_MANUAL_COMMANDS.md (Server management)
- docker-compose.yml (Service topology)
- dokploy.yaml (Deployment config)
```

## Workflow Automation

### Scenario 1: Deploy API Changes
```typescript
// User request:
"Deploy latest API changes to staging"

// AI auto-executes (NO questions asked):
async function deployApiStaging() {
  await runCommand("pnpm --filter api build");
  await runCommand("pnpm test"); // Quality gate
  await sshCommand("103.54.153.248", "docker-compose restart api");
  await verifyHealth("http://103.54.153.248:3001/health");
  await notifySlack("✅ API deployed to staging");
}
```

### Scenario 2: Database Migration
```typescript
// User request:
"Apply new Prisma migration to VPS"

// AI auto-executes:
async function migrateVpsDb() {
  await backupDatabase("103.54.153.248:5432", "r2:v-edfinance-backup");
  await runCommand("npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma");
  await validateSchema("103.54.153.248:5432");
  await regenerateDrizzle(); // Sync Triple-ORM
  await runIntegrationTests();
}
```

### Scenario 3: Monitoring Alert Response
```typescript
// User: "API latency spiked"
// AI checks Grafana FIRST (no questions):
async function investigateLatency() {
  const metrics = await fetchGrafana("http://103.54.153.248:3001/api/query");
  const slowQueries = await checkPgStatStatements();
  const containerStats = await dockerStats("103.54.153.248");
  
  // Auto-diagnosis based on pre-loaded patterns
  return diagnoseAndRecommend(metrics, slowQueries, containerStats);
}
```

## Anti-Hallucination Guardrails

```typescript
// DevOps Mode luôn verify commands trước khi execute:
const SAFE_COMMANDS = {
  read_only: ["docker ps", "git status", "pnpm list"],
  reversible: ["git checkout", "docker restart"],
  requires_backup: ["prisma migrate", "docker-compose down"],
  requires_approval: ["rm -rf", "dropdb", "docker system prune"]
};
```

## Activation

```bash
# Roo-Code extension settings:
{
  "roo-code.customModes": [
    {
      "name": "DevOps-Pro",
      "contextFiles": [
        ".agents/skills/roo-code-devops-mode.md",
        "AGENTS.md",
        "DEVOPS_GUIDE.md",
        "docker-compose.yml",
        "dokploy.yaml"
      ],
      "systemPrompt": "You are DevOps Pro, an expert in V-EdFinance infrastructure. You have complete knowledge of the deployment stack and never ask basic questions about infrastructure. Always verify health endpoints after deployments."
    }
  ]
}
```

## Sync với Beads Protocol

```bash
# Khi DevOps Mode thực hiện tasks:
bd create "VPS deployment of AI service" --type task --priority 1
bd update ved-xxx --status in_progress

# AI tự động:
# 1. Execute deployment workflow
# 2. Run health checks
# 3. Update monitoring dashboards
# 4. Close beads task with deployment logs

bd close ved-xxx --reason "Deployed to VPS staging. Health: ✅ Metrics: ✅"
bd sync  # Metadata to git
```

## Success Metrics

DevOps Mode reduces deployment friction:
- **Zero redundant questions** - AI pre-loaded với context
- **Faster incident response** - Auto-check Grafana/logs
- **Consistent procedures** - Follow DEVOPS_GUIDE.md
- **Safe automation** - Guardrails prevent destructive commands

---

**📌 Custom Mode Context**: AI assistant hoạt động như senior DevOps engineer đã làm việc 6 tháng trên V-EdFinance, biết rõ mọi infrastructure detail.
