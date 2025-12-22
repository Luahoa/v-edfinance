# PostgreSQL DBA Pro - AI Rules

## Mục Đích
AI-powered database administration workflows cho PostgreSQL, cung cấp expert-level DBA knowledge về query optimization, index management, vacuum strategies, và performance tuning.

## Core Workflows

### 1. Automatic Query Optimization
```typescript
class PostgresQueryOptimizer {
  async analyzeSlowQueries() {
    // Fetch từ pg_stat_statements
    const slowQueries = await this.db.query(`
      SELECT 
        query,
        calls,
        total_exec_time,
        mean_exec_time,
        stddev_exec_time,
        rows,
        100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS cache_hit_ratio
      FROM pg_stat_statements
      WHERE mean_exec_time > 100  -- Queries > 100ms
      ORDER BY total_exec_time DESC
      LIMIT 20
    `);
    
    // AI phân tích từng query
    for (const query of slowQueries) {
      const diagnosis = await this.diagnoseQuery(query);
      
      if (diagnosis.issue === 'missing_index') {
        console.log(`🔍 Missing index detected:`);
        console.log(`Query: ${query.query}`);
        console.log(`Suggested index: ${diagnosis.suggestedIndex}`);
        console.log(`Expected speedup: ${diagnosis.expectedSpeedup}x`);
        
        // Auto-generate migration
        await this.generateIndexMigration({
          table: diagnosis.table,
          columns: diagnosis.columns,
          type: diagnosis.indexType // btree, gin, gist, brin
        });
      }
      
      if (diagnosis.issue === 'seq_scan') {
        console.log(`⚠️ Sequential scan on large table:`);
        console.log(`Table: ${diagnosis.table} (${diagnosis.rowCount} rows)`);
        console.log(`Query: ${query.query}`);
        console.log(`Add WHERE clause or use index on: ${diagnosis.filterColumns}`);
      }
      
      if (diagnosis.issue === 'n_plus_1') {
        console.log(`🔄 N+1 query detected:`);
        console.log(`Query called ${query.calls} times with similar pattern`);
        console.log(`Refactor suggestion: Use JOIN or batch query`);
        console.log(`Potential savings: ${query.total_exec_time * 0.9}ms`);
      }
    }
  }
  
  async diagnoseQuery(queryStats: any) {
    // Get EXPLAIN ANALYZE
    const explainResult = await this.db.query(`EXPLAIN (ANALYZE, BUFFERS) ${queryStats.query}`);
    
    // Parse execution plan
    const plan = this.parseExplainPlan(explainResult);
    
    // AI reasoning
    if (plan.includes('Seq Scan') && queryStats.rows > 10000) {
      return {
        issue: 'seq_scan',
        table: this.extractTableName(plan),
        rowCount: queryStats.rows,
        filterColumns: this.extractWhereColumns(queryStats.query)
      };
    }
    
    if (plan.includes('Index Scan') === false && queryStats.calls > 100) {
      const columns = this.extractFilterColumns(queryStats.query);
      return {
        issue: 'missing_index',
        table: this.extractTableName(queryStats.query),
        columns,
        indexType: this.recommendIndexType(columns, plan),
        suggestedIndex: `CREATE INDEX idx_${columns.join('_')} ON ${table}(${columns.join(', ')})`,
        expectedSpeedup: this.estimateSpeedup(plan)
      };
    }
    
    if (queryStats.calls > 1000 && queryStats.mean_exec_time < 10) {
      return {
        issue: 'n_plus_1',
        occurrences: queryStats.calls,
        pattern: this.detectQueryPattern(queryStats.query)
      };
    }
    
    return { issue: 'none' };
  }
}
```

### 2. Index Recommendation Engine
```typescript
class IndexRecommendationEngine {
  async analyzeIndexCoverage() {
    // Kiểm tra index hiện có
    const existingIndexes = await this.db.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef,
        pg_size_pretty(pg_relation_size(indexrelid)) as size,
        idx_scan as scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched
      FROM pg_stat_user_indexes
      JOIN pg_indexes ON indexname = indexrelname
      ORDER BY idx_scan ASC
    `);
    
    // Unused indexes (candidates for removal)
    const unusedIndexes = existingIndexes.filter(idx => 
      idx.scans < 10 && idx.size > '1 MB'
    );
    
    console.log('🗑️ Unused indexes (safe to remove):');
    for (const idx of unusedIndexes) {
      console.log(`  ${idx.indexname} on ${idx.tablename} (${idx.size}, ${idx.scans} scans)`);
      console.log(`  DROP INDEX ${idx.indexname};`);
    }
    
    // Missing indexes (from query patterns)
    const missingIndexes = await this.detectMissingIndexes();
    
    console.log('➕ Recommended new indexes:');
    for (const rec of missingIndexes) {
      console.log(`  ${rec.table}.${rec.columns.join(', ')}`);
      console.log(`  ${rec.createStatement}`);
      console.log(`  Impact: ${rec.affectedQueries} queries, ${rec.estimatedSpeedup}x faster`);
    }
  }
  
  async detectMissingIndexes() {
    // Analyze query patterns from pg_stat_statements
    const queries = await this.db.query(`
      SELECT query, calls, mean_exec_time
      FROM pg_stat_statements
      WHERE mean_exec_time > 50
      AND query NOT LIKE '%pg_stat%'
    `);
    
    const recommendations = [];
    
    for (const q of queries) {
      const whereColumns = this.extractWhereColumns(q.query);
      const orderByColumns = this.extractOrderByColumns(q.query);
      const joinColumns = this.extractJoinColumns(q.query);
      
      // Recommend composite index for WHERE + ORDER BY
      if (whereColumns.length > 0 && orderByColumns.length > 0) {
        const columns = [...whereColumns, ...orderByColumns];
        const table = this.extractTableName(q.query);
        
        // Check if index already exists
        const exists = await this.checkIndexExists(table, columns);
        if (!exists) {
          recommendations.push({
            table,
            columns,
            type: 'btree',
            createStatement: `CREATE INDEX idx_${table}_${columns.join('_')} ON ${table}(${columns.join(', ')})`,
            affectedQueries: q.calls,
            estimatedSpeedup: this.calculateSpeedup(q.mean_exec_time, columns.length)
          });
        }
      }
      
      // Recommend GIN index for JSONB queries
      if (q.query.includes('->') || q.query.includes('->>')) {
        const jsonbColumn = this.extractJsonbColumn(q.query);
        recommendations.push({
          table: this.extractTableName(q.query),
          columns: [jsonbColumn],
          type: 'gin',
          createStatement: `CREATE INDEX idx_${jsonbColumn}_gin ON ${table} USING gin(${jsonbColumn})`,
          affectedQueries: q.calls,
          estimatedSpeedup: 10 // JSONB queries benefit greatly
        });
      }
    }
    
    return recommendations;
  }
}
```

### 3. Vacuum & Maintenance Automation
```typescript
class VacuumAutomation {
  async analyzeTableBloat() {
    const bloatQuery = `
      SELECT
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS bloat,
        round(100 * (pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename))::numeric / 
          nullif(pg_total_relation_size(schemaname||'.'||tablename), 0), 2) AS bloat_pct,
        n_dead_tup,
        n_live_tup,
        round(100 * n_dead_tup::numeric / nullif(n_live_tup, 0), 2) AS dead_pct,
        last_vacuum,
        last_autovacuum
      FROM pg_stat_user_tables
      WHERE n_live_tup > 0
      ORDER BY bloat_pct DESC
    `;
    
    const results = await this.db.query(bloatQuery);
    
    for (const table of results) {
      // High bloat = needs VACUUM FULL
      if (table.bloat_pct > 30) {
        console.log(`🔴 CRITICAL: ${table.tablename} has ${table.bloat_pct}% bloat`);
        console.log(`   Size: ${table.size}, Bloat: ${table.bloat}`);
        console.log(`   Action: VACUUM FULL ${table.tablename};`);
        console.log(`   ⚠️ Warning: VACUUM FULL locks table, run during maintenance window`);
      }
      
      // Many dead tuples = needs VACUUM
      else if (table.dead_pct > 20) {
        console.log(`🟡 ${table.tablename} has ${table.dead_pct}% dead tuples`);
        console.log(`   Action: VACUUM ANALYZE ${table.tablename};`);
      }
      
      // Not vacuumed recently
      const daysSinceVacuum = this.daysSince(table.last_vacuum || table.last_autovacuum);
      if (daysSinceVacuum > 7) {
        console.log(`⏰ ${table.tablename} not vacuumed for ${daysSinceVacuum} days`);
        console.log(`   Action: VACUUM ANALYZE ${table.tablename};`);
      }
    }
  }
  
  async setupAutovacuumTuning() {
    // AI recommends autovacuum settings based on table size & activity
    const tables = await this.db.query(`
      SELECT 
        schemaname || '.' || tablename as full_name,
        n_tup_ins + n_tup_upd + n_tup_del as modifications_per_day,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
      FROM pg_stat_user_tables
    `);
    
    for (const table of tables) {
      const sizeGB = table.size_bytes / (1024**3);
      const modsPerDay = table.modifications_per_day;
      
      // High-activity tables: aggressive autovacuum
      if (modsPerDay > 100000 || sizeGB > 10) {
        console.log(`ALTER TABLE ${table.full_name} SET (
          autovacuum_vacuum_scale_factor = 0.05,
          autovacuum_analyze_scale_factor = 0.02,
          autovacuum_vacuum_cost_delay = 10
        );`);
      }
      
      // JSONB-heavy tables: more aggressive
      const hasJsonb = await this.tableHasJsonb(table.full_name);
      if (hasJsonb) {
        console.log(`-- JSONB table ${table.full_name}: more frequent vacuum`);
        console.log(`ALTER TABLE ${table.full_name} SET (
          autovacuum_vacuum_scale_factor = 0.02
        );`);
      }
    }
  }
}
```

### 4. Connection Pool Optimization
```typescript
class ConnectionPoolOptimizer {
  async analyzeConnectionUsage() {
    const stats = await this.db.query(`
      SELECT 
        state,
        count(*) as connections,
        max(now() - state_change) as max_duration
      FROM pg_stat_activity
      WHERE datname = current_database()
      GROUP BY state
    `);
    
    const maxConnections = await this.db.query(`SHOW max_connections`);
    const currentTotal = stats.reduce((sum, s) => sum + s.connections, 0);
    
    console.log(`📊 Connection Pool Status:`);
    console.log(`   Total: ${currentTotal} / ${maxConnections[0].max_connections}`);
    
    for (const s of stats) {
      console.log(`   ${s.state}: ${s.connections} (max duration: ${s.max_duration})`);
    }
    
    // Detect connection leaks
    const idleInTransaction = stats.find(s => s.state === 'idle in transaction');
    if (idleInTransaction && idleInTransaction.connections > 5) {
      console.log(`⚠️ WARNING: ${idleInTransaction.connections} idle in transaction`);
      console.log(`   Possible connection leak in application code`);
      console.log(`   Check: await prisma.$disconnect() after operations`);
    }
    
    // Recommend pool size
    const recommended = this.calculateOptimalPoolSize({
      maxConnections: maxConnections[0].max_connections,
      activeQueries: stats.find(s => s.state === 'active')?.connections || 0,
      cpuCores: 4 // VPS cores
    });
    
    console.log(`\n💡 Recommended Prisma pool size:`);
    console.log(`   connection_limit = ${recommended.connectionLimit}`);
    console.log(`   pool_timeout = ${recommended.poolTimeout}`);
  }
  
  calculateOptimalPoolSize(config: any) {
    // Formula: (core_count * 2) + effective_spindle_count
    // For VPS: conservative approach
    const connectionLimit = Math.min(
      config.cpuCores * 2 + 1,
      Math.floor(config.maxConnections * 0.8) // Leave 20% for admin
    );
    
    return {
      connectionLimit,
      poolTimeout: 60, // seconds
      statementTimeout: 30000 // 30s max query time
    };
  }
}
```

## V-EdFinance PostgreSQL Health Checks

### Weekly Automated DBA Report
```typescript
async function weeklyDbaReport() {
  console.log('📋 V-EdFinance PostgreSQL Health Report\n');
  
  // 1. Database size trend
  const dbSize = await db.query(`
    SELECT pg_size_pretty(pg_database_size(current_database())) as size
  `);
  console.log(`Database size: ${dbSize[0].size}`);
  
  // 2. Top 10 largest tables
  const largestTables = await db.query(`
    SELECT 
      tablename,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    LIMIT 10
  `);
  console.log('\nTop 10 largest tables:');
  largestTables.forEach(t => console.log(`  ${t.tablename}: ${t.size}`));
  
  // 3. Slow queries summary
  const slowQueryCount = await db.query(`
    SELECT count(*) as count
    FROM pg_stat_statements
    WHERE mean_exec_time > 100
  `);
  console.log(`\nSlow queries (>100ms): ${slowQueryCount[0].count}`);
  
  // 4. Index health
  const indexHealth = await db.query(`
    SELECT 
      count(*) FILTER (WHERE idx_scan = 0) as unused,
      count(*) as total
    FROM pg_stat_user_indexes
  `);
  console.log(`Unused indexes: ${indexHealth[0].unused} / ${indexHealth[0].total}`);
  
  // 5. Cache hit ratio
  const cacheHit = await db.query(`
    SELECT 
      round(100.0 * sum(blks_hit) / nullif(sum(blks_hit) + sum(blks_read), 0), 2) as ratio
    FROM pg_stat_database
    WHERE datname = current_database()
  `);
  console.log(`Cache hit ratio: ${cacheHit[0].ratio}%`);
  
  // 6. Recommendations
  console.log('\n💡 Recommendations:');
  
  if (cacheHit[0].ratio < 95) {
    console.log('  - Increase shared_buffers (current cache hit < 95%)');
  }
  
  if (indexHealth[0].unused > 5) {
    console.log(`  - Remove ${indexHealth[0].unused} unused indexes to save space`);
  }
  
  if (slowQueryCount[0].count > 20) {
    console.log('  - Review and optimize slow queries (>20 detected)');
  }
  
  // Create beads task for issues
  await runCommand(`bd create "Weekly DBA optimization" --type maintenance --priority 2`);
}
```

## Integration with Triple-ORM Strategy

```typescript
// AI ensures consistent performance across Prisma, Drizzle, Kysely
class TripleOrmPerformanceMonitor {
  async compareOrmPerformance() {
    const testQuery = 'SELECT * FROM "BehaviorLog" WHERE userId = $1 LIMIT 10';
    
    // Benchmark Prisma
    const prismaStart = Date.now();
    await prisma.behaviorLog.findMany({ where: { userId: 'test' }, take: 10 });
    const prismaTime = Date.now() - prismaStart;
    
    // Benchmark Drizzle
    const drizzleStart = Date.now();
    await db.select().from(behaviorLog).where(eq(behaviorLog.userId, 'test')).limit(10);
    const drizzleTime = Date.now() - drizzleStart;
    
    // Benchmark Kysely
    const kyselyStart = Date.now();
    await kysely.selectFrom('BehaviorLog').where('userId', '=', 'test').limit(10).execute();
    const kyselyTime = Date.now() - kyselyStart;
    
    console.log('⚡ ORM Performance Comparison:');
    console.log(`  Prisma:  ${prismaTime}ms`);
    console.log(`  Drizzle: ${drizzleTime}ms (${((prismaTime - drizzleTime) / prismaTime * 100).toFixed(1)}% faster)`);
    console.log(`  Kysely:  ${kyselyTime}ms`);
    
    // AI recommends ORM for each use case
    console.log('\n📊 Recommended ORM usage:');
    console.log('  - Migrations: Prisma (source of truth)');
    console.log('  - Simple CRUD: Drizzle (fastest)');
    console.log('  - Complex analytics: Kysely (most flexible)');
  }
}
```

---

**📌 Skill Context**: AI hoạt động như senior PostgreSQL DBA với 10+ years experience, tự động detect và fix performance issues, recommend indexes, và maintain database health.
