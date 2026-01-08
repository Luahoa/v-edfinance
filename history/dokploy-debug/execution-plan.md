# Execution Plan: Fix Dokploy Deployment

Epic: ved-quwn
Generated: 2026-01-08

## Summary

| Item | Value |
|------|-------|
| Total Beads | 6 |
| Estimated Time | 20-30 minutes |
| Risk Level | 🟢 LOW (all UI-based, reversible) |

## Tracks

| Track | Agent | Beads (in order) | File Scope |
|-------|-------|------------------|------------|
| 1 | **BlueLake** | ved-quwn.1 → ved-quwn.2 → ved-quwn.3 → ved-quwn.4 → ved-quwn.5 → ved-quwn.6 | VPS + Dokploy UI |

**Note**: Single track because all beads are sequential (each depends on previous).

## Bead Details

### ved-quwn.1: Diagnose - Check Dokploy logs and verify images
**Time**: 5 min
**Actions**:
1. Open Dokploy UI: http://103.54.153.248:3000
2. Navigate to v-edfinance project → API service → Deployments
3. View deployment logs for error messages
4. SSH to VPS: `docker pull luahoa/v-edfinance-api:staging`

**Success Criteria**:
- [ ] Root cause identified (missing env / image not found / other)

---

### ved-quwn.2: Fix - Configure environment variables
**Time**: 5 min
**Actions**:
1. Dokploy UI → Project → Environment Variables
2. Add: `POSTGRES_PASSWORD=<from existing postgres>`
3. Add: `JWT_SECRET=<generate secure string>`
4. Add: `JWT_REFRESH_SECRET=<same as JWT_SECRET>`
5. Save

**Success Criteria**:
- [ ] All required env vars configured

---

### ved-quwn.3: Deploy - Redeploy API service
**Time**: 5 min
**Actions**:
1. Dokploy UI → API service → Deploy
2. Monitor deployment logs
3. Wait for container status: Running

**Success Criteria**:
- [ ] API container running
- [ ] Healthcheck passing: `curl http://localhost:3001/health`

---

### ved-quwn.4: Deploy - Redeploy Web service
**Time**: 5 min
**Actions**:
1. Dokploy UI → Web service → Deploy
2. Monitor deployment logs
3. Wait for container status: Running

**Success Criteria**:
- [ ] Web container running
- [ ] Depends on API healthy

---

### ved-quwn.5: Deploy - Redeploy Nginx service
**Time**: 5 min
**Actions**:
1. Dokploy UI → Nginx service → Deploy
2. Monitor deployment logs
3. Wait for container status: Running

**Success Criteria**:
- [ ] Nginx container running
- [ ] Port 80 exposed

---

### ved-quwn.6: Verify - Test all endpoints healthy
**Time**: 5 min
**Actions**:
```bash
# From VPS
curl http://localhost:3001/health     # API
curl http://localhost:3000            # Web
curl http://localhost/health          # Nginx

# From external
curl https://api.staging.v-edfinance.com/health
curl https://staging.v-edfinance.com
```

**Success Criteria**:
- [ ] All health endpoints return 200
- [ ] Dokploy UI shows all services green

---

## Key Learnings (from Discovery)

1. **Services were never deployed** - Only postgres exists on VPS
2. **Most likely cause**: Missing environment variables in Dokploy
3. **Required secrets**: POSTGRES_PASSWORD, JWT_SECRET (must match existing postgres)

## Cross-Track Dependencies

None (single sequential track).

## Fallback Plan

If Dokploy redeploy still fails:
1. Check detailed build logs
2. Try manual `docker compose up` via SSH
3. Verify GitHub integration working
