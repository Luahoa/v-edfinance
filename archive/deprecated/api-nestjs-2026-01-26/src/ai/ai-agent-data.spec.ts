/**
 * AI Agent Data Requirements Tests - Phase 3
 * Verifies AI agents can work with seeded data
 */

import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DatabaseArchitectAgent } from '../database/database-architect.agent';
import { PgvectorService } from '../database/pgvector.service';
import { KyselyService } from '../database/kysely.service';
import { DatabaseService } from '../database/database.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

describe('AI Agent Data Requirements - Phase 3', () => {
  // Skip if no test database available
  if (!process.env.TEST_DATABASE_URL) {
    it.skip('requires test database - set TEST_DATABASE_URL to enable integration tests', () => {});
    return;
  }

  let databaseArchitectAgent: DatabaseArchitectAgent;
  let aiService: AiService;
  let prismaService: PrismaService;
  let kyselyService: KyselyService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseArchitectAgent,
        PgvectorService,
        KyselyService,
        DatabaseService,
        PrismaService,
        AiService,
      ],
    }).compile();

    databaseArchitectAgent = module.get<DatabaseArchitectAgent>(
      DatabaseArchitectAgent,
    );
    aiService = module.get<AiService>(AiService);
    prismaService = module.get<PrismaService>(PrismaService);
    kyselyService = module.get<KyselyService>(KyselyService);
  });

  afterAll(async () => {
    await prismaService.$disconnect();
    await kyselyService.destroy();
  });

  describe('Phase 3.1: Database Architect Agent Data', () => {
    it('should analyze seeded query patterns', async () => {
      // Generate some synthetic query load first
      await prismaService.user.findMany({ take: 100 });
      await prismaService.course.findMany({ include: { lessons: true } });
      await kyselyService.db.selectFrom('BehaviorLog').selectAll().execute();

      const patterns = await databaseArchitectAgent.analyzeQueryPatterns();

      expect(patterns).toBeDefined();
      expect(Array.isArray(patterns)).toBe(true);

      if (patterns.length > 0) {
        patterns.forEach((pattern) => {
          expect(pattern).toHaveProperty('queryTemplate');
          expect(pattern).toHaveProperty('executionCount');
          expect(pattern).toHaveProperty('avgDuration');
          expect(pattern).toHaveProperty('totalCost');
        });
      }
    });

    it('should generate recommendations for seeded queries', async () => {
      const recommendations =
        await databaseArchitectAgent.generateRecommendations();

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);

      if (recommendations.length > 0) {
        recommendations.forEach((rec) => {
          expect(rec).toHaveProperty('queryPattern');
          expect(rec).toHaveProperty('recommendation');
          expect(rec).toHaveProperty('confidence');
          expect(rec).toHaveProperty('estimatedGain');
          expect(rec).toHaveProperty('source');
          expect(['rag', 'heuristic', 'generic']).toContain(rec.source);
        });
      }
    });

    it('should detect slow queries from seeded data', async () => {
      // Simulate slow query
      await kyselyService.db
        .selectFrom('BehaviorLog')
        .innerJoin('User', 'User.id', 'BehaviorLog.userId')
        .selectAll()
        .execute();

      const slowQueries = await databaseArchitectAgent.detectSlowQueries();

      expect(slowQueries).toBeDefined();
      expect(Array.isArray(slowQueries)).toBe(true);
    });

    it('should provide heuristic recommendations', async () => {
      const testQuery = 'SELECT * FROM "User" WHERE email LIKE \'%example%\'';
      const recommendation =
        await databaseArchitectAgent.analyzeQuery(testQuery);

      expect(recommendation).toBeDefined();
      expect(recommendation.source).toBe('heuristic');
      expect(recommendation.recommendation).toContain('SELECT *');
      expect(recommendation.confidence).toBeGreaterThan(0);
    });
  });

  describe('Phase 3.2: AI Chat Service Data', () => {
    it('should retrieve user context from seeded data', async () => {
      const student = await prismaService.user.findFirst({
        where: { role: 'STUDENT' },
      });

      expect(student).toBeDefined();

      // Get user context (courses, progress, activity)
      const enrollments = await prismaService.courseProgress.findMany({
        where: { userId: student!.id },
        include: { course: true },
      });

      const behaviorLogs = await kyselyService.db
        .selectFrom('BehaviorLog')
        .selectAll()
        .where('userId', '=', student!.id)
        .limit(10)
        .execute();

      const context = {
        user: student,
        enrolledCourses: enrollments,
        recentActivity: behaviorLogs,
      };

      expect(context.user).toBeDefined();
      expect(Array.isArray(context.enrolledCourses)).toBe(true);
      expect(Array.isArray(context.recentActivity)).toBe(true);
    });

    it('should verify AI can access course data', async () => {
      const courses = await prismaService.course.findMany({
        include: { lessons: true },
        where: { published: true },
        take: 5,
      });

      expect(courses).toBeDefined();
      expect(courses.length).toBeGreaterThan(0);

      courses.forEach((course) => {
        // AI needs multi-lingual data
        expect(course.title).toHaveProperty('vi');
        expect(course.title).toHaveProperty('en');
        expect(course.title).toHaveProperty('zh');

        // AI needs lesson content
        expect(Array.isArray(course.lessons)).toBe(true);
      });
    });

    it('should verify AI can access user learning progress', async () => {
      const student = await prismaService.user.findFirst({
        where: { role: 'STUDENT' },
      });

      const progress = await prismaService.courseProgress.findMany({
        where: { userId: student!.id },
        include: {
          course: true,
          completedLessons: true,
        },
      });

      // Progress may be empty in basic seed, that's ok
      expect(Array.isArray(progress)).toBe(true);

      if (progress.length > 0) {
        progress.forEach((p) => {
          expect(p).toHaveProperty('progress');
          expect(p).toHaveProperty('status');
          expect(p.course).toBeDefined();
        });
      }
    });

    it('should verify AI can access gamification data', async () => {
      const student = await prismaService.user.findFirst({
        where: { role: 'STUDENT' },
      });

      const streaks = await prismaService.userStreak.findMany({
        where: { userId: student!.id },
      });

      const achievements = await prismaService.userAchievement.findMany({
        where: { userId: student!.id },
      });

      const buddyGroups = await prismaService.buddyGroupMember.findMany({
        where: { userId: student!.id },
        include: { buddyGroup: true },
      });

      // May be empty in basic seed
      expect(Array.isArray(streaks)).toBe(true);
      expect(Array.isArray(achievements)).toBe(true);
      expect(Array.isArray(buddyGroups)).toBe(true);
    });
  });

  describe('Phase 3.3: Behavioral Analytics Data', () => {
    it('should aggregate user behavior patterns', async () => {
      const behaviorStats = await kyselyService.db
        .selectFrom('BehaviorLog')
        .select([
          'action',
          kyselyService.db.fn.count('id').as('count'),
          kyselyService.db.fn.min('createdAt').as('first_seen'),
          kyselyService.db.fn.max('createdAt').as('last_seen'),
        ])
        .groupBy('action')
        .execute();

      expect(behaviorStats).toBeDefined();
      expect(Array.isArray(behaviorStats)).toBe(true);

      if (behaviorStats.length > 0) {
        behaviorStats.forEach((stat) => {
          expect(stat.action).toBeDefined();
          expect(Number(stat.count)).toBeGreaterThan(0);
        });
      }
    });

    it('should track learning patterns by time', async () => {
      const dailyActivity = await kyselyService.db
        .selectFrom('BehaviorLog')
        .select([
          kyselyService.db.fn('DATE', ['createdAt']).as('activity_date'),
          kyselyService.db.fn.count('id').as('event_count'),
        ])
        .groupBy(kyselyService.db.fn('DATE', ['createdAt']))
        .orderBy('activity_date', 'desc')
        .limit(7)
        .execute();

      expect(dailyActivity).toBeDefined();
      expect(Array.isArray(dailyActivity)).toBe(true);
    });

    it('should identify active vs inactive users', async () => {
      const userActivity = await kyselyService.db
        .selectFrom('User')
        .leftJoin('BehaviorLog', 'User.id', 'BehaviorLog.userId')
        .select([
          'User.id',
          'User.email',
          'User.role',
          kyselyService.db.fn.count('BehaviorLog.id').as('activity_count'),
        ])
        .groupBy(['User.id', 'User.email', 'User.role'])
        .orderBy('activity_count', 'desc')
        .limit(10)
        .execute();

      expect(userActivity).toBeDefined();
      expect(Array.isArray(userActivity)).toBe(true);

      userActivity.forEach((user) => {
        expect(user.email).toBeDefined();
        expect(typeof user.activity_count).toBe('bigint');
      });
    });
  });

  describe('Phase 3.4: Content Recommendation Data', () => {
    it('should find popular courses', async () => {
      const popularCourses = await kyselyService.db
        .selectFrom('Course')
        .leftJoin('CourseProgress', 'Course.id', 'CourseProgress.courseId')
        .select([
          'Course.id',
          'Course.slug',
          kyselyService.db.raw<string>("Course.title->>'vi'").as('title'),
          kyselyService.db.fn.count('CourseProgress.id').as('enrollment_count'),
        ])
        .groupBy(['Course.id', 'Course.slug', 'Course.title'])
        .orderBy('enrollment_count', 'desc')
        .limit(5)
        .execute();

      expect(popularCourses).toBeDefined();
      expect(Array.isArray(popularCourses)).toBe(true);

      popularCourses.forEach((course) => {
        expect(course.slug).toBeDefined();
        expect(course.title).toBeDefined();
      });
    });

    it('should find courses by level', async () => {
      const beginnerCourses = await prismaService.course.findMany({
        where: {
          level: 'BEGINNER',
          published: true,
        },
        take: 5,
      });

      expect(beginnerCourses).toBeDefined();
      expect(Array.isArray(beginnerCourses)).toBe(true);

      beginnerCourses.forEach((course) => {
        expect(course.level).toBe('BEGINNER');
        expect(course.published).toBe(true);
      });
    });

    it('should find recommended courses for user', async () => {
      const student = await prismaService.user.findFirst({
        where: { role: 'STUDENT' },
      });

      // Get user's completed courses
      const completed = await prismaService.courseProgress.findMany({
        where: {
          userId: student!.id,
          status: 'COMPLETED',
        },
        select: { courseId: true },
      });

      const completedIds = completed.map((c) => c.courseId);

      // Find courses not yet started
      const recommendations = await prismaService.course.findMany({
        where: {
          id: { notIn: completedIds },
          published: true,
        },
        take: 5,
      });

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });
});
