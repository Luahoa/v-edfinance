import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { QueryOptimizerService } from './query-optimizer.service';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

/**
 * Query Optimizer AI Controller
 *
 * Endpoints for autonomous database optimization:
 * - Analyze slow queries
 * - Get index usage statistics
 * - Detect unused indexes
 * - Capacity planning metrics
 */
@ApiTags('Debug - Query Optimizer AI')
@Controller('debug/query-optimizer')
export class QueryOptimizerController {
  constructor(private readonly optimizer: QueryOptimizerService) {}

  @Get('analyze')
  @ApiOperation({
    summary: 'Analyze slow queries and get optimization recommendations',
    description:
      'Requires pg_stat_statements extension. Analyzes queries slower than threshold (default: 100ms).',
  })
  @ApiQuery({
    name: 'threshold',
    required: false,
    description: 'Minimum execution time in ms (default: 100)',
  })
  async analyzeSlowQueries(@Query('threshold') threshold?: string) {
    const thresholdMs = threshold ? parseInt(threshold, 10) : 100;
    return this.optimizer.analyzeSlowQueries(thresholdMs);
  }

  @Get('indexes/usage')
  @ApiOperation({
    summary: 'Get index usage statistics',
    description: 'Shows which indexes are being used and how frequently.',
  })
  async getIndexUsage() {
    return this.optimizer.getIndexUsage();
  }

  @Get('indexes/unused')
  @ApiOperation({
    summary: 'Detect unused indexes',
    description:
      'Finds indexes with < 10 scans and > 1MB size - candidates for removal.',
  })
  async detectUnusedIndexes() {
    return this.optimizer.detectUnusedIndexes();
  }

  @Get('capacity/tables')
  @ApiOperation({
    summary: 'Get table sizes for capacity planning',
    description: 'Shows database size, table sizes, and row counts.',
  })
  async getTableSizes() {
    return this.optimizer.getTableSizes();
  }
}
