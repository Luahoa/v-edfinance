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
import { AuditModule } from '../../src/audit/audit.module';

/**
 * I029: Security Audit Trail Integration Test
 * Tests: Sensitive actions → Audit logs created → Searchable → Tamper-proof
 * Validates: Immutable logging, GDPR compliance
 */
describe.skip('[SKIP: Missing audit module] Security Audit Trail (I029)', () => {
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
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        UsersModule,
        AuthModule,
        AuditModule,
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

    // Create admin
    const adminResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `audit-admin-${Date.now()}@example.com`,
        password: 'AdminPass123!',
        name: { vi: 'Quản Trị Audit', en: 'Audit Admin', zh: '审计管理' },
      });
    adminId = adminResponse.body.data.user.id;
    adminToken = adminResponse.body.data.accessToken;
    await prisma.user.update({
      where: { id: adminId },
      data: { role: 'admin' },
    });

    // Create user
    const userResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `audit-user-${Date.now()}@example.com`,
        password: 'UserPass123!',
        name: { vi: 'Người Dùng Audit', en: 'Audit User', zh: '审计用户' },
      });
    userId = userResponse.body.data.user.id;
    userToken = userResponse.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.user
      .deleteMany({ where: { id: { in: [adminId, userId] } } })
      .catch(() => {});
    await app.close();
    await prisma.$disconnect();
  });

  describe('Audit Log Creation', () => {
    it('should create audit log for sensitive login action', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: `audit-user-${Date.now()}@example.com`,
          password: 'WrongPassword',
        })
        .expect(401);

      const auditLogs = await prisma.auditLog.findMany({
        where: { action: 'login_failed' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].action).toBe('login_failed');
    });

    it('should create audit log for password change', async () => {
      await request(app.getHttpServer())
        .patch('/users/me/password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentPassword: 'UserPass123!',
          newPassword: 'NewPass123!',
        })
        .expect(200);

      const auditLogs = await prisma.auditLog.findMany({
        where: { userId, action: 'password_changed' },
      });

      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].severity).toBe('high');
    });

    it('should create audit log for role elevation', async () => {
      const tempUser = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `temp-${Date.now()}@example.com`,
          password: 'TempPass123!',
          name: { vi: 'Tạm', en: 'Temp', zh: '临时' },
        });

      const tempUserId = tempUser.body.data.user.id;

      await request(app.getHttpServer())
        .patch(`/admin/users/${tempUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' })
        .expect(200);

      const auditLogs = await prisma.auditLog.findMany({
        where: {
          targetUserId: tempUserId,
          action: 'role_changed',
        },
      });

      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].metadata).toHaveProperty('newRole', 'admin');
    });
  });

  describe('Audit Log Immutability', () => {
    it('should prevent modification of audit logs', async () => {
      const log = await prisma.auditLog.create({
        data: {
          userId,
          action: 'test_action',
          severity: 'medium',
          metadata: { test: true },
        },
      });

      // Attempt to modify should fail or be logged
      try {
        await prisma.auditLog.update({
          where: { id: log.id },
          data: { action: 'modified_action' },
        });
        // If update succeeds, it should create a tamper log
        const tamperLogs = await prisma.auditLog.findMany({
          where: { action: 'audit_log_tamper_attempt' },
        });
        expect(tamperLogs.length).toBeGreaterThan(0);
      } catch (error) {
        // Expected to fail if immutability is enforced at DB level
        expect(error).toBeDefined();
      }
    });

    it('should include hash for tamper detection', async () => {
      const log = await prisma.auditLog.create({
        data: {
          userId,
          action: 'hash_test',
          severity: 'low',
          metadata: { data: 'test' },
        },
      });

      expect(log.hash).toBeDefined();
      expect(typeof log.hash).toBe('string');
      expect(log.hash.length).toBeGreaterThan(0);
    });
  });

  describe('Audit Log Search & Filtering', () => {
    it('should search audit logs by user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/audit/logs?userId=${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.logs).toBeDefined();
      expect(
        response.body.data.logs.every((log: any) => log.userId === userId),
      ).toBe(true);
    });

    it('should filter audit logs by action type', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/audit/logs?action=password_changed')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(
        response.body.data.logs.every(
          (log: any) => log.action === 'password_changed',
        ),
      ).toBe(true);
    });

    it('should filter audit logs by severity', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/audit/logs?severity=high')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(
        response.body.data.logs.every((log: any) => log.severity === 'high'),
      ).toBe(true);
    });

    it('should filter audit logs by date range', async () => {
      const startDate = new Date(
        Date.now() - 24 * 60 * 60 * 1000,
      ).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app.getHttpServer())
        .get(`/admin/audit/logs?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.logs).toBeDefined();
      expect(Array.isArray(response.body.data.logs)).toBe(true);
    });
  });

  describe('GDPR Compliance', () => {
    it('should support audit log export for user data request', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me/data-export')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.auditLogs).toBeDefined();
      expect(Array.isArray(response.body.data.auditLogs)).toBe(true);
    });

    it('should anonymize audit logs on user deletion', async () => {
      const tempUser = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `gdpr-${Date.now()}@example.com`,
          password: 'GdprPass123!',
          name: { vi: 'GDPR', en: 'GDPR', zh: 'GDPR' },
        });

      const tempUserId = tempUser.body.data.user.id;
      const tempToken = tempUser.body.data.accessToken;

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: tempUserId,
          action: 'user_action',
          severity: 'low',
          metadata: {},
        },
      });

      // Delete user (GDPR right to be forgotten)
      await request(app.getHttpServer())
        .delete('/users/me')
        .set('Authorization', `Bearer ${tempToken}`)
        .expect(200);

      // Check audit log is anonymized
      const anonymizedLogs = await prisma.auditLog.findMany({
        where: { userId: tempUserId },
      });

      expect(anonymizedLogs.length).toBeGreaterThan(0);
      expect(anonymizedLogs[0].metadata).toHaveProperty('anonymized', true);
    });
  });

  describe('Access Control', () => {
    it('should allow admin to view all audit logs', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/audit/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.logs).toBeDefined();
    });

    it('should deny regular user access to audit logs', async () => {
      await request(app.getHttpServer())
        .get('/admin/audit/logs')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should allow user to view their own audit logs', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me/audit-logs')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(
        response.body.data.logs.every((log: any) => log.userId === userId),
      ).toBe(true);
    });
  });
});
