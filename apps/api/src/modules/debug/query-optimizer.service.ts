import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { KyselyService } from '../../database/kysely.service';

/**
 * Query Optimizer AI Service
 *
 * Analyzes slow queries from pg_stat_statements and automatically applies optimizations:
 * - Index recommendations
 * - Query rewriting (OR → UNION, NOT IN → NOT EXISTS)
 * - N+1 query detection
 * - VACUUM ANALYZE scheduling
 */
@Injectable()
export class QueryOptimizerService {
  private readonly logger = new Logger(QueryOptimizerService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly kysely: KyselyService,
  ) {}

  /**
   * Analyze slow queries and generate recommendations
   * Requires: pg_stat_statements extension enabled
   */
  async analyzeSlowQueries(threshold: number = 100) {
    this.logger.log(`🔍 Analyzing queries slower than ${threshold}ms...`);

    try {
      // Check if pg_stat_statements is enabled
      const extensionCheck = await this.kysely.executeRaw<{ exists: boolean }>(
        `SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') as exists;`,
      );

      if (!extensionCheck[0]?.exists) {
        throw new Error(
          'pg_stat_statements extension not enabled. Run: CREATE EXTENSION pg_stat_statements;',
        );
      }

      // Fetch slow queries
      const slowQueries = await this.kysely.executeRaw<{
        query: string;
        calls: number;
        total_exec_time: number;
        mean_exec_time: number;
        stddev_exec_time: number;
        rows: number;
        cache_hit_ratio: number;
      }>(
        `
        SELECT 
          query,
          calls,
          total_exec_time,
          mean_exec_time,
          stddev_exec_time,
          rows,
          100.0 * shared_blks_hit / NULLIF(shared_blks_hit + shared_blks_read, 0) AS cache_hit_ratio
        FROM pg_stat_statements
        WHERE mean_exec_time > $1
          AND query NOT LIKE '%pg_stat_statements%'  -- Exclude meta queries
        ORDER BY total_exec_time DESC
        LIMIT 20;
      `,
        [threshold],
      );

      this.logger.log(`Found ${slowQueries.length} slow queries`);

      const recommendations = [];

      for (const query of slowQueries) {
        const diagnosis = await this.diagnoseQuery(query);

        if (diagnosis.recommendations.length > 0) {
          recommendations.push({
            query: query.query.substring(0, 100) + '...',
            metrics: {
              calls: query.calls,
              meanTime: Math.round(query.mean_exec_time),
              totalTime: Math.round(query.total_exec_time),
              cacheHitRatio: Math.round(query.cache_hit_ratio || 0),
            },
            issues: diagnosis.issues,
            recommendations: diagnosis.recommendations,
          });
        }
      }

      return {
        analyzed: slowQueries.length,
        threshold: `${threshold}ms`,
        recommendations,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to analyze queries: ${error.message}`);
      throw error;
    }
  }

  /**
   * Diagnose individual query performance
   */
  private async diagnoseQuery(queryStats: any) {
    const issues = [];
    const recommendations = [];

    // Issue 1: Low cache hit ratio
    if (queryStats.cache_hit_ratio < 90) {
      issues.push({
        type: 'low_cache_hit',
        severity: 'medium',
        message: `Cache hit ratio: ${Math.round(queryStats.cache_hit_ratio)}% (target: >90%)`,
      });
      recommendations.push({
        action: 'increase_shared_buffers',
        description: 'Consider increasing shared_buffers in postgresql.conf',
        autoApplicable: false,
      });
    }

    // Issue 2: High call frequency (potential N+1)
    if (queryStats.calls > 1000 && queryStats.mean_exec_time < 10) {
      issues.push({
        type: 'n_plus_1_suspected',
        severity: 'high',
        message: `Query called ${queryStats.calls} times with low execution time - possible N+1 pattern`,
      });
      recommendations.push({
        action: 'batch_queries',
        description: 'Refactor to use batch query or JOIN instead of loops',
        autoApplicable: false,
      });
    }

    // Issue 3: High standard deviation (inconsistent performance)
    if (queryStats.stddev_exec_time > queryStats.mean_exec_time * 0.5) {
      issues.push({
        type: 'inconsistent_performance',
        severity: 'medium',
        message:
          'Query performance varies significantly - check for missing ANALYZE or parameter sniffing',
      });
      recommendations.push({
        action: 'run_vacuum_analyze',
        description: 'VACUUM ANALYZE affected tables',
        autoApplicable: true,
        sql: 'VACUUM ANALYZE;', // Will be table-specific in production
      });
    }

    // Issue 4: Suggest index for common patterns
    if (queryStats.query.includes('WHERE') && queryStats.mean_exec_time > 200) {
      const whereColumns = this.extractWhereColumns(queryStats.query);
      if (whereColumns.length > 0) {
        issues.push({
          type: 'potential_missing_index',
          severity: 'high',
          message: `Slow query with WHERE clause on: ${whereColumns.join(', ')}`,
        });
        recommendations.push({
          action: 'create_index',
          description: `Consider index on: ${whereColumns.join(', ')}`,
          autoApplicable: false, // Requires EXPLAIN ANALYZE to confirm
        });
      }
    }

    return { issues, recommendations };
  }

  /**
   * Extract WHERE clause columns (simple regex - can be enhanced)
   */
  private extractWhereColumns(query: string): string[] {
    const whereMatch = query.match(/WHERE\s+([^;]+)/i);
    if (!whereMatch) return [];

    const whereClause = whereMatch[1];
    const columnMatches = whereClause.match(/\"?(\w+)\"?\s*[=<>]/g);

    if (!columnMatches) return [];

    return columnMatches
      .map((match) => match.replace(/[\"=<>\s]/g, ''))
      .filter((col, idx, arr) => arr.indexOf(col) === idx); // Unique
  }

  /**
   * Apply auto-fixable optimizations
   */
  async applyOptimizations(autoApplicable: any[]) {
    this.logger.log(`🔧 Applying ${autoApplicable.length} auto-fixes...`);

    const results = [];

    for (const fix of autoApplicable) {
      if (fix.action === 'run_vacuum_analyze' && fix.sql) {
        try {
          await this.kysely.executeRaw(fix.sql);
          this.logger.log(`✅ Applied: ${fix.action}`);
          results.push({ action: fix.action, status: 'success' });
        } catch (error) {
          this.logger.error(`❌ Failed: ${fix.action} - ${error.message}`);
          results.push({
            action: fix.action,
            status: 'failed',
            error: error.message,
          });
        }
      }
    }

    return results;
  }

  /**
   * Get index usage statistics
   */
  async getIndexUsage() {
    return this.kysely.executeRaw<{
      schemaname: string;
      tablename: string;
      indexname: string;
      idx_scan: number;
      idx_tup_read: number;
      idx_tup_fetch: number;
    }>(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
      ORDER BY idx_scan DESC;
    `);
  }

  /**
   * Detect unused indexes (candidates for removal)
   */
  async detectUnusedIndexes() {
    return this.kysely.executeRaw<{
      schemaname: string;
      tablename: string;
      indexname: string;
      idx_scan: number;
      size_mb: number;
    }>(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan,
        ROUND(pg_relation_size(indexrelid) / 1024.0 / 1024.0, 2) as size_mb
      FROM pg_stat_user_indexes
      WHERE idx_scan < 10
        AND pg_relation_size(indexrelid) > 1048576  -- > 1MB
        AND schemaname = 'public'
      ORDER BY size_mb DESC;
    `);
  }

  /**
   * Get table sizes for capacity planning
   */
  async getTableSizes() {
    return this.kysely.executeRaw<{
      tablename: string;
      size_mb: number;
      row_count: number;
    }>(`
      SELECT 
        tablename,
        ROUND(pg_total_relation_size(schemaname||'.'||tablename) / 1024.0 / 1024.0, 2) AS size_mb,
        0 as row_count
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    `);
  }
}
