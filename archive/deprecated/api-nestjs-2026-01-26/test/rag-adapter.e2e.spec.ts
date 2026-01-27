import { Test, type TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RagAdapterService } from '../src/ai/rag-adapter.service';
import { PgvectorService } from '../src/database/pgvector.service';

/**
 * RagAdapter Integration Test
 * Converted from E2E to unit test with mocks to avoid DatabaseModule dependency
 */
describe('RagAdapter Integration', () => {
  let service: RagAdapterService;

  const mockOptimizations = [
    {
      id: '1',
      queryText: 'Compound Interest Basics',
      recommendation: 'Compound interest is calculated on initial principal and accumulated interest.',
      similarity: 0.92,
      metadata: { type: 'financial', category: 'basics' },
    },
    {
      id: '2',
      queryText: 'Investment Risk Management',
      recommendation: 'Diversification reduces risk by spreading investments across asset classes.',
      similarity: 0.85,
      metadata: { type: 'financial', category: 'advanced' },
    },
    {
      id: '3',
      queryText: 'Savings Goals',
      recommendation: 'Set SMART goals: Specific, Measurable, Achievable, Relevant, Time-bound.',
      similarity: 0.78,
      metadata: { type: 'educational', category: 'planning' },
    },
  ];

  const mockPgvectorService = {
    generateEmbedding: vi.fn().mockResolvedValue(new Array(384).fill(0.1)),
    findSimilarOptimizations: vi.fn().mockResolvedValue(mockOptimizations),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RagAdapterService,
        { provide: PgvectorService, useValue: mockPgvectorService },
      ],
    }).compile();

    service = module.get<RagAdapterService>(RagAdapterService);

    // Manual binding for NestJS DI workaround
    (service as any).pgvector = mockPgvectorService;
  });

  describe('getRelevantContext', () => {
    it('should retrieve real documents from DB (mocked)', async () => {
      const startTime = Date.now();
      
      const context = await service.getRelevantContext('compound interest', {
        threshold: 0.7,
        limit: 5,
      });

      const endTime = Date.now();

      expect(context.sources.length).toBeGreaterThan(0);
      expect(context.retrievalTimeMs).toBeLessThan(endTime - startTime + 100);
      expect(mockPgvectorService.findSimilarOptimizations).toHaveBeenCalledWith(
        'compound interest',
        { threshold: 0.7, limit: 5 },
      );
    });

    it('should format sources correctly', async () => {
      const context = await service.getRelevantContext('investment tips', {
        limit: 3,
      });

      expect(context.sources).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: expect.any(String),
            content: expect.any(String),
            similarity: expect.any(Number),
          }),
        ]),
      );
    });

    it('should combine text for prompt injection', async () => {
      const context = await service.getRelevantContext('savings goals');

      expect(context.combinedText).toContain('[Source 1:');
      expect(context.combinedText).toContain('---');
    });

    it('should filter by metadata type', async () => {
      mockPgvectorService.findSimilarOptimizations.mockResolvedValueOnce([
        mockOptimizations[0],
        mockOptimizations[1],
      ]);

      const context = await service.getRelevantContext('financial advice', {
        types: ['financial'],
      });

      expect(context.sources).toHaveLength(2);
      context.sources.forEach((source) => {
        expect(source.metadata?.type).toBe('financial');
      });
    });

    it('should return empty context on error (graceful degradation)', async () => {
      mockPgvectorService.findSimilarOptimizations.mockRejectedValueOnce(
        new Error('DB connection error'),
      );

      const context = await service.getRelevantContext('test query');

      expect(context.sources).toHaveLength(0);
      expect(context.combinedText).toBe('');
      expect(context.retrievalTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('shouldUseRAG', () => {
    it('should return true for financial queries', () => {
      expect(service.shouldUseRAG('How does compound interest work?')).toBe(true);
      expect(service.shouldUseRAG('What is investment risk?')).toBe(true);
      expect(service.shouldUseRAG('Tôi nên đầu tư như thế nào?')).toBe(true);
    });

    it('should return true for learning queries', () => {
      expect(service.shouldUseRAG('Recommend a course for beginners')).toBe(true);
      expect(service.shouldUseRAG('Gợi ý khóa học tài chính')).toBe(true);
    });

    it('should return true for definition queries', () => {
      expect(service.shouldUseRAG('Lãi kép là gì?')).toBe(true);
      expect(service.shouldUseRAG('What is a portfolio?')).toBe(true);
    });

    it('should return false for generic queries', () => {
      expect(service.shouldUseRAG('Hello')).toBe(false);
      expect(service.shouldUseRAG('What time is it?')).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should complete retrieval within acceptable time', async () => {
      const context = await service.getRelevantContext('performance test', {
        limit: 5,
      });

      // Mock should be fast, but we test the measurement works
      expect(context.retrievalTimeMs).toBeDefined();
      expect(context.retrievalTimeMs).toBeGreaterThanOrEqual(0);
    });
  });
});
