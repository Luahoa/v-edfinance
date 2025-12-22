# 🚀 VPS Analytics Deployment Guide

**Date:** 2025-12-22  
**Epic:** ved-hyv - Database Speed Optimization  
**Status:** Phase 2 Complete - Ready for VPS Testing

---

## ✅ What's Been Deployed Locally

### 1. Kysely Analytics Repository
**File:** `apps/api/src/analytics/analytics.repository.ts`

**Queries Implemented:**
- ✅ `getDailyActiveUsers(days)` - DAU/MAU tracking
- ✅ `getMonthlyActiveUsers(months)` - Monthly active users
- ✅ `getLearningFunnel(courseId?)` - Signup → Completion funnel
- ✅ `getCohortRetention(weeks)` - Weekly retention by signup cohort
- ✅ `getLeaderboard(options)` - **With Redis caching (5min TTL)**
- ✅ `getStudentBehaviorPattern(userId, days)` - AI personalization input
- ✅ `getCourseCompletionByLevel()` - Difficulty analysis
- ✅ `getAtRiskStudents(options)` - Student risk detection
- ✅ `getCourseEngagementMetrics(courseId)` - Deep course analytics
- ✅ `getGamificationEffectiveness()` - Points/streaks impact

### 2. Module Integration
**File:** `apps/api/src/analytics/analytics.module.ts`

**Dependencies:**
- ✅ `KyselyModule` - Type-safe query builder
- ✅ `RedisCacheModule` - Global cache module
- ✅ `AnalyticsRepository` - Exported for use in controllers

### 3. Redis Caching Strategy
**Implementation:**
```typescript
// 5-minute TTL for leaderboard
const cacheKey = `leaderboard:${groupId}:${timeframe}:${limit}`;
await cacheManager.set(cacheKey, result, 300000); // 300s = 5min
```

**Cache Invalidation:** Manual via Redis CLI or automatic expiry

---

## 🎯 VPS Deployment Steps

### Phase 1: Code Deployment (via Git)

```bash
# 1. Commit and push changes
git add apps/api/src/analytics/
git commit -m "feat: Implement Kysely analytics queries with Redis caching (ved-hyv.7-13)"
git push origin staging  # Or main, depending on your setup

# 2. SSH to VPS
ssh root@103.54.153.248

# 3. Pull latest code (if manual deploy)
cd /root/v-edfinance
git pull origin staging

# 4. Rebuild API container (via Dokploy or manual)
# Option A: Dokploy auto-deploy (recommended)
# - Go to http://103.54.153.248:3000
# - Find v-edfinance-api-staging
# - Click "Redeploy"

# Option B: Manual Docker restart
docker restart v-edfinance-api-staging
```

### Phase 2: Database Seeding (for realistic testing)

```bash
# On VPS
cd /root/v-edfinance/apps/api

# Run dev seed (50 users, 10 courses)
pnpm db:seed:dev

# Or demo seed (200 users, 25 courses) for more realistic load
pnpm db:seed:demo

# Verify data
POSTGRES_CONTAINER=$(docker ps --filter "ancestor=postgres:15-alpine" --format "{{.Names}}" | head -n 1)
docker exec $POSTGRES_CONTAINER psql -U postgres -d vedfinance_staging -c "SELECT COUNT(*) FROM \"User\";"
docker exec $POSTGRES_CONTAINER psql -U postgres -d vedfinance_staging -c "SELECT COUNT(*) FROM \"BehaviorLog\";"
```

### Phase 3: Performance Testing

```bash
# From local machine
cd c:/Users/luaho/Demo project/v-edfinance

# Run VPS performance test
pnpm ts-node scripts/test-vps-analytics.ts

# Expected output:
# 📊 Performance Summary:
#    Average: 150ms
#    P95: <500ms ✅
#    Cache Hit Rate: 50%
```

---

## 📊 Performance Benchmarks

| Query | Target P95 | Expected (Cold) | Expected (Cached) |
|-------|------------|-----------------|-------------------|
| `getDailyActiveUsers()` | <500ms | 200-400ms | N/A |
| `getCohortRetention()` | <500ms | 300-500ms | N/A |
| `getLeaderboard()` | <100ms | 300ms | **<10ms** 🚀 |
| `getLearningFunnel()` | <300ms | 150-300ms | N/A |
| `getStudentBehaviorPattern()` | <500ms | 250-450ms | N/A |

**Redis Impact:**
- Leaderboard queries: **30x faster** when cached
- Cache hit rate target: >50% for global leaderboard

---

## 🔧 VPS-Specific Configuration

### 1. Redis Settings (Already Configured)
**File:** `docker-compose.yml` (on VPS)

```yaml
redis:
  image: redis:7-alpine
  command: redis-server --maxmemory 200mb --maxmemory-policy allkeys-lru
  ports:
    - "6379:6379"
```

**Test Redis connectivity:**
```bash
# On VPS
docker exec -it <redis_container> redis-cli
> PING
PONG
> KEYS leaderboard:*  # Check cached leaderboard keys
```

### 2. PostgreSQL Indexes (Already Applied)
**Migration:** `20251222000001_add_performance_indexes`

```sql
-- BehaviorLog indexes
CREATE INDEX idx_behavior_log_user_timestamp ON "BehaviorLog"("userId", "timestamp");
CREATE INDEX idx_behavior_log_event_type ON "BehaviorLog"("eventType", "userId");

-- UserProgress indexes
CREATE INDEX idx_user_progress_user_lesson ON "UserProgress"("userId", "lessonId");
CREATE INDEX idx_user_progress_status ON "UserProgress"("status", "userId");
```

**Verify indexes:**
```bash
docker exec $POSTGRES_CONTAINER psql -U postgres -d vedfinance_staging -c "\di"
```

---

## 🚨 Troubleshooting

### Issue: Analytics endpoints return 500
```bash
# Check API logs
docker logs v-edfinance-api-staging --tail 100

# Common causes:
# - Database connection lost
# - Redis not running
# - Missing environment variables
```

### Issue: Queries are slow (>500ms)
```sql
-- On VPS PostgreSQL
EXPLAIN ANALYZE 
SELECT DATE("timestamp"), COUNT(DISTINCT "userId") 
FROM "BehaviorLog" 
WHERE "timestamp" >= NOW() - INTERVAL '30 days' 
GROUP BY DATE("timestamp");

-- Check if indexes are being used
-- Expected: Index Scan on idx_behavior_log_user_timestamp
```

### Issue: Redis cache not working
```bash
# Check Redis is running
docker ps | grep redis

# Test cache manually
docker exec -it <redis_container> redis-cli
> SET test:key "hello"
> GET test:key
> DEL test:key

# Check API can connect to Redis
# Look for logs: "Cache connected" or connection errors
```

---

## 📈 Next Steps (Phase 3 - CI/CD)

After VPS testing validates performance:

1. **ved-hyv.14:** GitHub Actions for automated ERD generation
2. **ved-hyv.15:** Pre-commit hooks for schema changes
3. **ved-hyv.16:** NocoDB setup for admin data inspection
4. **ved-hyv.17:** Documentation completion
5. **ved-hyv.18:** Package.json scripts cleanup

---

## 📚 Related Files

- [DATABASE_OPTIMIZATION_ROADMAP.md](../DATABASE_OPTIMIZATION_ROADMAP.md) - Full 5-week plan
- [DATABASE_TOOLS_INTEGRATION_PLAN.md](DATABASE_TOOLS_INTEGRATION_PLAN.md) - Original strategy
- [VPS_MANUAL_COMMANDS.md](../VPS_MANUAL_COMMANDS.md) - VPS operations reference
- [test-vps-analytics.ts](../scripts/test-vps-analytics.ts) - Performance test script

---

**Last Updated:** 2025-12-22  
**Maintainer:** Amp Agent
