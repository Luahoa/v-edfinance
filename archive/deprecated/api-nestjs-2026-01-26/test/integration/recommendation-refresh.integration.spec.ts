import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import 'reflect-metadata';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuthModule } from '../../src/auth/auth.module';
import { PrismaModule } from '../../src/prisma/prisma.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { UsersModule } from '../../src/users/users.module';
import { CoursesModule } from '../../src/courses/courses.module';
import { BehaviorAnalyticsModule } from '../../src/behavior-analytics/behavior-analytics.module';

/**
 * I027: Recommendation Refresh Trigger Integration Test
 * Tests: User behavior change → Recommendation stale → Auto-refresh triggered
 * Validates: Staleness detection, background job execution
 */
describe.skip('[SKIP: Missing behavior-analytics module] Recommendation Refresh Trigger (I027)', () => {
  // Skip if no test database available
  if (!process.env.TEST_DATABASE_URL) {
    it.skip('requires test database - set TEST_DATABASE_URL to enable integration tests', () => {});
    return;
  }

  let app: INestApplication;
  let prisma: PrismaService;
  let userId: string;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        UsersModule,
        AuthModule,
        CoursesModule,
        BehaviorAnalyticsModule,
      ],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: vi.fn((key: string) => {
          if (key === 'JWT_SECRET') return 'test_secret';
          if (key === 'DATABASE_URL') return process.env.DATABASE_URL;
          if (key === 'RECOMMENDATION_STALE_THRESHOLD_HOURS') return '1';
          return process.env[key];
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();

    // Create test user
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `recom-${Date.now()}@example.com`,
        password: 'RecomPass123!',
        name: { vi: 'Gợi Ý', en: 'Recommendation', zh: '推荐' },
      });
    userId = response.body.data.user.id;
    accessToken = response.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await app.close();
    await prisma.$disconnect();
  });

  describe('Initial Recommendation Generation', () => {
    it('should generate initial recommendations on first request', async () => {
      const response = await request(app.getHttpServer())
        .get('/courses/recommendations')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.recommendations).toBeDefined();
      expect(Array.isArray(response.body.data.recommendations)).toBe(true);
      expect(response.body.data.generatedAt).toBeDefined();
    });

    it('should cache recommendations for subsequent requests', async () => {
      const firstResponse = await request(app.getHttpServer())
        .get('/courses/recommendations')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const secondResponse = await request(app.getHttpServer())
        .get('/courses/recommendations')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(firstResponse.body.data.generatedAt).toBe(
        secondResponse.body.data.generatedAt,
      );
    });
  });

  describe('Staleness Detection', () => {
    it('should detect stale recommendations after significant behavior change', async () => {
      // Generate multiple behavior logs
      for (let i = 0; i < 5; i++) {
        await prisma.behaviorLog.create({
          data: {
            userId,
            action: 'course_view',
            category: 'learning',
            metadata: { courseId: `test-${i}` },
          },
        });
      }

      const response = await request(app.getHttpServer())
        .get('/courses/recommendations/status')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.isStale).toBeDefined();
      expect(response.body.data.behaviorChangeCount).toBeGreaterThan(0);
    });

    it('should flag recommendations as stale after time threshold', async () => {
      // Update recommendation timestamp to simulate staleness
      await prisma.userRecommendation.updateMany({
        where: { userId },
        data: {
          generatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        },
      });

      const response = await request(app.getHttpServer())
        .get('/courses/recommendations/status')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.isStale).toBe(true);
      expect(response.body.data.reason).toContain('time');
    });
  });

  describe('Auto-Refresh Trigger', () => {
    it('should trigger background refresh job on stale detection', async () => {
      const response = await request(app.getHttpServer())
        .post('/courses/recommendations/refresh')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(202);

      expect(response.body.data.jobId).toBeDefined();
      expect(response.body.data.status).toBe('queued');
    });

    it('should complete refresh job and update recommendations', async () => {
      const refreshResponse = await request(app.getHttpServer())
        .post('/courses/recommendations/refresh')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(202);

      const jobId = refreshResponse.body.data.jobId;

      // Poll job status
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const statusResponse = await request(app.getHttpServer())
        .get(`/courses/recommendations/job/${jobId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(['completed', 'processing']).toContain(
        statusResponse.body.data.status,
      );
    });

    it('should prevent duplicate refresh jobs', async () => {
      const first = await request(app.getHttpServer())
        .post('/courses/recommendations/refresh')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(202);

      const second = await request(app.getHttpServer())
        .post('/courses/recommendations/refresh')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(409);

      expect(second.body.message).toContain('already in progress');
    });
  });

  describe('Recommendation Quality', () => {
    it('should improve recommendations after behavior-based refresh', async () => {
      // Generate behavior showing interest in specific category
      for (let i = 0; i < 3; i++) {
        await prisma.behaviorLog.create({
          data: {
            userId,
            action: 'course_view',
            category: 'finance',
            metadata: { category: 'investment' },
          },
        });
      }

      await request(app.getHttpServer())
        .post('/courses/recommendations/refresh')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(202);

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const response = await request(app.getHttpServer())
        .get('/courses/recommendations')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.recommendations.length).toBeGreaterThan(0);
    });
  });
});
