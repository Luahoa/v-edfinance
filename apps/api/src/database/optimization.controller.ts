/**
 * OptimizationController - Admin API for Database Optimization Insights
 *
 * Endpoints:
 * - GET /admin/database/optimizations - List all optimization recommendations
 * - GET /admin/database/optimizations/similar - RAG search for similar optimizations
 * - GET /admin/database/optimizations/stats - Summary statistics
 * - POST /admin/database/audit - Trigger manual audit
 */

import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import {
  DatabaseArchitectAgent,
  OptimizationRecommendation,
} from './database-architect.agent';
import { PgvectorService } from './pgvector.service';
import { DatabaseService } from './database.service';
import { optimizationLogs } from './drizzle-schema';
import { desc, sql } from 'drizzle-orm';

@ApiTags('Admin - Database Optimization')
@Controller('admin/database')
@ApiBearerAuth()
export class OptimizationController {
  constructor(
    private readonly agent: DatabaseArchitectAgent,
    private readonly pgvector: PgvectorService,
    private readonly database: DatabaseService,
  ) {}

  @Get('optimizations')
  @ApiOperation({ summary: 'List all optimization recommendations' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Max records to return (default: 50)',
  })
  @ApiQuery({
    name: 'minConfidence',
    required: false,
    type: Number,
    description: 'Filter by minimum confidence (0-1)',
  })
  @ApiResponse({ status: 200, description: 'List of optimizations' })
  async listOptimizations(
    @Query('limit') limit: string = '50',
    @Query('minConfidence') minConfidence: string = '0',
  ) {
    const db = this.database.getDrizzleDb();
    const limitNum = Math.min(parseInt(limit) || 50, 200);
    const minConf = parseFloat(minConfidence) || 0;

    const results = await db
      .select({
        id: optimizationLogs.id,
        queryText: optimizationLogs.queryText,
        recommendation: optimizationLogs.recommendation,
        performanceGain: optimizationLogs.performanceGain,
        confidence: optimizationLogs.confidence,
        source: optimizationLogs.source,
        createdAt: optimizationLogs.createdAt,
        appliedAt: optimizationLogs.appliedAt,
      })
      .from(optimizationLogs)
      .where(sql`${optimizationLogs.confidence} >= ${minConf}`)
      .orderBy(desc(optimizationLogs.createdAt))
      .limit(limitNum);

    return {
      total: results.length,
      data: results,
    };
  }

  @Get('optimizations/similar')
  @ApiOperation({
    summary: 'Find similar optimizations using RAG (vector search)',
  })
  @ApiQuery({
    name: 'query',
    required: true,
    type: String,
    description: 'Query text to search for',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Max similar records (default: 5)',
  })
  @ApiResponse({
    status: 200,
    description: 'Similar optimizations ranked by similarity',
  })
  async findSimilar(
    @Query('query') query: string,
    @Query('limit') limit: string = '5',
  ) {
    if (!query) {
      return { error: 'Query parameter is required' };
    }

    const limitNum = Math.min(parseInt(limit) || 5, 20);
    const similar = await this.pgvector.findSimilarOptimizations(query, {
      limit: limitNum,
    });

    return {
      query,
      results: similar,
    };
  }

  @Get('optimizations/stats')
  @ApiOperation({ summary: 'Get optimization statistics summary' })
  @ApiResponse({ status: 200, description: 'Summary statistics' })
  async getStats() {
    const db = this.database.getDrizzleDb();

    const stats = await db
      .select({
        totalOptimizations: sql<number>`count(*)::int`,
        avgConfidence: sql<number>`avg(${optimizationLogs.confidence})::float`,
        avgPerformanceGain: sql<number>`avg(${optimizationLogs.performanceGain})::float`,
        highConfidenceCount: sql<number>`count(*) filter (where ${optimizationLogs.confidence} >= 0.8)::int`,
        appliedCount: sql<number>`count(*) filter (where ${optimizationLogs.appliedAt} is not null)::int`,
      })
      .from(optimizationLogs);

    const sourceBreakdown = await db
      .select({
        source: optimizationLogs.source,
        count: sql<number>`count(*)::int`,
        avgConfidence: sql<number>`avg(${optimizationLogs.confidence})::float`,
      })
      .from(optimizationLogs)
      .groupBy(optimizationLogs.source);

    return {
      summary: stats[0] || {
        totalOptimizations: 0,
        avgConfidence: 0,
        avgPerformanceGain: 0,
        highConfidenceCount: 0,
        appliedCount: 0,
      },
      bySource: sourceBreakdown,
    };
  }

  @Post('audit')
  @ApiOperation({ summary: 'Trigger manual database optimization audit' })
  @ApiResponse({ status: 200, description: 'Audit completed successfully' })
  @ApiResponse({ status: 500, description: 'Audit failed' })
  async triggerAudit() {
    try {
      const results = await this.agent.runWeeklyAudit();
      return {
        success: true,
        message: 'Audit completed',
        optimizationsFound: results.length,
        highConfidenceCount: results.filter((r) => r.confidence >= 0.8).length,
        recommendations: results.slice(0, 10), // Top 10
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('heuristics')
  @ApiOperation({ summary: 'List all heuristic rules used by the agent' })
  @ApiResponse({ status: 200, description: 'List of heuristic rules' })
  async getHeuristics() {
    const rules = this.agent.getHeuristicRules();
    return {
      total: rules.length,
      rules: rules.map((rule, index) => ({
        id: index + 1,
        pattern: rule.pattern.source,
        recommendation: rule.recommendation,
        estimatedGain: rule.estimatedGain,
      })),
    };
  }
}
