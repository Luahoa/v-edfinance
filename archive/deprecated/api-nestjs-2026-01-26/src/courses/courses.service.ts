import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  type Course,
  type Lesson,
  type Level,
  type Prisma,
  ProgressStatus,
} from '@prisma/client';
import { GamificationService } from '../common/gamification.service';
import { withRetry } from '../common/transaction-retry';
import { ValidationService } from '../common/validation.service';
import { PrismaService } from '../prisma/prisma.service';
import { VideoCompletionValidator } from '../common/validators/video-completion.validator';
import type { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import type { CreateLessonDto, UpdateLessonDto } from './dto/lesson.dto';
import type { WatchLogDto } from './dto/progress.dto';

@Injectable()
export class CoursesService {
  private videoValidator: VideoCompletionValidator;

  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
    private validation: ValidationService,
  ) {
    this.videoValidator = new VideoCompletionValidator();
  }

  // Course CRUD
  async createCourse(data: CreateCourseDto): Promise<Course> {
    const title = this.validation.validate('I18N_TEXT', data.title);
    const description = this.validation.validate('I18N_TEXT', data.description);

    return this.prisma.course.create({
      data: {
        slug: data.slug,
        title: title as unknown as Prisma.InputJsonValue,
        description: description as unknown as Prisma.InputJsonValue,
        thumbnailKey: data.thumbnailKey,
        price: data.price,
        level: data.level,
        published: data.published,
      },
    });
  }

  async findAllCourses(query: {
    page?: number;
    limit?: number;
    published?: boolean;
    level?: Level;
  }): Promise<{ data: Course[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, query.limit || 10);
    const skip = (page - 1) * limit;

    const where: Prisma.CourseWhereInput = {
      published: query.published,
      level: query.level,
    };

    const [data, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        include: { _count: { select: { lessons: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.course.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOneCourse(id: string): Promise<Course> {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        lessons: { where: { published: true }, orderBy: { order: 'asc' } },
      },
    });
    if (!course) throw new NotFoundException(`Course with ID ${id} not found`);
    return course;
  }

  async findOneLesson(id: string): Promise<Lesson> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
    });
    if (!lesson) throw new NotFoundException(`Lesson with ID ${id} not found`);
    return lesson;
  }

  async updateCourse(id: string, data: UpdateCourseDto): Promise<Course> {
    return this.prisma.course.update({
      where: { id },
      data: data as Prisma.CourseUpdateInput,
    });
  }

  async removeCourse(id: string): Promise<Course> {
    return this.prisma.course.delete({
      where: { id },
    });
  }

  // Lesson CRUD
  async createLesson(data: CreateLessonDto): Promise<Lesson> {
    // Automatically determine order if not provided
    if (data.order === undefined) {
      const lastLesson = await this.prisma.lesson.findFirst({
        where: { courseId: data.courseId },
        orderBy: { order: 'desc' },
      });
      data.order = (lastLesson?.order ?? 0) + 1;
    }

    return this.prisma.lesson.create({
      data: data as unknown as Prisma.LessonCreateInput,
    });
  }

  async updateLesson(id: string, data: UpdateLessonDto): Promise<Lesson> {
    return this.prisma.lesson.update({
      where: { id },
      data: data as unknown as Prisma.LessonUpdateInput,
    });
  }

  async removeLesson(id: string): Promise<Lesson> {
    return this.prisma.lesson.delete({
      where: { id },
    });
  }

  // Progress Tracking
  async updateProgress(
    userId: string,
    lessonId: string,
    status: ProgressStatus,
    durationSpent: number,
    watchLogs?: WatchLogDto[],
  ) {
    return withRetry(
      () =>
        this.executeProgressUpdate(
          userId,
          lessonId,
          status,
          durationSpent,
          watchLogs,
        ),
      `updateProgress:${userId}:${lessonId}`,
      { maxRetries: 3, baseDelayMs: 100 },
    );
  }

  private async executeProgressUpdate(
    userId: string,
    lessonId: string,
    status: ProgressStatus,
    durationSpent: number,
    watchLogs?: WatchLogDto[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      // VED-7MN + VED-YT11: Anti-tampering + Anti-cheat validation
      if (status === ProgressStatus.COMPLETED) {
        const lesson = await tx.lesson.findUnique({
          where: { id: lessonId },
          select: { duration: true, id: true, videoKey: true },
        });

        if (!lesson) {
          throw new NotFoundException(`Lesson ${lessonId} not found`);
        }

        const existing = await tx.userProgress.findUnique({
          where: { userId_lessonId: { userId, lessonId } },
        });

        // Calculate total watch time (existing + new duration)
        const totalDuration = (existing?.durationSpent || 0) + durationSpent;

        // Minimum 90% watch time required for completion
        const MIN_COMPLETION_THRESHOLD = 0.9;
        const requiredDuration = lesson.duration
          ? lesson.duration * MIN_COMPLETION_THRESHOLD
          : 0;

        if (lesson.duration && totalDuration < requiredDuration) {
          // Log suspicious activity
          await tx.behaviorLog.create({
            data: {
              userId,
              sessionId: 'system',
              path: `/lessons/${lessonId}`,
              eventType: 'SUSPICIOUS_PROGRESS',
              actionCategory: 'SECURITY',
              duration: durationSpent,
              deviceInfo: {},
              payload: {
                lessonId,
                expectedDuration: lesson.duration,
                actualDuration: totalDuration,
                threshold: MIN_COMPLETION_THRESHOLD,
                requiredDuration,
              },
            },
          });

          throw new BadRequestException(
            `Lesson must be watched for at least ${Math.ceil(requiredDuration)}s (90% of ${lesson.duration}s). Current: ${totalDuration}s`,
          );
        }

        // VED-YT11: Advanced anti-cheat validation for video lessons
        if (lesson.videoKey && watchLogs && watchLogs.length > 0) {
          const validationResult = await this.videoValidator.validate(
            watchLogs as any,
            {
              videoId: lesson.videoKey as any,
              duration: lesson.duration || 0,
            },
          );

          if (!validationResult.isValid) {
            // Log cheat attempt
            await tx.behaviorLog.create({
              data: {
                userId,
                sessionId: watchLogs[0]?.sessionId || 'unknown',
                path: `/lessons/${lessonId}`,
                eventType: 'CHEAT_ATTEMPT_DETECTED',
                actionCategory: 'SECURITY',
                duration: durationSpent,
                deviceInfo: {},
                // FIXED: Convert ValidationResult to plain object for JSON storage
                payload: {
                  lessonId,
                  videoId: lesson.videoKey,
                  validationResult: {
                    isValid: validationResult.isValid,
                    reason: validationResult.reason,
                    watchTime: validationResult.watchTime,
                    completionRate: validationResult.completionRate,
                    suspiciousActivity: validationResult.suspiciousActivity,
                  },
                  watchLogsCount: watchLogs.length,
                  suspiciousActivity: validationResult.suspiciousActivity,
                },
              },
            });

            throw new BadRequestException(
              `Video completion validation failed: ${validationResult.reason}`,
            );
          }

          // Log successful validation
          await tx.behaviorLog.create({
            data: {
              userId,
              sessionId: watchLogs[0]?.sessionId || 'unknown',
              path: `/lessons/${lessonId}`,
              eventType: 'VIDEO_COMPLETION_VALIDATED',
              actionCategory: 'PROGRESS',
              duration: Math.round(validationResult.watchTime),
              deviceInfo: {},
              payload: {
                lessonId,
                videoId: lesson.videoKey,
                validationResult: {
                  watchTime: validationResult.watchTime,
                  completionRate: validationResult.completionRate,
                },
              },
            },
          });
        }
      }

      const existing = await tx.userProgress.findUnique({
        where: { userId_lessonId: { userId, lessonId } },
      });

      const progress = await tx.userProgress.upsert({
        where: {
          userId_lessonId: { userId, lessonId },
        },
        update: {
          status,
          durationSpent: { increment: durationSpent },
          completedAt:
            status === ProgressStatus.COMPLETED &&
            (!existing || existing.status !== ProgressStatus.COMPLETED)
              ? new Date()
              : undefined,
        },
        create: {
          userId,
          lessonId,
          status,
          durationSpent,
          completedAt: status === ProgressStatus.COMPLETED ? new Date() : null,
        },
      });

      if (
        status === ProgressStatus.COMPLETED &&
        (!existing || existing.status !== ProgressStatus.COMPLETED)
      ) {
        await tx.user.update({
          where: { id: userId },
          data: { points: { increment: 10 } },
        });

        await this.gamification.logEvent(userId, 'LESSON_COMPLETED', 10, {
          lessonId,
        });
      }

      return progress;
    });
  }

  async getUserProgress(userId: string, courseId: string) {
    return this.prisma.userProgress.findMany({
      where: {
        userId,
        lesson: { courseId },
      },
      include: {
        lesson: true,
      },
    });
  }
}
