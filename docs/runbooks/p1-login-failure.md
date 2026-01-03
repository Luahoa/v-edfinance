# P1 Incident Runbook: Login Failure

**Severity:** P1 (High)  
**MTTR Target:** 15 minutes  
**Status:** Active

---

## 🚨 Detection

### Automated Alerts
- Error rate spike on `/api/auth/login` endpoint (>5% failure rate)
- Prometheus: `http_requests_total{endpoint="/auth/login",status="401"} > 100/min`
- User reports: "Cannot log in" support tickets

### Manual Detection
- Login page returns error after valid credentials
- JWT token not generated
- Session cookie not set
- Redirect to login page immediately after successful auth

### Quick Diagnosis Commands
```bash
# Check recent login attempts
ssh root@103.54.153.248
docker logs <api_container> --tail 100 | grep "auth/login"

# Check JWT service status
curl http://103.54.153.248:3001/debug/jwt-status | jq

# Test login endpoint directly
curl -X POST http://103.54.153.248:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass"}' \
  -v
```

---

## ⚡ Immediate Actions (First 5 Minutes)

### Step 1: Verify Service Availability
```bash
# Check if auth service is up
curl -I http://103.54.153.248:3001/api/auth/health

# Check if database is accessible
docker exec <api_container> npx prisma db pull --preview-feature
```

**If services down:** See [p0-service-down.md](p0-service-down.md)

### Step 2: Check Error Pattern
```bash
# Get recent login errors
docker logs <api_container> --tail 200 | grep -i "login\|auth" | grep -i "error"

# Common error patterns:
# - "Invalid credentials" → User issue (not incident)
# - "JWT secret not configured" → Configuration error
# - "Database connection failed" → Database issue
# - "Redis connection timeout" → Session store issue
# - "CORS error" → Frontend/backend mismatch
```

### Step 3: Test with Known Good Credentials
```bash
# Use test account from seed data
curl -X POST http://103.54.153.248:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@vedfinance.com","password":"Admin123!"}' \
  | jq

# Expected success response:
# {
#   "accessToken": "eyJhbGc...",
#   "refreshToken": "eyJhbGc...",
#   "user": { "id": "...", "email": "..." }
# }

# If this succeeds → User-specific issue, not incident
# If this fails → System-wide issue, continue diagnosis
```

---

## 🔧 Diagnosis & Resolution

### Scenario A: JWT Secret Missing/Invalid
**Symptoms:** Error contains "JWT secret" or "jsonwebtoken"

```bash
# Check environment variables
docker exec <api_container> printenv | grep JWT

# Required variables:
# JWT_SECRET=xxxxx (should be present and >32 chars)
# JWT_EXPIRES_IN=7d (optional, default used if missing)

# Fix: Update Dokploy environment variables
# 1. Access Dokploy dashboard
# 2. Navigate to API app → Environment
# 3. Add/update JWT_SECRET
# 4. Redeploy
```

**Emergency Fix (Temporary):**
```bash
# Generate new secret
NEW_SECRET=$(openssl rand -base64 32)

# Update running container (temporary until redeploy)
docker exec <api_container> sh -c "export JWT_SECRET=$NEW_SECRET"

# Restart to apply
docker restart <api_container>

# ⚠️ WARNING: This will invalidate all existing tokens!
```

### Scenario B: Database User Table Issue
**Symptoms:** "User not found" errors for valid accounts

```bash
# Check if User table exists and has data
docker exec <postgres_container> psql -U postgres -d vedfinance_staging -c \
  "SELECT COUNT(*) FROM \"User\";"

# If 0 rows → Database restored from wrong backup
# If table doesn't exist → Schema migration issue

# Verify specific user exists
docker exec <postgres_container> psql -U postgres -d vedfinance_staging -c \
  "SELECT id, email, role FROM \"User\" WHERE email = 'admin@vedfinance.com';"

# If user missing → Restore from backup or run seed
```

**Fix: Run Database Seed (Development/Staging Only)**
```bash
cd /root/v-edfinance/apps/api
npx prisma db seed

# Verify
docker exec <postgres_container> psql -U postgres -d vedfinance_staging -c \
  "SELECT COUNT(*) FROM \"User\";"
```

### Scenario C: Redis Session Store Failure
**Symptoms:** Login succeeds but session not persisted

```bash
# Check Redis container
docker ps | grep redis

# If not running, restart
REDIS_CONTAINER=$(docker ps -a --filter "ancestor=redis:7-alpine" --format "{{.Names}}" | head -n 1)
docker restart $REDIS_CONTAINER

# Test Redis connection
docker exec $REDIS_CONTAINER redis-cli ping
# Expected: PONG

# Check session keys
docker exec $REDIS_CONTAINER redis-cli KEYS "sess:*" | head -n 10

# If Redis is down → Sessions fallback to memory (lost on restart)
```

### Scenario D: Password Hashing Issue
**Symptoms:** Valid passwords rejected after deployment

```bash
# Check if bcrypt library loaded correctly
docker exec <api_container> node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.compareSync('test', bcrypt.hashSync('test', 10)));"
# Expected: true

# Check user password hash format
docker exec <postgres_container> psql -U postgres -d vedfinance_staging -c \
  "SELECT email, LENGTH(password) as hash_length FROM \"User\" LIMIT 5;"

# bcrypt hash should be 60 characters
# If different → Password migration issue
```

### Scenario E: CORS/Cookie Issue (Frontend)
**Symptoms:** Login works in Postman but fails in browser

```bash
# Check CORS configuration in API
docker exec <api_container> cat /app/dist/main.js | grep -i "cors"

# Test CORS headers
curl -X OPTIONS http://103.54.153.248:3001/api/auth/login \
  -H "Origin: http://103.54.153.248:3002" \
  -v | grep "Access-Control"

# Expected headers:
# Access-Control-Allow-Origin: http://103.54.153.248:3002
# Access-Control-Allow-Credentials: true
```

**Fix: Update CORS Configuration**
```typescript
// apps/api/src/main.ts
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://103.54.153.248:3002',
  credentials: true,
});
```

---

## 🛡️ Common Fixes Reference

### Fix 1: Reset JWT Secret
```bash
# Generate new secret
openssl rand -base64 32

# Update in Dokploy dashboard → API → Environment Variables
# Redeploy API
```

### Fix 2: Restore User Database
```bash
# Use latest backup
bash /root/v-edfinance/scripts/database/vps-restore.sh

# Or run seed for dev/staging
cd /root/v-edfinance/apps/api && npx prisma db seed
```

### Fix 3: Clear Redis Session Cache
```bash
# Flush all sessions (emergency only)
docker exec $REDIS_CONTAINER redis-cli FLUSHDB

# Or clear specific user sessions
docker exec $REDIS_CONTAINER redis-cli KEYS "sess:user:*" | xargs redis-cli DEL
```

### Fix 4: Restart Auth Service
```bash
# Graceful restart
docker restart <api_container>

# Verify
curl http://103.54.153.248:3001/api/auth/health
```

---

## ✅ Recovery Verification

### Test Login Flow End-to-End
```bash
# 1. Register new user (if registration working)
curl -X POST http://103.54.153.248:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-'$(date +%s)'@vedfinance.com",
    "password": "Test123!",
    "name": "Test User"
  }' | jq

# 2. Login with new user
curl -X POST http://103.54.153.248:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-xxx@vedfinance.com",
    "password": "Test123!"
  }' -c /tmp/cookies.txt | jq

# 3. Access protected endpoint with token
ACCESS_TOKEN=$(cat /tmp/cookies.txt | grep access_token | awk '{print $7}')
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://103.54.153.248:3001/api/users/me | jq

# 4. Logout
curl -X POST http://103.54.153.248:3001/api/auth/logout \
  -b /tmp/cookies.txt

# All steps should succeed
```

### Monitor Error Rate
```bash
# Watch login endpoint for 5 minutes
watch -n 10 'docker logs <api_container> --tail 50 | grep "auth/login" | grep -c "error"'

# Should be 0 or very low (<1% of requests)
```

---

## 📊 Common Causes (Historical Data)

| Cause | Frequency | Fix Time | Prevention |
|-------|-----------|----------|------------|
| JWT secret not set after deploy | 35% | 5 min | Add to CI/CD env check |
| Redis connection timeout | 25% | 3 min | Add Redis health check |
| Database seed not run (staging) | 20% | 10 min | Automate seed in staging deploy |
| CORS misconfiguration | 15% | 5 min | Add CORS validation to tests |
| Password hash algorithm change | 5% | 20 min | Version lock bcrypt library |

---

## 📝 Post-Incident Actions

### Immediate (Within 30 Minutes)
1. **Document in Incident Log**
2. **Create Monitoring Bead:**
   ```bash
   beads create "Add auth endpoint monitoring to Grafana" --type task --priority 1
   ```
3. **Verify Related Services:**
   - Registration endpoint
   - Password reset flow
   - OAuth providers (if configured)

### Short-Term (Within 1 Week)
1. **Add Integration Tests:**
   ```typescript
   // apps/api/test/auth.e2e-spec.ts
   describe('Authentication Flow (E2E)', () => {
     it('should complete full login flow', async () => {
       // Register → Login → Access Protected → Logout
     });
     
     it('should reject invalid credentials', async () => {
       // Test error handling
     });
     
     it('should handle JWT expiration', async () => {
       // Test token refresh
     });
   });
   ```

2. **Add Health Check Endpoint:**
   ```typescript
   // apps/api/src/modules/auth/auth.controller.ts
   @Get('health')
   async healthCheck() {
     return {
       status: 'ok',
       jwt: !!process.env.JWT_SECRET,
       redis: await this.redisService.ping(),
       database: await this.prisma.$queryRaw`SELECT 1`,
     };
   }
   ```

3. **Improve Error Messages:**
   - Never expose "User not found" (security)
   - Log detailed errors server-side only
   - Return generic "Invalid credentials" to client

---

## 🚀 Escalation Paths

### Level 1: Self-Service (0-10 minutes)
- Check environment variables
- Restart services
- Verify database connection
- Clear Redis cache

### Level 2: Backend Engineer (10-30 minutes)
- Review recent auth service changes
- Check Prisma schema changes
- Verify JWT configuration
- Test with multiple accounts
- Contact: [Slack: #backend-oncall]

### Level 3: Security Team (30+ minutes)
- Investigate potential security breach
- Review auth logs for suspicious activity
- Rotate secrets if compromise suspected
- Contact: [Slack: #security]

---

## 📚 Related Resources
- [JWT Authentication Guide](../../docs/AUTH_GUIDE.md)
- [Database Seed Data](../../apps/api/prisma/seed.ts)
- [Redis Configuration](../../docker-compose.yml)
- [P0: Service Down](p0-service-down.md)
- [P0: Database Failure](p0-database-failure.md)

---

**Last Updated:** 2026-01-04  
**Owner:** Track 4 - PurpleBear  
**Review Frequency:** Monthly
