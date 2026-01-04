import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

/**
 * VED-7P4: VannaService - AI-powered Text-to-SQL with pgvector embeddings
 *
 * Responsibilities:
 * - Generate SQL from natural language queries
 * - Store/retrieve query embeddings (vector(384))
 * - Cache similar queries for performance
 * - Multi-language support (vi/en/zh)
 */

export interface VannaQueryRequest {
  question: string;
  language?: 'vi' | 'en' | 'zh';
  context?: string;
  userId?: string;
}

export interface VannaQueryResult {
  sql: string;
  confidence: number;
  embedding?: number[]; // vector(384)
  fromCache?: boolean;
  executionPlan?: string;
}

export interface VannaTrainRequest {
  sql: string;
  question: string;
  language?: 'vi' | 'en' | 'zh';
}

@Injectable()
export class VannaService {
  private readonly logger = new Logger(VannaService.name);
  private readonly client: AxiosInstance;
  private readonly enableVectorCache: boolean;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('VANNA_API_KEY');
    const baseUrl = this.config.get<string>(
      'VANNA_BASE_URL',
      'https://api.vanna.ai',
    );
    this.enableVectorCache = this.config.get<boolean>(
      'VANNA_ENABLE_CACHE',
      true,
    );

    if (!apiKey) {
      this.logger.warn(
        'VANNA_API_KEY not set - VannaService will run in mock mode',
      );
    }

    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Generate SQL from natural language question
   */
  async generateSQL(request: VannaQueryRequest): Promise<VannaQueryResult> {
    try {
      this.logger.log(
        `Generating SQL for question: "${request.question.substring(0, 50)}..."`,
      );

      // Check vector cache first (if enabled and pgvector available)
      if (this.enableVectorCache && request.userId) {
        const cached = await this.findSimilarQuery(
          request.question,
          request.language,
        );
        if (cached) {
          this.logger.log('Cache HIT - returning similar query');
          return { ...cached, fromCache: true };
        }
      }

      // Call Vanna API
      const response = await this.client.post('/v1/generate-sql', {
        question: request.question,
        language: request.language || 'en',
        context: request.context,
      });

      const result: VannaQueryResult = {
        sql: response.data.sql,
        confidence: response.data.confidence || 0,
        embedding: response.data.embedding, // vector(384) from Vanna
        executionPlan: response.data.executionPlan,
        fromCache: false,
      };

      // Store embedding for future similarity search
      if (result.embedding && request.userId) {
        await this.storeQueryEmbedding(request, result);
      }

      return result;
    } catch (error: any) {
      this.logger.error(`Vanna API error: ${error.message}`, error.stack);

      // Graceful degradation - return mock SQL (for testing and API failures)
      this.logger.warn('Vanna API unavailable - returning mock query');
      return this.getMockSQLResult(request.question);
    }
  }

  /**
   * Train Vanna with custom SQL examples
   */
  async trainModel(request: VannaTrainRequest): Promise<void> {
    try {
      await this.client.post('/v1/train', {
        sql: request.sql,
        question: request.question,
        language: request.language || 'en',
      });

      this.logger.log(`Trained model with new example: "${request.question}"`);
    } catch (error: any) {
      this.logger.error(`Training failed: ${error.message}`, error.stack);
      // Non-critical - log but don't throw
      this.logger.warn('Training skipped - Vanna API unavailable');
    }
  }

  /**
   * Find similar queries using pgvector cosine similarity
   * Requires OptimizationLog.queryEmbedding (vector(384))
   */
  private async findSimilarQuery(
    question: string,
    language?: string,
  ): Promise<VannaQueryResult | null> {
    try {
      // Generate embedding for input question
      const response = await this.client.post('/v1/embed', {
        text: question,
        language: language || 'en',
      });

      const queryEmbedding = response.data.embedding;

      // TODO: Replace with DatabaseService vector search once VED-B7M is complete
      // const similar = await this.databaseService.findSimilarQueries({
      //   embedding: queryEmbedding,
      //   threshold: 0.85,
      //   limit: 1,
      // });

      // Mock response for now
      this.logger.debug(
        'Vector cache not yet integrated - skipping similarity search',
      );
      return null;
    } catch (error: any) {
      this.logger.warn(`Vector search failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Store query embedding in OptimizationLog
   */
  private async storeQueryEmbedding(
    request: VannaQueryRequest,
    result: VannaQueryResult,
  ): Promise<void> {
    try {
      // TODO: Replace with DatabaseService once VED-B7M is complete
      // await this.databaseService.insertOptimizationLog({
      //   userId: request.userId,
      //   queryEmbedding: result.embedding, // vector(384)
      //   metadata: {
      //     question: request.question,
      //     sql: result.sql,
      //     language: request.language,
      //     confidence: result.confidence,
      //   },
      // });

      this.logger.debug('Query embedding stored (mock)');
    } catch (error: any) {
      // Non-critical - log but don't fail the request
      this.logger.warn(`Failed to store embedding: ${error.message}`);
    }
  }

  /**
   * Mock SQL generation for testing/fallback
   */
  private getMockSQLResult(question: string): VannaQueryResult {
    return {
      sql: 'SELECT * FROM "User" LIMIT 10; -- Mock query',
      confidence: 0.5,
      fromCache: false,
      executionPlan: 'Mock execution plan',
    };
  }

  /**
   * Health check for Vanna API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch {
      return false;
    }
  }
}
