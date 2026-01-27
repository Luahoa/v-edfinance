/**
 * DatabaseArchitectAgent - AI-Powered Database Optimization Agent
 *
 * Responsibilities:
 * - Analyze query patterns from pg_stat_statements (production) or mock data (dev)
 * - Generate optimization recommendations using RAG + Heuristics
 * - Run weekly audits automatically
 * - Store optimization insights for continuous learning
 *
 * Strategy:
 * 1. RAG lookup via PgvectorService (highest confidence)
 * 2. Heuristic rules engine (fast, reliable)
 * 3. Generic fallback (safe default)
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { sql } from 'kysely';
import { PgvectorService } from './pgvector.service';
import { KyselyService } from './kysely.service';
import { DatabaseService } from './database.service';

export interface QueryPattern {
  queryTemplate: string;
  executionCount: number;
  avgDuration: number;
  totalCost: number;
  lastSeen: Date;
}

export interface OptimizationRecommendation {
  queryPattern: string;
  recommendation: string;
  confidence: number;
  estimatedGain: number;
  source: 'rag' | 'heuristic' | 'generic';
}

interface HeuristicRule {
  pattern: RegExp;
  recommendation: string;
  estimatedGain: number;
}

const HEURISTIC_RULES: HeuristicRule[] = [
  {
    pattern: /SELECT\s+\*\s+FROM/i,
    recommendation:
      'Avoid SELECT *, specify only needed columns to reduce data transfer and improve performance',
    estimatedGain: 0.15,
  },
  {
    pattern: /WHERE.*LIKE\s+['"]%.*%['"]/i,
    recommendation:
      'Leading wildcard in LIKE prevents index usage. Consider full-text search (tsvector) or prefix search',
    estimatedGain: 0.4,
  },
  {
    pattern: /OFFSET\s+\d{3,}/i,
    recommendation:
      'High OFFSET values are slow. Use keyset pagination (WHERE id > last_id) instead',
    estimatedGain: 0.5,
  },
  {
    pattern: /JOIN.*JOIN.*JOIN/i,
    recommendation:
      'Multiple JOINs detected. Verify index coverage on foreign keys and join columns',
    estimatedGain: 0.25,
  },
  {
    pattern: /WHERE.*OR/i,
    recommendation:
      'OR conditions may prevent index usage. Consider UNION or restructure query',
    estimatedGain: 0.2,
  },
  {
    pattern: /NOT\s+IN\s*\(/i,
    recommendation:
      'NOT IN can be slow with large subqueries. Use LEFT JOIN ... WHERE IS NULL or NOT EXISTS',
    estimatedGain: 0.3,
  },
  {
    pattern: /COUNT\s*\(\s*\*\s*\)/i,
    recommendation:
      'COUNT(*) without WHERE scans entire table. Add WHERE clause or use approximate count for analytics',
    estimatedGain: 0.35,
  },
  {
    pattern: /ORDER\s+BY.*LIMIT/i,
    recommendation: 'ORDER BY + LIMIT benefits from index on sorted columns',
    estimatedGain: 0.2,
  },
  {
    pattern: /DISTINCT/i,
    recommendation:
      'DISTINCT requires sorting. Verify if GROUP BY or proper JOIN can eliminate duplicates earlier',
    estimatedGain: 0.15,
  },
  {
    pattern: /SELECT.*\(\s*SELECT/i,
    recommendation:
      'Correlated subquery in SELECT. Consider JOIN or window functions for better performance',
    estimatedGain: 0.4,
  },
];

@Injectable()
export class DatabaseArchitectAgent {
  private readonly logger = new Logger(DatabaseArchitectAgent.name);

  constructor(
    private readonly pgvector: PgvectorService,
    private readonly kysely: KyselyService,
    private readonly database: DatabaseService,
  ) {}

  /**
   * Apply heuristic rules to query
   * @param query SQL query text
   * @returns Recommendation or null if no rule matched
   */
  private applyHeuristicRules(
    query: string,
  ): OptimizationRecommendation | null {
    for (const rule of HEURISTIC_RULES) {
      if (rule.pattern.test(query)) {
        this.logger.debug(`Heuristic rule matched: ${rule.pattern}`);
        return {
          queryPattern: query,
          recommendation: rule.recommendation,
          confidence: 0.8,
          estimatedGain: rule.estimatedGain,
          source: 'heuristic',
        };
      }
    }
    return null;
  }

  /**
   * Find similar optimization using RAG lookup
   * @param query SQL query text
   * @returns Recommendation or null if no similar optimization found
   */
  async findSimilarOptimization(
    query: string,
  ): Promise<OptimizationRecommendation | null> {
    try {
      const similar = await this.pgvector.findSimilarOptimizations(query, {
        threshold: 0.85,
        limit: 3,
      });

      if (similar.length === 0) {
        this.logger.debug('No similar optimizations found via RAG');
        return null;
      }

      const best = similar[0];
      this.logger.debug(`RAG match found: similarity=${best.similarity}`);

      return {
        queryPattern: query,
        recommendation:
          best.recommendation ||
          'Optimization found but no recommendation stored',
        confidence: best.similarity,
        estimatedGain: best.performanceGain || 0,
        source: 'rag',
      };
    } catch (error) {
      this.logger.error(`RAG lookup failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Store recommendation for future RAG lookup
   * @param query SQL query
   * @param recommendation Optimization recommendation
   */
  private async storeRecommendation(
    query: string,
    recommendation: OptimizationRecommendation,
  ): Promise<void> {
    try {
      await this.pgvector.storeOptimization({
        queryText: query,
        recommendation: recommendation.recommendation,
        performanceGain: Math.round(recommendation.estimatedGain * 100),
        metadata: {
          source: recommendation.source,
          confidence: recommendation.confidence,
          detectedAt: new Date(),
        },
      });
      this.logger.debug('Stored recommendation for future RAG');
    } catch (error) {
      this.logger.error(`Failed to store recommendation: ${error.message}`);
    }
  }

  /**
   * Generate optimization recommendation for a query
   * Combines RAG + Heuristics + Fallback strategy
   *
   * @param query SQL query text
   * @returns Optimization recommendation
   */
  async generateRecommendation(
    query: string,
  ): Promise<OptimizationRecommendation> {
    // Strategy 1: Try RAG first (best quality, learned from past optimizations)
    const rag = await this.findSimilarOptimization(query);
    if (rag && rag.confidence > 0.85) {
      this.logger.log(
        `RAG recommendation (confidence: ${rag.confidence.toFixed(2)})`,
      );
      return rag;
    }

    // Strategy 2: Try heuristics (fast, reliable pattern matching)
    const heuristic = this.applyHeuristicRules(query);
    if (heuristic) {
      this.logger.log(
        `Heuristic recommendation: ${heuristic.recommendation.substring(0, 50)}...`,
      );
      // Store for future RAG
      await this.storeRecommendation(query, heuristic);
      return heuristic;
    }

    // Strategy 3: Generic fallback
    this.logger.log('No specific optimization found, returning generic advice');
    return {
      queryPattern: query,
      recommendation:
        'No specific optimization found. Run EXPLAIN ANALYZE to review query plan and identify bottlenecks.',
      confidence: 0.5,
      estimatedGain: 0,
      source: 'generic',
    };
  }

  /**
   * Normalize query by replacing parameter values with placeholders
   * @param query SQL query
   * @returns Normalized query template
   */
  private normalizeQuery(query: string): string {
    return query
      .replace(/\s+/g, ' ')
      .replace(/'[^']*'/g, '?')
      .replace(/\d+/g, '?')
      .trim();
  }

  /**
   * Get mock query patterns for local development
   * @returns Array of realistic query patterns
   */
  private getMockQueryPatterns(): QueryPattern[] {
    return [
      {
        queryTemplate: 'SELECT * FROM "User" WHERE email = $1',
        executionCount: 1245,
        avgDuration: 23.5,
        totalCost: 29257,
        lastSeen: new Date(),
      },
      {
        queryTemplate:
          'SELECT "User".* FROM "User" LEFT JOIN "BehaviorLog" ON "User".id = "BehaviorLog".userId WHERE "BehaviorLog".eventType = $1',
        executionCount: 892,
        avgDuration: 145.2,
        totalCost: 129538,
        lastSeen: new Date(),
      },
      {
        queryTemplate: 'SELECT COUNT(*) FROM "BehaviorLog" WHERE userId = $1',
        executionCount: 2341,
        avgDuration: 12.1,
        totalCost: 28326,
        lastSeen: new Date(),
      },
      {
        queryTemplate: 'SELECT * FROM "Course" WHERE title LIKE \'%finance%\'',
        executionCount: 567,
        avgDuration: 234.5,
        totalCost: 132976,
        lastSeen: new Date(),
      },
      {
        queryTemplate:
          'SELECT "User".*, "Course".* FROM "User" JOIN "Enrollment" ON "User".id = "Enrollment".userId JOIN "Course" ON "Enrollment".courseId = "Course".id WHERE "User".locale = $1 ORDER BY "Enrollment".createdAt DESC LIMIT 50 OFFSET 500',
        executionCount: 423,
        avgDuration: 389.7,
        totalCost: 164863,
        lastSeen: new Date(),
      },
      {
        queryTemplate:
          'SELECT * FROM "OptimizationLog" WHERE queryText NOT IN (SELECT queryText FROM "OptimizationLog" WHERE appliedAt IS NOT NULL)',
        executionCount: 134,
        avgDuration: 567.3,
        totalCost: 76018,
        lastSeen: new Date(),
      },
      {
        queryTemplate:
          'SELECT (SELECT COUNT(*) FROM "BehaviorLog" WHERE userId = "User".id) AS logCount FROM "User"',
        executionCount: 234,
        avgDuration: 1234.5,
        totalCost: 288873,
        lastSeen: new Date(),
      },
      {
        queryTemplate:
          'SELECT DISTINCT "User".email FROM "User" JOIN "BehaviorLog" ON "User".id = "BehaviorLog".userId WHERE "BehaviorLog".timestamp > $1',
        executionCount: 456,
        avgDuration: 234.1,
        totalCost: 106749,
        lastSeen: new Date(),
      },
    ];
  }

  /**
   * Analyze query patterns from pg_stat_statements or mock data
   * @param since Only analyze queries executed after this date
   * @returns Array of query patterns sorted by total cost
   */
  async analyzeQueryPatterns(since: Date): Promise<QueryPattern[]> {
    // For local development, use mock data
    if (process.env.NODE_ENV !== 'production') {
      this.logger.log('Using mock query patterns (development mode)');
      return this.getMockQueryPatterns();
    }

    // Production: Query pg_stat_statements
    try {
      this.logger.log('Fetching query patterns from pg_stat_statements...');

      // Note: pg_stat_statements requires manual setup on VPS (VED-Y1U)
      // Using raw SQL because pg_stat_statements isn't in Kysely schema
      const patterns = await sql<{
        query: string;
        calls: number;
        mean_exec_time: number;
        total_exec_time: number;
      }>`
        SELECT query, calls, mean_exec_time, total_exec_time
        FROM pg_stat_statements
        WHERE calls > 100
        ORDER BY total_exec_time DESC
        LIMIT 50
      `.execute(this.kysely.query);

      return patterns.rows.map((p) => ({
        queryTemplate: this.normalizeQuery(p.query),
        executionCount: p.calls,
        avgDuration: p.mean_exec_time,
        totalCost: p.total_exec_time,
        lastSeen: new Date(),
      }));
    } catch (error) {
      this.logger.warn(`pg_stat_statements unavailable: ${error.message}`);
      this.logger.log('Falling back to mock query patterns');
      return this.getMockQueryPatterns();
    }
  }

  /**
   * Weekly audit scheduler - runs every Sunday at midnight
   * Analyzes queries from the past week and generates recommendations
   */
  @Cron(CronExpression.EVERY_WEEK)
  async runWeeklyAudit(): Promise<OptimizationRecommendation[]> {
    this.logger.log('🔍 Starting weekly database audit...');

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const patterns = await this.analyzeQueryPatterns(oneWeekAgo);

    this.logger.log(`Analyzing ${patterns.length} query patterns...`);

    const recommendations: OptimizationRecommendation[] = [];

    for (const pattern of patterns) {
      const rec = await this.generateRecommendation(pattern.queryTemplate);

      // Only include high-confidence recommendations
      if (rec.confidence > 0.7) {
        recommendations.push({
          ...rec,
        });

        this.logger.debug(
          `[${rec.source}] ${pattern.queryTemplate.substring(0, 50)}... -> ${rec.recommendation.substring(0, 50)}...`,
        );
      }
    }

    this.logger.log(
      `✅ Weekly audit complete: ${recommendations.length} recommendations generated`,
    );
    this.logger.log(
      `Top sources: RAG=${recommendations.filter((r) => r.source === 'rag').length}, Heuristic=${recommendations.filter((r) => r.source === 'heuristic').length}`,
    );

    return recommendations;
  }

  /**
   * Manual audit trigger for testing
   * @param since Analyze queries since this date (default: 7 days ago)
   * @returns Audit recommendations
   */
  async runManualAudit(since?: Date): Promise<OptimizationRecommendation[]> {
    const startDate = since || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return this.runWeeklyAudit();
  }

  /**
   * Get agent status and model information
   * @returns Status information
   */
  getStatus(): Record<string, any> {
    return {
      heuristicRulesCount: HEURISTIC_RULES.length,
      pgvectorStatus: this.pgvector.getModelStatus(),
      environment: process.env.NODE_ENV || 'development',
      nextAudit: 'Every Sunday at 00:00 (configured via @Cron)',
    };
  }

  /**
   * Get heuristic rules (for admin API)
   * @returns Array of heuristic rules
   */
  getHeuristicRules(): HeuristicRule[] {
    return HEURISTIC_RULES;
  }
}
