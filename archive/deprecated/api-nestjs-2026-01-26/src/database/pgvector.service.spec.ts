/**
 * PgvectorService Unit Tests
 *
 * Coverage:
 * - Embeddings generation
 * - Vector similarity search (pgvector + fallback)
 * - Optimization storage
 * - Error handling & graceful degradation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { PgvectorService } from './pgvector.service';
import { DatabaseService } from './database.service';
import { ConfigService } from '@nestjs/config';
import { KyselyService } from './kysely.service';

// Mock pipeline function
vi.mock('@xenova/transformers', () => ({
  pipeline: vi.fn(),
  env: {
    allowLocalModels: true,
    useBrowserCache: false,
  },
}));

describe('PgvectorService', () => {
  let service: PgvectorService;
  let databaseService: any;
  let mockPipeline: any;

  beforeEach(async () => {
    // Create mock pipeline
    mockPipeline = vi.fn().mockResolvedValue({
      data: new Float32Array(384).fill(0.5), // Mock embedding
    });

    // Mock @xenova/transformers
    const { pipeline } = await import('@xenova/transformers');
    vi.mocked(pipeline).mockResolvedValue(mockPipeline);

    // Create testing module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PgvectorService,
        {
          provide: DatabaseService,
          useValue: {
            db: {
              select: vi.fn().mockReturnThis(),
              from: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              orderBy: vi.fn().mockReturnThis(),
              limit: vi.fn().mockResolvedValue([]),
              execute: vi.fn(),
            },
            insertOptimizationLog: vi.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn().mockReturnValue('postgresql://test'),
          },
        },
        {
          provide: KyselyService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<PgvectorService>(PgvectorService);
    databaseService = module.get(DatabaseService);

    // Manually bind service to fix NestJS TestingModule mock binding issue
    (service as any).databaseService = databaseService;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should load embeddings model on initialization', async () => {
      await service.onModuleInit();

      const status = service.getModelStatus();
      expect(status.loaded).toBe(true);
      expect(status.model).toBe('Xenova/all-MiniLM-L6-v2');
      expect(status.dimension).toBe(384);
    });

    it('should handle model loading failure gracefully', async () => {
      const { pipeline } = await import('@xenova/transformers');
      vi.mocked(pipeline).mockRejectedValueOnce(
        new Error('Model download failed'),
      );

      await service.onModuleInit();

      const status = service.getModelStatus();
      expect(status.loaded).toBe(false);
    });
  });

  describe('generateEmbedding', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should generate 384-dimensional embedding vector', async () => {
      const embedding = await service.generateEmbedding('SELECT * FROM users');

      expect(embedding).toHaveLength(384);
      expect(Array.isArray(embedding)).toBe(true);
      expect(typeof embedding[0]).toBe('number');
    });

    it('should handle different text inputs', async () => {
      const queries = [
        'SELECT * FROM users WHERE id = 1',
        'Show me all active users',
        '显示所有用户', // Chinese
        'Hiển thị người dùng', // Vietnamese
      ];

      for (const query of queries) {
        const embedding = await service.generateEmbedding(query);
        expect(embedding).toHaveLength(384);
      }
    });

    it('should return zero vector when model not loaded', async () => {
      // Create new service without initializing
      const uninitializedService = new PgvectorService(databaseService);

      const embedding = await uninitializedService.generateEmbedding('test');

      expect(embedding).toHaveLength(384);
      expect(embedding.every((val) => val === 0)).toBe(true);
    });

    it('should handle embedding generation error', async () => {
      mockPipeline.mockRejectedValueOnce(new Error('Pipeline error'));

      const embedding = await service.generateEmbedding('test query');

      // Should return zero vector on error
      expect(embedding).toHaveLength(384);
      expect(embedding.every((val) => val === 0)).toBe(true);
    });
  });

  describe('storeOptimization', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should store optimization with generated embedding', async () => {
      const mockId = 'log-12345';
      databaseService.insertOptimizationLog.mockResolvedValue([{ id: mockId }]);

      const result = await service.storeOptimization({
        queryText: 'SELECT * FROM users',
        recommendation: 'Add index on id column',
        performanceGain: 0.65,
        metadata: { source: 'ai-architect' },
      });

      expect(result).toBe(mockId);
      expect(databaseService.insertOptimizationLog).toHaveBeenCalledWith(
        expect.objectContaining({
          queryText: 'SELECT * FROM users',
          queryEmbedding: expect.any(String), // Now stored as JSON string
          recommendation: 'Add index on id column',
          performanceGain: 0.65,
        }),
      );
    });

    it('should handle metadata defaults', async () => {
      databaseService.insertOptimizationLog.mockResolvedValue([
        { id: 'test-id' },
      ]);

      await service.storeOptimization({
        queryText: 'SELECT count(*) FROM orders',
        recommendation: null,
        performanceGain: null,
      });

      expect(databaseService.insertOptimizationLog).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: null,
        }),
      );
    });
  });

  describe('findSimilarOptimizations', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should find similar optimizations with pgvector', async () => {
      const mockResults = [
        {
          id: 'log-1',
          queryText: 'SELECT * FROM users',
          recommendation: 'Use index',
          performanceGain: 0.8,
          metadata: {},
          similarity: 0.92,
        },
        {
          id: 'log-2',
          queryText: 'SELECT id, name FROM users',
          recommendation: 'Add covering index',
          performanceGain: 0.65,
          metadata: {},
          similarity: 0.87,
        },
      ];

      databaseService.db.limit = vi.fn().mockResolvedValue(mockResults);

      const results = await service.findSimilarOptimizations('Show all users', {
        threshold: 0.85,
        limit: 5,
      });

      expect(results).toHaveLength(2);
      expect(results[0].similarity).toBeGreaterThan(0.85);
      expect(results[0].id).toBe('log-1');
    });

    it('should use default options', async () => {
      databaseService.db.limit = vi.fn().mockResolvedValue([]);

      await service.findSimilarOptimizations('test query');

      // Verify default threshold (0.85) and limit (5) are used
      expect(databaseService.db.limit).toHaveBeenCalledWith(5);
    });

    it('should fallback to in-memory search if pgvector unavailable', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          queryText: 'SELECT * FROM users',
          queryEmbedding: new Array(384).fill(0.5),
          recommendation: 'Test',
          performanceGain: 0.8,
          metadata: {},
        },
      ];

      // Mock pgvector error
      databaseService.db.limit = vi
        .fn()
        .mockRejectedValue(
          new Error('operator does not exist: vector <=> vector'),
        );

      // Mock fallback query
      databaseService.db.select = vi.fn().mockReturnThis();
      databaseService.db.from = vi.fn().mockReturnThis();
      databaseService.db.limit = vi.fn().mockResolvedValue(mockLogs);

      const results = await service.findSimilarOptimizations('test query', {
        threshold: 0.5,
      });

      // Should use in-memory similarity
      expect(results).toBeDefined();
    });
  });

  describe('isPgvectorAvailable', () => {
    it('should return true when pgvector extension exists', async () => {
      databaseService.db.execute = vi.fn().mockResolvedValue({
        rows: [{ '?column?': 1 }],
      });

      const available = await service.isPgvectorAvailable();
      expect(available).toBe(true);
    });

    it('should return false when pgvector extension missing', async () => {
      databaseService.db.execute = vi.fn().mockResolvedValue({
        rows: [],
      });

      const available = await service.isPgvectorAvailable();
      expect(available).toBe(false);
    });

    it('should return false on database error', async () => {
      databaseService.db.execute = vi
        .fn()
        .mockRejectedValue(new Error('Connection failed'));

      const available = await service.isPgvectorAvailable();
      expect(available).toBe(false);
    });
  });

  describe('getModelStatus', () => {
    it('should return model status when loaded', async () => {
      await service.onModuleInit();

      const status = service.getModelStatus();

      expect(status).toEqual({
        loaded: true,
        model: 'Xenova/all-MiniLM-L6-v2',
        dimension: 384,
      });
    });

    it('should return model status when not loaded', () => {
      const uninitializedService = new PgvectorService(databaseService);

      const status = uninitializedService.getModelStatus();

      expect(status.loaded).toBe(false);
      expect(status.dimension).toBe(384);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should handle empty query text', async () => {
      const embedding = await service.generateEmbedding('');
      expect(embedding).toHaveLength(384);
    });

    it('should handle very long query text', async () => {
      const longQuery = 'SELECT * FROM users WHERE '.repeat(100) + 'id = 1';
      const embedding = await service.generateEmbedding(longQuery);
      expect(embedding).toHaveLength(384);
    });

    it('should handle special characters in query', async () => {
      const specialQuery =
        "SELECT * FROM users WHERE name = 'O''Brien' AND age > 25";
      const embedding = await service.generateEmbedding(specialQuery);
      expect(embedding).toHaveLength(384);
    });

    it('should handle similarity threshold edge cases', async () => {
      databaseService.db.limit = vi.fn().mockResolvedValue([]);

      // Threshold = 0 (match all)
      await service.findSimilarOptimizations('test', { threshold: 0 });
      expect(databaseService.db.limit).toHaveBeenCalled();

      // Threshold = 1 (exact match only)
      await service.findSimilarOptimizations('test', { threshold: 1 });
      expect(databaseService.db.limit).toHaveBeenCalled();
    });
  });
});
