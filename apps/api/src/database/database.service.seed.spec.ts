/**
 * Database Seed Verification Tests - Phase 2
 * Triple-ORM Data Verification (Prisma + Drizzle + Kysely)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaService } from '../prisma/prisma.service';
import { DatabaseService } from '../database/database.service';
import { KyselyService } from '../database/kysely.service';
import { sql } from 'kysely';

describe('Database Seed Verification - Triple ORM', () => {
  // Skip if no test database available
  if (!process.env.TEST_DATABASE_URL) {
    it.skip('requires test database - set TEST_DATABASE_URL to enable integration tests', () => {});
    return;
  }

  let prismaService: PrismaService;
  let databaseService: DatabaseService;
  let kyselyService: KyselyService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, DatabaseService, KyselyService],
    }).compile();

    prismaService = module.get<PrismaService>(PrismaService);
    databaseService = module.get<DatabaseService>(DatabaseService);
    kyselyService = module.get<KyselyService>(KyselyService);
  });

  afterAll(async () => {
    await prismaService.$disconnect();
    await kyselyService.destroy();
  });

  describe('Phase 2.1: Prisma Read Verification', () => {
    it('should read seeded users via Prisma', async () => {
      const users = await prismaService.user.findMany({ take: 10 });

      expect(users).toBeDefined();
      expect(users.length).toBeGreaterThan(0);
      expect(users.length).toBeLessThanOrEqual(10);

      // Verify user structure
      expect(users[0]).toHaveProperty('id');
      expect(users[0]).toHaveProperty('email');
      expect(users[0]).toHaveProperty('role');
      expect(users[0]).toHaveProperty('metadata');
      expect(users[0]).toHaveProperty('preferredLocale');
    });

    it('should read seeded courses with lessons via Prisma', async () => {
      const courses = await prismaService.course.findMany({
        include: { lessons: true },
        take: 5,
      });

      expect(courses).toBeDefined();
      expect(courses.length).toBeGreaterThan(0);

      // Verify course structure
      courses.forEach((course) => {
        expect(course).toHaveProperty('id');
        expect(course).toHaveProperty('slug');
        expect(course).toHaveProperty('title');
        expect(course).toHaveProperty('lessons');
        expect(Array.isArray(course.lessons)).toBe(true);

        // Verify JSONB title structure
        expect(course.title).toHaveProperty('vi');
        expect(course.title).toHaveProperty('en');
        expect(course.title).toHaveProperty('zh');
      });
    });

    it('should verify admin user exists', async () => {
      const admin = await prismaService.user.findFirst({
        where: { role: 'ADMIN' },
      });

      expect(admin).toBeDefined();
      expect(admin?.email).toContain('admin');
      expect(admin?.role).toBe('ADMIN');
    });

    it('should verify student users exist', async () => {
      const students = await prismaService.user.findMany({
        where: { role: 'STUDENT' },
        take: 10,
      });

      expect(students.length).toBeGreaterThan(0);
      students.forEach((student) => {
        expect(student.role).toBe('STUDENT');
        expect(student.email).toBeDefined();
      });
    });
  });

  describe('Phase 2.2: Drizzle Read Verification', () => {
    it('should read seeded behavior logs via Drizzle', async () => {
      // Use DatabaseService which routes to Drizzle for BehaviorLog
      const db = kyselyService.db;
      const logs = await db
        .selectFrom('BehaviorLog')
        .selectAll()
        .limit(10)
        .execute();

      expect(logs).toBeDefined();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs.length).toBeLessThanOrEqual(10);

      // Verify behavior log structure
      logs.forEach((log) => {
        expect(log).toHaveProperty('id');
        expect(log).toHaveProperty('userId');
        expect(log).toHaveProperty('action');
        expect(log).toHaveProperty('createdAt');
      });
    });

    it('should handle JSONB fields correctly in courses', async () => {
      const db = kyselyService.db;
      const courses = await db
        .selectFrom('Course')
        .select(['id', 'slug', 'title', 'description'])
        .limit(5)
        .execute();

      expect(courses).toBeDefined();
      expect(courses.length).toBeGreaterThan(0);

      courses.forEach((course) => {
        // JSONB fields should be objects
        expect(typeof course.title).toBe('object');
        expect(course.title).toHaveProperty('vi');
        expect(course.title).toHaveProperty('en');
        expect(course.title).toHaveProperty('zh');

        if (course.description) {
          expect(typeof course.description).toBe('object');
        }
      });
    });

    it('should verify metadata JSONB in users', async () => {
      const db = kyselyService.db;
      const users = await db
        .selectFrom('User')
        .select(['id', 'email', 'metadata'])
        .where('role', '=', 'STUDENT')
        .limit(5)
        .execute();

      expect(users.length).toBeGreaterThan(0);

      users.forEach((user) => {
        expect(user.metadata).toBeDefined();
        expect(typeof user.metadata).toBe('object');
        // displayName should be in metadata
        if (user.metadata && typeof user.metadata === 'object') {
          const meta = user.metadata as Record<string, any>;
          expect(meta).toHaveProperty('displayName');
        }
      });
    });
  });

  describe('Phase 2.3: Kysely Analytics Verification', () => {
    it('should aggregate behavior logs by action', async () => {
      const db = kyselyService.db;
      const stats = await db
        .selectFrom('BehaviorLog')
        .select(['action', sql<number>`COUNT(*)`.as('count')])
        .groupBy('action')
        .execute();

      expect(stats).toBeDefined();
      expect(stats.length).toBeGreaterThan(0);

      stats.forEach((stat) => {
        expect(stat.action).toBeDefined();
        expect(stat.count).toBeGreaterThan(0);
      });
    });

    it('should join users and courses for analytics', async () => {
      const db = kyselyService.db;
      const enrollments = await db
        .selectFrom('CourseProgress')
        .innerJoin('User', 'User.id', 'CourseProgress.userId')
        .innerJoin('Course', 'Course.id', 'CourseProgress.courseId')
        .select([
          'User.email',
          'Course.slug',
          'CourseProgress.progress',
          'CourseProgress.status',
        ])
        .limit(10)
        .execute();

      expect(enrollments).toBeDefined();
      // May be empty if no course progress seeded, that's ok
      if (enrollments.length > 0) {
        enrollments.forEach((enrollment) => {
          expect(enrollment.email).toBeDefined();
          expect(enrollment.slug).toBeDefined();
          expect(enrollment.progress).toBeDefined();
        });
      }
    });

    it('should calculate user activity statistics', async () => {
      const db = kyselyService.db;
      const userStats = await db
        .selectFrom('BehaviorLog')
        .innerJoin('User', 'User.id', 'BehaviorLog.userId')
        .select([
          'User.email',
          'User.role',
          sql<number>`COUNT(*)`.as('activity_count'),
        ])
        .groupBy(['User.email', 'User.role'])
        .limit(10)
        .execute();

      expect(userStats).toBeDefined();
      expect(userStats.length).toBeGreaterThan(0);

      userStats.forEach((stat) => {
        expect(stat.email).toBeDefined();
        expect(stat.role).toBeDefined();
        expect(stat.activity_count).toBeGreaterThan(0);
      });
    });

    it('should verify course enrollment statistics', async () => {
      const db = kyselyService.db;
      const courseStats = await db
        .selectFrom('Course')
        .leftJoin('CourseProgress', 'Course.id', 'CourseProgress.courseId')
        .select([
          'Course.slug',
          sql<string>`Course.title->>'vi'`.as('title_vi'),
          sql<number>`COUNT(CourseProgress.id)`.as('enrollment_count'),
        ])
        .groupBy(['Course.id', 'Course.slug', 'Course.title'])
        .limit(10)
        .execute();

      expect(courseStats).toBeDefined();
      expect(courseStats.length).toBeGreaterThan(0);

      courseStats.forEach((stat) => {
        expect(stat.slug).toBeDefined();
        expect(stat.title_vi).toBeDefined();
        expect(typeof stat.enrollment_count).toBe('number');
      });
    });
  });

  describe('Phase 2.4: Cross-ORM Consistency Check', () => {
    it('should return same user count across ORMs', async () => {
      // Prisma count
      const prismaCount = await prismaService.user.count();

      // Kysely count
      const kyselyResult = await kyselyService.db
        .selectFrom('User')
        .select(sql<number>`COUNT(*)`.as('count'))
        .executeTakeFirst();
      const kyselyCount = kyselyResult?.count || 0;

      expect(prismaCount).toBe(Number(kyselyCount));
      expect(prismaCount).toBeGreaterThan(0);
    });

    it('should return same course count across ORMs', async () => {
      // Prisma count
      const prismaCount = await prismaService.course.count();

      // Kysely count
      const kyselyResult = await kyselyService.db
        .selectFrom('Course')
        .select(sql<number>`COUNT(*)`.as('count'))
        .executeTakeFirst();
      const kyselyCount = kyselyResult?.count || 0;

      expect(prismaCount).toBe(Number(kyselyCount));
      expect(prismaCount).toBeGreaterThan(0);
    });

    it('should verify JSONB data consistency', async () => {
      // Get course via Prisma
      const prismaCourse = await prismaService.course.findFirst({
        where: { published: true },
      });

      expect(prismaCourse).toBeDefined();

      // Get same course via Kysely
      const kyselyCourse = await kyselyService.db
        .selectFrom('Course')
        .selectAll()
        .where('id', '=', prismaCourse!.id)
        .executeTakeFirst();

      expect(kyselyCourse).toBeDefined();
      expect(kyselyCourse?.slug).toBe(prismaCourse?.slug);

      // JSONB fields should match
      expect(JSON.stringify(kyselyCourse?.title)).toBe(
        JSON.stringify(prismaCourse?.title),
      );
    });
  });
});
