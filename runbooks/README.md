# Incident Response Runbooks

**Purpose:** Step-by-step procedures for handling production incidents  
**Owner:** Track 4 - PurpleBear  
**Last Updated:** 2026-01-04

---

## 📚 Available Runbooks

### P0 - Critical (MTTR <10 minutes)
| Runbook | Scenario | Common Causes | Quick Actions |
|---------|----------|---------------|---------------|
| [**Service Down**](p0-service-down.md) | Complete outage | Container crashed, port conflict, disk full | Restart container, check logs, rollback |
| [**Database Failure**](p0-database-failure.md) | DB inaccessible | Container stopped, corruption, connection pool exhausted | Restart PostgreSQL, restore backup, kill blocking queries |
| [**Memory Leak**](p0-memory-leak.md) | OOM kill loop | Unclosed connections, event listeners, large cache | Restart, heap snapshot, increase limit temporarily |

### P1 - High (MTTR <30 minutes)
| Runbook | Scenario | Common Causes | Quick Actions |
|---------|----------|---------------|---------------|
| [**Login Failure**](p1-login-failure.md) | Users can't authenticate | JWT secret missing, Redis down, CORS issue | Check env vars, restart Redis, verify CORS |
| [**Payment Failure**](p1-payment-failure.md) | Payments not processing | Stripe API key invalid, webhook broken, DB rollback | Verify API keys, reconcile transactions, check webhooks |
| [**Slow Queries**](p1-slow-queries.md) | Database performance degraded | Missing index, N+1 queries, outdated statistics | Create index, analyze tables, optimize queries |

---

## 🚀 Quick Start Guide

### When an Incident Occurs

1. **Assess Severity** (Use table above)
   - P0 = Complete outage or data loss
   - P1 = Major feature broken or severe degradation
   - P2 = Minor issue with workaround

2. **Open Runbook**
   - Click the runbook link above
   - Follow steps sequentially
   - Don't skip verification steps

3. **Log Incident**
   ```bash
   cd /root/v-edfinance
   ./scripts/incident-tracker.sh log --severity P0 --title "Brief description"
   ```

4. **Execute Recovery**
   - Follow "Immediate Actions" section first (2-5 min)
   - Then proceed to "Diagnosis & Resolution"
   - Verify recovery before closing

5. **Post-Incident**
   - Update incident status
   - Create follow-up beads for root cause fixes
   - Schedule RCA meeting (P0/P1 only)

---

## 📋 Runbook Structure

Each runbook follows this template:

```markdown
# [Severity] Incident Runbook: [Title]

## 🚨 Detection
- How to detect the issue (alerts, symptoms)
- Quick diagnosis commands

## ⚡ Immediate Actions (First X Minutes)
- Step-by-step triage
- Quick fixes to restore service

## 🔧 Diagnosis & Resolution
- Common scenarios with fixes
- Detailed troubleshooting steps

## 🛡️ Recovery Procedures
- Rollback instructions
- Backup restore steps

## ✅ Recovery Verification
- Health check commands
- Success criteria

## 📝 Post-Incident Actions
- Documentation requirements
- Follow-up tasks
- RCA process

## 🚀 Escalation Paths
- When to escalate
- Who to contact
- Vendor support info
```

---

## 🔧 Essential Commands Reference

### Health Checks
```bash
# API Health
curl http://103.54.153.248:3001/health

# Database Status
docker exec <postgres_container> pg_isready -U postgres

# Redis Status
docker exec <redis_container> redis-cli ping

# Container Status
docker ps | grep vedfinance
```

### Log Analysis
```bash
# Recent errors (last 100 lines)
docker logs <container> --tail 100 | grep -i error

# Follow logs in real-time
docker logs <container> -f

# Errors in last hour
docker logs <container> --since 1h | grep -i "error\|fatal"
```

### Quick Recovery
```bash
# Restart service
docker restart <container>

# Rollback deployment (Dokploy)
# Access http://103.54.153.248:3000 → Deployments → Rollback

# Database backup
bash /root/v-edfinance/scripts/database/vps-backup.sh

# Database restore
bash /root/v-edfinance/scripts/database/vps-restore.sh
```

---

## 🎯 MTTR Targets

| Severity | Detection | Mitigation | Recovery | Total MTTR |
|----------|-----------|------------|----------|------------|
| **P0** | <2 min | <3 min | <5 min | **<10 min** |
| **P1** | <5 min | <10 min | <15 min | **<30 min** |
| **P2** | <15 min | <30 min | <1 hour | **<2 hours** |

**MTTR Breakdown:**
- **Detection:** Time from incident start to alert/awareness
- **Mitigation:** Time from detection to service partially restored
- **Recovery:** Time from mitigation to full service restoration
- **Total MTTR:** Detection + Mitigation + Recovery

---

## 🔄 Incident Response Workflow

```
┌─────────────────────────────────────────────────────────┐
│                   Incident Detected                      │
│         (Alert fired or user report received)            │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              Assess Severity (P0/P1/P2)                  │
│            Open appropriate runbook                      │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│         Log Incident (incident-tracker.sh)               │
│     Create incident entry in INCIDENTS.md                │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│         Execute "Immediate Actions" (2-5 min)            │
│         Follow runbook steps sequentially                │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│               Diagnosis & Resolution                     │
│         Identify root cause and apply fix                │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              Verify Recovery (Checklist)                 │
│       Run health checks and monitor stability            │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│            Update Incident Status (Resolved)             │
│      Create follow-up beads for preventive fixes         │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│         Post-Incident (Within 24 hours)                  │
│    - RCA document (P0/P1)                                │
│    - Update runbook if needed                            │
│    - Notify stakeholders                                 │
└─────────────────────────────────────────────────────────┘
```

---

## 🎓 Runbook Maintenance

### Monthly Review
- [ ] Verify all runbooks still accurate
- [ ] Add new scenarios discovered
- [ ] Update commands if infrastructure changed
- [ ] Remove outdated sections

### After Each P0/P1 Incident
- [ ] Update runbook with new learnings
- [ ] Add missing scenarios
- [ ] Improve clarity of confusing steps
- [ ] Update escalation paths if needed

### Quarterly Drills
- [ ] Test each P0 runbook in staging
- [ ] Measure MTTR during drill
- [ ] Identify gaps in procedures
- [ ] Train new team members

---

## 📞 Escalation Contacts

### Level 1: Self-Service (0-10 min)
- Follow runbook procedures
- Use automated recovery scripts
- Check common causes section

### Level 2: On-Call Engineer (10-30 min)
- **Slack:** #ops-oncall
- **Response Time:** <15 minutes
- **Expertise:** All P0/P1 scenarios

### Level 3: Specialist (30-60 min)
- **Database Issues:** #database-experts
- **Security Issues:** #security-team
- **Payment Issues:** #finance-team

### Level 4: External Support (60+ min)
- **VPS Provider:** [Support Portal]
- **Dokploy:** support@dokploy.com
- **Stripe:** [Dashboard Support]
- **PostgreSQL:** Community Forums

---

## 📊 Runbook Effectiveness Metrics

### Usage Statistics (Last 30 Days)
*(Updated monthly)*

| Runbook | Times Used | Avg MTTR | Success Rate |
|---------|------------|----------|--------------|
| Service Down | - | - | - |
| Database Failure | - | - | - |
| Memory Leak | - | - | - |
| Login Failure | - | - | - |
| Payment Failure | - | - | - |
| Slow Queries | - | - | - |

**Target:** 95%+ success rate (incident resolved using runbook)

---

## 🔗 Related Documentation

- [**Incident Tracker**](../INCIDENTS.md) - Central incident log
- [**Incident Tracker Script**](../../scripts/incident-tracker.sh) - CLI tool
- [**Retrospective Template**](../incident-retrospective-template.md) - Monthly review
- [**Deployment Runbook**](../DEPLOYMENT_RUNBOOK.md) - Deployment procedures
- [**Rollback Procedures**](../ROLLBACK_PROCEDURES.md) - Rollback guide
- [**Quality Gates**](../QUALITY_GATE_STANDARDS.md) - Pre-deploy checks

---

## ✅ Runbook Checklist (Before Using)

Before following a runbook, verify:

- [ ] You've correctly identified the severity (P0/P1/P2)
- [ ] You have access to VPS (SSH key configured)
- [ ] You have necessary credentials (DB, Stripe, etc.)
- [ ] You've logged the incident in INCIDENTS.md
- [ ] You've notified the team (#ops-incidents Slack channel)

---

**Questions or Issues?**  
- Create a bead: `beads create "Runbook improvement: [description]" --type task --priority 2`
- Update docs: Edit the runbook markdown file directly
- Discuss: #ops-runbooks Slack channel

---

**Last Reviewed:** 2026-01-04  
**Next Review:** 2026-02-04  
**Owner:** Track 4 - PurpleBear
