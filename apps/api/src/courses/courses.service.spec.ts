import { NotFoundException } from '@nestjs/common';
import { Level, ProgressStatus } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CoursesService } from './courses.service';

describe('CoursesService (Pure Unit Test)', () => {
  let service: CoursesService;
  let mockPrisma: any;
  let mockGamification: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      course: {
        create: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      lesson: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      userProgress: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
        findMany: vi.fn(),
      },
      user: {
        update: vi.fn(),
      },
      $transaction: vi.fn((cb) => cb(mockPrisma)),
    };
    mockGamification = {
      logEvent: vi.fn(),
    };
    const mockValidation = {
      validate: vi.fn((type, data) => data),
    };
    service = new CoursesService(
      mockPrisma,
      mockGamification,
      mockValidation as any,
    );
  });

  describe('createCourse', () => {
    it('should create a course', async () => {
      const dto = {
        slug: 'test-course',
        title: { vi: 'Học phí' },
        level: Level.BEGINNER,
      };
      mockPrisma.course.create.mockResolvedValue({ id: 'c1', ...dto });

      const result = await service.createCourse(dto as any);

      expect(mockPrisma.course.create).toHaveBeenCalled();
      expect(result.id).toBe('c1');
    });
  });

  describe('findOneCourse', () => {
    it('should return course with lessons', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({ id: 'c1', lessons: [] });
      const result = await service.findOneCourse('c1');
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if course not found', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null);
      await expect(service.findOneCourse('c1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProgress', () => {
    const userId = 'u1';
    const lessonId = 'l1';

    it('should upsert progress and reward points for first completion', async () => {
      mockPrisma.userProgress.findUnique.mockResolvedValue(null);
      mockPrisma.userProgress.upsert.mockResolvedValue({
        userId,
        lessonId,
        status: ProgressStatus.COMPLETED,
      });

      await service.updateProgress(
        userId,
        lessonId,
        ProgressStatus.COMPLETED,
        100,
      );

      expect(mockPrisma.userProgress.upsert).toHaveBeenCalled();
      expect(mockPrisma.user.update).toHaveBeenCalled();
      expect(mockGamification.logEvent).toHaveBeenCalled();
    });

    it('should not reward points if already completed', async () => {
      mockPrisma.userProgress.findUnique.mockResolvedValue({
        status: ProgressStatus.COMPLETED,
      });
      mockPrisma.userProgress.upsert.mockResolvedValue({
        status: ProgressStatus.COMPLETED,
      });

      await service.updateProgress(
        userId,
        lessonId,
        ProgressStatus.COMPLETED,
        100,
      );

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockGamification.logEvent).not.toHaveBeenCalled();
    });
  });

  describe('createLesson', () => {
    it('should determine order automatically if not provided', async () => {
      mockPrisma.lesson.findFirst.mockResolvedValue({ order: 5 });
      mockPrisma.lesson.create.mockResolvedValue({ id: 'l1', order: 6 });

      const result = await service.createLesson({
        courseId: 'c1',
        title: { vi: 'Bài 1' },
      } as any);

      expect(mockPrisma.lesson.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { courseId: 'c1' },
          orderBy: { order: 'desc' },
        }),
      );
      expect(result.order).toBe(6);
    });

    it('should start with order 1 if no lessons exist', async () => {
      mockPrisma.lesson.findFirst.mockResolvedValue(null);
      mockPrisma.lesson.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'l1', ...data }),
      );

      const result = await service.createLesson({
        courseId: 'c1',
        title: { vi: 'Bài 1' },
      } as any);

      expect(result.order).toBe(1);
    });
  });

  describe('updateLesson', () => {
    it('should update lesson data', async () => {
      mockPrisma.lesson.update.mockResolvedValue({
        id: 'l1',
        title: { vi: 'Updated' },
      });
      const result = await service.updateLesson('l1', {
        title: { vi: 'Updated' },
      } as any);
      expect(result.title.vi).toBe('Updated');
    });
  });

  describe('removeLesson', () => {
    it('should delete lesson', async () => {
      mockPrisma.lesson.delete.mockResolvedValue({ id: 'l1' });
      const result = await service.removeLesson('l1');
      expect(result.id).toBe('l1');
    });
  });

  describe('Enrollment Constraints (S003)', () => {
    it('should handle getUserProgress for empty course', async () => {
      mockPrisma.userProgress.findMany.mockResolvedValue([]);
      const result = await service.getUserProgress('u1', 'c1');
      expect(result).toEqual([]);
    });

    it('should include lesson details in user progress', async () => {
      mockPrisma.userProgress.findMany.mockResolvedValue([
        {
          userId: 'u1',
          lessonId: 'l1',
          status: 'COMPLETED',
          lesson: { id: 'l1', title: { vi: 'Bài 1' } },
        },
      ]);

      const result = await service.getUserProgress('u1', 'c1');
      expect(result[0]).toHaveProperty('lesson');
    });
  });

  describe('Progress Calculation Edge Cases (S003)', () => {
    it('should handle progress update with zero duration', async () => {
      mockPrisma.userProgress.findUnique.mockResolvedValue(null);
      mockPrisma.userProgress.upsert.mockResolvedValue({
        userId: 'u1',
        lessonId: 'l1',
        status: ProgressStatus.IN_PROGRESS,
        durationSpent: 0,
      });

      await service.updateProgress('u1', 'l1', ProgressStatus.IN_PROGRESS, 0);
      expect(mockPrisma.userProgress.upsert).toHaveBeenCalled();
    });

    it('should increment duration for existing progress', async () => {
      mockPrisma.userProgress.findUnique.mockResolvedValue({
        userId: 'u1',
        lessonId: 'l1',
        status: ProgressStatus.IN_PROGRESS,
        durationSpent: 50,
      });
      mockPrisma.userProgress.upsert.mockResolvedValue({
        userId: 'u1',
        lessonId: 'l1',
        status: ProgressStatus.IN_PROGRESS,
        durationSpent: 100,
      });

      await service.updateProgress('u1', 'l1', ProgressStatus.IN_PROGRESS, 50);
      expect(mockPrisma.userProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            durationSpent: { increment: 50 },
          }),
        }),
      );
    });

    it('should not reward points for re-completing same lesson', async () => {
      mockPrisma.userProgress.findUnique.mockResolvedValue({
        userId: 'u1',
        lessonId: 'l1',
        status: ProgressStatus.COMPLETED,
      });
      mockPrisma.userProgress.upsert.mockResolvedValue({
        status: ProgressStatus.COMPLETED,
      });

      await service.updateProgress('u1', 'l1', ProgressStatus.COMPLETED, 20);
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockGamification.logEvent).not.toHaveBeenCalled();
    });

    it('should set completedAt timestamp on first completion', async () => {
      mockPrisma.userProgress.findUnique.mockResolvedValue({
        userId: 'u1',
        lessonId: 'l1',
        status: ProgressStatus.IN_PROGRESS,
      });
      mockPrisma.userProgress.upsert.mockImplementation((args: any) => {
        return Promise.resolve({ ...args.create, completedAt: new Date() });
      });

      await service.updateProgress('u1', 'l1', ProgressStatus.COMPLETED, 60);
      expect(mockPrisma.userProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            completedAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('Lesson Ordering Logic (S003)', () => {
    it('should handle manual order override', async () => {
      mockPrisma.lesson.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'l1', ...data }),
      );

      const result = await service.createLesson({
        courseId: 'c1',
        title: { vi: 'Bài đặc biệt' },
        order: 99,
      } as any);

      expect(result.order).toBe(99);
      expect(mockPrisma.lesson.findFirst).not.toHaveBeenCalled();
    });

    it('should auto-assign order for empty course', async () => {
      mockPrisma.lesson.findFirst.mockResolvedValue(null);
      mockPrisma.lesson.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'l1', ...data }),
      );

      const result = await service.createLesson({
        courseId: 'c1',
        title: { vi: 'First Lesson' },
      } as any);

      expect(result.order).toBe(1);
    });

    it('should respect existing lesson order sequence', async () => {
      mockPrisma.lesson.findFirst.mockResolvedValue({ order: 10 });
      mockPrisma.lesson.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'l1', ...data }),
      );

      const result = await service.createLesson({
        courseId: 'c1',
        title: { vi: 'Next Lesson' },
      } as any);

      expect(result.order).toBe(11);
    });
  });

  describe('Course Query Pagination (S003)', () => {
    it('should enforce max limit of 100', async () => {
      mockPrisma.course.findMany.mockResolvedValue([]);
      mockPrisma.course.count.mockResolvedValue(0);

      await service.findAllCourses({ limit: 500 });

      expect(mockPrisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });

    it('should enforce min page of 1', async () => {
      mockPrisma.course.findMany.mockResolvedValue([]);
      mockPrisma.course.count.mockResolvedValue(0);

      await service.findAllCourses({ page: -5 });

      expect(mockPrisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0 }),
      );
    });

    it('should filter by published and level', async () => {
      mockPrisma.course.findMany.mockResolvedValue([]);
      mockPrisma.course.count.mockResolvedValue(0);

      await service.findAllCourses({
        published: true,
        level: 'BEGINNER' as any,
      });

      expect(mockPrisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { published: true, level: 'BEGINNER' },
        }),
      );
    });
  });

  describe('CRUD Error Handling (S003)', () => {
    it('should throw NotFoundException for invalid lesson ID', async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue(null);
      await expect(service.findOneLesson('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should delete course successfully', async () => {
      mockPrisma.course.delete.mockResolvedValue({ id: 'c1' } as any);
      const result = await service.removeCourse('c1');
      expect(result.id).toBe('c1');
    });

    it('should update course with partial data', async () => {
      mockPrisma.course.update.mockResolvedValue({
        id: 'c1',
        slug: 'updated-slug',
      } as any);
      const result = await service.updateCourse('c1', {
        slug: 'updated-slug',
      } as any);
      expect(result.slug).toBe('updated-slug');
    });
  });
});
