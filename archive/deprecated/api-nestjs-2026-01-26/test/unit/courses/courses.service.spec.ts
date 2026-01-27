import { NotFoundException } from '@nestjs/common';
import { Level, ProgressStatus } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CoursesService } from '../../../src/courses/courses.service';

describe('CoursesService', () => {
  let service: CoursesService;
  let prisma: any;
  let gamification: any;
  let validation: any;

  beforeEach(() => {
    prisma = {
      course: {
        create: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      lesson: {
        findFirst: vi.fn(),
        create: vi.fn(),
        findUnique: vi.fn(),
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
      $transaction: vi.fn((cb) => cb(prisma)),
    };
    gamification = {
      logEvent: vi.fn(),
    };
    validation = {
      validate: vi.fn((type, value) => value),
    };

    service = new CoursesService(prisma, gamification, validation);
  });

  describe('createCourse', () => {
    it('should create course with localized JSONB content (vi/en/zh)', async () => {
      const createDto = {
        slug: 'finance-101',
        title: { vi: 'Tài chính 101', en: 'Finance 101', zh: '金融101' },
        description: { vi: 'Mô tả', en: 'Description', zh: '描述' },
        thumbnailKey: 'thumb.jpg',
        price: 100000,
        level: Level.BEGINNER,
        published: true,
      };

      prisma.course.create.mockResolvedValue({ id: 'c1', ...createDto });

      const result = await service.createCourse(createDto);

      expect(validation.validate).toHaveBeenCalledWith(
        'I18N_TEXT',
        createDto.title,
      );
      expect(validation.validate).toHaveBeenCalledWith(
        'I18N_TEXT',
        createDto.description,
      );
      expect(prisma.course.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          slug: 'finance-101',
          level: Level.BEGINNER,
          price: 100000,
        }),
      });
      expect(result).toHaveProperty('id', 'c1');
    });

    it('should validate JSONB structure via ValidationService', async () => {
      const invalidDto = {
        slug: 'test',
        title: { vi: 'Test' }, // Missing en/zh
        description: { vi: 'Desc' },
        thumbnailKey: 'thumb.jpg',
        price: 0,
      };

      validation.validate.mockImplementation(() => {
        throw new Error('Missing required languages');
      });

      await expect(service.createCourse(invalidDto as any)).rejects.toThrow();
    });
  });

  describe('findAllCourses', () => {
    it('should return paginated courses with default values', async () => {
      prisma.course.findMany.mockResolvedValue([
        { id: '1', title: 'Course 1' },
      ]);
      prisma.course.count.mockResolvedValue(1);

      const result = await service.findAllCourses({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should filter by published status', async () => {
      prisma.course.findMany.mockResolvedValue([]);
      prisma.course.count.mockResolvedValue(0);

      await service.findAllCourses({ published: true });

      expect(prisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ published: true }),
        }),
      );
    });

    it('should filter by level (BEGINNER, INTERMEDIATE, ADVANCED)', async () => {
      prisma.course.findMany.mockResolvedValue([]);
      prisma.course.count.mockResolvedValue(0);

      await service.findAllCourses({ level: Level.INTERMEDIATE });

      expect(prisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ level: Level.INTERMEDIATE }),
        }),
      );
    });

    it('should enforce max limit of 100', async () => {
      prisma.course.findMany.mockResolvedValue([]);
      prisma.course.count.mockResolvedValue(0);

      const result = await service.findAllCourses({ limit: 500 });

      expect(result.limit).toBe(100);
    });

    it('should handle page boundaries correctly', async () => {
      prisma.course.findMany.mockResolvedValue([]);
      prisma.course.count.mockResolvedValue(0);

      await service.findAllCourses({ page: 0, limit: 10 });

      expect(prisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0, // page 0 should become page 1
          take: 10,
        }),
      );
    });
  });

  describe('findOneCourse', () => {
    it('should return course with published lessons ordered by order field', async () => {
      const course = {
        id: 'c1',
        title: { vi: 'Khóa học 1' },
        lessons: [
          { id: 'l1', order: 1 },
          { id: 'l2', order: 2 },
        ],
      };
      prisma.course.findUnique.mockResolvedValue(course);

      const result = await service.findOneCourse('c1');

      expect(result).toEqual(course);
      expect(prisma.course.findUnique).toHaveBeenCalledWith({
        where: { id: 'c1' },
        include: {
          lessons: { where: { published: true }, orderBy: { order: 'asc' } },
        },
      });
    });

    it('should throw NotFoundException if course not found', async () => {
      prisma.course.findUnique.mockResolvedValue(null);
      await expect(service.findOneCourse('invalid')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOneCourse('invalid')).rejects.toThrow(
        'Course with ID invalid not found',
      );
    });
  });

  describe('updateCourse', () => {
    it('should update course and preserve localization structure', async () => {
      const updateDto = {
        title: { vi: 'Cập nhật', en: 'Updated', zh: '更新' },
        price: 150000,
      };

      prisma.course.update.mockResolvedValue({ id: 'c1', ...updateDto });

      const result = await service.updateCourse('c1', updateDto);

      expect(prisma.course.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: updateDto,
      });
      expect(result.title).toEqual(updateDto.title);
    });

    it('should allow partial updates', async () => {
      const updateDto = { published: false };
      prisma.course.update.mockResolvedValue({ id: 'c1', published: false });

      await service.updateCourse('c1', updateDto);

      expect(prisma.course.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { published: false },
      });
    });
  });

  describe('removeCourse', () => {
    it('should delete course', async () => {
      prisma.course.delete.mockResolvedValue({ id: 'c1' });

      const result = await service.removeCourse('c1');

      expect(prisma.course.delete).toHaveBeenCalledWith({
        where: { id: 'c1' },
      });
      expect(result.id).toBe('c1');
    });
  });

  describe('updateProgress', () => {
    it('should update progress and award points on first completion', async () => {
      const userId = 'user-1';
      const lessonId = 'lesson-1';
      prisma.userProgress.findUnique.mockResolvedValue(null);
      prisma.userProgress.upsert.mockResolvedValue({
        id: 'p1',
        status: ProgressStatus.COMPLETED,
      });
      // Mock lesson lookup required by updateProgress
      prisma.lesson.findUnique.mockResolvedValue({ id: lessonId, duration: 100, videoKey: 'key' });

      await service.updateProgress(
        userId,
        lessonId,
        ProgressStatus.COMPLETED,
        100,
      );

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { points: { increment: 10 } },
      });
      expect(gamification.logEvent).toHaveBeenCalledWith(
        userId,
        'LESSON_COMPLETED',
        10,
        {
          lessonId,
        },
      );
    });

    it('should not award points if already completed (idempotent)', async () => {
      const userId = 'user-1';
      const lessonId = 'lesson-1';
      prisma.userProgress.findUnique.mockResolvedValue({
        status: ProgressStatus.COMPLETED,
      });
      prisma.userProgress.upsert.mockResolvedValue({
        status: ProgressStatus.COMPLETED,
      });
      // Mock lesson lookup required by updateProgress
      prisma.lesson.findUnique.mockResolvedValue({ id: lessonId, duration: 100, videoKey: 'key' });

      await service.updateProgress(
        userId,
        lessonId,
        ProgressStatus.COMPLETED,
        100,
      );

      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(gamification.logEvent).not.toHaveBeenCalled();
    });

    it('should increment durationSpent on existing progress', async () => {
      prisma.userProgress.findUnique.mockResolvedValue({
        status: ProgressStatus.IN_PROGRESS,
        durationSpent: 50,
      });
      prisma.userProgress.upsert.mockResolvedValue({ durationSpent: 150 });

      await service.updateProgress('u1', 'l1', ProgressStatus.IN_PROGRESS, 100);

      expect(prisma.userProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            durationSpent: { increment: 100 },
          }),
        }),
      );
    });

    it('should set completedAt timestamp on first completion only', async () => {
      prisma.userProgress.findUnique.mockResolvedValue(null);
      prisma.userProgress.upsert.mockImplementation((args) => {
        expect(args.create.completedAt).toBeInstanceOf(Date);
        return Promise.resolve({ completedAt: new Date() });
      });
      // Mock lesson lookup required by updateProgress
      prisma.lesson.findUnique.mockResolvedValue({ id: 'l1', duration: 100, videoKey: 'key' });

      await service.updateProgress('u1', 'l1', ProgressStatus.COMPLETED, 100);
    });
  });

  describe('getUserProgress', () => {
    it('should return all progress for a user in a specific course', async () => {
      const progress = [
        {
          id: 'p1',
          userId: 'u1',
          lessonId: 'l1',
          status: ProgressStatus.COMPLETED,
        },
        {
          id: 'p2',
          userId: 'u1',
          lessonId: 'l2',
          status: ProgressStatus.IN_PROGRESS,
        },
      ];
      prisma.userProgress.findMany.mockResolvedValue(progress);

      const result = await service.getUserProgress('u1', 'c1');

      expect(prisma.userProgress.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'u1',
          lesson: { courseId: 'c1' },
        },
        include: { lesson: true },
      });
      expect(result).toEqual(progress);
    });
  });

  describe('findOneLesson', () => {
    it('should return lesson by id', async () => {
      const lesson = { id: 'l1', title: { vi: 'Bài 1' } };
      prisma.lesson.findUnique.mockResolvedValue(lesson);

      const result = await service.findOneLesson('l1');

      expect(result).toEqual(lesson);
    });

    it('should throw NotFoundException if lesson not found', async () => {
      prisma.lesson.findUnique.mockResolvedValue(null);
      await expect(service.findOneLesson('invalid')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOneLesson('invalid')).rejects.toThrow(
        'Lesson with ID invalid not found',
      );
    });
  });
});
