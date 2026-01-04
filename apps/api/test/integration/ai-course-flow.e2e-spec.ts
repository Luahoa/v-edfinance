import type { ExecutionContext, INestApplication } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AiModule } from '../../src/ai/ai.module';
import { AuthModule } from '../../src/auth/auth.module';
import { JwtAuthGuard } from '../../src/auth/jwt-auth.guard';
import { CommonModule } from '../../src/common/common.module';
import { CoursesModule } from '../../src/courses/courses.module';
import { PrismaModule } from '../../src/prisma/prisma.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { Role } from '@prisma/client';

describe('AI & Course Integration (e2e)', () => {
  // Skip if no test database available
  if (!process.env.TEST_DATABASE_URL) {
    it.skip('requires test database - set TEST_DATABASE_URL to enable integration tests', () => {});
    return;
  }

  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;
  let courseId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        CommonModule,
        AuthModule,
        AiModule,
        CoursesModule,
      ],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: vi.fn((key: string) => {
          if (key === 'JWT_SECRET') return 'test_secret';
          if (key === 'GEMINI_API_KEY') return 'test_key';
          if (key === 'REDIS_HOST') return 'localhost';
          if (key === 'REDIS_PORT') return '6379';
          return null;
        }),
      })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest();
          request.user = {
            userId: 'test-user-123',
            email: 'test@example.com',
            role: Role.STUDENT,
          };
          return true;
        },
      })
      .overrideProvider('CACHE_MANAGER')
      .useValue({
        get: vi.fn(),
        set: vi.fn(),
        del: vi.fn(),
        reset: vi.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Guard overridden - no real auth needed
    userId = 'test-user-123';
    accessToken = 'mock-token';

    // Create test user
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password',
        role: Role.STUDENT,
      },
    });

    // Seed test courses
    await prisma.course.createMany({
      data: [
        {
          slug: 'test-course-1',
          title: { vi: 'Khóa học 1', en: 'Course 1', zh: '课程1' },
          description: { vi: 'Mô tả', en: 'Description', zh: '描述' },
          thumbnailKey: 'test-thumbnail-1.jpg',
          price: 0,
          level: 'BEGINNER',
          published: true,
        },
        {
          slug: 'test-course-2',
          title: { vi: 'Khóa học 2', en: 'Course 2', zh: '课程2' },
          description: { vi: 'Mô tả', en: 'Description', zh: '描述' },
          thumbnailKey: 'test-thumbnail-2.jpg',
          price: 100,
          level: 'INTERMEDIATE',
          published: true,
        },
      ],
    });

    // Get courseId for cleanup
    const firstCourse = await prisma.course.findFirst();
    courseId = firstCourse?.id || '';
  }, 180000);

  afterAll(async () => {
    // Cleanup
    if (app) {
      if (userId) {
        await prisma.chatMessage.deleteMany({ where: { thread: { userId } } });
        await prisma.chatThread.deleteMany({ where: { userId } });
        await prisma.userProgress.deleteMany({ where: { userId } });
        await prisma.lesson.deleteMany({ where: { course: { id: courseId } } });
        await prisma.course.deleteMany({});
        await prisma.user.delete({ where: { id: userId } });
      }
      await app.close();
    }
  });

  describe('AI Module', () => {
    it('should create a chat thread', async () => {
      const response = await request(app.getHttpServer())
        .post('/ai/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'My Investment Chat' })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.title).toBe('My Investment Chat');
    });

    it('should fail to generate response without thread', async () => {
      await request(app.getHttpServer())
        .post('/ai/threads/invalid-id/chat')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ prompt: 'Hello' })
        .expect(404); // Thread not found
    });
  });

  describe('Course Module', () => {
    let lessonId: string;

    beforeAll(async () => {
      // Create test course with lessons
      const course = await prisma.course.create({
        data: {
          slug: 'test-course-' + Date.now(),
          title: { vi: 'Khóa học Test', en: 'Test Course', zh: '测试课程' },
          description: { vi: 'Mô tả', en: 'Description', zh: '描述' },
          thumbnailKey: 'default-thumbnail.jpg',
          price: 0,
          level: 'BEGINNER',
          lessons: {
            create: [
              {
                title: { vi: 'Bài học 1', en: 'Lesson 1', zh: '课程1' },
                content: { vi: 'Nội dung', en: 'Content', zh: '内容' },
                type: 'VIDEO',
                order: 1,
                duration: 30,
              },
            ],
          },
        },
        include: { lessons: true },
      });

      courseId = course.id;
      lessonId = course.lessons[0].id;
    });

    it('should return all courses', async () => {
      const response = await request(app.getHttpServer())
        .get('/courses')
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should update lesson progress', async () => {
      const response = await request(app.getHttpServer())
        .post(`/courses/lessons/${lessonId}/progress`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          status: 'COMPLETED',
          durationSpent: 300,
        })
        .expect(201);

      expect(response.body.status).toBe('COMPLETED');

      // Check points were awarded
      const user = await prisma.user.findUnique({ where: { id: userId } });
      expect(user?.points).toBeGreaterThan(0);
    });
  });
});
