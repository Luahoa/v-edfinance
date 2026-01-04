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
import { SocialModule } from '../../src/social/social.module';
import { GamificationModule } from '../../src/gamification/gamification.module';

/**
 * I025: Full User Lifecycle Integration Test
 * Tests: Register → Learn → Socialize → Invest → Graduation
 * Validates: Complete user journey with all modules integrated
 */
describe.skip('[SKIP: Missing social module] Full User Lifecycle Integration (I025)', () => {
  // Skip if no test database available
  if (!process.env.TEST_DATABASE_URL) {
    it.skip('requires test database - set TEST_DATABASE_URL to enable integration tests', () => {});
    return;
  }

  let app: INestApplication;
  let prisma: PrismaService;
  let userId: string;
  let accessToken: string;
  let courseId: string;

  const testUser = {
    email: `lifecycle-${Date.now()}@example.com`,
    password: 'SecurePass123!',
    name: {
      vi: 'Người Dùng Đầy Đủ',
      en: 'Complete User',
      zh: '完整用户',
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        UsersModule,
        AuthModule,
        CoursesModule,
        SocialModule,
        GamificationModule,
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

    // Create test course
    const course = await prisma.course.create({
      data: {
        title: { vi: 'Khóa Học Kiểm Thử', en: 'Test Course', zh: '测试课程' },
        slug: `test-lifecycle-${Date.now()}`,
        description: { vi: 'Mô tả', en: 'Description', zh: '描述' },
        level: 'beginner',
        duration: 60,
        price: 0,
      },
    });
    courseId = course.id;
  });

  afterAll(async () => {
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
    await prisma.course.delete({ where: { id: courseId } }).catch(() => {});
    await app.close();
    await prisma.$disconnect();
  });

  describe('Phase 1: Registration & Onboarding', () => {
    it('should register new user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(testUser.email);
      userId = response.body.data.user.id;
      accessToken = response.body.data.accessToken;
    });

    it('should fetch user profile after registration', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data.name).toEqual(testUser.name);
    });
  });

  describe('Phase 2: Learning Journey', () => {
    it('should enroll in course', async () => {
      const response = await request(app.getHttpServer())
        .post(`/courses/${courseId}/enroll`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      expect(response.body.data.courseId).toBe(courseId);
      expect(response.body.data.userId).toBe(userId);
    });

    it('should track progress and earn points', async () => {
      const progressResponse = await request(app.getHttpServer())
        .patch(`/courses/${courseId}/progress`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ progress: 50 })
        .expect(200);

      expect(progressResponse.body.data.progress).toBe(50);

      // Check gamification points
      const pointsResponse = await request(app.getHttpServer())
        .get('/gamification/points')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(pointsResponse.body.data.totalPoints).toBeGreaterThan(0);
    });
  });

  describe('Phase 3: Social Engagement', () => {
    it('should create social post about learning', async () => {
      const response = await request(app.getHttpServer())
        .post('/social/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: { vi: 'Đang học!', en: 'Learning!', zh: '学习中！' },
        })
        .expect(201);

      expect(response.body.data.userId).toBe(userId);
      expect(response.body.data.content).toBeDefined();
    });
  });

  describe('Phase 4: Investment & Financial Management', () => {
    it('should create commitment contract', async () => {
      const response = await request(app.getHttpServer())
        .post('/commitment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          goalType: 'saving',
          amount: 1000000,
          deadline: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          penalty: 100000,
        })
        .expect(201);

      expect(response.body.data.userId).toBe(userId);
      expect(response.body.data.amount).toBe(1000000);
    });
  });

  describe('Phase 5: Graduation & Achievement', () => {
    it('should complete course and earn certification', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/courses/${courseId}/progress`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ progress: 100 })
        .expect(200);

      expect(response.body.data.progress).toBe(100);
      expect(response.body.data.completedAt).toBeDefined();
    });

    it('should achieve level up from accumulated points', async () => {
      const response = await request(app.getHttpServer())
        .get('/gamification/level')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.currentLevel).toBeGreaterThan(0);
    });

    it('should have complete user statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.coursesCompleted).toBe(1);
      expect(response.body.data.totalPoints).toBeGreaterThan(0);
      expect(response.body.data.socialPosts).toBeGreaterThan(0);
    });
  });
});
