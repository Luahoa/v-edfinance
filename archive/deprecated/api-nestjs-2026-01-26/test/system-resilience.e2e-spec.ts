import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../src/app.module';
import { DiagnosticService } from '../src/modules/debug/diagnostic.service';
import { AiService } from '../src/ai/ai.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppService } from '../src/app.service';
import helmet from 'helmet';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

describe.skip('System Resilience (e2e) [REQUIRES_DB]', () => {
  let app: INestApplication;
  let diagnosticService: DiagnosticService;
  let aiService: AiService;
  let prismaService: PrismaService;
  let appService: AppService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(helmet());
    app.useGlobalFilters(new AllExceptionsFilter());

    diagnosticService = moduleFixture.get<DiagnosticService>(DiagnosticService);
    aiService = moduleFixture.get<AiService>(AiService);
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    appService = moduleFixture.get<AppService>(AppService);

    await app.init();
  }, 120000);

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('Resilience: Global Error Boundary', () => {
    it('should catch forced errors and return structured ErrorId', async () => {
      // Mock the service method on the instance retrieved from the app
      const spy = vi
        .spyOn(diagnosticService, 'runFullDiagnostics')
        .mockRejectedValue(new Error('Resilience test error'));

      const res = await request(app.getHttpServer())
        .get('/debug/run')
        .expect(500);

      expect(res.body).toHaveProperty('errorId');
      expect(res.body.errorId).toContain('ERR-');
      expect(res.body).toHaveProperty('statusCode', 500);

      spy.mockRestore();
    });
  });

  describe('Resilience: Manual Rate Limiting (AI)', () => {
    it('should throw ForbiddenException when AI rate limit exceeded', async () => {
      const userId = 'test-user-resilience';
      const spy = vi
        .spyOn(prismaService.behaviorLog, 'count')
        .mockResolvedValue(25);

      await expect((aiService as any).checkUserAIUsage(userId)).rejects.toThrow(
        'AI rate limit exceeded',
      );

      spy.mockRestore();
    });
  });

  describe('Resilience: Health Check Reliability', () => {
    it('should return 200 for metrics Content successfully', async () => {
      vi.restoreAllMocks();

      // Ensure we are mocking the method on the instance NestJS is actually using
      const metricsSpy = vi
        .spyOn(diagnosticService, 'getMetrics')
        .mockResolvedValue('vedfinance_metrics_test 1' as any);

      const response = await request(app.getHttpServer())
        .get('/debug/metrics')
        .expect(200);

      expect(response.text).toContain('vedfinance_metrics_test');
      metricsSpy.mockRestore();
    });
  });

  describe('Resilience: Security Headers', () => {
    it('should include Helmet security headers on successful requests', async () => {
      vi.restoreAllMocks();
      vi.spyOn(appService, 'getHello').mockReturnValue('Hello World!');

      const response = await request(app.getHttpServer()).get('/').expect(200);

      expect(response.headers).toHaveProperty('x-dns-prefetch-control');
      expect(response.headers).toHaveProperty('x-frame-options');
    });
  });
});
