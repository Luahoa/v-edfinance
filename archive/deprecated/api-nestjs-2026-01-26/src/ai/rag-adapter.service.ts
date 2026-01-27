import { Injectable } from '@nestjs/common';
import { PgvectorService } from '../database/pgvector.service';

export interface RAGSource {
  title: string;
  content: string;
  similarity: number;
  metadata?: Record<string, any>;
}

export interface RAGContext {
  sources: RAGSource[];
  combinedText: string;
  retrievalTimeMs: number;
}

@Injectable()
export class RagAdapterService {
  constructor(private readonly pgvector: PgvectorService) {}
  
  /**
   * Get relevant context for a query via RAG
   * @param query User's question
   * @param options Retrieval options
   * @returns RAG context with sources
   */
  async getRelevantContext(
    query: string,
    options: {
      threshold?: number; // Similarity threshold (default: 0.75)
      limit?: number;     // Max results (default: 3)
      types?: string[];   // Filter by metadata.type
    } = {}
  ): Promise<RAGContext> {
    const startTime = Date.now();
    
    const {
      threshold = 0.75,
      limit = 3,
      types = [],
    } = options;
    
    try {
      // 1. Generate embedding for query
      const embedding = await this.pgvector.generateEmbedding(query);
      
      // 2. Find similar documents using pgvector (Drizzle-based)
      // This is SAFE per spike-2 findings (read-only query)
      // FIXED: Pass query string instead of embedding array
      const similar = await this.pgvector.findSimilarOptimizations(query, {
        threshold,
        limit,
      });
      
      // 3. Filter by type if specified
      let filtered = similar;
      if (types.length > 0) {
        filtered = similar.filter(s => 
          s.metadata && 
          types.includes((s.metadata as any).type)
        );
      }
      
      // 4. Format sources
      const sources: RAGSource[] = filtered.map(s => ({
        title: s.queryText || 'Untitled',
        content: s.recommendation || '',
        similarity: s.similarity,
        metadata: s.metadata as Record<string, any> || {},
      }));
      
      // 5. Combine into prompt-ready text
      const combinedText = sources.length > 0
        ? sources
            .map((s, idx) => `[Source ${idx + 1}: ${s.title}]\n${s.content}`)
            .join('\n\n---\n\n')
        : '';
      
      const retrievalTimeMs = Date.now() - startTime;
      
      return {
        sources,
        combinedText,
        retrievalTimeMs,
      };
    } catch (error) {
      // Graceful degradation: return empty context on error
      console.error('RAG retrieval error:', error);
      return {
        sources: [],
        combinedText: '',
        retrievalTimeMs: Date.now() - startTime,
      };
    }
  }
  
  /**
   * Check if RAG should be used for this query
   * @param query User's question
   * @returns True if RAG is recommended
   */
  shouldUseRAG(query: string): boolean {
    // Use RAG for these query types
    const ragKeywords = [
      // Financial
      'đầu tư', 'investment', 'portfolio', 'rủi ro', 'risk',
      'lãi suất', 'interest', 'compound', 'savings',
      // Learning
      'khóa học', 'course', 'bài học', 'lesson', 'học', 'learn',
      'gợi ý', 'recommend', 'suggestion',
      // Definitions (FAQ type)
      'là gì', 'what is', 'định nghĩa', 'definition',
    ];
    
    const lowerQuery = query.toLowerCase();
    return ragKeywords.some(keyword => lowerQuery.includes(keyword));
  }
}
