import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import 'reflect-metadata';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import * as dotenv from 'dotenv';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../../src/app.module';
import { AuthController } from '../../src/auth/auth.controller';
import { AuthModule } from '../../src/auth/auth.module';
import { AuthService } from '../../src/auth/auth.service';
import { PrismaModule } from '../../src/prisma/prisma.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { UsersModule } from '../../src/users/users.module';
import { UsersService } from '../../src/users/users.service';

dotenv.config();

describe('Auth Integration (e2e)', () => {
  // Skip if no test database available
  if (!process.env.TEST_DATABASE_URL) {
    it.skip('requires test database - set TEST_DATABASE_URL to enable integration tests', () => {});
    return;
  }

  let app: INestApplication;
  let prisma: PrismaService;

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

    // Clean test data before tests
    await prisma.user.deleteMany({
      where: { email: { contains: 'test-integration' } },
    });
  }, 30000);

  afterAll(async () => {
    if (app) {
      await prisma.user.deleteMany({
        where: { email: { contains: 'test-integration' } },
      });
      await app.close();
    }
  });

  const testUser = {
    email: `test-integration-${Date.now()}@example.com`,
    password: 'Password123!',
    name: {
      vi: 'Người Kiểm Thử',
      en: 'Integration Tester',
      zh: '集成测试员',
    },
  };

  it('should register a new user', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201);

    expect(response.body.access_token).toBeDefined();
    expect(response.body.refresh_token).toBeDefined();

    const user = await prisma.user.findUnique({
      where: { email: testUser.email },
    });
    expect(user).toBeDefined();
    expect(user?.name).toEqual(testUser.name);
  });

  it('should login and return tokens', async () => {
    // Ensure user exists before login test
    const existingUser = await prisma.user.findUnique({
      where: { email: testUser.email },
    });

    if (!existingUser) {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);
    }

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    expect(response.body.access_token).toBeDefined();
    expect(response.body.refresh_token).toBeDefined();
  });

  it('should fail login with wrong password', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword',
      })
      .expect(401);
  });
});
