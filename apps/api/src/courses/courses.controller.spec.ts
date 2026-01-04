import { Test, type TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { AiService } from '../ai/ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import {
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Level, ProgressStatus, Role } from '@prisma/client';

describe('CoursesController', () => {
  let controller: CoursesController;
  let coursesService: CoursesService;
  let aiService: AiService;

  const mockCoursesService = {
    createCourse: vi.fn(),
    findAllCourses: vi.fn(),
    findOneCourse: vi.fn(),
    findOneLesson: vi.fn(),
    updateCourse: vi.fn(),
    removeCourse: vi.fn(),
    createLesson: vi.fn(),
    updateLesson: vi.fn(),
    removeLesson: vi.fn(),
    updateProgress: vi.fn(),
  };

  const mockAiService = {
    getCourseAdvice: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [
        { provide: CoursesService, useValue: mockCoursesService },
        { provide: AiService, useValue: mockAiService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = { userId: 'user-123', role: Role.ADMIN };
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    controller = module.get<CoursesController>(CoursesController);
    coursesService = module.get<CoursesService>(CoursesService);
    aiService = module.get<AiService>(AiService);

    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createCourse', () => {
    const createDto = {
      title: { vi: 'Khóa học mới', en: 'New Course', zh: '新课程' },
      description: { vi: 'Mô tả', en: 'Description', zh: '描述' },
      level: Level.BEGINNER,
    };

    it('should create a new course successfully', async () => {
      const createdCourse = { id: 'course-1', ...createDto };
      mockCoursesService.createCourse.mockResolvedValue(createdCourse);

      const result = await controller.createCourse(createDto);

      expect(coursesService.createCourse).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(createdCourse);
    });

    it('should validate required fields', async () => {
      mockCoursesService.createCourse.mockRejectedValue(
        new Error('Title is required'),
      );

      await expect(controller.createCourse({} as any)).rejects.toThrow();
    });
  });

  describe('findAll', () => {
    it('should return all courses with default pagination', async () => {
      const courses = [
        { id: 'course-1', title: { vi: 'Khóa 1' }, level: Level.BEGINNER },
        { id: 'course-2', title: { vi: 'Khóa 2' }, level: Level.INTERMEDIATE },
      ];
      mockCoursesService.findAllCourses.mockResolvedValue(courses);

      const result = await controller.findAll();

      expect(coursesService.findAllCourses).toHaveBeenCalledWith({
        page: undefined,
        limit: undefined,
        level: undefined,
      });
      expect(result).toEqual(courses);
    });

    it('should apply pagination parameters', async () => {
      mockCoursesService.findAllCourses.mockResolvedValue([]);

      await controller.findAll(2, 10);

      expect(coursesService.findAllCourses).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        level: undefined,
      });
    });

    it('should filter by level', async () => {
      const beginnerCourses = [{ id: 'course-1', level: Level.BEGINNER }];
      mockCoursesService.findAllCourses.mockResolvedValue(beginnerCourses);

      await controller.findAll(undefined, undefined, Level.BEGINNER);

      expect(coursesService.findAllCourses).toHaveBeenCalledWith({
        page: undefined,
        limit: undefined,
        level: Level.BEGINNER,
      });
    });

    it('should convert string params to numbers', async () => {
      mockCoursesService.findAllCourses.mockResolvedValue([]);

      await controller.findAll('3' as any, '20' as any);

      expect(coursesService.findAllCourses).toHaveBeenCalledWith({
        page: 3,
        limit: 20,
        level: undefined,
      });
    });
  });

  describe('findOne', () => {
    it('should return a single course', async () => {
      const course = { id: 'course-1', title: { vi: 'Khóa học' } };
      mockCoursesService.findOneCourse.mockResolvedValue(course);

      const result = await controller.findOne('course-1');

      expect(coursesService.findOneCourse).toHaveBeenCalledWith('course-1');
      expect(result).toEqual(course);
    });

    it('should throw NotFoundException for non-existent course', async () => {
      mockCoursesService.findOneCourse.mockRejectedValue(
        new NotFoundException('Course not found'),
      );

      await expect(controller.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findLesson', () => {
    it('should return a single lesson', async () => {
      const lesson = { id: 'lesson-1', title: { vi: 'Bài học' } };
      mockCoursesService.findOneLesson.mockResolvedValue(lesson);

      const result = await controller.findLesson('lesson-1');

      expect(coursesService.findOneLesson).toHaveBeenCalledWith('lesson-1');
      expect(result).toEqual(lesson);
    });

    it('should throw NotFoundException for non-existent lesson', async () => {
      mockCoursesService.findOneLesson.mockRejectedValue(
        new NotFoundException('Lesson not found'),
      );

      await expect(controller.findLesson('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateCourse', () => {
    const updateDto = {
      title: { vi: 'Cập nhật', en: 'Updated', zh: '更新' },
    };

    it('should update course successfully', async () => {
      const updated = { id: 'course-1', ...updateDto };
      mockCoursesService.updateCourse.mockResolvedValue(updated);

      const result = await controller.updateCourse('course-1', updateDto);

      expect(coursesService.updateCourse).toHaveBeenCalledWith(
        'course-1',
        updateDto,
      );
      expect(result).toEqual(updated);
    });

    it('should handle partial updates', async () => {
      const partialDto = { level: Level.ADVANCED };
      mockCoursesService.updateCourse.mockResolvedValue({
        id: 'course-1',
        ...partialDto,
      });

      await controller.updateCourse('course-1', partialDto);

      expect(coursesService.updateCourse).toHaveBeenCalledWith(
        'course-1',
        partialDto,
      );
    });
  });

  describe('removeCourse', () => {
    it('should delete course successfully', async () => {
      mockCoursesService.removeCourse.mockResolvedValue({
        id: 'course-1',
        deleted: true,
      });

      const result = await controller.removeCourse('course-1');

      expect(coursesService.removeCourse).toHaveBeenCalledWith('course-1');
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException for non-existent course', async () => {
      mockCoursesService.removeCourse.mockRejectedValue(
        new NotFoundException('Course not found'),
      );

      await expect(controller.removeCourse('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createLesson', () => {
    const createLessonDto = {
      courseId: 'course-1',
      title: { vi: 'Bài học mới', en: 'New Lesson', zh: '新课' },
      content: { vi: 'Nội dung', en: 'Content', zh: '内容' },
      order: 1,
    };

    it('should create a new lesson', async () => {
      const created = { id: 'lesson-1', ...createLessonDto };
      mockCoursesService.createLesson.mockResolvedValue(created);

      const result = await controller.createLesson(createLessonDto);

      expect(coursesService.createLesson).toHaveBeenCalledWith(createLessonDto);
      expect(result).toEqual(created);
    });
  });

  describe('updateLesson', () => {
    const updateLessonDto = {
      title: { vi: 'Cập nhật bài', en: 'Updated Lesson', zh: '更新课' },
    };

    it('should update lesson successfully', async () => {
      const updated = { id: 'lesson-1', ...updateLessonDto };
      mockCoursesService.updateLesson.mockResolvedValue(updated);

      const result = await controller.updateLesson('lesson-1', updateLessonDto);

      expect(coursesService.updateLesson).toHaveBeenCalledWith(
        'lesson-1',
        updateLessonDto,
      );
      expect(result).toEqual(updated);
    });
  });

  describe('removeLesson', () => {
    it('should delete lesson successfully', async () => {
      mockCoursesService.removeLesson.mockResolvedValue({
        id: 'lesson-1',
        deleted: true,
      });

      const result = await controller.removeLesson('lesson-1');

      expect(coursesService.removeLesson).toHaveBeenCalledWith('lesson-1');
      expect(result).toBeDefined();
    });
  });

  describe('updateProgress', () => {
    const progressBody = {
      status: ProgressStatus.COMPLETED,
      durationSpent: 300,
    };

    it('should update user progress successfully', async () => {
      const progress = { id: 'progress-1', ...progressBody };
      mockCoursesService.updateProgress.mockResolvedValue(progress);

      const req = { user: { userId: 'user-123' } };
      const result = await controller.updateProgress(
        'lesson-1',
        req,
        progressBody,
      );

      expect(coursesService.updateProgress).toHaveBeenCalledWith(
        'user-123',
        'lesson-1',
        ProgressStatus.COMPLETED,
        300,
      );
      expect(result).toEqual(progress);
    });

    it('should handle IN_PROGRESS status', async () => {
      const inProgressBody = {
        status: ProgressStatus.IN_PROGRESS,
        durationSpent: 120,
      };
      mockCoursesService.updateProgress.mockResolvedValue({
        id: 'progress-2',
        ...inProgressBody,
      });

      const req = { user: { userId: 'user-123' } };
      await controller.updateProgress('lesson-2', req, inProgressBody);

      expect(coursesService.updateProgress).toHaveBeenCalledWith(
        'user-123',
        'lesson-2',
        ProgressStatus.IN_PROGRESS,
        120,
      );
    });

    it('should validate duration is non-negative', async () => {
      const invalidBody = {
        status: ProgressStatus.COMPLETED,
        durationSpent: -10,
      };
      mockCoursesService.updateProgress.mockRejectedValue(
        new Error('Duration must be non-negative'),
      );

      const req = { user: { userId: 'user-123' } };

      await expect(
        controller.updateProgress('lesson-1', req, invalidBody),
      ).rejects.toThrow();
    });
  });

  describe('getMentorAdvice', () => {
    it('should get AI mentor advice for course', async () => {
      const advice = {
        message: 'Focus on practical exercises',
        nextSteps: ['Complete quiz', 'Practice coding'],
      };
      mockAiService.getCourseAdvice.mockResolvedValue(advice);

      const req = { user: { userId: 'user-123' } };
      const result = await controller.getMentorAdvice('course-1', req);

      expect(aiService.getCourseAdvice).toHaveBeenCalledWith(
        'course-1',
        'user-123',
      );
      expect(result).toEqual(advice);
    });

    it('should handle AI service errors', async () => {
      mockAiService.getCourseAdvice.mockRejectedValue(
        new Error('AI service unavailable'),
      );

      const req = { user: { userId: 'user-123' } };

      await expect(controller.getMentorAdvice('course-1', req)).rejects.toThrow(
        'AI service unavailable',
      );
    });
  });

  describe('Role-Based Access Control', () => {
    it('should require ADMIN or TEACHER role for createCourse', () => {
      const roles = Reflect.getMetadata(
        'roles',
        CoursesController.prototype.createCourse,
      );
      expect(roles).toContain(Role.ADMIN);
      expect(roles).toContain(Role.TEACHER);
    });

    it('should require ADMIN or TEACHER role for updateCourse', () => {
      const roles = Reflect.getMetadata(
        'roles',
        CoursesController.prototype.updateCourse,
      );
      expect(roles).toContain(Role.ADMIN);
      expect(roles).toContain(Role.TEACHER);
    });

    it('should require only ADMIN role for removeCourse', () => {
      const roles = Reflect.getMetadata(
        'roles',
        CoursesController.prototype.removeCourse,
      );
      expect(roles).toContain(Role.ADMIN);
    });

    it('should not require specific roles for public endpoints', () => {
      const roles = Reflect.getMetadata(
        'roles',
        CoursesController.prototype.findAll,
      );
      expect(roles).toBeUndefined();
    });
  });
});
