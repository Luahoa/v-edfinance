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
import { AnalyticsModule } from '../../src/analytics/analytics.module';

/**
 * I026: Admin Dashboard Data Pipeline Integration Test
 * Tests: User actions → Metrics calculated → Admin views dashboard → Real-time updates
 * Validates: Role-based access, data accuracy
 */
describe.skip('[SKIP: Missing analytics module] Admin Dashboard Data Pipeline (I026)', () => {
  // Skip if no test database available
  if (!process.env.TEST_DATABASE_URL) {
    it.skip('requires test database - set TEST_DATABASE_URL to enable integration tests', () => {});
    return;
  }

  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let userToken: string;
  let adminId: string;
  let regularUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        UsersModule,
        AuthModule,
        AnalyticsModule,
      ],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: vi.fn((key: string) => {
          if (key === 'JWT_SECRET') return 'test_secret';
          if (key === 'DATABASE_URL') return process.env.DATABASE_URL;
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

    // Create admin user
    const adminResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `admin-${Date.now()}@example.com`,
        password: 'AdminPass123!',
        name: { vi: 'Quản Trị', en: 'Admin', zh: '管理员' },
      });
    adminId = adminResponse.body.data.user.id;
    adminToken = adminResponse.body.data.accessToken;

    // Promote to admin
    await prisma.user.update({
      where: { id: adminId },
      data: { role: 'admin' },
    });

    // Create regular user
    const userResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `user-${Date.now()}@example.com`,
        password: 'UserPass123!',
        name: { vi: 'Người Dùng', en: 'User', zh: '用户' },
      });
    regularUserId = userResponse.body.data.user.id;
    userToken = userResponse.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.user
      .deleteMany({
        where: { id: { in: [adminId, regularUserId] } },
      })
      .catch(() => {});
    await app.close();
    await prisma.$disconnect();
  });

  describe('Role-Based Access Control', () => {
    it('should allow admin to access dashboard', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.metrics).toBeDefined();
    });

    it('should deny regular user access to dashboard', async () => {
      await request(app.getHttpServer())
        .get('/admin/dashboard')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should deny unauthenticated access to dashboard', async () => {
      await request(app.getHttpServer()).get('/admin/dashboard').expect(401);
    });
  });

  describe('Data Pipeline Accuracy', () => {
    it('should calculate user growth metrics correctly', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/metrics/user-growth')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.totalUsers).toBeGreaterThanOrEqual(2);
      expect(response.body.data.newUsersToday).toBeGreaterThanOrEqual(2);
    });

    it('should aggregate course enrollment statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/metrics/enrollments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalEnrollments).toBeGreaterThanOrEqual(0);
    });

    it('should track behavior log metrics', async () => {
      // Generate behavior log
      await prisma.behaviorLog.create({
        data: {
          userId: regularUserId,
          action: 'page_view',
          category: 'navigation',
          metadata: { page: 'dashboard' },
        },
      });

      const response = await request(app.getHttpServer())
        .get('/admin/metrics/behavior')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.totalActions).toBeGreaterThan(0);
    });
  });

  describe('Real-Time Updates', () => {
    it('should reflect new user registration in metrics', async () => {
      const beforeResponse = await request(app.getHttpServer())
        .get('/admin/metrics/user-growth')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const beforeCount = beforeResponse.body.data.totalUsers;

      // Register new user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `newuser-${Date.now()}@example.com`,
          password: 'NewPass123!',
          name: { vi: 'Mới', en: 'New', zh: '新' },
        });

      const afterResponse = await request(app.getHttpServer())
        .get('/admin/metrics/user-growth')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(afterResponse.body.data.totalUsers).toBe(beforeCount + 1);
    });

    it('should update dashboard cache on significant events', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.lastUpdated).toBeDefined();
      expect(
        new Date(response.body.data.lastUpdated).getTime(),
      ).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('Data Integrity & Validation', () => {
    it('should ensure metrics match database counts', async () => {
      const dbCount = await prisma.user.count();

      const response = await request(app.getHttpServer())
        .get('/admin/metrics/user-growth')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.totalUsers).toBe(dbCount);
    });

    it('should handle missing data gracefully', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/metrics/nonexistent')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });
  });
});
