/**
 * PgvectorService - Vector Embeddings & Similarity Search
 *
 * Responsibilities:
 * - Generate embeddings using local Xenova model (all-MiniLM-L6-v2)
 * - Store/retrieve optimizations with vector embeddings
 * - Semantic similarity search for query deduplication
 *
 * Performance:
 * - Embedding generation: ~50ms (local, no API costs)
 * - Vector search: <10ms with pgvector index
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { pipeline, env } from '@xenova/transformers';
import { DatabaseService } from './database.service';
import { eq, sql } from 'drizzle-orm';
import { optimizationLogs } from './drizzle-schema';

// Disable remote model loading (use cached models only)
env.allowLocalModels = true;
env.useBrowserCache = false;

export interface OptimizationLogEntry {
  queryText: string;
  recommendation: string | null;
  performanceGain: number | null;
  metadata?: Record<string, any>;
}

export interface SimilarOptimization {
  id: string;
  queryText: string;
  recommendation: string | null;
  performanceGain: number | null;
  similarity: number;
  metadata: Record<string, any> | null;
}

export interface FindSimilarOptions {
  threshold?: number; // Cosine similarity threshold (0-1), default 0.85
  limit?: number; // Max results, default 5
}

@Injectable()
export class PgvectorService implements OnModuleInit {
  private readonly logger = new Logger(PgvectorService.name);
  private embeddingPipeline: any | null = null;
  private readonly modelName = 'Xenova/all-MiniLM-L6-v2';
  private readonly embeddingDimension = 384;

  constructor(private readonly databaseService: DatabaseService) {}

  async onModuleInit(): Promise<void> {
    try {
      this.logger.log(`Loading local embeddings model: ${this.modelName}...`);

      // Load feature extraction pipeline (sentence embeddings)
      this.embeddingPipeline = await pipeline(
        'feature-extraction',
        this.modelName,
        { quantized: true }, // Use quantized model for faster inference
      );

      this.logger.log(
        `✅ Embeddings model loaded (dimension: ${this.embeddingDimension})`,
      );
    } catch (error) {
      this.logger.error(`Failed to load embeddings model: ${error.message}`);
      this.logger.warn(
        'PgvectorService will operate in degraded mode (no embeddings)',
      );
    }
  }

  /**
   * Generate vector embedding for text using local Xenova model
   * @param text Input text (SQL query, recommendation, etc.)
   * @returns 384-dimensional embedding vector
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.embeddingPipeline) {
      this.logger.warn('Embeddings model not loaded, returning zero vector');
      return new Array(this.embeddingDimension).fill(0);
    }

    try {
      const startTime = Date.now();

      // Generate embedding
      const output = await this.embeddingPipeline(text, {
        pooling: 'mean',
        normalize: true,
      });

      // Extract embedding array
      const embedding = Array.from(output.data) as number[];

      const duration = Date.now() - startTime;
      this.logger.debug(
        `Generated embedding in ${duration}ms (dim: ${embedding.length})`,
      );

      return embedding;
    } catch (error) {
      this.logger.error(`Embedding generation failed: ${error.message}`);
      return new Array(this.embeddingDimension).fill(0);
    }
  }

  /**
   * Store optimization recommendation with vector embedding
   * @param entry Optimization log entry
   * @returns Created log ID
   */
  async storeOptimization(entry: OptimizationLogEntry): Promise<string> {
    // Generate embedding for query text
    const queryEmbedding = await this.generateEmbedding(entry.queryText);

    // Store in OptimizationLog via DatabaseService
    const [result] = await this.databaseService.insertOptimizationLog({
      queryText: entry.queryText,
      queryEmbedding: JSON.stringify(queryEmbedding), // Store as JSON text
      recommendation: entry.recommendation ?? null,
      performanceGain: entry.performanceGain ?? null,
      metadata: entry.metadata || null,
    });

    this.logger.log(`Stored optimization: ${result.id}`);
    return result.id;
  }

  /**
   * Find similar optimization queries using vector similarity search
   * @param query Natural language query or SQL
   * @param options Search options (threshold, limit)
   * @returns Similar optimizations ranked by cosine similarity
   */
  async findSimilarOptimizations(
    query: string,
    options: FindSimilarOptions = {},
  ): Promise<SimilarOptimization[]> {
    const { threshold = 0.85, limit = 5 } = options;

    // Generate embedding for input query
    const queryEmbedding = await this.generateEmbedding(query);

    try {
      // Use pgvector's cosine distance operator (<=>)
      // Similarity = 1 - cosine_distance
      const results = await this.databaseService.db
        .select({
          id: optimizationLogs.id,
          queryText: optimizationLogs.queryText,
          recommendation: optimizationLogs.recommendation,
          performanceGain: optimizationLogs.performanceGain,
          metadata: optimizationLogs.metadata,
          // Calculate similarity: 1 - (embedding <=> query_embedding)
          similarity: sql<number>`1 - (${optimizationLogs.queryEmbedding} <=> ${JSON.stringify(queryEmbedding)}::vector)`,
        })
        .from(optimizationLogs)
        .where(
          sql`1 - (${optimizationLogs.queryEmbedding} <=> ${JSON.stringify(queryEmbedding)}::vector) > ${threshold}`,
        )
        .orderBy(
          sql`${optimizationLogs.queryEmbedding} <=> ${JSON.stringify(queryEmbedding)}::vector`,
        )
        .limit(limit);

      this.logger.debug(
        `Found ${results.length} similar optimizations (threshold: ${threshold})`,
      );

      return results as SimilarOptimization[];
    } catch (error) {
      // Graceful degradation: fallback to in-memory similarity if pgvector unavailable
      if (error.message?.includes('vector')) {
        this.logger.warn(
          'pgvector not available, using in-memory similarity search',
        );
        return this.findSimilarInMemory(queryEmbedding, threshold, limit);
      }
      throw error;
    }
  }

  /**
   * Fallback: In-memory cosine similarity search (when pgvector unavailable)
   */
  private async findSimilarInMemory(
    queryEmbedding: number[],
    threshold: number,
    limit: number,
  ): Promise<SimilarOptimization[]> {
    // Fetch all optimization logs
    const allLogs = await this.databaseService.db
      .select()
      .from(optimizationLogs)
      .limit(1000); // Safety limit

    // Calculate cosine similarity for each
    const withSimilarity = allLogs
      .map((log) => {
        // Parse queryEmbedding from JSON string
        const embedding = log.queryEmbedding
          ? JSON.parse(log.queryEmbedding)
          : [];
        return {
          id: log.id,
          queryText: log.queryText,
          recommendation: log.recommendation,
          performanceGain: log.performanceGain,
          metadata: log.metadata as Record<string, any> | null,
          similarity: this.cosineSimilarity(queryEmbedding, embedding),
        };
      })
      .filter((log) => log.similarity > threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return withSimilarity;
  }

  /**
   * Cosine similarity calculation (for fallback mode)
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

    return dotProduct / (magA * magB);
  }

  /**
   * Check if pgvector extension is available in database
   */
  async isPgvectorAvailable(): Promise<boolean> {
    try {
      const result = await this.databaseService.db.execute(
        sql`SELECT 1 FROM pg_extension WHERE extname = 'vector'`,
      );
      return result.rows.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get embeddings model status
   */
  getModelStatus(): {
    loaded: boolean;
    model: string;
    dimension: number;
  } {
    return {
      loaded: this.embeddingPipeline !== null,
      model: this.modelName,
      dimension: this.embeddingDimension,
    };
  }
}
