import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import 'reflect-metadata';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import * as dotenv from 'dotenv';
import request from 'supertest';
import { AuthModule } from '../src/auth/auth.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { UsersModule } from '../src/users/users.module';
import {
  createMockPrismaService,
  createMockUser,
} from '../src/test-utils/prisma-mock.helper';

dotenv.config();

describe('Auth & Profile Integration', () => {
  // Skip if no test database configured
  if (!process.env.TEST_DATABASE_URL) {
    it.skip('requires test database - set TEST_DATABASE_URL to enable integration tests', () => {});
    return;
  }

  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let refreshToken: string;

  const testUser = {
    email: `test-profile-${Date.now()}@example.com`,
    password: 'Password123!',
    name: {
      vi: 'Người Kiểm Thử',
      en: 'Integration Tester',
      zh: '集成测试员',
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        UsersModule,
        AuthModule,
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
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  }, 30000);

  afterAll(async () => {
    if (app) {
      await prisma.refreshToken.deleteMany({
        where: { user: { email: testUser.email } },
      });
      await prisma.user.deleteMany({
        where: { email: testUser.email },
      });
      await app.close();
    }
  });

  it('1. Register → Login → Get Profile', async () => {
    // Register
    const regRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201);

    expect(regRes.body.access_token).toBeDefined();

    // Login
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    accessToken = loginRes.body.access_token;
    refreshToken = loginRes.body.refresh_token;

    // Get Profile
    const profileRes = await request(app.getHttpServer())
      .get('/users/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(profileRes.body.email).toBe(testUser.email);
    expect(profileRes.body.name).toEqual(testUser.name);
  });

  it('2. Update Profile (Multi-locale)', async () => {
    const updatedName = {
      vi: 'Tên Đã Cập Nhật',
      en: 'Updated Name',
      zh: '更新后的名称',
    };

    await request(app.getHttpServer())
      .patch('/users/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: updatedName, preferredLocale: 'en' })
      .expect(200);

    // Verify DB
    const user = await prisma.user.findUnique({
      where: { email: testUser.email },
    });
    expect(user?.name).toEqual(updatedName);
    expect(user?.preferredLocale).toBe('en');
  });

  it('3. Change Password', async () => {
    const newPassword = 'NewPassword123!';

    await request(app.getHttpServer())
      .patch('/users/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ oldPassword: testUser.password, newPassword })
      .expect(200);

    // Verify Login with new password
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: newPassword })
      .expect(200);

    testUser.password = newPassword;
  });

  it('4. Token Refresh Logic', async () => {
    const refreshRes = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: refreshToken })
      .expect(200);

    expect(refreshRes.body.access_token).toBeDefined();
    expect(refreshRes.body.refresh_token).not.toBe(refreshToken);

    // New access token works
    await request(app.getHttpServer())
      .get('/users/profile')
      .set('Authorization', `Bearer ${refreshRes.body.access_token}`)
      .expect(200);

    refreshToken = refreshRes.body.refresh_token;
  });

  it('5. Token Reuse Detection (Security)', async () => {
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: 'invalid-or-old' })
      .expect(401);
  });
});
