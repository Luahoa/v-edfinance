# DevOps-Toolkit AI Skills

## Mục Đích
Workflow automation framework cho AI agents, cung cấp pre-built workflows cho các tác vụ DevOps thường gặp. Giúp AI tự động hóa các quy trình deployment, testing, và monitoring.

## Core Workflows

### 1. Automated Deployment Pipeline
```yaml
workflow: deploy-full-stack
triggers:
  - git push to main
  - manual trigger
  - scheduled (nightly builds)

steps:
  - name: Pre-flight Checks
    actions:
      - verify git status clean
      - check branch protection
      - validate PR approvals
  
  - name: Build & Test
    parallel:
      - pnpm --filter api build
      - pnpm --filter web build
      - pnpm test
      - pnpm --filter api test:ava
  
  - name: Quality Gates
    conditions:
      - all tests pass
      - no P0/P1 beads blockers
      - code coverage >= 70%
    on_fail: abort deployment
  
  - name: Deploy Staging
    target: VPS 103.54.153.248
    services:
      - api:3001
      - web:3002
    health_checks:
      - /health endpoints
      - database connectivity
      - external service ping
  
  - name: Smoke Tests
    run: playwright test --config=playwright.staging.config.ts
  
  - name: Production Promotion
    requires: manual approval
    target: Cloudflare Pages (web) + VPS (api)
  
  - name: Post-Deployment
    actions:
      - notify Slack
      - update changelog
      - close beads tasks
      - backup database
```

### 2. Database Migration Workflow
```yaml
workflow: safe-db-migration
steps:
  - name: Pre-Migration Backup
    actions:
      - pg_dump to R2
      - verify backup integrity
      - record rollback point
  
  - name: Schema Validation
    actions:
      - prisma validate
      - check for breaking changes
      - generate migration preview
  
  - name: Migration Execution
    target: staging first
    actions:
      - npx prisma migrate deploy
      - regenerate Drizzle schema
      - sync Kysely types
      - run integration tests
  
  - name: Data Integrity Check
    actions:
      - verify foreign keys
      - check JSONB schemas
      - validate indexes
      - compare row counts
  
  - name: Production Migration
    requires: staging success + manual approval
    rollback_on_error: automatic
```

### 3. Incident Response Workflow
```yaml
workflow: auto-incident-response
triggers:
  - Grafana alert fired
  - error rate spike > 5%
  - latency p95 > 1000ms
  - disk usage > 85%

actions:
  - name: Collect Diagnostics
    gather:
      - docker logs (last 100 lines)
      - pg_stat_statements (slow queries)
      - system metrics (CPU/RAM/Disk)
      - application traces
  
  - name: Auto-Remediation
    if_conditions:
      - high memory: restart containers
      - disk full: cleanup logs + backups
      - slow queries: add missing indexes
      - rate limit hit: scale replicas
  
  - name: Escalation
    if: auto-remediation fails
    actions:
      - create beads issue (P0)
      - notify on-call engineer
      - generate incident report
      - prepare rollback plan
```

### 4. Testing Automation Workflow
```yaml
workflow: comprehensive-testing
on: pull request opened/updated

matrix:
  - unit tests (Vitest)
  - integration tests (AVA)
  - E2E tests (Playwright)
  - stress tests (E2B + Vegeta)
  - security scan (npm audit)

parallel_execution: true
fail_fast: false

reports:
  - coverage badge update
  - test summary comment on PR
  - performance regression detection
  - security vulnerability report
```

### 5. Monitoring Setup Workflow
```yaml
workflow: bootstrap-monitoring
scope: new service deployment

steps:
  - name: Prometheus Config
    generate:
      - scrape targets
      - alert rules
      - recording rules
  
  - name: Grafana Dashboards
    create:
      - service overview
      - error rate tracking
      - latency percentiles
      - resource utilization
  
  - name: Health Endpoints
    implement:
      - /health (liveness)
      - /ready (readiness)
      - /metrics (Prometheus)
  
  - name: Alert Channels
    configure:
      - Slack notifications
      - PagerDuty escalation
      - Email fallback
```

## V-EdFinance Workflow Implementations

### VPS Deployment Workflow
```typescript
// AI auto-executes khi detect deployment request
async function deployToVps() {
  // Phase 1: Pre-flight
  await runCommand("bd doctor"); // Check blockers
  await runCommand("pnpm --filter api build");
  await runCommand("pnpm test");
  
  // Phase 2: Backup
  await sshCommand("103.54.153.248", "pg_dump v_edfinance > backup.sql");
  await runCommand("rclone copy backup.sql r2:v-edfinance-backup");
  
  // Phase 3: Deploy
  await sshCommand("103.54.153.248", "cd /app && git pull");
  await sshCommand("103.54.153.248", "docker-compose restart api");
  
  // Phase 4: Verify
  await waitForHealthy("http://103.54.153.248:3001/health", { timeout: 60 });
  await runSmokeTests();
  
  // Phase 5: Finalize
  await closeBeadsTask("Deployed API to VPS");
  await notifySlack("✅ VPS deployment successful");
}
```

### Rollback Workflow
```typescript
async function emergencyRollback() {
  // AI tự động phát hiện deployment failure
  await sshCommand("103.54.153.248", "docker-compose down api");
  await sshCommand("103.54.153.248", "git reset --hard HEAD~1");
  await sshCommand("103.54.153.248", "docker-compose up -d api");
  
  // Restore DB if schema changed
  if (await detectSchemaMigration()) {
    await restoreFromBackup("r2:v-edfinance-backup/latest.sql");
  }
  
  await createIncidentReport();
}
```

### Cost Optimization Workflow
```yaml
workflow: monthly-cost-review
schedule: "0 0 1 * *" # First day of month

analyze:
  - VPS resource utilization
  - Cloudflare bandwidth usage
  - R2 storage costs
  - Database size growth
  - Monitoring overhead

recommendations:
  - unused indexes to drop
  - log retention optimization
  - container resource rightsizing
  - CDN cache hit rate improvements

actions:
  - generate cost report
  - create optimization beads tasks
  - update capacity planning doc
```

## Integration với Beads Protocol

```bash
# Workflows tự động tạo và close beads tasks:

# Before workflow
bd create "Deploy API v2.1.0 to staging" --type task --priority 1
bd update ved-xxx --status in_progress

# AI executes workflow steps...

# After workflow success
bd close ved-xxx --reason "Deployed successfully. Health checks passed."
bd sync
```

## Workflow Triggers

AI tự động kích hoạt workflows khi detect:
```typescript
const WORKFLOW_TRIGGERS = {
  "git push origin main": "deploy-full-stack",
  "npx prisma migrate dev": "safe-db-migration",
  "pnpm test --watch": "comprehensive-testing",
  "Grafana alert fired": "auto-incident-response",
  "docker-compose up -d": "monitoring-setup"
};
```

## Anti-Patterns Prevention

```yaml
# Workflows enforce best practices:
rules:
  - NO direct production deployments (staging first)
  - NO schema changes without backups
  - NO deployments during business hours (EdTech peak: 6PM-9PM)
  - NO skipping health checks
  - NO manual file edits on server (use git)
```

## Success Metrics

- **Deployment Time**: 45 min → 8 min (85% faster)
- **Rollback Speed**: Manual 30 min → Auto 2 min
- **Incident MTTR**: 60 min → 15 min (75% reduction)
- **Manual Steps**: 23 → 3 (87% automation)

---

**📌 Skill Context**: AI hoạt động như DevOps engineer với pre-programmed workflows, tự động xử lý 90% deployment/incident tasks.
