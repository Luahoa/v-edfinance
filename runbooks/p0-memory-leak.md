# P0 Incident Runbook: Memory Leak

**Severity:** P0 (Critical)  
**MTTR Target:** 10 minutes  
**Status:** Active

---

## 🚨 Detection

### Automated Alerts
- Prometheus: `container_memory_usage_bytes > 1.8GB` (90% of 2GB limit)
- Docker Stats: Memory usage increasing steadily over time
- Application logs: `JavaScript heap out of memory`

### Manual Detection
- API becomes slow/unresponsive
- Container restart loop (OOM killed)
- `docker stats` shows memory climbing

### Quick Diagnosis Commands
```bash
# Check current memory usage
ssh root@103.54.153.248
docker stats --no-stream | grep vedfinance

# Check container events for OOM kills
docker events --filter 'event=oom' --since 1h

# Check Node.js heap usage (if exposed)
curl http://103.54.153.248:3001/debug/memory | jq
```

---

## ⚡ Immediate Actions (First 5 Minutes)

### Step 1: Confirm Memory Leak Pattern
```bash
# Monitor memory growth over 60 seconds
docker stats <api_container> --no-stream
sleep 60
docker stats <api_container> --no-stream

# If memory increased by >100MB in 60s → Confirmed leak
```

### Step 2: Emergency Restart (Immediate Relief)
```bash
# Graceful restart to free memory
docker restart <api_container>

# Verify recovery
sleep 15
curl http://103.54.153.248:3001/health

# Monitor memory after restart
watch -n 5 'docker stats --no-stream | grep vedfinance'
```

**Success:** If memory stabilizes < 500MB → Monitor for 15 minutes  
**Failure:** If memory climbs rapidly (>50MB/min) → Proceed to root cause analysis

---

## 🔧 Memory Analysis Commands

### Get Heap Snapshot (Node.js)
```bash
# Trigger heap snapshot (if enabled in debug mode)
curl -X POST http://103.54.153.248:3001/debug/heap-snapshot

# Download snapshot for analysis
scp root@103.54.153.248:/tmp/heap-*.heapsnapshot ./

# Analyze with Chrome DevTools:
# 1. Open chrome://inspect
# 2. Load heap snapshot
# 3. Check "Retained Size" column for large objects
```

### Check Process Memory Details
```bash
# Get detailed memory breakdown
docker exec <api_container> node -e "console.log(process.memoryUsage())"

# Expected output:
# {
#   rss: xxx,        # Total memory (should be < 500MB normally)
#   heapTotal: xxx,  # Total heap (should be < 300MB)
#   heapUsed: xxx,   # Used heap (should be < 200MB)
#   external: xxx    # External memory (buffers, etc.)
# }
```

### Identify Leaking Endpoints
```bash
# Check endpoint request counts (high-traffic = suspect)
docker exec <api_container> cat /tmp/request-log.json | \
  jq 'group_by(.endpoint) | map({endpoint: .[0].endpoint, count: length}) | sort_by(-.count)'

# Common leak sources:
# - File uploads (multer not releasing buffers)
# - WebSocket connections (not cleaned up)
# - Database connection pool (connections not returned)
# - Event listeners (not removed)
```

---

## 🔍 Root Cause Analysis

### Common Memory Leak Patterns

#### Pattern A: Unclosed Database Connections
**Symptoms:** Memory grows with DB query volume

```bash
# Check active Prisma connections
docker exec <api_container> npx prisma studio --browser none &
# Count connections in pg_stat_activity

# Fix: Ensure `prisma.$disconnect()` in shutdown hooks
# Location: apps/api/src/main.ts
```

#### Pattern B: Event Listener Accumulation
**Symptoms:** Memory grows with WebSocket/SSE usage

```bash
# Check active event listeners (if instrumented)
curl http://103.54.153.248:3001/debug/event-listeners | jq

# Look for:
# - EventEmitters with >100 listeners
# - Socket.io connections not cleaned up
```

**Fix Location:** `apps/api/src/modules/websocket/`

#### Pattern C: Large Object Retention (Cache)
**Symptoms:** Memory jumps after specific operations

```bash
# Check cache size (if using in-memory cache)
curl http://103.54.153.248:3001/debug/cache-stats | jq

# Common culprits:
# - LRU cache without size limit
# - Session store in memory (use Redis)
# - Large JSON responses cached indefinitely
```

**Fix:** Configure cache eviction policy

#### Pattern D: File Upload Buffer Leak
**Symptoms:** Memory spikes during file uploads

```bash
# Check multer configuration
grep -r "multer" apps/api/src --include="*.ts"

# Verify:
# - Storage is 'diskStorage', not 'memoryStorage'
# - Files are cleaned up after processing
# - Upload size limits enforced
```

---

## 🛡️ Short-Term Mitigation

### Increase Container Memory Limit (Emergency Only)
```bash
# Current limit: 2GB
# Increase to 4GB temporarily
docker update --memory="4g" --memory-swap="4g" <api_container>
docker restart <api_container>

# Create bead to fix root cause:
beads create "Investigate and fix memory leak in API" --type task --priority 0
```

### Enable Memory Limit Soft Alert
```bash
# Set soft limit to trigger GC more aggressively
docker update --memory-reservation="1.5g" <api_container>
```

### Implement Auto-Restart on High Memory
```bash
# Add health check to Dokploy config
# Edit dokploy.yaml:

healthcheck:
  test: ["CMD", "sh", "-c", "MEMORY=$(ps aux | grep 'node' | awk '{sum+=$6} END {print sum}'); if [ $MEMORY -gt 1800000 ]; then exit 1; fi"]
  interval: 30s
  timeout: 5s
  retries: 3
```

---

## 📊 Prevention & Monitoring

### Add Memory Profiling Endpoint (Development)
```typescript
// apps/api/src/modules/debug/debug.controller.ts

@Get('memory')
getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
    external: `${Math.round(usage.external / 1024 / 1024)}MB`,
  };
}

@Post('heap-snapshot')
async createHeapSnapshot() {
  const v8 = require('v8');
  const filename = `/tmp/heap-${Date.now()}.heapsnapshot`;
  const writeStream = fs.createWriteStream(filename);
  v8.writeHeapSnapshot(writeStream);
  return { snapshot: filename };
}
```

### Grafana Alert Rules
Add to `monitoring/prometheus/alerts.yml`:

```yaml
groups:
  - name: memory_alerts
    interval: 30s
    rules:
      - alert: MemoryLeakDetected
        expr: (container_memory_usage_bytes{container="api"} - container_memory_usage_bytes{container="api"} offset 5m) > 100000000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Memory leak detected in API container"
          description: "Memory increased by >100MB in 5 minutes"

      - alert: HighMemoryUsage
        expr: container_memory_usage_bytes{container="api"} / 2000000000 > 0.9
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "API container using >90% memory"
          description: "OOM kill imminent - restart required"
```

### Automated Memory Reports
Create cron job on VPS:

```bash
# /etc/cron.d/memory-report
*/15 * * * * root docker stats --no-stream | grep vedfinance >> /var/log/memory-usage.log
```

---

## ✅ Recovery Verification

### Post-Restart Checklist
```bash
# 1. Verify service is healthy
curl http://103.54.153.248:3001/health
# Expected: {"status":"ok"}

# 2. Check baseline memory (should be <300MB)
docker stats <api_container> --no-stream

# 3. Run load test to verify leak is fixed
cd /root/v-edfinance/scripts/tests/vegeta
./run-stress-test.sh

# 4. Monitor memory during load test
watch -n 10 'docker stats --no-stream | grep vedfinance'

# 5. Memory should stabilize within 10% after load test ends
```

### 24-Hour Monitoring Plan
```bash
# Collect memory samples every 5 minutes for 24 hours
for i in {1..288}; do
  docker stats --no-stream | grep vedfinance | \
    awk '{print systime() "," $4}' >> /tmp/memory-trend.csv
  sleep 300
done

# Analyze trend (should be flat or decreasing)
# If increasing linearly → Leak still present
```

---

## 📝 Post-Incident Actions

### Immediate (Within 1 Hour)
1. **Document in Incident Log**
2. **Create Code Analysis Bead:**
   ```bash
   beads create "Profile API endpoints for memory leaks" --type task --priority 0
   ```
3. **Enable Heap Profiling:**
   ```bash
   # Update Dockerfile to enable inspector
   # ENV NODE_OPTIONS="--max-old-space-size=1536 --inspect=0.0.0.0:9229"
   ```

### Short-Term (Within 1 Week)
1. **Code Review Focus Areas:**
   - All WebSocket handlers: Ensure cleanup on disconnect
   - File upload handlers: Verify stream cleanup
   - Database queries: Verify connection pool configuration
   - Caching: Implement TTL and size limits

2. **Add Unit Tests:**
   ```typescript
   // Test for connection pool leaks
   describe('Database Connection Pool', () => {
     it('should not leak connections', async () => {
       const initialConnections = await getActiveConnections();
       
       // Simulate 1000 requests
       for (let i = 0; i < 1000; i++) {
         await request(app).get('/api/users');
       }
       
       const finalConnections = await getActiveConnections();
       expect(finalConnections).toBeLessThanOrEqual(initialConnections + 10);
     });
   });
   ```

3. **Performance Testing:**
   - Add memory profiling to CI/CD
   - Run 1-hour soak test before production deploy
   - Monitor memory growth rate

---

## 🚀 Escalation Paths

### Level 1: Auto-Recovery (0-5 minutes)
- Container restart via health check
- Memory usage < 1.8GB within 2 minutes

### Level 2: Manual Investigation (5-30 minutes)
- Heap snapshot analysis
- Endpoint profiling
- Code review of recent changes
- Contact: [Slack: #dev-oncall]

### Level 3: Node.js Expert (30-60 minutes)
- Deep V8 profiling
- Garbage collection tuning
- Memory leak detection tools (clinic.js)
- Contact: [Slack: #architecture]

### Level 4: Architect Review (60+ minutes)
- Consider architectural changes (e.g., worker pools)
- Evaluate external caching (Redis)
- Database connection pooling strategy
- Contact: [Slack: #critical-incidents]

---

## 📚 Related Resources
- [Node.js Memory Management Best Practices](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Chrome DevTools Heap Profiler](https://developer.chrome.com/docs/devtools/memory-problems/)
- [clinic.js - Node.js Performance Profiling](https://clinicjs.org/)
- [P0: Service Down](p0-service-down.md)
- [Monitoring Setup](../../monitoring/README.md)

---

**Last Updated:** 2026-01-04  
**Owner:** Track 4 - PurpleBear  
**Review Frequency:** Monthly  
**Next Action:** Add automated heap profiling to staging environment
