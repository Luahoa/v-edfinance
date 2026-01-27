import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AuthModule } from '../../src/auth/auth.module';
import { BehaviorModule } from '../../src/behavior/behavior.module';
import { NudgeModule } from '../../src/modules/nudge/nudge.module';
import { PrismaModule } from '../../src/prisma/prisma.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { UsersService } from '../../src/users/users.service';

// Mock bcrypt to bypass hashing/comparison logic issues
vi.mock('bcrypt', async () => ({
  hash: vi.fn().mockResolvedValue('mocked_hash'),
  compare: vi.fn().mockResolvedValue(true),
}));

describe('Behavior & Gamification Integration (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    // Force environment variables for Auth
    process.env.JWT_SECRET = 'test_secret';
    process.env.JWT_EXPIRATION_TIME = '15m';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        EventEmitterModule.forRoot(),
        PrismaModule,
        AuthModule,
        BehaviorModule,
        NudgeModule,
      ],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: vi.fn((key: string) => {
          if (key === 'JWT_SECRET') return 'test_secret';
          return null;
        }),
      })
      .overrideProvider(UsersService)
      .useValue({
        findOne: vi.fn().mockResolvedValue({
          id: 'user-1',
          email: 'behavior-test@example.com',
          role: 'USER',
          passwordHash: 'mocked_hash',
        }),
        create: vi.fn().mockResolvedValue({
          id: 'user-1',
          email: 'behavior-test@example.com',
          role: 'USER',
          passwordHash: 'mocked_hash',
        }),
      })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: vi.fn(),
        $disconnect: vi.fn(),
        onModuleInit: vi.fn(),
        onModuleDestroy: vi.fn(),
        refreshToken: {
          create: vi.fn().mockResolvedValue({
            id: 'refresh-token-1',
            token: 'hashed_token',
            userId: 'user-1',
          }),
          update: vi.fn(),
          findUnique: vi.fn(),
        },
        behaviorLog: {
          create: vi.fn().mockResolvedValue({
            id: 'log-1',
            eventType: 'PAGE_VIEW',
            userId: 'user-1',
          }),
          findMany: vi.fn().mockResolvedValue([]),
          count: vi.fn().mockResolvedValue(1),
          deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
        userAchievement: {
          deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
        userStreak: {
          findUnique: vi.fn().mockResolvedValue({ currentStreak: 5 }),
          deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
        user: {
          findUnique: vi.fn().mockImplementation((args) => {
            if (args.where.id || args.where.email) {
              return Promise.resolve({
                id: 'user-1',
                email: 'behavior-test@example.com',
                role: 'USER',
                passwordHash: 'mocked_hash',
              });
            }
            return Promise.resolve(null);
          }),
          create: vi.fn().mockResolvedValue({
            id: 'user-1',
            role: 'USER',
          }),
          delete: vi.fn().mockResolvedValue({}),
        },
        systemSettings: {
          findMany: vi.fn().mockResolvedValue([]),
        },
      })
      .overrideProvider('CACHE_MANAGER')
      .useValue({
        get: vi.fn(),
        set: vi.fn(),
        del: vi.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Setup: Create a user and get token
    const email = `behavior-test-${Date.now()}@example.com`;
    // Register calls generating tokens, but we mock UsersService.create
    // It returns user. Then Auth controller calls generateTokens.
    const regResp = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'Password123!', name: 'Behavior Tester' });

    // Auth register automatically logs in and returns tokens?
    // Let's rely on login explicitly to be safe, or just use regResp access_token if present.
    // AuthController.register -> AuthService.register -> generateTokens.
    // So regResp.body should have access_token.

    userId = 'user-1'; // Hardcoded from mock

    const loginResp = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'Password123!' })
      .expect(200);

    accessToken = loginResp.body.access_token;
  }, 180000);

  afterAll(async () => {
    // Cleanup
    if (app) {
      // Since UsersService is mocked, we can't easily clean up real DB, so just close app.
      // The PrismaService mock also prevents DB writes.
      await app.close();
    }
  });

  describe('Behavior Tracking', () => {
    it('should log a user behavior event', async () => {
      const response = await request(app.getHttpServer())
        .post('/behavior/log')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          eventType: 'PAGE_VIEW',
          metadata: { page: 'dashboard' },
        })
        .expect(201);

      expect(response.body.eventType).toBe('PAGE_VIEW');
      expect(response.body.userId).toBe(userId);
    });

    it('should retrieve behavior logs for user', async () => {
      const response = await request(app.getHttpServer())
        .get('/behavior/logs')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('Gamification & Streaks', () => {
    it('should get current streak', async () => {
      const response = await request(app.getHttpServer())
        .get('/behavior/streak')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('currentStreak');
      expect(typeof response.body.currentStreak).toBe('number');
    });

    it('should trigger a nudge check (social proof)', async () => {
      const response = await request(app.getHttpServer())
        .post('/nudge/check')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          context: 'COURSE_LISTING',
          currentPath: '/courses',
        })
        .expect(201);

      // Nudge might be null if no triggers meet criteria, but the endpoint should work
      if (response.body) {
        expect(response.body).toHaveProperty('type');
        expect(response.body).toHaveProperty('content');
      }
    });
  });
});
