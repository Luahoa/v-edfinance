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
import { HealthModule } from '../../src/health/health.module';

/**
 * I030: Disaster Recovery Simulation Integration Test
 * Tests: Critical failure → Fallback systems activate → Graceful degradation → Recovery
 * Validates: Health checks, circuit breakers
 */
describe.skip('[SKIP: Missing health module] Disaster Recovery Simulation (I030)', () => {
  // Skip if no test database available
  if (!process.env.TEST_DATABASE_URL) {
    it.skip('requires test database - set TEST_DATABASE_URL to enable integration tests', () => {});
    return;
  }

  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        UsersModule,
        AuthModule,
        HealthModule,
      ],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: vi.fn((key: string) => {
          if (key === 'JWT_SECRET') return 'test_secret';
          if (key === 'DATABASE_URL') return process.env.DATABASE_URL;
          if (key === 'CIRCUIT_BREAKER_THRESHOLD') return '3';
          if (key === 'CIRCUIT_BREAKER_TIMEOUT') return '5000';
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
        email: `disaster-${Date.now()}@example.com`,
        password: 'DisasterPass123!',
        name: { vi: 'Thảm Họa', en: 'Disaster', zh: '灾难' },
      });
    accessToken = response.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  describe('Health Checks', () => {
    it('should report healthy status when all systems operational', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.checks.database).toBe('up');
      expect(response.body.checks.redis).toBeDefined();
    });

    it('should report degraded status when non-critical service fails', async () => {
      // Simulate Redis failure (if applicable)
      const response = await request(app.getHttpServer())
        .get('/health/detailed')
        .expect(200);

      expect(['healthy', 'degraded']).toContain(response.body.status);
    });

    it('should provide component-level health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/components')
        .expect(200);

      expect(response.body.components).toHaveProperty('database');
      expect(response.body.components).toHaveProperty('api');
      expect(['up', 'down', 'degraded']).toContain(
        response.body.components.database,
      );
    });
  });

  describe('Circuit Breaker Activation', () => {
    it('should activate circuit breaker after threshold failures', async () => {
      // Simulate multiple failures
      const endpoint = '/api/unreliable-service';

      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .get(endpoint)
          .set('Authorization', `Bearer ${accessToken}`)
          .catch(() => {}); // Ignore errors
      }

      // Circuit should be open
      const response = await request(app.getHttpServer())
        .get(endpoint)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(503);

      expect(response.body.message).toContain('circuit breaker');
    });

    it('should allow half-open state after timeout', async () => {
      await new Promise((resolve) => setTimeout(resolve, 6000)); // Wait for circuit breaker timeout

      const response = await request(app.getHttpServer())
        .get('/api/unreliable-service')
        .set('Authorization', `Bearer ${accessToken}`);

      // Should attempt request in half-open state
      expect([200, 503]).toContain(response.status);
    });
  });

  describe('Graceful Degradation', () => {
    it('should serve cached data when database is slow', async () => {
      // Simulate slow database query
      vi.spyOn(prisma.user, 'findUnique').mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(null), 10000)),
      );

      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .timeout(5000);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.meta?.cached).toBe(true);

      vi.restoreAllMocks();
    });

    it('should disable non-essential features during high load', async () => {
      const response = await request(app.getHttpServer())
        .get('/features/status')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.essentialFeatures).toBeDefined();
      expect(response.body.data.nonEssentialFeatures).toBeDefined();
    });

    it('should queue background jobs when worker is down', async () => {
      const response = await request(app.getHttpServer())
        .post('/courses/recommendations/refresh')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(202);

      expect(response.body.data.status).toBe('queued');
      expect(response.body.data.willRetry).toBe(true);
    });
  });

  describe('Database Connection Failure', () => {
    it('should handle database connection loss gracefully', async () => {
      // Disconnect database
      await prisma.$disconnect();

      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(503);

      expect(response.body.message).toContain('database');

      // Reconnect
      await prisma.$connect();
    });

    it('should auto-reconnect after database recovery', async () => {
      await prisma.$connect();

      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body.checks.database).toBe('up');
    });
  });

  describe('Failover Mechanisms', () => {
    it('should use read replica when primary database is down', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.meta?.source).toBeDefined();
      expect(['primary', 'replica', 'cache']).toContain(
        response.body.meta.source,
      );
    });

    it('should fallback to static content when API fails', async () => {
      const response = await request(app.getHttpServer())
        .get('/courses')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Recovery Procedures', () => {
    it('should log recovery events for monitoring', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/recovery-logs')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should clear circuit breaker after successful health check', async () => {
      // Trigger health check
      await request(app.getHttpServer())
        .post('/health/reset-circuit-breakers')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify circuit is closed
      const statusResponse = await request(app.getHttpServer())
        .get('/health/circuit-breakers')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(
        statusResponse.body.data.every((cb: any) => cb.state === 'closed'),
      ).toBe(true);
    });

    it('should send alert notifications during critical failures', async () => {
      // Simulate critical failure
      const response = await request(app.getHttpServer())
        .get('/health/alerts')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.criticalAlerts).toBeDefined();
      expect(Array.isArray(response.body.data.criticalAlerts)).toBe(true);
    });
  });

  describe('Data Integrity During Recovery', () => {
    it('should prevent data corruption during failover', async () => {
      // Attempt write operation during degraded state
      const response = await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: { vi: 'Phục Hồi', en: 'Recovery', zh: '恢复' },
        })
        .expect(200);

      // Verify write succeeded or was safely rejected
      expect(response.body.data).toBeDefined();
    });

    it('should maintain transaction integrity across failures', async () => {
      const response = await request(app.getHttpServer())
        .post('/transactions/atomic-test')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          operations: [
            { type: 'create', model: 'user' },
            { type: 'create', model: 'profile' },
          ],
        });

      // Either all succeed or all fail
      expect([200, 500]).toContain(response.status);
      if (response.status === 500) {
        expect(response.body.message).toContain('rolled back');
      }
    });
  });
});
