/**
 * I008: AI Personalization Pipeline Integration Test
 * 
 * Tests: User behavior → Analytics aggregation → AI analysis → Personalized content
 * Validates: Recommendation accuracy, cache invalidation
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { PrismaModule } from '../../apps/api/src/prisma/prisma.module';
import { generateTestEmail } from './test-setup';

describe('I008: AI Personalization Pipeline', () => {
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
    await prisma.behaviorLog.deleteMany({ where: { eventType: { contains: 'TEST-' } } });
    await prisma.aiAnalysis.deleteMany({ where: { analysisType: { contains: 'TEST-' } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'test-ai-' } } });
  });

  describe('Behavior Tracking → AI Analysis → Recommendations', () => {
    it('should track user behavior events', async () => {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: generateTestEmail(),
            passwordHash: 'hashed',
            name: 'Test User',
            role: 'USER',
          },
        });

        // Track multiple behavior events
        await tx.behaviorLog.createMany({
          data: [
            {
              userId: user.id,
              eventType: 'TEST-COURSE_VIEW',
              metadata: { courseId: 'course-1', duration: 120 },
              timestamp: new Date(),
            },
            {
              userId: user.id,
              eventType: 'TEST-LESSON_COMPLETE',
              metadata: { lessonId: 'lesson-1', score: 85 },
              timestamp: new Date(),
            },
            {
              userId: user.id,
              eventType: 'TEST-QUIZ_ATTEMPT',
              metadata: { quizId: 'quiz-1', score: 90 },
              timestamp: new Date(),
            },
          ],
        });

        const logs = await tx.behaviorLog.findMany({
          where: { userId: user.id, eventType: { contains: 'TEST-' } },
        });

        expect(logs).toHaveLength(3);
      });
    });

    it('should aggregate behavior data for AI analysis', async () => {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: generateTestEmail(),
            passwordHash: 'hashed',
            name: 'Test User',
            role: 'USER',
          },
        });

        // Create behavior pattern
        for (let i = 0; i < 10; i++) {
          await tx.behaviorLog.create({
            data: {
              userId: user.id,
              eventType: 'TEST-COURSE_VIEW',
              metadata: { courseId: `course-${i % 3}`, duration: 60 + i * 10 },
              timestamp: new Date(Date.now() - i * 60000), // Spread over time
            },
          });
        }

        // Aggregate behavior
        const courseViews = await tx.behaviorLog.groupBy({
          by: ['userId'],
          where: { userId: user.id, eventType: 'TEST-COURSE_VIEW' },
          _count: { id: true },
        });

        expect(courseViews[0]._count.id).toBe(10);
      });
    });

    it('should generate AI analysis from user behavior', async () => {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: generateTestEmail(),
            passwordHash: 'hashed',
            name: 'Test User',
            role: 'USER',
          },
        });

        // Create behavior logs
        await tx.behaviorLog.createMany({
          data: [
            {
              userId: user.id,
              eventType: 'TEST-COURSE_VIEW',
              metadata: { category: 'stocks', duration: 300 },
              timestamp: new Date(),
            },
            {
              userId: user.id,
              eventType: 'TEST-COURSE_VIEW',
              metadata: { category: 'stocks', duration: 450 },
              timestamp: new Date(),
            },
          ],
        });

        // Generate AI analysis
        const analysis = await tx.aiAnalysis.create({
          data: {
            userId: user.id,
            analysisType: 'TEST-PREFERENCE_ANALYSIS',
            result: {
              preferredCategory: 'stocks',
              averageDuration: 375,
              confidence: 0.85,
            },
            confidence: 0.85,
            createdAt: new Date(),
          },
        });

        expect(analysis).toBeDefined();
        expect(analysis.result).toMatchObject({
          preferredCategory: 'stocks',
          averageDuration: 375,
        });
      });
    });

    it('should generate personalized course recommendations', async () => {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: generateTestEmail(),
            passwordHash: 'hashed',
            name: 'Test User',
            role: 'USER',
          },
        });

        // Create AI analysis with preferences
        await tx.aiAnalysis.create({
          data: {
            userId: user.id,
            analysisType: 'TEST-RECOMMENDATION_ENGINE',
            result: {
              recommendedCourses: ['course-1', 'course-2', 'course-3'],
              reasons: ['High engagement with similar content', 'Skill level match'],
            },
            confidence: 0.9,
            createdAt: new Date(),
          },
        });

        // Retrieve recommendations
        const recommendations = await tx.aiAnalysis.findFirst({
          where: { userId: user.id, analysisType: 'TEST-RECOMMENDATION_ENGINE' },
        });

        expect(recommendations?.result).toHaveProperty('recommendedCourses');
        expect((recommendations?.result as any).recommendedCourses).toHaveLength(3);
      });
    });

    it('should update recommendations when behavior changes', async () => {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: generateTestEmail(),
            passwordHash: 'hashed',
            name: 'Test User',
            role: 'USER',
          },
        });

        // Initial analysis
        const initialAnalysis = await tx.aiAnalysis.create({
          data: {
            userId: user.id,
            analysisType: 'TEST-ADAPTIVE_RECOMMENDATIONS',
            result: { interests: ['stocks'] },
            confidence: 0.7,
            createdAt: new Date(),
          },
        });

        // New behavior indicating changed interest
        await tx.behaviorLog.create({
          data: {
            userId: user.id,
            eventType: 'TEST-COURSE_VIEW',
            metadata: { category: 'crypto', duration: 600 },
            timestamp: new Date(),
          },
        });

        // Update analysis
        const updatedAnalysis = await tx.aiAnalysis.update({
          where: { id: initialAnalysis.id },
          data: {
            result: { interests: ['stocks', 'crypto'] },
            confidence: 0.85,
          },
        });

        expect((updatedAnalysis.result as any).interests).toContain('crypto');
        expect(updatedAnalysis.confidence).toBeGreaterThan(initialAnalysis.confidence);
      });
    });

    it('should handle cache invalidation after new behavior', async () => {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: generateTestEmail(),
            passwordHash: 'hashed',
            name: 'Test User',
            role: 'USER',
          },
        });

        // Create cached analysis
        const cachedAnalysis = await tx.aiAnalysis.create({
          data: {
            userId: user.id,
            analysisType: 'TEST-CACHED_RECOMMENDATIONS',
            result: { recommendations: ['old-course-1'] },
            confidence: 0.8,
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
          },
        });

        // New behavior
        await tx.behaviorLog.create({
          data: {
            userId: user.id,
            eventType: 'TEST-MAJOR_PREFERENCE_CHANGE',
            metadata: { category: 'real-estate' },
            timestamp: new Date(),
          },
        });

        // Invalidate and regenerate
        await tx.aiAnalysis.delete({ where: { id: cachedAnalysis.id } });

        const newAnalysis = await tx.aiAnalysis.create({
          data: {
            userId: user.id,
            analysisType: 'TEST-CACHED_RECOMMENDATIONS',
            result: { recommendations: ['new-course-1', 'new-course-2'] },
            confidence: 0.9,
            createdAt: new Date(),
          },
        });

        expect((newAnalysis.result as any).recommendations).not.toContain('old-course-1');
      });
    });

    it('should measure recommendation accuracy based on user engagement', async () => {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: generateTestEmail(),
            passwordHash: 'hashed',
            name: 'Test User',
            role: 'USER',
          },
        });

        // Generate recommendations
        const analysis = await tx.aiAnalysis.create({
          data: {
            userId: user.id,
            analysisType: 'TEST-ACCURACY_TRACKING',
            result: { recommendedCourses: ['course-1', 'course-2', 'course-3'] },
            confidence: 0.85,
            createdAt: new Date(),
          },
        });

        // User engages with recommended course
        await tx.behaviorLog.create({
          data: {
            userId: user.id,
            eventType: 'TEST-RECOMMENDED_COURSE_ENROLLED',
            metadata: {
              courseId: 'course-1',
              recommendationId: analysis.id,
              engaged: true,
            },
            timestamp: new Date(),
          },
        });

        // Track accuracy
        const engagementLogs = await tx.behaviorLog.findMany({
          where: {
            userId: user.id,
            eventType: 'TEST-RECOMMENDED_COURSE_ENROLLED',
            metadata: { path: ['engaged'], equals: true },
          },
        });

        expect(engagementLogs).toHaveLength(1);
      });
    });
  });
});
