# Service Dependencies Configuration

**Epic**: ved-et78  
**Bead**: ved-et78-dokploy-deps  
**Track**: 2 (GreenCastle)

---

## Dependency Architecture

### Dependency Graph

```
┌─────────────┐
│ PostgreSQL  │
└──────┬──────┘
       │ (healthy)
       ↓
┌─────────────┐
│     API     │
└──────┬──────┘
       │ (healthy)
       ↓
┌─────────────┐
│     Web     │
└──────┬──────┘
       │ (started)
       ↓
┌─────────────┐
│    Nginx    │
└─────────────┘
```

**Legend**:
- `(healthy)` - Service must pass health check before dependent starts
- `(started)` - Service only needs to be started (no health check wait)

---

## Service-by-Service Dependency Configuration

### 1. PostgreSQL (No Dependencies)

**Depends on**: None (base service)

**Startup behavior**:
- Starts immediately
- Initializes database
- Runs health check every 10s

**Health check**:
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s
```

**Explanation**:
- `interval: 10s` - Check every 10 seconds
- `retries: 5` - Max 5 attempts (50s total)
- `start_period: 30s` - Grace period before first check
- **Healthy after**: ~30-50s

**Manual verification**:
```bash
# From VPS
docker exec v-edfinance-postgres pg_isready -U postgres
# Expected: "postgres:5432 - accepting connections"
```

---

### 2. API (Depends on PostgreSQL)

**Depends on**: `postgres` (healthy)

**Startup behavior**:
1. Waits for PostgreSQL to be healthy
2. Connects to database
3. Runs migrations (if configured)
4. Starts API server on port 3001
5. Runs health check

**Dependency configuration** (docker-compose):
```yaml
depends_on:
  postgres:
    condition: service_healthy
```

**Dependency configuration** (Dokploy UI):
- Go to API service → **Dependencies** tab
- Add dependency: `postgres`
- Condition: **Wait for healthy**
- Start timeout: 120s

**Health check**:
```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3001/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

**Explanation**:
- `start_period: 40s` - Grace period for DB connection
- `interval: 30s` - Check every 30 seconds
- `retries: 3` - Max 3 attempts (90s total)
- **Healthy after**: ~40-90s (after DB is healthy)

**Manual verification**:
```bash
# From VPS
docker exec v-edfinance-api wget -qO- http://localhost:3001/health
# Expected: {"status":"ok"}

# Or via curl
curl http://103.54.153.248:3001/health
```

**Troubleshooting startup issues**:
```bash
# Check API logs
docker logs v-edfinance-api --tail=50

# Common issues:
# 1. DATABASE_URL misconfigured
# 2. PostgreSQL not accepting connections
# 3. Missing environment variables (JWT_SECRET)
```

---

### 3. Web (Depends on API)

**Depends on**: `api` (healthy)

**Startup behavior**:
1. Waits for API to be healthy
2. Builds Next.js app (if not pre-built)
3. Starts web server on port 3000
4. Fetches initial data from API (if SSR)

**Dependency configuration** (docker-compose):
```yaml
depends_on:
  api:
    condition: service_healthy
```

**Dependency configuration** (Dokploy UI):
- Go to Web service → **Dependencies** tab
- Add dependency: `api`
- Condition: **Wait for healthy**
- Start timeout: 180s

**Health check**:
```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

**Explanation**:
- `start_period: 40s` - Grace period for Next.js startup
- **Healthy after**: ~40-90s (after API is healthy)

**Manual verification**:
```bash
# From VPS
docker exec v-edfinance-web wget -qO- http://localhost:3000 | head -n 20
# Expected: HTML content with <html> tag

# Or via curl
curl http://103.54.153.248:3000
```

**Troubleshooting startup issues**:
```bash
# Check Web logs
docker logs v-edfinance-web --tail=50

# Common issues:
# 1. NEXT_PUBLIC_API_URL pointing to wrong API
# 2. API not responding to health checks
# 3. Build errors (if building at runtime)
```

---

### 4. Nginx (Depends on Web + API)

**Depends on**: `web` (started), `api` (healthy)

**Startup behavior**:
1. Waits for API to be healthy
2. Waits for Web to start (no health check required)
3. Loads nginx configuration
4. Starts reverse proxy on port 80

**Dependency configuration** (docker-compose):
```yaml
depends_on:
  web:
    condition: service_started
  api:
    condition: service_healthy
```

**Dependency configuration** (Dokploy UI):
- Go to Nginx service → **Dependencies** tab
- Add dependency: `api` → Condition: **Wait for healthy**
- Add dependency: `web` → Condition: **Wait for started**

**Health check**:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost/health"]
  interval: 30s
  timeout: 5s
  retries: 3
  start_period: 20s
```

**Explanation**:
- Nginx proxies `/health` to API `/health`
- Quick startup (no dependencies wait)
- **Healthy after**: ~20-30s

**Manual verification**:
```bash
# From VPS
curl http://localhost/health
# Expected: {"status":"ok"} (proxied from API)

# Or public access
curl http://103.54.153.248/health
```

**Nginx routing**:
```nginx
# Proxy API requests
location /api {
    proxy_pass http://api:3001;
}

# Proxy health check
location /health {
    proxy_pass http://api:3001/health;
}

# Proxy all other requests to Web
location / {
    proxy_pass http://web:3000;
}
```

---

## Health Check Endpoints Summary

| Service | Endpoint | Command | Expected Response | Healthy After |
|---------|----------|---------|-------------------|---------------|
| PostgreSQL | Internal | `pg_isready -U postgres` | `accepting connections` | 30-50s |
| API | `http://localhost:3001/health` | `wget` or `curl` | `{"status":"ok"}` | 40-90s |
| Web | `http://localhost:3000` | `wget` or `curl` | HTML content | 40-90s |
| Nginx | `http://localhost/health` | `curl` | `{"status":"ok"}` (proxied) | 20-30s |

---

## Networking Configuration

### Network Setup

**Network name**: `vedfinance-net` (or `v-edfinance-network` in Dokploy)

**Network driver**: bridge

**Configuration** (docker-compose):
```yaml
networks:
  vedfinance-net:
    driver: bridge
```

### Internal Service Communication

**Service-to-Service URLs** (within Docker network):

| From | To | URL | Port |
|------|-----|-----|------|
| API | PostgreSQL | `postgres:5432` | 5432 |
| Web | API | `http://api:3001` | 3001 |
| Nginx | API | `http://api:3001` | 3001 |
| Nginx | Web | `http://web:3000` | 3000 |

**Key principle**: Use service names as hostnames (Docker DNS resolution)

### External Access

**Public URLs** (from outside Docker network):

| Service | URL | Port | Access |
|---------|-----|------|--------|
| Nginx | `http://103.54.153.248` | 80 | Public |
| API | `http://103.54.153.248:3001` | 3001 | Public (testing only) |
| Web | `http://103.54.153.248:3000` | 3000 | Public (testing only) |
| PostgreSQL | `localhost:5432` | 5432 | Internal only |

**Production recommendation**:
- Close ports 3000 and 3001 (only expose 80/443)
- All traffic goes through Nginx reverse proxy

---

## Startup Sequence Timeline

### Cold Start (All Services Down)

```
T+0s     PostgreSQL starts
T+30s    PostgreSQL healthy ✅
T+30s    → API starts (waiting for DB)
T+70s    API healthy ✅
T+70s    → Web starts (waiting for API)
T+70s    → Nginx starts (no health check wait)
T+90s    Nginx healthy ✅
T+110s   Web healthy ✅
T+120s   ✅ ALL SERVICES HEALTHY
```

**Total cold start time**: ~2-3 minutes

### Warm Restart (Services Already Running)

```
T+0s     All services stop
T+10s    PostgreSQL starts (data already exists)
T+15s    PostgreSQL healthy ✅
T+15s    → API starts
T+30s    API healthy ✅
T+30s    → Web starts
T+30s    → Nginx starts
T+40s    Nginx healthy ✅
T+50s    Web healthy ✅
T+60s    ✅ ALL SERVICES HEALTHY
```

**Total warm restart time**: ~1 minute

---

## Dependency Failure Scenarios

### Scenario 1: PostgreSQL Fails to Start

**Impact**:
- API waits indefinitely (or until timeout)
- Web never starts (depends on API)
- Nginx never starts (depends on Web)

**Resolution**:
```bash
# Check PostgreSQL logs
docker logs v-edfinance-postgres

# Common fixes:
# 1. Fix POSTGRES_PASSWORD in .env.production
# 2. Fix volume permissions
# 3. Clear corrupted data: docker volume rm v-edfinance_postgres_data
```

### Scenario 2: API Fails Health Check

**Symptoms**:
- API container running but health check fails
- Web waits indefinitely
- Nginx waits indefinitely

**Resolution**:
```bash
# Check if API is listening
docker exec v-edfinance-api netstat -tuln | grep 3001

# Test health endpoint manually
docker exec v-edfinance-api curl http://localhost:3001/health

# Common fixes:
# 1. Check DATABASE_URL is correct
# 2. Verify JWT_SECRET is set
# 3. Check API logs for errors
```

### Scenario 3: Web Fails to Start

**Symptoms**:
- API healthy
- Web container crashes or health check fails
- Nginx starts but cannot proxy to Web

**Resolution**:
```bash
# Check Web logs
docker logs v-edfinance-web

# Common fixes:
# 1. Check NEXT_PUBLIC_API_URL points to API
# 2. Verify Node.js version compatibility
# 3. Check for build errors in logs
```

### Scenario 4: Nginx Cannot Connect to Upstream

**Symptoms**:
- All services healthy
- Nginx returns 502 Bad Gateway

**Resolution**:
```bash
# Check Nginx logs
docker logs v-edfinance-nginx

# Test upstream services from Nginx container
docker exec v-edfinance-nginx curl http://api:3001/health
docker exec v-edfinance-nginx curl http://web:3000

# Common fixes:
# 1. Verify all services on same network
# 2. Check nginx.conf upstream configuration
# 3. Restart Nginx: docker-compose restart nginx
```

---

## Verification Checklist

### Pre-Deployment

- [ ] All services configured with correct dependencies
- [ ] Health checks defined for all services
- [ ] Network configuration complete
- [ ] Environment variables set
- [ ] Docker images available on Docker Hub

### Post-Deployment

- [ ] All 4 services show **Running** status
- [ ] PostgreSQL health check passes
- [ ] API health check passes (`http://103.54.153.248:3001/health`)
- [ ] Web health check passes (`http://103.54.153.248:3000`)
- [ ] Nginx health check passes (`http://103.54.153.248/health`)
- [ ] Service logs show no errors
- [ ] Dependency order correct (DB → API → Web → Nginx)
- [ ] All services on same Docker network
- [ ] No container restarts (check `docker ps` RESTART count)

### Functional Testing

- [ ] API endpoints accessible via Nginx (`http://103.54.153.248/api/...`)
- [ ] Web frontend loads (`http://103.54.153.248`)
- [ ] Web can fetch data from API
- [ ] Database connections working (check API logs)
- [ ] No 502 errors from Nginx

---

## Manual Testing Commands

```bash
# 1. Check all services running
docker-compose -f docker-compose.production.yml ps

# 2. Check health status
docker inspect v-edfinance-postgres | grep -A 5 Health
docker inspect v-edfinance-api | grep -A 5 Health
docker inspect v-edfinance-web | grep -A 5 Health
docker inspect v-edfinance-nginx | grep -A 5 Health

# 3. Test health endpoints
curl http://localhost:3001/health  # API
curl http://localhost:3000         # Web
curl http://localhost/health       # Nginx

# 4. Check service logs
docker-compose -f docker-compose.production.yml logs postgres --tail=20
docker-compose -f docker-compose.production.yml logs api --tail=20
docker-compose -f docker-compose.production.yml logs web --tail=20
docker-compose -f docker-compose.production.yml logs nginx --tail=20

# 5. Test dependency order
docker-compose -f docker-compose.production.yml up -d --force-recreate
# Watch startup order in logs
```

---

## Monitoring Recommendations

### Docker Compose Monitoring

```bash
# Watch services in real-time
watch -n 2 'docker-compose -f docker-compose.production.yml ps'

# Monitor resource usage
docker stats
```

### Dokploy UI Monitoring

**Location**: Project → **Services** tab

**Metrics to watch**:
- Service status (Running/Stopped/Restarting)
- Health check status
- CPU/Memory usage
- Container restart count
- Last deployment time

**Alerts** (if configured):
- Service down → Email notification
- Health check failed 3+ times → Email notification
- Memory usage > 80% → Warning

---

## Next Steps After Configuration

1. ✅ Verify all dependencies configured correctly
2. ✅ Test cold start (all services down → up)
3. ✅ Test warm restart (single service restart)
4. ✅ Test automated deployment (push to staging → webhook → redeploy)
5. ✅ Document any issues in troubleshooting runbook

---

**Document created**: 2026-01-07  
**Epic**: ved-et78  
**Bead**: ved-et78-dokploy-deps  
**Status**: Complete
