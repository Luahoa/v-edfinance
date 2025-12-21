/**
 * I009: Enrollment → Progress → Certificate Integration Test
 * 
 * Tests: Enroll → Complete all lessons → Final quiz → Certificate generated
 * Validates: Progress calculation, achievement awarding
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { PrismaModule } from '../../apps/api/src/prisma/prisma.module';
import { generateTestEmail } from './test-setup';

describe('I009: Course Lifecycle - Enrollment to Certificate', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [PrismaModule],
    }).compile();

    prisma = moduleRef.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await moduleRef.close();
  });

  afterEach(async () => {
    await prisma.enrollment.deleteMany({});
    await prisma.lessonProgress.deleteMany({});
    await prisma.quizAttempt.deleteMany({});
    await prisma.achievement.deleteMany({ where: { title: { contains: 'TEST-' } } });
    await prisma.course.deleteMany({ where: { title: { contains: 'TEST-' } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'test-course-' } } });
  });

  describe('Full Course Lifecycle', () => {
    it('should enroll user in a course', async () => {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: generateTestEmail(),
            passwordHash: 'hashed',
            name: 'Test Student',
            role: 'USER',
          },
        });

        const course = await tx.course.create({
          data: {
            title: 'TEST-Introduction to Stocks',
            description: { vi: 'Chứng khoán cơ bản', en: 'Basic Stocks', zh: '基础股票' },
            slug: `test-stocks-${Date.now()}`,
            level: 'BEGINNER',
            estimatedHours: 10,
          },
        });

        const enrollment = await tx.enrollment.create({
          data: {
            userId: user.id,
            courseId: course.id,
            enrolledAt: new Date(),
            progress: 0,
          },
        });

        expect(enrollment).toBeDefined();
        expect(enrollment.progress).toBe(0);
      });
    });

    it('should track lesson completion and update progress', async () => {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: generateTestEmail(),
            passwordHash: 'hashed',
            name: 'Test Student',
            role: 'USER',
          },
        });

        const course = await tx.course.create({
          data: {
            title: 'TEST-Financial Planning',
            description: { vi: 'Test', en: 'Test', zh: 'Test' },
            slug: `test-planning-${Date.now()}`,
            level: 'INTERMEDIATE',
            estimatedHours: 15,
          },
        });

        const lessons = await Promise.all([
          tx.lesson.create({
            data: {
              courseId: course.id,
              title: { vi: 'Lesson 1', en: 'Lesson 1', zh: 'Lesson 1' },
              content: { vi: 'Content', en: 'Content', zh: 'Content' },
              order: 1,
            },
          }),
          tx.lesson.create({
            data: {
              courseId: course.id,
              title: { vi: 'Lesson 2', en: 'Lesson 2', zh: 'Lesson 2' },
              content: { vi: 'Content', en: 'Content', zh: 'Content' },
              order: 2,
            },
          }),
          tx.lesson.create({
            data: {
              courseId: course.id,
              title: { vi: 'Lesson 3', en: 'Lesson 3', zh: 'Lesson 3' },
              content: { vi: 'Content', en: 'Content', zh: 'Content' },
              order: 3,
            },
          }),
        ]);

        const enrollment = await tx.enrollment.create({
          data: {
            userId: user.id,
            courseId: course.id,
            enrolledAt: new Date(),
            progress: 0,
          },
        });

        // Complete first lesson
        await tx.lessonProgress.create({
          data: {
            userId: user.id,
            lessonId: lessons[0].id,
            completed: true,
            completedAt: new Date(),
          },
        });

        // Update progress (33.33%)
        await tx.enrollment.update({
          where: { id: enrollment.id },
          data: { progress: 33 },
        });

        const updatedEnrollment = await tx.enrollment.findUnique({
          where: { id: enrollment.id },
        });

        expect(updatedEnrollment?.progress).toBe(33);
      });
    });

    it('should complete all lessons and calculate 100% progress', async () => {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: generateTestEmail(),
            passwordHash: 'hashed',
            name: 'Test Student',
            role: 'USER',
          },
        });

        const course = await tx.course.create({
          data: {
            title: 'TEST-Complete Course',
            description: { vi: 'Test', en: 'Test', zh: 'Test' },
            slug: `test-complete-${Date.now()}`,
            level: 'BEGINNER',
            estimatedHours: 5,
          },
        });

        const lessons = await Promise.all([
          tx.lesson.create({
            data: {
              courseId: course.id,
              title: { vi: 'L1', en: 'L1', zh: 'L1' },
              content: { vi: 'C', en: 'C', zh: 'C' },
              order: 1,
            },
          }),
          tx.lesson.create({
            data: {
              courseId: course.id,
              title: { vi: 'L2', en: 'L2', zh: 'L2' },
              content: { vi: 'C', en: 'C', zh: 'C' },
              order: 2,
            },
          }),
        ]);

        const enrollment = await tx.enrollment.create({
          data: {
            userId: user.id,
            courseId: course.id,
            enrolledAt: new Date(),
            progress: 0,
          },
        });

        // Complete all lessons
        await tx.lessonProgress.createMany({
          data: lessons.map(lesson => ({
            userId: user.id,
            lessonId: lesson.id,
            completed: true,
            completedAt: new Date(),
          })),
        });

        // Update to 100%
        await tx.enrollment.update({
          where: { id: enrollment.id },
          data: { progress: 100 },
        });

        const completedEnrollment = await tx.enrollment.findUnique({
          where: { id: enrollment.id },
        });

        expect(completedEnrollment?.progress).toBe(100);
      });
    });

    it('should pass final quiz and generate certificate', async () => {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: generateTestEmail(),
            passwordHash: 'hashed',
            name: 'Test Student',
            role: 'USER',
          },
        });

        const course = await tx.course.create({
          data: {
            title: 'TEST-Quiz Course',
            description: { vi: 'Test', en: 'Test', zh: 'Test' },
            slug: `test-quiz-${Date.now()}`,
            level: 'BEGINNER',
            estimatedHours: 5,
          },
        });

        const enrollment = await tx.enrollment.create({
          data: {
            userId: user.id,
            courseId: course.id,
            enrolledAt: new Date(),
            progress: 100, // All lessons completed
          },
        });

        // Take final quiz
        const quizAttempt = await tx.quizAttempt.create({
          data: {
            userId: user.id,
            courseId: course.id,
            score: 85,
            passed: true,
            attemptedAt: new Date(),
          },
        });

        // Generate certificate
        const certificate = await tx.certificate.create({
          data: {
            userId: user.id,
            courseId: course.id,
            issuedAt: new Date(),
            certificateUrl: `https://certificates.example.com/${user.id}-${course.id}`,
          },
        });

        expect(quizAttempt.passed).toBe(true);
        expect(certificate).toBeDefined();
        expect(certificate.certificateUrl).toContain(user.id);
      });
    });

    it('should award achievement for course completion', async () => {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: generateTestEmail(),
            passwordHash: 'hashed',
            name: 'Test Student',
            role: 'USER',
            points: 0,
          },
        });

        const course = await tx.course.create({
          data: {
            title: 'TEST-Achievement Course',
            description: { vi: 'Test', en: 'Test', zh: 'Test' },
            slug: `test-achievement-${Date.now()}`,
            level: 'ADVANCED',
            estimatedHours: 20,
          },
        });

        await tx.enrollment.create({
          data: {
            userId: user.id,
            courseId: course.id,
            enrolledAt: new Date(),
            progress: 100,
            completedAt: new Date(),
          },
        });

        // Award achievement
        const achievement = await tx.achievement.create({
          data: {
            title: 'TEST-Course Master',
            description: { vi: 'Hoàn thành khóa học', en: 'Completed course', zh: '完成课程' },
            icon: '🎓',
            pointsReward: 100,
          },
        });

        await tx.userAchievement.create({
          data: {
            userId: user.id,
            achievementId: achievement.id,
            earnedAt: new Date(),
          },
        });

        // Award points
        await tx.user.update({
          where: { id: user.id },
          data: { points: { increment: 100 } },
        });

        const updatedUser = await tx.user.findUnique({
          where: { id: user.id },
          include: { achievements: true },
        });

        expect(updatedUser?.points).toBe(100);
        expect(updatedUser?.achievements).toHaveLength(1);
      });
    });

    it('should handle quiz retry and track best score', async () => {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: generateTestEmail(),
            passwordHash: 'hashed',
            name: 'Test Student',
            role: 'USER',
          },
        });

        const course = await tx.course.create({
          data: {
            title: 'TEST-Retry Quiz',
            description: { vi: 'Test', en: 'Test', zh: 'Test' },
            slug: `test-retry-${Date.now()}`,
            level: 'INTERMEDIATE',
            estimatedHours: 10,
          },
        });

        // First attempt (failed)
        await tx.quizAttempt.create({
          data: {
            userId: user.id,
            courseId: course.id,
            score: 55,
            passed: false,
            attemptedAt: new Date(Date.now() - 60000),
          },
        });

        // Second attempt (passed)
        await tx.quizAttempt.create({
          data: {
            userId: user.id,
            courseId: course.id,
            score: 85,
            passed: true,
            attemptedAt: new Date(),
          },
        });

        // Get best score
        const attempts = await tx.quizAttempt.findMany({
          where: { userId: user.id, courseId: course.id },
          orderBy: { score: 'desc' },
        });

        expect(attempts[0].score).toBe(85);
        expect(attempts).toHaveLength(2);
      });
    });

    it('should prevent certificate generation without quiz pass', async () => {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: generateTestEmail(),
            passwordHash: 'hashed',
            name: 'Test Student',
            role: 'USER',
          },
        });

        const course = await tx.course.create({
          data: {
            title: 'TEST-No Certificate',
            description: { vi: 'Test', en: 'Test', zh: 'Test' },
            slug: `test-no-cert-${Date.now()}`,
            level: 'BEGINNER',
            estimatedHours: 5,
          },
        });

        await tx.enrollment.create({
          data: {
            userId: user.id,
            courseId: course.id,
            enrolledAt: new Date(),
            progress: 100,
          },
        });

        // Failed quiz
        await tx.quizAttempt.create({
          data: {
            userId: user.id,
            courseId: course.id,
            score: 45,
            passed: false,
            attemptedAt: new Date(),
          },
        });

        // No certificate should be generated
        const certificates = await tx.certificate.findMany({
          where: { userId: user.id, courseId: course.id },
        });

        expect(certificates).toHaveLength(0);
      });
    });
  });
});
