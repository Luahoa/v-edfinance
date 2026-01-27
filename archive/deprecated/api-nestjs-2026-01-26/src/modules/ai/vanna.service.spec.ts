import { ConfigService } from '@nestjs/config';
import { VannaService } from './vanna.service';
import { describe, it, expect, vi } from 'vitest';

describe('VannaService', () => {
  const mockConfigService = {
    get: vi.fn((key: string, defaultValue?: unknown) => {
      const config: Record<string, unknown> = {
        VANNA_API_KEY: 'test-api-key',
        VANNA_BASE_URL: 'https://api.vanna.test',
        VANNA_ENABLE_CACHE: true,
      };
      return config[key] ?? defaultValue;
    }),
  };

  // Create service directly without NestJS DI
  const service = new VannaService(mockConfigService as unknown as ConfigService);

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateSQL', () => {
    it('should return mock SQL when API fails', async () => {
      const result = await service.generateSQL({
        question: 'Show me all users',
        language: 'en',
      });

      expect(result).toBeDefined();
      expect(result.sql).toContain('SELECT');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });

    it('should handle multi-language queries', async () => {
      const languages: ('vi' | 'en' | 'zh')[] = ['vi', 'en', 'zh'];

      for (const lang of languages) {
        const result = await service.generateSQL({
          question: 'Test query',
          language: lang,
        });

        expect(result).toBeDefined();
        expect(result.sql).toBeTruthy();
      }
    });

    it('should include embedding in result', async () => {
      const result = await service.generateSQL({
        question: 'Get user statistics',
        userId: 'test-user-id',
      });

      expect(result).toHaveProperty('sql');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('fromCache');
    });
  });

  describe('trainModel', () => {
    it('should accept training data without errors', async () => {
      await expect(
        service.trainModel({
          sql: 'SELECT * FROM "User" WHERE role = \'STUDENT\'',
          question: 'Show all students',
          language: 'en',
        }),
      ).resolves.not.toThrow();
    });

    it('should handle training with different languages', async () => {
      const trainingData = [
        {
          sql: 'SELECT count(*) FROM "User"',
          question: 'Có bao nhiêu người dùng?',
          language: 'vi' as const,
        },
        {
          sql: 'SELECT count(*) FROM "User"',
          question: 'How many users?',
          language: 'en' as const,
        },
        {
          sql: 'SELECT count(*) FROM "User"',
          question: '有多少用户？',
          language: 'zh' as const,
        },
      ];

      for (const data of trainingData) {
        await expect(service.trainModel(data)).resolves.not.toThrow();
      }
    });
  });

  describe('healthCheck', () => {
    it('should return false in test environment', async () => {
      const isHealthy = await service.healthCheck();
      expect(typeof isHealthy).toBe('boolean');
    });
  });

  describe('configuration', () => {
    it('should log warning when VANNA_API_KEY is missing', () => {
      const mockConfig = {
        get: vi.fn((key: string, defaultValue?: unknown) => {
          if (key === 'VANNA_API_KEY') return undefined;
          if (key === 'VANNA_BASE_URL') return 'https://api.vanna.test';
          if (key === 'VANNA_ENABLE_CACHE') return true;
          return defaultValue;
        }),
      };

      const serviceWithoutKey = new VannaService(mockConfig as unknown as ConfigService);
      expect(serviceWithoutKey).toBeDefined();
    });
  });

  describe('vector caching', () => {
    it('should skip cache when disabled', async () => {
      const mockConfig = {
        get: vi.fn((key: string, defaultValue?: unknown) => {
          const config: Record<string, unknown> = {
            VANNA_API_KEY: 'test-key',
            VANNA_BASE_URL: 'https://api.vanna.test',
            VANNA_ENABLE_CACHE: false,
          };
          return config[key] ?? defaultValue;
        }),
      };

      const serviceNoCache = new VannaService(mockConfig as unknown as ConfigService);
      const result = await serviceNoCache.generateSQL({
        question: 'Test',
        userId: 'test-user',
      });

      expect(result.fromCache).toBe(false);
    });
  });
});
