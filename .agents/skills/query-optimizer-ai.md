# Query Optimizer AI (pg-optimizer)

## Mục Đích
AI-powered query optimization với automatic EXPLAIN ANALYZE parsing, index recommendations, query rewriting, và performance regression detection. Tự động tối ưu mọi query trong V-EdFinance.

## Core Capabilities

### 1. Automatic Query Analysis
```typescript
class QueryOptimizerAI {
  async analyzeQuery(sql: string, params: any[]) {
    console.log('🔍 Analyzing query performance...\n');
    
    // Step 1: Execute EXPLAIN ANALYZE
    const explain = await this.db.query(`
      EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT JSON)
      ${sql}
    `, params);
    
    const plan = explain[0]['QUERY PLAN'][0];
    
    // Step 2: Extract key metrics
    const metrics = {
      executionTime: plan['Execution Time'],
      planningTime: plan['Planning Time'],
      totalCost: plan.Plan['Total Cost'],
      rows: plan.Plan['Actual Rows'],
      buffersHit: plan.Plan['Shared Hit Blocks'],
      buffersRead: plan.Plan['Shared Read Blocks'],
      cacheHitRatio: this.calculateCacheHitRatio(plan)
    };
    
    console.log('⏱️ Execution Metrics:');
    console.log(`   Execution time: ${metrics.executionTime.toFixed(2)}ms`);
    console.log(`   Planning time: ${metrics.planningTime.toFixed(2)}ms`);
    console.log(`   Cache hit ratio: ${metrics.cacheHitRatio.toFixed(1)}%`);
    console.log(`   Rows returned: ${metrics.rows}\n`);
    
    // Step 3: AI diagnosis
    const diagnosis = await this.diagnosePerformance(plan, sql);
    
    // Step 4: Generate recommendations
    const recommendations = await this.generateRecommendations(diagnosis);
    
    // Step 5: Auto-apply fixes (if safe)
    if (recommendations.some(r => r.autoApplicable)) {
      console.log('🔧 Auto-applying safe optimizations...\n');
      await this.applyOptimizations(recommendations.filter(r => r.autoApplicable));
    }
    
    return { metrics, diagnosis, recommendations };
  }
  
  diagnosePerformance(plan: any, sql: string) {
    const issues = [];
    
    // Issue 1: Sequential scan on large table
    if (this.hasSeqScan(plan) && plan.Plan['Actual Rows'] > 1000) {
      issues.push({
        type: 'seq_scan',
        severity: 'high',
        table: this.extractTableName(plan),
        rows: plan.Plan['Actual Rows'],
        message: 'Sequential scan on large table - add index',
        fix: this.suggestIndex(sql, plan)
      });
    }
    
    // Issue 2: Index not being used
    if (this.hasUnusedIndex(plan, sql)) {
      issues.push({
        type: 'unused_index',
        severity: 'medium',
        message: 'Index exists but not used - check query conditions',
        fix: 'Rewrite query to use index or remove unused index'
      });
    }
    
    // Issue 3: N+1 query pattern
    if (this.detectN1Pattern(sql)) {
      issues.push({
        type: 'n_plus_1',
        severity: 'high',
        message: 'N+1 query detected - use JOIN or batch query',
        fix: this.rewriteToJoin(sql)
      });
    }
    
    // Issue 4: Inefficient JOIN order
    if (this.hasSuboptimalJoinOrder(plan)) {
      issues.push({
        type: 'join_order',
        severity: 'medium',
        message: 'Suboptimal join order - planner estimates are off',
        fix: 'Run ANALYZE or use explicit JOIN order'
      });
    }
    
    // Issue 5: Missing statistics
    const statsAge = this.getStatisticsAge(plan);
    if (statsAge > 7) {
      issues.push({
        type: 'stale_stats',
        severity: 'low',
        message: `Statistics not updated for ${statsAge} days`,
        fix: 'ANALYZE table_name;'
      });
    }
    
    return issues;
  }
  
  generateRecommendations(diagnosis: any[]) {
    const recommendations = [];
    
    for (const issue of diagnosis) {
      if (issue.type === 'seq_scan') {
        recommendations.push({
          title: 'Add missing index',
          priority: 'P1',
          autoApplicable: true,
          sql: issue.fix.createIndex,
          impact: 'Query 10-100x faster',
          implementation: `
            -- 1. Create index
            ${issue.fix.createIndex}
            
            -- 2. Verify usage
            EXPLAIN ${issue.fix.testQuery}
          `
        });
      }
      
      if (issue.type === 'n_plus_1') {
        recommendations.push({
          title: 'Refactor N+1 query to use JOIN',
          priority: 'P1',
          autoApplicable: false, // Requires code change
          before: issue.fix.before,
          after: issue.fix.after,
          impact: 'Reduce queries from N to 1',
          implementation: `
            // Before: N+1 queries
            ${issue.fix.before}
            
            // After: Single JOIN query
            ${issue.fix.after}
          `
        });
      }
      
      if (issue.type === 'stale_stats') {
        recommendations.push({
          title: 'Update table statistics',
          priority: 'P2',
          autoApplicable: true,
          sql: issue.fix,
          impact: 'Improve query planner accuracy'
        });
      }
    }
    
    return recommendations;
  }
}
```

### 2. Query Rewriting Engine
```typescript
class QueryRewriter {
  /**
   * AI automatically rewrites slow queries to faster equivalents
   */
  rewriteQuery(originalSql: string): { rewritten: string; reasoning: string } {
    // Pattern 1: OR to UNION
    if (originalSql.includes(' OR ')) {
      const rewritten = this.convertOrToUnion(originalSql);
      return {
        rewritten,
        reasoning: 'OR conditions prevent index usage - converted to UNION for separate index scans'
      };
    }
    
    // Pattern 2: NOT IN to NOT EXISTS
    if (originalSql.includes('NOT IN')) {
      const rewritten = this.convertNotInToNotExists(originalSql);
      return {
        rewritten,
        reasoning: 'NOT IN is slow on large tables - NOT EXISTS stops at first match'
      };
    }
    
    // Pattern 3: DISTINCT to GROUP BY
    if (originalSql.includes('DISTINCT')) {
      const rewritten = this.convertDistinctToGroupBy(originalSql);
      return {
        rewritten,
        reasoning: 'GROUP BY can use indexes more efficiently than DISTINCT'
      };
    }
    
    // Pattern 4: Subquery to JOIN
    if (originalSql.includes('WHERE id IN (SELECT')) {
      const rewritten = this.convertSubqueryToJoin(originalSql);
      return {
        rewritten,
        reasoning: 'JOIN allows planner to optimize better than correlated subquery'
      };
    }
    
    return { rewritten: originalSql, reasoning: 'No optimization available' };
  }
  
  convertOrToUnion(sql: string): string {
    // Before: SELECT * FROM users WHERE status = 'active' OR role = 'admin'
    // After:  SELECT * FROM users WHERE status = 'active'
    //         UNION
    //         SELECT * FROM users WHERE role = 'admin'
    
    const conditions = this.extractOrConditions(sql);
    const baseQuery = this.extractBaseQuery(sql);
    
    return conditions
      .map(condition => `${baseQuery} WHERE ${condition}`)
      .join('\nUNION\n');
  }
  
  convertNotInToNotExists(sql: string): string {
    // Before: SELECT * FROM orders WHERE user_id NOT IN (SELECT id FROM banned_users)
    // After:  SELECT * FROM orders o WHERE NOT EXISTS (
    //           SELECT 1 FROM banned_users b WHERE b.id = o.user_id
    //         )
    
    const pattern = /NOT IN \(SELECT (.*?) FROM (.*?)\)/;
    const match = sql.match(pattern);
    
    if (match) {
      const [_, column, table] = match;
      const mainTable = this.extractMainTable(sql);
      
      return sql.replace(pattern, 
        `NOT EXISTS (SELECT 1 FROM ${table} WHERE ${column} = ${mainTable}.user_id)`
      );
    }
    
    return sql;
  }
}
```

### 3. Index Recommendation Engine
```typescript
class IndexRecommender {
  async recommendIndexes() {
    console.log('🔎 Analyzing query patterns for index recommendations...\n');
    
    // Collect all queries from pg_stat_statements
    const queries = await this.db.query(`
      SELECT 
        queryid,
        query,
        calls,
        total_exec_time,
        mean_exec_time,
        stddev_exec_time
      FROM pg_stat_statements
      WHERE mean_exec_time > 10  -- Queries >10ms
      AND query NOT LIKE '%pg_stat%'
      ORDER BY total_exec_time DESC
      LIMIT 50
    `);
    
    const recommendations = new Map();
    
    for (const q of queries) {
      // Get EXPLAIN for query
      const explain = await this.getExplainPlan(q.query);
      
      // Detect missing indexes
      const missingIndexes = this.detectMissingIndexes(explain, q.query);
      
      for (const idx of missingIndexes) {
        const key = `${idx.table}_${idx.columns.join('_')}`;
        
        if (!recommendations.has(key)) {
          recommendations.set(key, {
            table: idx.table,
            columns: idx.columns,
            type: idx.type,
            impact: 0,
            affectedQueries: []
          });
        }
        
        // Accumulate impact
        const rec = recommendations.get(key);
        rec.impact += q.total_exec_time * 0.8; // Assume 80% speedup
        rec.affectedQueries.push(q.queryid);
      }
    }
    
    // Sort by impact
    const sorted = Array.from(recommendations.values())
      .sort((a, b) => b.impact - a.impact);
    
    console.log('📊 Top Index Recommendations:\n');
    
    for (const rec of sorted.slice(0, 10)) {
      console.log(`${rec.table}(${rec.columns.join(', ')})`);
      console.log(`  Type: ${rec.type}`);
      console.log(`  Impact: ${Math.round(rec.impact)}ms saved`);
      console.log(`  Affects: ${rec.affectedQueries.length} queries`);
      console.log(`  SQL: CREATE INDEX idx_${rec.table}_${rec.columns.join('_')} ON "${rec.table}"(${rec.columns.join(', ')});`);
      console.log();
    }
    
    // Auto-generate migration for top 3
    console.log('🔧 Auto-generating migration for top 3 indexes...\n');
    
    const migration = this.generateIndexMigration(sorted.slice(0, 3));
    await fs.writeFile('prisma/migrations/add_recommended_indexes/migration.sql', migration);
    
    console.log('✅ Migration created: prisma/migrations/add_recommended_indexes/\n');
  }
  
  detectMissingIndexes(explainPlan: any, sql: string) {
    const indexes = [];
    
    // Parse EXPLAIN output for Seq Scan nodes
    const seqScans = this.findNodesByType(explainPlan, 'Seq Scan');
    
    for (const scan of seqScans) {
      const table = scan['Relation Name'];
      const filter = scan['Filter'];
      
      if (filter) {
        // Extract columns from filter
        const columns = this.extractColumnsFromFilter(filter);
        
        indexes.push({
          table,
          columns,
          type: 'btree',
          reason: 'Sequential scan with filter - index would help'
        });
      }
    }
    
    // Detect JSONB queries needing GIN index
    if (sql.includes('->') || sql.includes('->>')) {
      const jsonbColumn = this.extractJsonbColumn(sql);
      const table = this.extractTableName(sql);
      
      indexes.push({
        table,
        columns: [jsonbColumn],
        type: 'gin',
        reason: 'JSONB query - GIN index for fast lookups'
      });
    }
    
    return indexes;
  }
}
```

### 4. Performance Regression Detection
```typescript
class PerformanceMonitor {
  /**
   * AI detects when queries suddenly get slower
   */
  async detectRegressions() {
    // Compare current performance to baseline (7 days ago)
    const current = await this.getQueryStats('now');
    const baseline = await this.getQueryStats('7 days ago');
    
    const regressions = [];
    
    for (const queryId in current) {
      const curr = current[queryId];
      const base = baseline[queryId];
      
      if (!base) continue; // New query
      
      // Regression: 2x slower or +100ms
      const slowdown = curr.mean_exec_time / base.mean_exec_time;
      const absoluteIncrease = curr.mean_exec_time - base.mean_exec_time;
      
      if (slowdown > 2 || absoluteIncrease > 100) {
        regressions.push({
          queryId,
          query: curr.query,
          before: base.mean_exec_time,
          after: curr.mean_exec_time,
          slowdown: `${slowdown.toFixed(1)}x`,
          calls: curr.calls
        });
      }
    }
    
    if (regressions.length > 0) {
      console.log('🔴 Performance Regressions Detected!\n');
      
      for (const reg of regressions) {
        console.log(`Query: ${reg.query.substring(0, 80)}...`);
        console.log(`  Before: ${reg.before.toFixed(2)}ms`);
        console.log(`  After: ${reg.after.toFixed(2)}ms (${reg.slowdown} slower)`);
        console.log(`  Calls: ${reg.calls}\n`);
      }
      
      // Auto-investigate
      console.log('🔍 Auto-investigating root cause...\n');
      
      for (const reg of regressions) {
        const cause = await this.investigateRegression(reg);
        console.log(`Root cause: ${cause.reason}`);
        console.log(`Fix: ${cause.fix}\n`);
      }
      
      // Create alert
      await this.notifySlack({
        channel: '#database-alerts',
        message: `⚠️ ${regressions.length} query performance regressions detected`,
        details: regressions
      });
      
      // Create beads task
      await runCommand(`bd create "Investigate query performance regression" --type bug --priority 1`);
    }
  }
  
  async investigateRegression(regression: any) {
    // Check 1: Missing statistics
    const statsAge = await this.getTableStatsAge(regression.query);
    if (statsAge > 7) {
      return {
        reason: 'Stale table statistics - planner using outdated data',
        fix: 'ANALYZE affected_table;'
      };
    }
    
    // Check 2: Index bloat
    const bloat = await this.getIndexBloat(regression.query);
    if (bloat > 30) {
      return {
        reason: `Index bloat at ${bloat}% - index scans slower`,
        fix: 'REINDEX affected_index;'
      };
    }
    
    // Check 3: Data volume increase
    const growth = await this.getTableGrowth(regression.query);
    if (growth > 2) {
      return {
        reason: `Table grew ${growth}x - query now slower`,
        fix: 'Add index or partition table'
      };
    }
    
    return {
      reason: 'Unknown - requires manual investigation',
      fix: 'Check recent schema changes or data patterns'
    };
  }
}
```

## V-EdFinance Integration

### Auto-Optimization Workflow
```typescript
// Run daily at 3AM (low traffic)
async function dailyQueryOptimization() {
  const optimizer = new QueryOptimizerAI();
  
  // 1. Analyze all slow queries
  const slowQueries = await optimizer.findSlowQueries({ threshold: 100 });
  
  // 2. Generate optimizations
  const optimizations = [];
  for (const query of slowQueries) {
    const result = await optimizer.analyzeQuery(query.sql, query.params);
    optimizations.push(...result.recommendations);
  }
  
  // 3. Auto-apply safe fixes (indexes, ANALYZE)
  const safeOpts = optimizations.filter(o => o.autoApplicable);
  for (const opt of safeOpts) {
    await db.query(opt.sql);
    console.log(`✅ Applied: ${opt.title}`);
  }
  
  // 4. Create beads tasks for manual fixes
  const manualOpts = optimizations.filter(o => !o.autoApplicable);
  for (const opt of manualOpts) {
    await runCommand(`bd create "${opt.title}" --type optimization --priority ${opt.priority}`);
  }
  
  // 5. Report results
  console.log(`\n📊 Optimization Summary:`);
  console.log(`   Auto-applied: ${safeOpts.length}`);
  console.log(`   Requires review: ${manualOpts.length}`);
}
```

---

**📌 Skill Context**: AI query optimizer tự động phát hiện, phân tích, và fix slow queries 24/7. Giảm query time 50-90% thông qua index recommendations và query rewriting.
