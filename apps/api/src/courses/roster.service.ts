import { Injectable, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import type {
  CourseRosterResponseDto,
  GetCourseRosterQueryDto,
  StudentRosterItemDto,
} from './dto/roster.dto';

/**
 * Roster Service - Student enrollment and progress tracking
 *
 * Provides instructor/admin functionality to view:
 * - All students enrolled in a course
 * - Individual student progress
 * - Completion rates
 * - Last activity timestamps
 */
@Injectable()
export class RosterService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get roster of students enrolled in a course
   *
   * Strategy:
   * 1. Find all users who have UserProgress records for lessons in this course
   * 2. Aggregate progress data per user
   * 3. Apply search, sort, and pagination
   */
  async getCourseRoster(
    courseId: string,
    query: GetCourseRosterQueryDto
  ): Promise<CourseRosterResponseDto> {
    const { page = 1, limit = 20, sortBy = 'enrolledAt', sortOrder = 'desc', search } = query;

    // 1. Verify course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lessons: {
          select: { id: true },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course not found: ${courseId}`);
    }

    const totalLessons = course.lessons.length;
    const lessonIds = course.lessons.map((lesson) => lesson.id);

    // 2. Find all users who have progress in this course
    // Group by userId to get unique enrolled students
    const enrolledStudentsRaw = await this.prisma.userProgress.groupBy({
      by: ['userId'],
      where: {
        lessonId: {
          in: lessonIds,
        },
      },
      _min: {
        createdAt: true, // First lesson started = enrollment date
      },
      _max: {
        updatedAt: true, // Last activity
      },
    });

    const totalStudents = enrolledStudentsRaw.length;

    // 3. Get detailed student data with progress
    const userIds = enrolledStudentsRaw.map((item) => item.userId);

    // Fetch users with their progress data
    const students = await this.prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
        ...(search && {
          OR: [
            {
              email: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              name: {
                path: ['vi'],
                string_contains: search,
              },
            },
            {
              name: {
                path: ['en'],
                string_contains: search,
              },
            },
          ],
        }),
      },
      include: {
        progress: {
          where: {
            lessonId: {
              in: lessonIds,
            },
          },
          select: {
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    // 4. Calculate progress for each student
    const studentsWithProgress = students.map((student) => {
      const completedLessons = student.progress.filter((p) => p.status === 'COMPLETED').length;
      const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
      const enrolledAt =
        student.progress.length > 0
          ? student.progress.reduce(
              (earliest, p) => (p.createdAt < earliest ? p.createdAt : earliest),
              student.progress[0].createdAt
            )
          : new Date();
      const lastActivity =
        student.progress.length > 0
          ? student.progress.reduce(
              (latest, p) => (p.updatedAt > latest ? p.updatedAt : latest),
              student.progress[0].updatedAt
            )
          : new Date();

      return {
        userId: student.id,
        name: this.extractLocalizedString(student.name, 'vi'),
        email: student.email,
        enrolledAt,
        progress,
        completedLessons,
        totalLessons,
        lastActivity,
        completed: completedLessons === totalLessons && totalLessons > 0,
      };
    });

    // 5. Sort
    studentsWithProgress.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'enrolledAt':
          comparison = a.enrolledAt.getTime() - b.enrolledAt.getTime();
          break;
        case 'progress':
          comparison = a.progress - b.progress;
          break;
        case 'lastActivity':
          comparison = a.lastActivity.getTime() - b.lastActivity.getTime();
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // 6. Paginate
    const startIndex = (page - 1) * limit;
    const paginatedStudents = studentsWithProgress.slice(startIndex, startIndex + limit);

    // 7. Build response
    return {
      courseId,
      courseTitle: this.extractLocalizedString(course.title, 'vi'),
      totalStudents,
      students: paginatedStudents,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalStudents / limit),
        limit,
        totalStudents,
      },
    };
  }

  /**
   * Get individual student progress for a course
   */
  async getStudentCourseProgress(courseId: string, userId: string): Promise<StudentRosterItemDto> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lessons: {
          select: { id: true },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course not found: ${courseId}`);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        progress: {
          where: {
            lessonId: {
              in: course.lessons.map((l) => l.id),
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User not found: ${userId}`);
    }

    const totalLessons = course.lessons.length;
    const completedLessons = user.progress.filter((p) => p.status === 'COMPLETED').length;
    const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    const enrolledAt =
      user.progress.length > 0
        ? user.progress.reduce(
            (earliest, p) => (p.createdAt < earliest ? p.createdAt : earliest),
            user.progress[0].createdAt
          )
        : new Date();

    const lastActivity =
      user.progress.length > 0
        ? user.progress.reduce(
            (latest, p) => (p.updatedAt > latest ? p.updatedAt : latest),
            user.progress[0].updatedAt
          )
        : new Date();

    return {
      userId: user.id,
      name: this.extractLocalizedString(user.name, 'vi'),
      email: user.email,
      enrolledAt,
      progress,
      completedLessons,
      totalLessons,
      lastActivity,
      completed: completedLessons === totalLessons && totalLessons > 0,
    };
  }

  /**
   * Helper: Extract localized string from JSON field
   */
  private extractLocalizedString(jsonField: any, locale: 'vi' | 'en' | 'zh' = 'vi'): string {
    if (typeof jsonField === 'string') {
      return jsonField;
    }

    if (typeof jsonField === 'object' && jsonField !== null) {
      return jsonField[locale] || jsonField.vi || jsonField.en || Object.values(jsonField)[0] || '';
    }

    return '';
  }
}
