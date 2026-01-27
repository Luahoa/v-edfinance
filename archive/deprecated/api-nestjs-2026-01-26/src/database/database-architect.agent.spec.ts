import { Test, TestingModule } from '@nestjs/testing';
import {
  DatabaseArchitectAgent,
  QueryPattern,
  OptimizationRecommendation,
} from './database-architect.agent';
import { PgvectorService } from './pgvector.service';
import { KyselyService } from './kysely.service';
import { DatabaseService } from './database.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('DatabaseArchitectAgent', () => {
  let agent: DatabaseArchitectAgent;
  let mockPgvector: any;
  let mockKysely: any;
  let mockDatabase: any;

  beforeEach(async () => {
    // Mock PgvectorService
    mockPgvector = {
      findSimilarOptimizations: vi.fn(),
      storeOptimization: vi.fn(),
      getModelStatus: vi
        .fn()
        .mockReturnValue({ loaded: true, modelName: 'test-model' }),
    };

    // Mock KyselyService
    mockKysely = {
      query: {
        selectFrom: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        execute: vi.fn(),
      },
    };

    // Mock DatabaseService
    mockDatabase = {
      insertOptimizationLog: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseArchitectAgent,
        { provide: PgvectorService, useValue: mockPgvector },
        { provide: KyselyService, useValue: mockKysely },
        { provide: DatabaseService, useValue: mockDatabase },
      ],
    }).compile();

    agent = module.get<DatabaseArchitectAgent>(DatabaseArchitectAgent);

    // Manually bind service to fix NestJS TestingModule mock binding issue
    (agent as any).pgvector = mockPgvector;
  });

  describe('Heuristic Rules Engine', () => {
    it('should detect SELECT * anti-pattern', async () => {
      const query = 'SELECT * FROM users WHERE email = $1';
      const rec = await agent.generateRecommendation(query);

      expect(rec).toBeDefined();
      expect(rec.recommendation).toContain('SELECT *');
      expect(rec.source).toBe('heuristic');
      expect(rec.confidence).toBe(0.8);
      expect(rec.estimatedGain).toBeGreaterThan(0);
    });

    it('should detect LIKE with leading wildcard', async () => {
      const query = "SELECT name FROM products WHERE name LIKE '%phone%'";
      const rec = await agent.generateRecommendation(query);

      expect(rec.recommendation).toContain('wildcard');
      expect(rec.source).toBe('heuristic');
      expect(rec.estimatedGain).toBeGreaterThan(0.3);
    });

    it('should detect multiple JOINs', async () => {
      const query =
        'SELECT a.id, b.name FROM a JOIN b ON a.id = b.id JOIN c ON b.id = c.id JOIN d ON c.id = d.id';
      const rec = await agent.generateRecommendation(query);

      expect(rec.recommendation).toContain('JOIN');
      expect(rec.source).toBe('heuristic');
    });

    it('should detect NOT IN anti-pattern', async () => {
      const query =
        'SELECT id, email FROM users WHERE id NOT IN (SELECT userId FROM active_users)';
      const rec = await agent.generateRecommendation(query);

      expect(rec.recommendation).toContain('NOT IN');
      expect(rec.source).toBe('heuristic');
    });

    it('should detect high OFFSET pagination', async () => {
      const query =
        'SELECT id, title FROM posts ORDER BY created_at LIMIT 20 OFFSET 5000';
      const rec = await agent.generateRecommendation(query);

      expect(rec.recommendation).toContain('OFFSET');
      expect(rec.estimatedGain).toBe(0.5);
    });
  });

  describe('RAG Integration', () => {
    it('should find cached recommendations via PgvectorService', async () => {
      const query = 'SELECT user_id FROM sessions WHERE token = $1';

      mockPgvector.findSimilarOptimizations.mockResolvedValue([
        {
          id: 'opt-123',
          queryText: 'SELECT user_id FROM sessions WHERE token = $1',
          recommendation: 'Add index on sessions(token)',
          performanceGain: 65,
          similarity: 0.92,
          metadata: { source: 'rag' },
        },
      ]);

      const rec = await agent.generateRecommendation(query);

      expect(rec.source).toBe('rag');
      expect(rec.confidence).toBe(0.92);
      expect(rec.recommendation).toContain('index');
      expect(mockPgvector.findSimilarOptimizations).toHaveBeenCalledWith(
        query,
        {
          threshold: 0.85,
          limit: 3,
        },
      );
    });

    it('should fallback to heuristics when no RAG match found', async () => {
      mockPgvector.findSimilarOptimizations.mockResolvedValue([]);

      const query = 'SELECT * FROM users';
      const rec = await agent.generateRecommendation(query);

      expect(rec.source).toBe('heuristic');
      expect(mockPgvector.findSimilarOptimizations).toHaveBeenCalled();
    });

    it('should store new recommendations for future RAG', async () => {
      mockPgvector.findSimilarOptimizations.mockResolvedValue([]);
      mockPgvector.storeOptimization.mockResolvedValue('new-opt-id');

      const query = 'SELECT * FROM orders';
      await agent.generateRecommendation(query);

      expect(mockPgvector.storeOptimization).toHaveBeenCalled();
      const storeCall = mockPgvector.storeOptimization.mock.calls[0][0];
      expect(storeCall.queryText).toBe(query);
      expect(storeCall.recommendation).toBeDefined();
    });

    it('should handle RAG lookup failures gracefully', async () => {
      mockPgvector.findSimilarOptimizations.mockRejectedValue(
        new Error('Vector search failed'),
      );

      const query = 'SELECT * FROM products';
      const rec = await agent.generateRecommendation(query);

      // Should fallback to heuristic or generic
      expect(rec).toBeDefined();
      expect(['heuristic', 'generic']).toContain(rec.source);
    });
  });

  describe('Query Pattern Analysis', () => {
    it('should return mock patterns in development mode', async () => {
      process.env.NODE_ENV = 'development';

      const patterns = await agent.analyzeQueryPatterns(new Date());

      expect(patterns).toBeDefined();
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0]).toHaveProperty('queryTemplate');
      expect(patterns[0]).toHaveProperty('executionCount');
      expect(patterns[0]).toHaveProperty('avgDuration');
    });

    it('should query pg_stat_statements in production mode', async () => {
      process.env.NODE_ENV = 'production';

      // Mock kysely.query execute method for raw SQL
      const mockExecute = vi.fn().mockResolvedValue({
        rows: [
          {
            query: 'SELECT * FROM users WHERE id = $1',
            calls: 1500,
            mean_exec_time: 12.5,
            total_exec_time: 18750,
          },
        ],
      });

      // Override the kysely query property
      (agent as any).kysely = { query: { execute: mockExecute } };

      const patterns = await agent.analyzeQueryPatterns(new Date());

      expect(patterns).toBeDefined();
      expect(patterns.length).toBeGreaterThan(0);
    });

    it('should fallback to mock data when pg_stat_statements unavailable', async () => {
      process.env.NODE_ENV = 'production';
      mockKysely.query.execute.mockRejectedValue(
        new Error('Extension not installed'),
      );

      const patterns = await agent.analyzeQueryPatterns(new Date());

      expect(patterns).toBeDefined();
      expect(patterns.length).toBeGreaterThan(0);
    });
  });

  describe('Weekly Audit', () => {
    it('should generate audit report with high-confidence recommendations', async () => {
      mockPgvector.findSimilarOptimizations.mockResolvedValue([]);

      const recommendations = await agent.runWeeklyAudit();

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);

      // All recommendations should have confidence > 0.7
      recommendations.forEach((rec) => {
        expect(rec.confidence).toBeGreaterThan(0.7);
      });
    });

    it('should filter out low-confidence recommendations', async () => {
      const recommendations = await agent.runWeeklyAudit();

      // Generic recommendations (confidence 0.5) should be filtered
      const genericRecs = recommendations.filter((r) => r.source === 'generic');
      expect(genericRecs.length).toBe(0);
    });

    it('should handle empty query patterns gracefully', async () => {
      // Mock empty patterns
      vi.spyOn(agent as any, 'getMockQueryPatterns').mockReturnValue([]);

      const recommendations = await agent.runWeeklyAudit();

      expect(recommendations).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    it('should return generic recommendation when no rules match', async () => {
      mockPgvector.findSimilarOptimizations.mockResolvedValue([]);

      const query = 'SELECT id FROM simple_table';
      const rec = await agent.generateRecommendation(query);

      expect(rec.source).toBe('generic');
      expect(rec.recommendation).toContain('EXPLAIN ANALYZE');
      expect(rec.confidence).toBe(0.5);
    });

    it('should handle empty query strings', async () => {
      const rec = await agent.generateRecommendation('');

      expect(rec).toBeDefined();
      expect(rec.source).toBe('generic');
    });

    it('should normalize queries correctly', async () => {
      const normalized = agent['normalizeQuery'](
        "SELECT * FROM users WHERE email = 'test@example.com' AND id = 123",
      );

      expect(normalized).toContain('?');
      expect(normalized).not.toContain('test@example.com');
      expect(normalized).not.toContain('123');
    });
  });

  describe('Agent Status', () => {
    it('should return agent status with all components', () => {
      const status = agent.getStatus();

      expect(status).toHaveProperty('heuristicRulesCount');
      expect(status).toHaveProperty('pgvectorStatus');
      expect(status).toHaveProperty('environment');
      expect(status).toHaveProperty('nextAudit');
      expect(status.heuristicRulesCount).toBeGreaterThan(0);
    });
  });
});
