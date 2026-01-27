import type { INestApplication } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { ProgressStatus, Role } from '@prisma/client';
import { EventEmitterModule } from '@nestjs/event-emitter';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AuthModule } from '../src/auth/auth.module';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { CommonModule } from '../src/common/common.module';
import { CoursesModule } from '../src/courses/courses.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { UsersModule } from '../src/users/users.module';
import { cleanupDatabase, createTestApp } from './helpers/test-utils';

describe('Course Learning Flow (Integration)', () => {
  // Skip if no test database configured
  if (!process.env.TEST_DATABASE_URL) {
    it.skip('requires test database - set TEST_DATABASE_URL to enable integration tests', () => {});
    return;
  }

  let app: INestApplication;
  let prisma: PrismaService;
  const userId = 'test-learner-id';
  const accessToken = 'mock-token';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        EventEmitterModule.forRoot(),
        PrismaModule,
        CommonModule,
        AuthModule,
        UsersModule,
        CoursesModule,
      ],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: vi.fn((key: string) => {
          if (key === 'JWT_SECRET') return 'test_secret';
          return null;
        }),
      })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context) => {
          const req = context.switchToHttp().getRequest();
          req.user = {
            userId,
            email: 'learner@example.com',
            role: Role.STUDENT,
          };
          return true;
        },
      })
      .compile();

    app = await createTestApp(moduleFixture);
    prisma = app.get<PrismaService>(PrismaService);

    await cleanupDatabase();

    await prisma.user.create({
      data: {
        id: userId,
        email: 'learner@example.com',
        passwordHash: 'hashed_password',
        name: { vi: 'Người học', en: 'Learner', zh: '学习者' },
        role: Role.STUDENT,
        points: 0,
        preferredLocale: 'vi',
      },
    });
  });

  afterAll(async () => {
    if (app) {
      await cleanupDatabase();
      await app.close();
    }
  });

  describe('Full Learning Lifecycle', () => {
    let courseId: string;
    let lessonId: string;

    it('should setup a course with localized content', async () => {
      const course = await prisma.course.create({
        data: {
          slug: 'integration-test-course',
          title: {
            vi: 'Khóa học tích hợp',
            en: 'Integration Course',
            zh: '集成课程',
          },
          description: { vi: 'Mô tả', en: 'Description', zh: '描述' },
          thumbnailKey: 'thumb.png',
          price: 0,
          published: true,
          lessons: {
            create: {
              order: 1,
              title: { vi: 'Bài học 1', en: 'Lesson 1', zh: '第1课' },
              content: { vi: 'Nội dung', en: 'Content', zh: '内容' },
              published: true,
            },
          },
        },
        include: { lessons: true },
      });

      courseId = course.id;
      lessonId = course.lessons[0].id;

      expect(courseId).toBeDefined();
      expect(lessonId).toBeDefined();
    });

    it('should start a lesson (progress persistence)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/courses/lessons/${lessonId}/progress`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          status: ProgressStatus.STARTED,
          durationSpent: 10,
        })
        .expect(201);

      expect(res.body.status).toBe(ProgressStatus.STARTED);
      expect(res.body.durationSpent).toBe(10);

      const progress = await prisma.userProgress.findUnique({
        where: { userId_lessonId: { userId, lessonId } },
      });
      expect(progress).toBeDefined();
      expect(progress?.status).toBe(ProgressStatus.STARTED);
    });

    it('should complete lesson → trigger points calculation', async () => {
      const res = await request(app.getHttpServer())
        .post(`/courses/lessons/${lessonId}/progress`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          status: ProgressStatus.COMPLETED,
          durationSpent: 50,
        })
        .expect(201);

      expect(res.body.status).toBe(ProgressStatus.COMPLETED);
      expect(res.body.durationSpent).toBe(60); // 10 (started) + 50 (completed)

      const user = await prisma.user.findUnique({ where: { id: userId } });
      expect(user?.points).toBe(10); // Default reward is 10 points

      const log = await prisma.behaviorLog.findFirst({
        where: { userId, eventType: 'LESSON_COMPLETED' },
      });
      expect(log).toBeDefined();
      expect(log?.payload).toMatchObject({ pointsEarned: 10, lessonId });
    });

    it('should verify dashboard stats update', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/profile/dashboard')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.points).toBe(10);
      expect(res.body.enrolledCoursesCount).toBe(1);
      expect(res.body.completedLessonsCount).toBe(1);
      expect(res.body.totalDurationSpent).toBe(60);
    });

    it('should test course content localization', async () => {
      const res = await request(app.getHttpServer())
        .get(`/courses/${courseId}`)
        .expect(200);

      // Verify localized fields returned as JSONB
      expect(res.body.title.vi).toBe('Khóa học tích hợp');
      expect(res.body.title.en).toBe('Integration Course');
      expect(res.body.lessons[0].title.zh).toBe('第1课');
    });

    it('should be idempotent (completing again does not award extra points)', async () => {
      await request(app.getHttpServer())
        .post(`/courses/lessons/${lessonId}/progress`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          status: ProgressStatus.COMPLETED,
          durationSpent: 10,
        })
        .expect(201);

      const user = await prisma.user.findUnique({ where: { id: userId } });
      expect(user?.points).toBe(10); // Still 10, not 20
    });
  });
});
