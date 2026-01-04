/**
 * OptimizationController Tests
 *
 * Tests all admin API endpoints for database optimization insights
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { OptimizationController } from './optimization.controller';
import { DatabaseArchitectAgent } from './database-architect.agent';
import { PgvectorService } from './pgvector.service';
import { DatabaseService } from './database.service';

describe('OptimizationController', () => {
  let controller: OptimizationController;
  let mockAgent: Partial<DatabaseArchitectAgent>;
  let mockPgvector: Partial<PgvectorService>;
  let mockDatabase: Partial<DatabaseService>;

  beforeEach(async () => {
    // Mock services
    mockAgent = {
      runWeeklyAudit: vi.fn().mockResolvedValue([
        {
          queryPattern: 'SELECT * FROM User',
          recommendation: 'Specify columns instead of SELECT *',
          confidence: 0.85,
          estimatedGain: 15,
          source: 'heuristic',
        },
        {
          queryPattern: 'SELECT COUNT(*) FROM BehaviorLog WHERE userId = ?',
          recommendation: 'Add index on userId column',
          confidence: 0.9,
          estimatedGain: 30,
          source: 'rag',
        },
      ]),
      getHeuristicRules: vi.fn().mockReturnValue([
        {
          pattern: /SELECT\s+\*\s+FROM/i,
          recommendation: 'Avoid SELECT *',
          estimatedGain: 0.15,
        },
      ]),
    };

    mockPgvector = {
      findSimilarOptimizations: vi.fn().mockResolvedValue([
        {
          queryText: 'SELECT * FROM User WHERE email = ?',
          recommendation: 'Add index on email column',
          similarity: 0.92,
        },
      ]),
    };

    const mockDrizzleDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          id: '123',
          queryText: 'SELECT * FROM User',
          recommendation: 'Use specific columns',
          performanceGain: 15,
          confidence: 0.85,
          source: 'heuristic',
          createdAt: new Date(),
          appliedAt: null,
        },
      ]),
      groupBy: vi.fn().mockResolvedValue([
        { source: 'heuristic', count: 10, avgConfidence: 0.82 },
        { source: 'rag', count: 5, avgConfidence: 0.91 },
      ]),
    };

    mockDatabase = {
      getDrizzleDb: vi.fn().mockReturnValue(mockDrizzleDb),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OptimizationController],
      providers: [
        { provide: DatabaseArchitectAgent, useValue: mockAgent },
        { provide: PgvectorService, useValue: mockPgvector },
        { provide: DatabaseService, useValue: mockDatabase },
      ],
    }).compile();

    controller = module.get<OptimizationController>(OptimizationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('listOptimizations', () => {
    it('should return list of optimizations', async () => {
      const result = await controller.listOptimizations('50', '0');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should filter by minimum confidence', async () => {
      const result = await controller.listOptimizations('50', '0.8');
      expect(result).toBeDefined();
    });

    it('should limit results correctly', async () => {
      const result = await controller.listOptimizations('10', '0');
      expect(result.data.length).toBeLessThanOrEqual(10);
    });
  });

  describe('findSimilar', () => {
    it('should find similar optimizations using RAG', async () => {
      const result = await controller.findSimilar('SELECT * FROM User', '5');
      expect(result).toHaveProperty('query');
      expect(result).toHaveProperty('results');
      expect(mockPgvector.findSimilarOptimizations).toHaveBeenCalledWith(
        'SELECT * FROM User',
        { limit: 5 },
      );
    });

    it('should return error if query is missing', async () => {
      const result = await controller.findSimilar('', '5');
      expect(result).toHaveProperty('error');
    });

    it('should respect limit parameter', async () => {
      await controller.findSimilar('test query', '3');
      expect(mockPgvector.findSimilarOptimizations).toHaveBeenCalledWith(
        'test query',
        { limit: 3 },
      );
    });
  });

  describe('getStats', () => {
    it('should return optimization statistics', async () => {
      const result = await controller.getStats();
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('bySource');
    });
  });

  describe('triggerAudit', () => {
    it('should trigger manual audit successfully', async () => {
      const result = await controller.triggerAudit();
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('optimizationsFound', 2);
      expect(result).toHaveProperty('highConfidenceCount', 2);
      expect(mockAgent.runWeeklyAudit).toHaveBeenCalled();
    });

    it('should handle audit errors gracefully', async () => {
      mockAgent.runWeeklyAudit = vi
        .fn()
        .mockRejectedValue(new Error('Database connection failed'));
      const result = await controller.triggerAudit();
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
    });

    it('should return top 10 recommendations', async () => {
      const result = await controller.triggerAudit();
      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeLessThanOrEqual(10);
    });
  });

  describe('getHeuristics', () => {
    it('should return list of heuristic rules', async () => {
      const result = await controller.getHeuristics();
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('rules');
      expect(Array.isArray(result.rules)).toBe(true);
      expect(mockAgent.getHeuristicRules).toHaveBeenCalled();
    });

    it('should format heuristic rules correctly', async () => {
      const result = await controller.getHeuristics();
      const rule = result.rules[0];
      expect(rule).toHaveProperty('id');
      expect(rule).toHaveProperty('pattern');
      expect(rule).toHaveProperty('recommendation');
      expect(rule).toHaveProperty('estimatedGain');
    });
  });
});
