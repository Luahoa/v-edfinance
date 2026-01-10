import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RagAdapterService } from './rag-adapter.service';
import { PgvectorService } from '../database/pgvector.service';

describe('RagAdapterService', () => {
  let service: RagAdapterService;
  let pgvectorMock: { generateEmbedding: ReturnType<typeof vi.fn>; findSimilarOptimizations: ReturnType<typeof vi.fn> };
  
  beforeEach(async () => {
    pgvectorMock = {
      generateEmbedding: vi.fn(),
      findSimilarOptimizations: vi.fn(),
    } as any;
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RagAdapterService,
        { provide: PgvectorService, useValue: pgvectorMock },
      ],
    }).compile();
    
    service = module.get<RagAdapterService>(RagAdapterService);
    
    // Manual binding to ensure mock is properly injected
    (service as any).pgvector = pgvectorMock;
  });
  
  it('should retrieve relevant context', async () => {
    pgvectorMock.generateEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
    
    pgvectorMock.findSimilarOptimizations.mockResolvedValue([
      {
        id: '1',
        queryText: 'Compound Interest',
        recommendation: 'Interest on interest...',
        similarity: 0.89,
        metadata: { type: 'financial_doc' },
      },
    ]);
    
    const context = await service.getRelevantContext('What is compound interest?');
    
    expect(context.sources.length).toBe(1);
    expect(context.sources[0].title).toBe('Compound Interest');
    expect(context.combinedText).toContain('[Source 1');
  });
  
  it('should filter by metadata type', async () => {
    pgvectorMock.generateEmbedding.mockResolvedValue([0.1]);
    pgvectorMock.findSimilarOptimizations.mockResolvedValue([
      { queryText: 'Doc 1', recommendation: 'A', similarity: 0.9, metadata: { type: 'course' } },
      { queryText: 'Doc 2', recommendation: 'B', similarity: 0.85, metadata: { type: 'financial_doc' } },
    ]);
    
    const context = await service.getRelevantContext('query', { types: ['course'] });
    
    expect(context.sources.length).toBe(1);
    expect(context.sources[0].title).toBe('Doc 1');
  });
  
  it('should determine if RAG should be used', () => {
    expect(service.shouldUseRAG('What is compound interest?')).toBe(true);
    expect(service.shouldUseRAG('Lãi suất kép là gì?')).toBe(true);
    expect(service.shouldUseRAG('Hello')).toBe(false);
  });
  
  it('should handle errors gracefully', async () => {
    pgvectorMock.generateEmbedding.mockRejectedValue(new Error('DB error'));
    
    const context = await service.getRelevantContext('query');
    
    expect(context.sources).toEqual([]);
    expect(context.combinedText).toBe('');
  });
});
