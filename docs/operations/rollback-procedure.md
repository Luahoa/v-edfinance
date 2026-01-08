# Rollback Procedure

**Last Updated:** 2026-01-04  
**Owner:** DevOps Team  
**Epic:** VED-DEPLOY

## Overview

This document describes the automated rollback procedures for V-EdFinance deployments across all environments (Development, Staging, Production).

## Quick Start

### Automated Rollback (GitHub Actions)

1. Go to [GitHub Actions - Rollback Deployment](../../.github/workflows/rollback.yml)
2. Click "Run workflow"
3. Select:
   - **Environment:** development | staging | production
   - **Force:** true (to rollback even if healthy)
   - **Reason:** Describe why (required for production)
4. Click "Run workflow"

### Manual Rollback (Command Line)

```bash
# Development
DOKPLOY_API_TOKEN=xxx ./scripts/deploy/auto-rollback.sh development

# Staging
DOKPLOY_API_TOKEN=xxx ./scripts/deploy/auto-rollback.sh staging

# Production (requires confirmation)
DOKPLOY_API_TOKEN=xxx ./scripts/deploy/auto-rollback.sh production

# Force rollback even if healthy
DOKPLOY_API_TOKEN=xxx FORCE_ROLLBACK=true ./scripts/deploy/auto-rollback.sh staging
```

## When to Rollback

### Immediate Rollback Triggers

- ❌ API health check failing (5xx errors)
- ❌ Web application not loading (500/502/503)
- ❌ Database connection errors
- ❌ Critical functionality broken
- ❌ Data corruption detected
- ❌ Security vulnerability discovered

### Evaluation Required

- ⚠️ Performance degradation (>30% slower)
- ⚠️ Increased error rate (<5% but noticeable)
- ⚠️ User reports of issues
- ⚠️ Dependency failures

## Rollback Process

### 1. Pre-Rollback Assessment

```bash
# Check current health
curl https://api-staging.v-edfinance.com/api/health
curl -I https://staging.v-edfinance.com

# Check error logs (if accessible)
docker logs api-staging --tail 100
```

### 2. Execute Rollback

The rollback script automatically:
1. ✅ Verifies current deployment health
2. ✅ Fetches previous successful deployment
3. ✅ Triggers Dokploy rollback to previous commit
4. ✅ Waits for deployment to complete
5. ✅ Verifies post-rollback health
6. ✅ Generates rollback report

### 3. Post-Rollback Verification

**Automatic Checks:**
- API health endpoint responding (200 OK)
- Web homepage loading (200 OK)
- All replicas healthy (production only)

**Manual Checks:**
- [ ] Critical user flows working (login, signup, course enrollment)
- [ ] Database queries executing normally
- [ ] No error spikes in monitoring
- [ ] User reports resolved

### 4. Incident Response

**After successful rollback:**
1. Create post-mortem issue in GitHub
2. Update deployment status dashboard
3. Notify stakeholders via Slack
4. Schedule root cause analysis

**If rollback fails:**
1. Automatic GitHub issue created
2. Critical Slack notification sent
3. Escalate to on-call engineer
4. Consider manual intervention

## Environment-Specific Notes

### Development

- **Auto-approve:** Yes
- **Notification:** Slack (optional)
- **Retention:** 7 days of deployment history

### Staging

- **Auto-approve:** Yes
- **Notification:** Slack (team channel)
- **Retention:** 14 days of deployment history

### Production

- **Auto-approve:** NO - Requires manual approval
- **Notification:** Slack (<!channel> alert)
- **Retention:** 30 days of deployment history
- **Reason required:** Must document why rollback is needed
- **Zero-downtime:** Rolling update to previous version

## Troubleshooting

### Rollback script fails to find previous deployment

```bash
# Manually check deployment history
curl -X GET https://dokploy.v-edfinance.com/api/projects/v-edfinance/deployments \
  -H "Authorization: Bearer $DOKPLOY_API_TOKEN" | jq .
```

### Health checks still failing after rollback

1. Check if previous version also had issues
2. May need to rollback further (manual intervention)
3. Consider emergency hotfix deployment

### Dokploy API not responding

1. Check VPS status: `ssh user@103.54.153.248`
2. Check Dokploy service: `docker ps | grep dokploy`
3. Manual deployment via Dokploy UI

## Rollback Report

After each rollback, a JSON report is generated:

```json
{
  "timestamp": "2026-01-04T10:30:00Z",
  "environment": "staging",
  "rollback": {
    "from": {
      "commit": "abc1234",
      "timestamp": "2026-01-04T10:00:00Z"
    },
    "to": {
      "commit": "def5678",
      "timestamp": "2026-01-04T09:00:00Z"
    },
    "deploymentId": "rollback-20260104-103000"
  },
  "health_checks": {
    "api": "healthy",
    "web": "healthy"
  },
  "status": "success"
}
```

## Emergency Contacts

- **DevOps Lead:** @luaho
- **On-Call Engineer:** Slack #on-call
- **VPS Access:** Via `~/.ssh/v-edfinance-vps.pem`

## Related Documentation

- [Deployment Workflows](../../.github/workflows/deploy-*.yml)
- [Health Check Endpoints](../api/health-checks.md)
- [Incident Response Runbook](../runbooks/incident-response.md)

---

**Last Rollback:** Check [GitHub Actions History](https://github.com/luaho/v-edfinance/actions/workflows/rollback.yml)
