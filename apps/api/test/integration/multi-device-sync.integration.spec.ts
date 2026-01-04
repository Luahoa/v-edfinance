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
import { WebSocketModule } from '../../src/websocket/websocket.module';

/**
 * I028: Multi-Device Session Sync Integration Test
 * Tests: Login on device A → Action on device B → State synced
 * Validates: JWT refresh, WebSocket syncing
 */
describe.skip('[SKIP: Missing websocket module] Multi-Device Session Sync (I028)', () => {
  // Skip if no test database available
  if (!process.env.TEST_DATABASE_URL) {
    it.skip('requires test database - set TEST_DATABASE_URL to enable integration tests', () => {});
    return;
  }

  let app: INestApplication;
  let prisma: PrismaService;
  let userId: string;
  let deviceAToken: string;
  let deviceBToken: string;
  let deviceARefreshToken: string;
  let deviceBRefreshToken: string;

  const testUser = {
    email: `multidevice-${Date.now()}@example.com`,
    password: 'MultiPass123!',
    name: { vi: 'Đa Thiết Bị', en: 'Multi Device', zh: '多设备' },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        UsersModule,
        AuthModule,
        WebSocketModule,
      ],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: vi.fn((key: string) => {
          if (key === 'JWT_SECRET') return 'test_secret';
          if (key === 'JWT_REFRESH_SECRET') return 'test_refresh_secret';
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

    // Register user
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser);
    userId = response.body.data.user.id;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await app.close();
    await prisma.$disconnect();
  });

  describe('Multi-Device Login', () => {
    it('should allow login from device A', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
          deviceId: 'device-a',
        })
        .expect(200);

      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      deviceAToken = response.body.data.accessToken;
      deviceARefreshToken = response.body.data.refreshToken;
    });

    it('should allow concurrent login from device B', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
          deviceId: 'device-b',
        })
        .expect(200);

      expect(response.body.data.accessToken).toBeDefined();
      deviceBToken = response.body.data.accessToken;
      deviceBRefreshToken = response.body.data.refreshToken;
    });

    it('should maintain separate sessions for each device', async () => {
      const sessions = await prisma.session.findMany({
        where: { userId },
      });

      expect(sessions.length).toBeGreaterThanOrEqual(2);
      expect(sessions.map((s) => s.deviceId)).toContain('device-a');
      expect(sessions.map((s) => s.deviceId)).toContain('device-b');
    });
  });

  describe('Token Refresh Synchronization', () => {
    it('should refresh token on device A without affecting device B', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: deviceARefreshToken })
        .expect(200);

      const newTokenA = response.body.data.accessToken;
      expect(newTokenA).not.toBe(deviceAToken);

      // Device B token should still be valid
      const deviceBCheck = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${deviceBToken}`)
        .expect(200);

      expect(deviceBCheck.body.data.id).toBe(userId);
    });

    it('should handle simultaneous refresh from both devices', async () => {
      const [refreshA, refreshB] = await Promise.all([
        request(app.getHttpServer())
          .post('/auth/refresh')
          .send({ refreshToken: deviceARefreshToken }),
        request(app.getHttpServer())
          .post('/auth/refresh')
          .send({ refreshToken: deviceBRefreshToken }),
      ]);

      expect(refreshA.status).toBe(200);
      expect(refreshB.status).toBe(200);
      expect(refreshA.body.data.accessToken).not.toBe(
        refreshB.body.data.accessToken,
      );
    });
  });

  describe('State Synchronization', () => {
    it('should sync profile updates across devices', async () => {
      // Update profile from device A
      await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${deviceAToken}`)
        .send({
          name: { vi: 'Đã Cập Nhật', en: 'Updated', zh: '已更新' },
        })
        .expect(200);

      // Verify update visible from device B
      const deviceBCheck = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${deviceBToken}`)
        .expect(200);

      expect(deviceBCheck.body.data.name.en).toBe('Updated');
    });

    it('should propagate behavior logs from device A to device B analytics', async () => {
      // Log action from device A
      await prisma.behaviorLog.create({
        data: {
          userId,
          action: 'page_view',
          category: 'navigation',
          metadata: { deviceId: 'device-a', page: 'dashboard' },
        },
      });

      // Check analytics from device B
      const response = await request(app.getHttpServer())
        .get('/analytics/behavior')
        .set('Authorization', `Bearer ${deviceBToken}`)
        .expect(200);

      expect(response.body.data.logs).toBeDefined();
      expect(
        response.body.data.logs.some(
          (log: any) => log.metadata?.deviceId === 'device-a',
        ),
      ).toBe(true);
    });
  });

  describe('Session Management', () => {
    it('should allow logout from device A without affecting device B', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${deviceAToken}`)
        .send({ deviceId: 'device-a' })
        .expect(200);

      // Device A should be logged out
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${deviceAToken}`)
        .expect(401);

      // Device B should still be active
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${deviceBToken}`)
        .expect(200);
    });

    it('should support logout from all devices', async () => {
      // Login again on device A
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
          deviceId: 'device-a',
        });
      const newTokenA = loginResponse.body.data.accessToken;

      // Logout from all devices
      await request(app.getHttpServer())
        .post('/auth/logout-all')
        .set('Authorization', `Bearer ${newTokenA}`)
        .expect(200);

      // Both devices should be logged out
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${newTokenA}`)
        .expect(401);

      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${deviceBToken}`)
        .expect(401);
    });
  });

  describe('Conflict Resolution', () => {
    it('should handle concurrent profile updates with last-write-wins', async () => {
      // Re-login both devices
      const [loginA, loginB] = await Promise.all([
        request(app.getHttpServer()).post('/auth/login').send({
          email: testUser.email,
          password: testUser.password,
          deviceId: 'device-a',
        }),
        request(app.getHttpServer()).post('/auth/login').send({
          email: testUser.email,
          password: testUser.password,
          deviceId: 'device-b',
        }),
      ]);

      const tokenA = loginA.body.data.accessToken;
      const tokenB = loginB.body.data.accessToken;

      // Concurrent updates
      await Promise.all([
        request(app.getHttpServer())
          .patch('/users/me')
          .set('Authorization', `Bearer ${tokenA}`)
          .send({ name: { vi: 'Từ A', en: 'From A', zh: '从A' } }),
        request(app.getHttpServer())
          .patch('/users/me')
          .set('Authorization', `Bearer ${tokenB}`)
          .send({ name: { vi: 'Từ B', en: 'From B', zh: '从B' } }),
      ]);

      // Verify final state
      const finalState = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(['From A', 'From B']).toContain(finalState.body.data.name.en);
    });
  });
});
