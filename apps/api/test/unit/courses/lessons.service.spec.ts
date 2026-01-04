import { LessonType } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CoursesService } from '../../../src/courses/courses.service';

describe('Lessons CRUD', () => {
  let service: CoursesService;
  let prisma: any;
  let gamification: any;
  let validation: any;

  beforeEach(() => {
    prisma = {
      lesson: {
        findFirst: vi.fn(),
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      course: {
        findUnique: vi.fn(),
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

  describe('createLesson', () => {
    it('should create VIDEO lesson with localized content', async () => {
      const createDto = {
        courseId: 'c1',
        title: { vi: 'Bài 1: Video', en: 'Lesson 1: Video', zh: '课程1：视频' },
        content: { vi: 'Nội dung', en: 'Content', zh: '内容' },
        videoKey: { vi: 'vid-vi.mp4', en: 'vid-en.mp4', zh: 'vid-zh.mp4' },
        type: LessonType.VIDEO,
        order: 1,
        published: true,
      };

      prisma.lesson.create.mockResolvedValue({ id: 'l1', ...createDto });

      const result = await service.createLesson(createDto);

      expect(prisma.lesson.create).toHaveBeenCalledWith({
        data: createDto,
      });
      expect(result.type).toBe(LessonType.VIDEO);
    });

    it('should create READING lesson', async () => {
      const createDto = {
        courseId: 'c1',
        title: { vi: 'Bài đọc', en: 'Reading', zh: '阅读' },
        content: { vi: 'Đọc nội dung', en: 'Reading content', zh: '阅读内容' },
        type: LessonType.READING,
        order: 2,
      };

      prisma.lesson.create.mockResolvedValue({ id: 'l2', ...createDto });

      const result = await service.createLesson(createDto);

      expect(result.type).toBe(LessonType.READING);
    });

    it('should create QUIZ lesson', async () => {
      const createDto = {
        courseId: 'c1',
        title: { vi: 'Bài kiểm tra', en: 'Quiz', zh: '测验' },
        content: { vi: 'Câu hỏi', en: 'Questions', zh: '问题' },
        type: LessonType.QUIZ,
        order: 3,
      };

      prisma.lesson.create.mockResolvedValue({ id: 'l3', ...createDto });

      const result = await service.createLesson(createDto);

      expect(result.type).toBe(LessonType.QUIZ);
    });

    it('should auto-assign order if not provided', async () => {
      const createDto = {
        courseId: 'c1',
        title: { vi: 'Bài mới' },
        content: { vi: 'Nội dung' },
      };

      prisma.lesson.findFirst.mockResolvedValue({ order: 5 });
      prisma.lesson.create.mockResolvedValue({ id: 'l6', order: 6 });

      const result = await service.createLesson(createDto);

      expect(prisma.lesson.findFirst).toHaveBeenCalledWith({
        where: { courseId: 'c1' },
        orderBy: { order: 'desc' },
      });
      expect(prisma.lesson.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ order: 6 }),
      });
      expect(result.order).toBe(6);
    });

    it('should set order to 1 for first lesson in course', async () => {
      const createDto = {
        courseId: 'c1',
        title: { vi: 'Bài đầu tiên' },
        content: { vi: 'Nội dung' },
      };

      prisma.lesson.findFirst.mockResolvedValue(null);
      prisma.lesson.create.mockResolvedValue({ id: 'l1', order: 1 });

      await service.createLesson(createDto);

      expect(prisma.lesson.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ order: 1 }),
      });
    });

    it('should respect explicitly provided order', async () => {
      const createDto = {
        courseId: 'c1',
        title: { vi: 'Bài đặc biệt' },
        content: { vi: 'Nội dung' },
        order: 10,
      };

      prisma.lesson.create.mockResolvedValue({ id: 'l10', order: 10 });

      await service.createLesson(createDto);

      expect(prisma.lesson.findFirst).not.toHaveBeenCalled();
      expect(prisma.lesson.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ order: 10 }),
      });
    });
  });

  describe('updateLesson', () => {
    it('should update lesson content preserving localization', async () => {
      const updateDto = {
        content: { vi: 'Nội dung mới', en: 'New content', zh: '新内容' },
      };

      prisma.lesson.update.mockResolvedValue({ id: 'l1', ...updateDto });

      const result = await service.updateLesson('l1', updateDto);

      expect(prisma.lesson.update).toHaveBeenCalledWith({
        where: { id: 'l1' },
        data: updateDto,
      });
      expect(result.content).toEqual(updateDto.content);
    });

    it('should allow reordering lessons', async () => {
      const updateDto = { order: 5 };
      prisma.lesson.update.mockResolvedValue({ id: 'l1', order: 5 });

      await service.updateLesson('l1', updateDto);

      expect(prisma.lesson.update).toHaveBeenCalledWith({
        where: { id: 'l1' },
        data: { order: 5 },
      });
    });

    it('should allow changing lesson type', async () => {
      const updateDto = { type: LessonType.QUIZ };
      prisma.lesson.update.mockResolvedValue({
        id: 'l1',
        type: LessonType.QUIZ,
      });

      await service.updateLesson('l1', updateDto);

      expect(prisma.lesson.update).toHaveBeenCalledWith({
        where: { id: 'l1' },
        data: { type: LessonType.QUIZ },
      });
    });
  });

  describe('removeLesson', () => {
    it('should delete lesson', async () => {
      prisma.lesson.delete.mockResolvedValue({ id: 'l1' });

      const result = await service.removeLesson('l1');

      expect(prisma.lesson.delete).toHaveBeenCalledWith({
        where: { id: 'l1' },
      });
      expect(result.id).toBe('l1');
    });
  });

  describe('lesson ordering', () => {
    it('should maintain sequential order for multiple lessons', async () => {
      prisma.lesson.findFirst
        .mockResolvedValueOnce({ order: 1 })
        .mockResolvedValueOnce({ order: 2 })
        .mockResolvedValueOnce({ order: 3 });

      const lessons = [];
      for (let i = 0; i < 3; i++) {
        prisma.lesson.create.mockResolvedValueOnce({ order: i + 2 });
        const result = await service.createLesson({
          courseId: 'c1',
          title: { vi: `Bài ${i + 2}` },
          content: { vi: 'Content' },
        });
        lessons.push(result);
      }

      expect(lessons[0].order).toBe(2);
      expect(lessons[1].order).toBe(3);
      expect(lessons[2].order).toBe(4);
    });
  });
});
