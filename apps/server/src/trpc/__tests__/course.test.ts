import { describe, it, expect, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';
import {
  createTestCaller,
  createAuthenticatedContext,
  createUnauthenticatedContext,
  createMockDb,
  vi,
} from './test-helpers';

const mockCourse = {
  id: 'course-1',
  slug: 'intro-to-investing',
  title: { vi: 'Nhập môn đầu tư', en: 'Intro to Investing' },
  description: { vi: 'Mô tả', en: 'Description' },
  level: 'BEGINNER',
  published: true,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

const mockLesson = {
  id: 'lesson-1',
  courseId: 'course-1',
  title: { vi: 'Bài 1', en: 'Lesson 1' },
  order: 1,
  published: true,
};

describe('courseRouter', () => {
  describe('list', () => {
    it('should return published courses', async () => {
      const mockDb = createMockDb();
      mockDb.query.courses.findMany.mockResolvedValue([mockCourse]);

      const ctx = createUnauthenticatedContext(mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.course.list({});

      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('intro-to-investing');
    });

    it('should filter by level', async () => {
      const mockDb = createMockDb();
      mockDb.query.courses.findMany.mockResolvedValue([mockCourse]);

      const ctx = createUnauthenticatedContext(mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.course.list({ level: 'BEGINNER' });

      expect(mockDb.query.courses.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('should respect pagination params', async () => {
      const mockDb = createMockDb();
      mockDb.query.courses.findMany.mockResolvedValue([]);

      const ctx = createUnauthenticatedContext(mockDb);
      const caller = createTestCaller(ctx);

      await caller.course.list({ limit: 10, offset: 20 });

      expect(mockDb.query.courses.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 20,
        })
      );
    });

    it('should use default pagination when not provided', async () => {
      const mockDb = createMockDb();
      mockDb.query.courses.findMany.mockResolvedValue([]);

      const ctx = createUnauthenticatedContext(mockDb);
      const caller = createTestCaller(ctx);

      await caller.course.list({});

      expect(mockDb.query.courses.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 20,
          offset: 0,
        })
      );
    });
  });

  describe('getBySlug', () => {
    it('should return course with lessons', async () => {
      const courseWithLessons = {
        ...mockCourse,
        lessons: [mockLesson],
      };
      const mockDb = createMockDb();
      mockDb.query.courses.findFirst.mockResolvedValue(courseWithLessons);

      const ctx = createUnauthenticatedContext(mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.course.getBySlug({ slug: 'intro-to-investing' });

      expect(result).toEqual(courseWithLessons);
      expect(result?.lessons).toHaveLength(1);
    });

    it('should return null for non-existent course', async () => {
      const mockDb = createMockDb();
      mockDb.query.courses.findFirst.mockResolvedValue(null);

      const ctx = createUnauthenticatedContext(mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.course.getBySlug({ slug: 'non-existent' });

      expect(result).toBeNull();
    });
  });

  describe('getProgress', () => {
    it('should return user progress for a course', async () => {
      const mockProgress = [
        {
          id: 'progress-1',
          lessonId: 'lesson-1',
          status: 'COMPLETED',
          durationSpent: 300,
          lesson: mockLesson,
        },
      ];
      const mockDb = createMockDb();
      mockDb.query.userProgress.findMany.mockResolvedValue(mockProgress);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.course.getProgress({ courseId: 'course-1' });

      expect(result).toEqual(mockProgress);
    });

    it('should throw UNAUTHORIZED when not authenticated', async () => {
      const ctx = createUnauthenticatedContext();
      const caller = createTestCaller(ctx);

      await expect(
        caller.course.getProgress({ courseId: 'course-1' })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('updateProgress', () => {
    it('should create new progress entry', async () => {
      const mockDb = createMockDb();
      mockDb.query.userProgress.findFirst.mockResolvedValue(null);

      const newProgress = {
        id: 'progress-new',
        userId: 'test-user-id',
        lessonId: 'lesson-1',
        status: 'STARTED',
        durationSpent: 0,
      };

      const insertChain = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([newProgress]),
      };
      mockDb.insert = vi.fn().mockReturnValue(insertChain);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.course.updateProgress({
        lessonId: 'lesson-1',
        status: 'STARTED',
      });

      expect(result).toEqual(newProgress);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should update existing progress entry', async () => {
      const existingProgress = {
        id: 'progress-1',
        userId: 'test-user-id',
        lessonId: 'lesson-1',
        status: 'STARTED',
        durationSpent: 100,
      };

      const mockDb = createMockDb();
      mockDb.query.userProgress.findFirst.mockResolvedValue(existingProgress);

      const updatedProgress = {
        ...existingProgress,
        status: 'COMPLETED',
        durationSpent: 300,
        completedAt: new Date(),
      };

      const updateChain = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([updatedProgress]),
      };
      mockDb.update = vi.fn().mockReturnValue(updateChain);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.course.updateProgress({
        lessonId: 'lesson-1',
        status: 'COMPLETED',
        durationSpent: 300,
      });

      expect(result.status).toBe('COMPLETED');
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should throw UNAUTHORIZED when not authenticated', async () => {
      const ctx = createUnauthenticatedContext();
      const caller = createTestCaller(ctx);

      await expect(
        caller.course.updateProgress({ lessonId: 'lesson-1', status: 'STARTED' })
      ).rejects.toThrow(TRPCError);
    });

    it('should validate status enum', async () => {
      const ctx = createAuthenticatedContext({});
      const caller = createTestCaller(ctx);

      await expect(
        caller.course.updateProgress({
          lessonId: 'lesson-1',
          // @ts-expect-error - Testing invalid status
          status: 'INVALID_STATUS',
        })
      ).rejects.toThrow();
    });
  });

  describe('enroll', () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      name: { vi: 'Người dùng', en: 'Test User' },
    };

    const validCourseId = '550e8400-e29b-41d4-a716-446655440000';

    it('should create enrollment for new user', async () => {
      const mockDb = createMockDb();
      mockDb.query.enrollments = {
        findFirst: vi.fn().mockResolvedValue(null),
      };
      mockDb.query.courses.findFirst.mockResolvedValue({ ...mockCourse, id: validCourseId });
      mockDb.query.users.findFirst.mockResolvedValue(mockUser);

      const newEnrollment = {
        id: 'enrollment-1',
        userId: 'test-user-id',
        courseId: validCourseId,
        enrolledAt: new Date(),
      };

      const insertChain = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([newEnrollment]),
      };
      mockDb.insert = vi.fn().mockReturnValue(insertChain);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.course.enroll({ courseId: validCourseId });

      expect(result.success).toBe(true);
      expect(result.alreadyEnrolled).toBe(false);
      expect(result.enrollment).toEqual(newEnrollment);
    });

    it('should return existing enrollment if already enrolled', async () => {
      const existingEnrollment = {
        id: 'enrollment-1',
        userId: 'test-user-id',
        courseId: validCourseId,
        enrolledAt: new Date(),
      };

      const mockDb = createMockDb();
      mockDb.query.enrollments = {
        findFirst: vi.fn().mockResolvedValue(existingEnrollment),
      };

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.course.enroll({ courseId: validCourseId });

      expect(result.success).toBe(true);
      expect(result.alreadyEnrolled).toBe(true);
      expect(result.enrollment).toEqual(existingEnrollment);
    });

    it('should throw error if course not found', async () => {
      const mockDb = createMockDb();
      mockDb.query.enrollments = {
        findFirst: vi.fn().mockResolvedValue(null),
      };
      mockDb.query.courses.findFirst.mockResolvedValue(null);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      await expect(
        caller.course.enroll({ courseId: validCourseId })
      ).rejects.toThrow('Course not found');
    });

    it('should throw UNAUTHORIZED when not authenticated', async () => {
      const ctx = createUnauthenticatedContext();
      const caller = createTestCaller(ctx);

      await expect(
        caller.course.enroll({ courseId: validCourseId })
      ).rejects.toThrow(TRPCError);
    });

    it('should accept locale parameter', async () => {
      const mockDb = createMockDb();
      mockDb.query.enrollments = {
        findFirst: vi.fn().mockResolvedValue(null),
      };
      mockDb.query.courses.findFirst.mockResolvedValue({ ...mockCourse, id: validCourseId });
      mockDb.query.users.findFirst.mockResolvedValue(mockUser);

      const newEnrollment = {
        id: 'enrollment-1',
        userId: 'test-user-id',
        courseId: validCourseId,
        enrolledAt: new Date(),
      };

      const insertChain = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([newEnrollment]),
      };
      mockDb.insert = vi.fn().mockReturnValue(insertChain);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.course.enroll({ courseId: validCourseId, locale: 'en' });

      expect(result.success).toBe(true);
    });
  });
});
