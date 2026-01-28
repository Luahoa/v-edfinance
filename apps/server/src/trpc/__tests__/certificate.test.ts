import { describe, it, expect } from 'vitest';
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
  level: 'BEGINNER',
  published: true,
};

const mockLessons = [
  { id: 'lesson-1', courseId: 'course-1', order: 1, published: true },
  { id: 'lesson-2', courseId: 'course-1', order: 2, published: true },
  { id: 'lesson-3', courseId: 'course-1', order: 3, published: true },
];

const mockCertificate = {
  id: 'cert-1',
  userId: 'test-user-id',
  courseId: 'course-1',
  studentName: { vi: 'Người dùng Test', en: 'Test User' },
  courseTitle: { vi: 'Nhập môn đầu tư', en: 'Intro to Investing' },
  completedAt: new Date('2025-01-15'),
  course: mockCourse,
};

describe('certificateRouter', () => {
  describe('list', () => {
    it('should return user certificates with course info', async () => {
      const mockDb = createMockDb();
      mockDb.query.certificates.findMany.mockResolvedValue([mockCertificate]);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.certificate.list();

      expect(result).toHaveLength(1);
      expect(result[0].courseId).toBe('course-1');
      expect(result[0].course).toBeDefined();
    });

    it('should return empty array when no certificates', async () => {
      const mockDb = createMockDb();
      mockDb.query.certificates.findMany.mockResolvedValue([]);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.certificate.list();

      expect(result).toEqual([]);
    });

    it('should throw UNAUTHORIZED when not authenticated', async () => {
      const ctx = createUnauthenticatedContext();
      const caller = createTestCaller(ctx);

      await expect(caller.certificate.list()).rejects.toThrow(TRPCError);
    });
  });

  describe('getById', () => {
    it('should return certificate by ID', async () => {
      const mockDb = createMockDb();
      mockDb.query.certificates.findFirst.mockResolvedValue(mockCertificate);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.certificate.getById({ id: 'cert-1' });

      expect(result).toEqual(mockCertificate);
      expect(result?.course).toBeDefined();
    });

    it('should return null for non-existent certificate', async () => {
      const mockDb = createMockDb();
      mockDb.query.certificates.findFirst.mockResolvedValue(null);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.certificate.getById({ id: 'non-existent' });

      expect(result).toBeNull();
    });

    it('should throw UNAUTHORIZED when not authenticated', async () => {
      const ctx = createUnauthenticatedContext();
      const caller = createTestCaller(ctx);

      await expect(caller.certificate.getById({ id: 'cert-1' })).rejects.toThrow(
        TRPCError
      );
    });
  });

  describe('checkEligibility', () => {
    it('should return eligible when all lessons completed', async () => {
      const courseWithLessons = { ...mockCourse, lessons: mockLessons };
      const completedProgress = mockLessons.map((l) => ({
        lessonId: l.id,
        status: 'COMPLETED',
      }));

      const mockDb = createMockDb();
      mockDb.query.courses.findFirst.mockResolvedValue(courseWithLessons);
      mockDb.query.certificates.findFirst.mockResolvedValue(null);
      mockDb.query.userProgress.findMany.mockResolvedValue(completedProgress);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.certificate.checkEligibility({ courseId: 'course-1' });

      expect(result.eligible).toBe(true);
    });

    it('should return not eligible when lessons incomplete', async () => {
      const courseWithLessons = { ...mockCourse, lessons: mockLessons };
      const partialProgress = [
        { lessonId: 'lesson-1', status: 'COMPLETED' },
        { lessonId: 'lesson-2', status: 'COMPLETED' },
        // lesson-3 not completed
      ];

      const mockDb = createMockDb();
      mockDb.query.courses.findFirst.mockResolvedValue(courseWithLessons);
      mockDb.query.certificates.findFirst.mockResolvedValue(null);
      mockDb.query.userProgress.findMany.mockResolvedValue(partialProgress);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.certificate.checkEligibility({ courseId: 'course-1' });

      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('2/3');
      expect(result.progress).toEqual({ completed: 2, total: 3 });
    });

    it('should return not eligible if certificate already issued', async () => {
      const courseWithLessons = { ...mockCourse, lessons: mockLessons };

      const mockDb = createMockDb();
      mockDb.query.courses.findFirst.mockResolvedValue(courseWithLessons);
      mockDb.query.certificates.findFirst.mockResolvedValue(mockCertificate);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.certificate.checkEligibility({ courseId: 'course-1' });

      expect(result.eligible).toBe(false);
      expect(result.reason).toBe('Certificate already issued');
      expect(result.certificate).toEqual(mockCertificate);
    });

    it('should return not eligible if course not found', async () => {
      const mockDb = createMockDb();
      mockDb.query.courses.findFirst.mockResolvedValue(null);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.certificate.checkEligibility({ courseId: 'non-existent' });

      expect(result.eligible).toBe(false);
      expect(result.reason).toBe('Course not found');
    });

    it('should throw UNAUTHORIZED when not authenticated', async () => {
      const ctx = createUnauthenticatedContext();
      const caller = createTestCaller(ctx);

      await expect(
        caller.certificate.checkEligibility({ courseId: 'course-1' })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('generate', () => {
    it('should generate new certificate', async () => {
      const mockUser = {
        id: 'test-user-id',
        name: { vi: 'Người dùng Test', en: 'Test User' },
      };

      const mockDb = createMockDb();
      mockDb.query.courses.findFirst.mockResolvedValue(mockCourse);
      mockDb.query.certificates.findFirst.mockResolvedValue(null);
      mockDb.query.users.findFirst.mockResolvedValue(mockUser);
      // Mock db.users.id access for the generate query
      (mockDb as unknown as { users: { id: string } }).users = { id: 'test-user-id' };

      const newCertificate = {
        id: 'cert-new',
        userId: 'test-user-id',
        courseId: 'course-1',
        studentName: mockUser.name,
        courseTitle: mockCourse.title,
        completedAt: new Date(),
      };

      const insertChain = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([newCertificate]),
      };
      mockDb.insert = vi.fn().mockReturnValue(insertChain);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.certificate.generate({ courseId: 'course-1' });

      expect(result.userId).toBe('test-user-id');
      expect(result.courseId).toBe('course-1');
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should return existing certificate if already issued', async () => {
      const mockDb = createMockDb();
      mockDb.query.courses.findFirst.mockResolvedValue(mockCourse);
      mockDb.query.certificates.findFirst.mockResolvedValue(mockCertificate);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.certificate.generate({ courseId: 'course-1' });

      expect(result).toEqual(mockCertificate);
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('should throw error if course not found', async () => {
      const mockDb = createMockDb();
      mockDb.query.courses.findFirst.mockResolvedValue(null);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      await expect(
        caller.certificate.generate({ courseId: 'non-existent' })
      ).rejects.toThrow('Course not found');
    });

    it('should throw UNAUTHORIZED when not authenticated', async () => {
      const ctx = createUnauthenticatedContext();
      const caller = createTestCaller(ctx);

      await expect(
        caller.certificate.generate({ courseId: 'course-1' })
      ).rejects.toThrow(TRPCError);
    });
  });
});
