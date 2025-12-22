# 🔄 Weekly Database Optimization Strategy

> **Autonomous Database Health Monitoring & Optimization**

**Created:** 2025-12-22  
**Frequency:** Every Sunday 2:00 AM (UTC+7)  
**Owner:** AI Database Architect Agent

---

## 🎯 Strategy Overview

**Problem:** Manual database optimization is reactive and inconsistent
- Developers only notice slow queries when users complain
- No systematic performance regression detection
- Optimization knowledge is siloed (not shared across team)

**Solution:** Automated Weekly Health Checks
- AI Agent runs comprehensive audit every Sunday
- Proactive optimization recommendations before users notice
- Knowledge base (Pgvector RAG) prevents duplicate work
- Automated PR creation for high-confidence fixes

---

## 📅 Weekly Schedule

### Sunday 2:00 AM - Main Audit
```typescript
@Cron('0 2 * * 0')  // Every Sunday at 2:00 AM
async runWeeklyAudit() {
  // Main optimization workflow
}
```

**Why Sunday 2 AM:**
- Lowest traffic period (users sleeping)
- Weekend = safer for risky EXPLAIN ANALYZE tests
- Results ready for Monday morning review

### Daily 3:00 AM - Health Snapshot
```typescript
@Cron('0 3 * * *')  // Every day at 3:00 AM
async dailyHealthSnapshot() {
  // Lightweight monitoring (no heavy analysis)
}
```

**Metrics collected:**
- Connection count
- Query p95 latency
- Cache hit ratio
- Disk usage trend

---

## 🔍 Audit Workflow (7 Steps)

### Step 1: Query pg_stat_statements (10s)
**Goal:** Find slow queries from past week

```typescript
async findSlowQueries() {
  const result = await this.kysely.db
    .selectFrom('pg_stat_statements' as any)
    .select([
      'query',
      'mean_exec_time',
      'calls',
      'total_exec_time',
      'stddev_exec_time'
    ])
    .where('mean_exec_time', '>', 500)  // > 500ms
    .where('calls', '>', 100)           // Called > 100 times
    .where('query', 'not like', '%pg_stat%')  // Exclude internal
    .orderBy('total_exec_time', 'desc')
    .limit(20)
    .execute();

  return result;
}
```

**Output:** List of 20 slowest queries

**Filters:**
- Mean execution time > 500ms (our SLA)
- Called at least 100 times (ignore one-off admin queries)
- Exclude internal PostgreSQL queries

---

### Step 2: RAG Lookup (5s per query)
**Goal:** Check if we've optimized similar queries before

```typescript
async checkPastOptimizations(queryText: string) {
  const similar = await this.pgvector.findSimilarOptimizations(
    queryText,
    3  // Top 3 similar
  );

  if (similar.length > 0 && similar[0].similarity > 0.85) {
    console.log('✅ Similar optimization found:', similar[0]);
    return {
      skip: true,
      reason: `Already optimized similar query (${similar[0].id})`,
      previousGain: similar[0].performanceGain
    };
  }

  return { skip: false };
}
```

**Logic:**
- Generate embedding for current slow query
- Search Pgvector for similar past optimizations (cosine similarity)
- If similarity > 85% → skip (already solved)
- Else → proceed to analysis

**Why RAG:**
- Prevents Agent from recommending same index twice
- Learns from past successes/failures
- Faster iteration (skip already-solved problems)

---

### Step 3: Vanna.AI Explain Query (15s per query)
**Goal:** Understand what the query is trying to do

```typescript
async explainQuery(queryText: string) {
  const explanation = await this.vanna.ask(
    `Explain what this SQL query does in business terms: ${queryText}`
  );

  return {
    intent: explanation.intent,      // "Find active users"
    tables: explanation.tables,      // ["User", "BehaviorLog"]
    complexity: explanation.complexity, // "high"
    businessContext: explanation.businessContext
  };
}
```

**Example:**
```sql
-- Input Query
SELECT u.id, COUNT(bl.id) as actions
FROM "User" u
LEFT JOIN "BehaviorLog" bl ON bl."userId" = u.id
WHERE bl."timestamp" > NOW() - INTERVAL '7 days'
GROUP BY u.id
HAVING COUNT(bl.id) > 50;

-- Vanna Explanation
{
  intent: "Find highly active users in the past week",
  tables: ["User", "BehaviorLog"],
  complexity: "medium",
  businessContext: "Used for user engagement dashboard"
}
```

---

### Step 4: Generate Recommendation (30s per query)
**Goal:** AI-powered optimization suggestion

```typescript
async generateRecommendation(query: any, explanation: any) {
  const prompt = `
  Query: ${query.query}
  Execution time: ${query.mean_exec_time}ms
  Frequency: ${query.calls} times/week
  Explanation: ${explanation.businessContext}
  
  Current indexes: ${await this.listIndexes(explanation.tables)}
  
  Suggest ONE optimization:
  - Type: index | rewrite | partition | cache
  - SQL: Exact migration SQL
  - Reasoning: Why this helps
  - Confidence: 0-100%
  `;

  const recommendation = await this.vanna.generateRecommendation(prompt);
  
  return {
    type: recommendation.type,
    sql: recommendation.sql,
    reasoning: recommendation.reasoning,
    confidence: recommendation.confidence / 100
  };
}
```

**Recommendation Types:**
1. **Index** - Add missing index (most common)
   ```sql
   CREATE INDEX idx_behavior_log_user_timestamp 
   ON "BehaviorLog"("userId", "timestamp");
   ```

2. **Query Rewrite** - More efficient SQL
   ```sql
   -- Replace LEFT JOIN with EXISTS for faster lookup
   ```

3. **Partitioning** - Split large tables
   ```sql
   -- Partition BehaviorLog by month
   ```

4. **Caching** - Add Redis cache layer
   ```typescript
   // Cache this query result for 5 minutes
   ```

---

### Step 5: EXPLAIN ANALYZE Test (20s per query)
**Goal:** Estimate actual performance gain

```typescript
async estimatePerformanceGain(query: string, recommendation: any) {
  // Start transaction (rollback at end)
  await this.kysely.db.raw('BEGIN');

  // Measure BEFORE
  const before = await this.kysely.db.raw(
    `EXPLAIN ANALYZE ${query}`
  );
  const beforeTime = this.extractExecutionTime(before);

  // Apply recommendation (temporary)
  if (recommendation.type === 'index') {
    await this.kysely.db.raw(recommendation.sql);
  }

  // Measure AFTER
  const after = await this.kysely.db.raw(
    `EXPLAIN ANALYZE ${query}`
  );
  const afterTime = this.extractExecutionTime(after);

  // Rollback (don't apply yet)
  await this.kysely.db.raw('ROLLBACK');

  const gain = ((beforeTime - afterTime) / beforeTime) * 100;

  return {
    beforeMs: beforeTime,
    afterMs: afterTime,
    gainPercent: gain,
    worthApplying: gain > 20  // Only recommend if > 20% gain
  };
}
```

**Safety:**
- All tests run in transaction (ROLLBACK at end)
- No changes applied to production DB
- Dry-run validation before actual migration

---

### Step 6: Store in Knowledge Base (5s)
**Goal:** Save optimization for future RAG

```typescript
async storeOptimization(
  queryText: string,
  recommendation: any,
  performanceGain: number
) {
  const embedding = await this.pgvector.generateEmbedding(
    `${queryText} ${recommendation.reasoning}`
  );

  await this.prisma.optimizationLog.create({
    data: {
      queryText,
      recommendation: recommendation.sql,
      performanceGain,
      confidence: recommendation.confidence,
      embedding: `[${embedding.join(',')}]`
    }
  });

  console.log('💾 Stored optimization for future RAG');
}
```

**Why store all recommendations:**
- Even rejected optimizations are valuable (learn what NOT to do)
- Future queries can benefit from past analysis
- Builds institutional knowledge (survives team turnover)

---

### Step 7: Create Pull Request (60s if confidence > 80%)
**Goal:** Automate migration creation for high-confidence fixes

```typescript
async createOptimizationPR(recommendation: any, performanceGain: number) {
  if (recommendation.confidence < 0.8) {
    console.log('⚠️ Confidence too low, manual review required');
    return;
  }

  const migrationName = `add_index_${Date.now()}`;
  const migrationPath = `apps/api/prisma/migrations/${migrationName}`;

  // Create migration file
  await fs.mkdir(migrationPath, { recursive: true });
  await fs.writeFile(
    `${migrationPath}/migration.sql`,
    `-- Migration generated by AI Database Architect
-- Confidence: ${recommendation.confidence * 100}%
-- Expected gain: ${performanceGain.toFixed(1)}%
-- Recommendation: ${recommendation.reasoning}

${recommendation.sql}
`
  );

  // Create GitHub PR via API
  await this.githubService.createPR({
    title: `[AI Agent] Database optimization: ${recommendation.reasoning}`,
    body: `
## 🤖 AI-Generated Database Optimization

**Confidence:** ${recommendation.confidence * 100}%  
**Expected Performance Gain:** ${performanceGain.toFixed(1)}%

**Query Before:**
\`\`\`sql
${queryText}
\`\`\`

**Recommendation:**
\`\`\`sql
${recommendation.sql}
\`\`\`

**Reasoning:**
${recommendation.reasoning}

**EXPLAIN ANALYZE:**
- Before: ${beforeMs}ms
- After: ${afterMs}ms
- Gain: ${performanceGain.toFixed(1)}%

**Review Checklist:**
- [ ] Verify index doesn't duplicate existing
- [ ] Check migration on staging first
- [ ] Monitor query latency after deploy
`,
    branch: `ai-optimize-${Date.now()}`,
    labels: ['database', 'ai-generated', 'optimization']
  });

  console.log('✅ PR created for manual review');
}
```

**PR Review Process:**
1. Agent creates PR with full context
2. Backend engineer reviews (15 min)
3. Test on staging environment
4. Merge if tests pass
5. Monitor production metrics

---

## 📊 Weekly Report (Sent Monday 9 AM)

**Email/Slack notification:**
```
📊 Database Optimization Weekly Report
Week of: Dec 22-28, 2025

🔍 Slow Queries Detected: 8
✅ Optimizations Recommended: 5
📝 PRs Created: 2 (high confidence)
⏭️ Manual Review Required: 3 (low confidence)

🎯 Top Optimization:
- Query: "Find active users (last 7 days)"
- Recommendation: Add index on BehaviorLog(userId, timestamp)
- Expected Gain: 67%
- Status: PR #1234 pending review

📈 Historical Performance:
- Optimizations Applied This Month: 12
- Average Performance Gain: 45%
- Total Query Time Saved: 3.2 seconds/request

🔗 View full report: http://103.54.153.248:3001/admin/database/optimizations
```

---

## 🚨 Alert Conditions

**Immediate Slack Alert (Any Day):**
- Query p95 > 2 seconds (critical SLA breach)
- Connection pool exhausted (> 90% used)
- Disk usage > 85%
- No optimizations possible (Agent stuck)

**Weekly Digest (Monday 9 AM):**
- Summary of slow queries
- Recommended optimizations
- PRs created
- Historical trends

---

## 🛡️ Safety Guardrails

### 1. Never Auto-Apply Migrations
**Rule:** All changes require human approval (via PR)

**Reason:** Even high-confidence AI can be wrong

**Exception:** Only in staging environment after team approval

---

### 2. Rollback Plan
**Every recommendation includes:**
```sql
-- Forward migration
CREATE INDEX idx_users_email ON "User"(email);

-- Rollback migration
DROP INDEX IF EXISTS idx_users_email;
```

---

### 3. Test on Staging First
**Workflow:**
1. Apply migration to staging
2. Run smoke tests (E2E suite)
3. Monitor for 24 hours
4. If stable → apply to production

---

### 4. Confidence Thresholds

| Confidence | Action |
|------------|--------|
| **90-100%** | Create PR + recommend immediate merge |
| **80-89%** | Create PR + request review |
| **60-79%** | Log recommendation, no PR |
| **< 60%** | Log only, flag for manual investigation |

---

## 📈 Success Metrics (KPIs)

**Weekly:**
- Slow queries detected (target: < 10)
- Optimizations applied (target: 2-5)
- Average confidence score (target: > 80%)
- Average performance gain (target: > 30%)

**Monthly:**
- Cumulative time saved (seconds/request)
- Number of PRs merged (target: 8-12)
- Agent accuracy (% of good recommendations)
- Knowledge base size (OptimizationLog records)

**Quarterly:**
- Overall p95 latency trend (should decrease)
- Index utilization rate (should increase)
- Developer time saved (estimate from PR reviews)

---

## 🔄 Continuous Improvement

### Monthly: Retrain Vanna Model
**Process:**
1. Export OptimizationLog (good + bad recommendations)
2. Retrain Vanna with successful optimizations
3. Update confidence scoring algorithm
4. A/B test new model vs old model (staging)

### Quarterly: Embeddings Model Tuning
**Process:**
1. Evaluate RAG accuracy (are we finding similar optimizations?)
2. Fine-tune embeddings model on domain-specific queries
3. Benchmark similarity score accuracy

---

## 🎯 Long-Term Vision (6 months)

**Phase 1 (Current):** Reactive optimization
- Detect slow queries → recommend fixes

**Phase 2 (Month 2-3):** Predictive optimization
- Analyze query patterns → predict future bottlenecks
- Example: "Course table growing fast → recommend partitioning"

**Phase 3 (Month 4-6):** Autonomous optimization
- Auto-apply low-risk optimizations (cached queries)
- Self-tuning database parameters (shared_buffers, work_mem)
- Proactive schema refactoring suggestions

---

## 📚 Documentation

**Runbooks:**
- `docs/AGENT_WEEKLY_AUDIT_RUNBOOK.md` - How to interpret audit results
- `docs/OPTIMIZATION_PR_REVIEW_GUIDE.md` - How to review AI-generated PRs
- `docs/VANNA_RETRAINING_GUIDE.md` - How to retrain Vanna model

**Monitoring:**
- Grafana Dashboard: "AI Database Architect Metrics"
- Alerts configured in Prometheus

---

## 🚀 Quick Start (Manual Trigger)

**Trigger audit immediately (for testing):**
```bash
# SSH to VPS
ssh root@103.54.153.248

# Trigger cron job manually
docker exec <api-container> curl -X POST http://localhost:3000/admin/database/run-audit

# Monitor logs
docker logs -f <api-container> | grep "DB Architect"

# View results
curl http://103.54.153.248:3001/admin/database/optimizations | jq
```

---

**Status:** 🟢 READY TO DEPLOY  
**First Audit:** Sunday, Dec 29, 2025 @ 2:00 AM  
**Owner:** AI Database Architect Agent + Backend Team
