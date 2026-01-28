import { z } from 'zod';
import { eq, and, desc, like, or, sql, count } from 'drizzle-orm';

import { router, publicProcedure, protectedProcedure } from '../trpc';
import { courses, lessons, userProgress, enrollments, users } from '../../../drizzle/schema';
import { sendEnrollmentEmail } from '../../lib/email';

export const courseRouter = router({
  // List published courses
  list: publicProcedure
    .input(
      z.object({
        level: z.enum(['BEGINNER', 'INTERMEDIATE', 'EXPERT']).optional(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const whereConditions = [eq(courses.published, true)];
      
      if (input.level) {
        whereConditions.push(eq(courses.level, input.level));
      }

      const result = await ctx.db.query.courses.findMany({
        where: and(...whereConditions),
        limit: input.limit,
        offset: input.offset,
        orderBy: desc(courses.createdAt),
      });

      return result;
    }),

  // Get course by slug with lessons
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const course = await ctx.db.query.courses.findFirst({
        where: eq(courses.slug, input.slug),
        with: {
          lessons: {
            where: eq(lessons.published, true),
            orderBy: lessons.order,
          },
        },
      });

      return course;
    }),

  // Get user progress for a course
  getProgress: protectedProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const progress = await ctx.db.query.userProgress.findMany({
        where: and(
          eq(userProgress.userId, ctx.user.id),
          // Join with lessons to filter by courseId
        ),
        with: {
          lesson: true,
        },
      });

      return progress;
    }),

  // Update lesson progress
  updateProgress: protectedProcedure
    .input(
      z.object({
        lessonId: z.string(),
        status: z.enum(['STARTED', 'IN_PROGRESS', 'COMPLETED']),
        durationSpent: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.userProgress.findFirst({
        where: and(
          eq(userProgress.userId, ctx.user.id),
          eq(userProgress.lessonId, input.lessonId)
        ),
      });

      if (existing) {
        const updated = await ctx.db
          .update(userProgress)
          .set({
            status: input.status,
            durationSpent: input.durationSpent ?? existing.durationSpent,
            completedAt: input.status === 'COMPLETED' ? new Date() : null,
            updatedAt: new Date(),
          })
          .where(eq(userProgress.id, existing.id))
          .returning();

        return updated[0];
      }

      const created = await ctx.db
        .insert(userProgress)
        .values({
          userId: ctx.user.id,
          lessonId: input.lessonId,
          status: input.status,
          durationSpent: input.durationSpent ?? 0,
        })
        .returning();

      return created[0];
    }),

  // Enroll in a course
  enroll: protectedProcedure
    .input(
      z.object({
        courseId: z.string().uuid(),
        locale: z.enum(['vi', 'en', 'zh']).optional().default('vi'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if already enrolled
      const existing = await ctx.db.query.enrollments.findFirst({
        where: and(
          eq(enrollments.userId, ctx.user.id),
          eq(enrollments.courseId, input.courseId)
        ),
      });

      if (existing) {
        return { success: true, alreadyEnrolled: true, enrollment: existing };
      }

      // Get course details for email
      const course = await ctx.db.query.courses.findFirst({
        where: eq(courses.id, input.courseId),
      });

      if (!course) {
        throw new Error('Course not found');
      }

      // Get user details
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.user.id),
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Create enrollment
      const [enrollment] = await ctx.db
        .insert(enrollments)
        .values({
          userId: ctx.user.id,
          courseId: input.courseId,
        })
        .returning();

      // Send confirmation email (async, don't block)
      const courseTitle = (course.title as Record<string, string>)?.[input.locale] || 
                          (course.title as Record<string, string>)?.vi || 
                          'Course';
      const userName = (user.name as Record<string, string>)?.[input.locale] || 
                       (user.name as Record<string, string>)?.vi || 
                       user.email.split('@')[0];

      sendEnrollmentEmail({
        to: user.email,
        userName,
        courseName: courseTitle,
        courseSlug: course.slug,
        locale: input.locale,
      }).then(async (result) => {
        if (result.success) {
          await ctx.db
            .update(enrollments)
            .set({ emailSentAt: new Date() })
            .where(eq(enrollments.id, enrollment.id));
        }
      });

      return { success: true, alreadyEnrolled: false, enrollment };
    }),

  // Get course roster (for teachers/admins)
  getRoster: protectedProcedure
    .input(
      z.object({
        courseId: z.string().uuid(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        search: z.string().optional(),
        status: z.enum(['all', 'completed', 'inProgress', 'notStarted']).default('all'),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        sortBy: z.enum(['enrolledAt', 'progress', 'lastActivity', 'name']).default('enrolledAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
      })
    )
    .query(async ({ ctx, input }) => {
      const { courseId, page, limit, search, status, dateFrom, dateTo, sortBy, sortOrder } = input;
      const offset = (page - 1) * limit;

      // Get course info
      const course = await ctx.db.query.courses.findFirst({
        where: eq(courses.id, courseId),
      });

      if (!course) {
        throw new Error('Course not found');
      }

      // Get total lessons for this course
      const lessonCountResult = await ctx.db
        .select({ count: count() })
        .from(lessons)
        .where(eq(lessons.courseId, courseId));
      const totalLessons = lessonCountResult[0]?.count || 0;

      // Build search condition
      const searchCondition = search
        ? or(
            like(users.email, `%${search}%`),
            sql`${users.name}->>'vi' ILIKE ${`%${search}%`}`,
            sql`${users.name}->>'en' ILIKE ${`%${search}%`}`
          )
        : undefined;

      // Build date range condition
      const dateConditions: ReturnType<typeof eq>[] = [];
      if (dateFrom) {
        dateConditions.push(sql`${enrollments.enrolledAt} >= ${new Date(dateFrom)}`);
      }
      if (dateTo) {
        dateConditions.push(sql`${enrollments.enrolledAt} <= ${new Date(dateTo + 'T23:59:59')}`);
      }

      // Build where conditions
      const whereConditions = [eq(enrollments.courseId, courseId)];
      if (searchCondition) whereConditions.push(searchCondition);
      if (dateConditions.length > 0) whereConditions.push(...dateConditions);

      // Get enrollments with user info
      const enrollmentQuery = ctx.db
        .select({
          enrollment: enrollments,
          user: users,
        })
        .from(enrollments)
        .innerJoin(users, eq(enrollments.userId, users.id))
        .where(and(...whereConditions))
        .limit(limit)
        .offset(offset);

      // Apply sorting
      const sortedQuery =
        sortBy === 'enrolledAt'
          ? enrollmentQuery.orderBy(sortOrder === 'desc' ? desc(enrollments.enrolledAt) : enrollments.enrolledAt)
          : sortBy === 'name'
            ? enrollmentQuery.orderBy(sortOrder === 'desc' ? desc(users.email) : users.email)
            : enrollmentQuery.orderBy(sortOrder === 'desc' ? desc(enrollments.enrolledAt) : enrollments.enrolledAt);

      const results = await sortedQuery;

      // Get progress for each student
      const allStudents = await Promise.all(
        results.map(async (row) => {
          // Get completed lessons count
          const progressResult = await ctx.db
            .select({
              completedCount: count(),
              lastActivity: sql<Date>`max(${userProgress.updatedAt})`,
            })
            .from(userProgress)
            .innerJoin(lessons, eq(userProgress.lessonId, lessons.id))
            .where(
              and(
                eq(userProgress.userId, row.user.id),
                eq(lessons.courseId, courseId),
                eq(userProgress.status, 'COMPLETED')
              )
            );

          const completedLessons = progressResult[0]?.completedCount || 0;
          const lastActivity = progressResult[0]?.lastActivity || row.enrollment.enrolledAt;
          const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

          const userName =
            (row.user.name as Record<string, string>)?.['vi'] ||
            (row.user.name as Record<string, string>)?.['en'] ||
            row.user.email.split('@')[0];

          // Determine student status
          const studentStatus: 'completed' | 'inProgress' | 'notStarted' =
            row.enrollment.completedAt !== null
              ? 'completed'
              : progress > 0
                ? 'inProgress'
                : 'notStarted';

          return {
            userId: row.user.id,
            name: userName,
            email: row.user.email,
            enrolledAt: row.enrollment.enrolledAt.toISOString(),
            progress,
            completedLessons,
            totalLessons,
            lastActivity: lastActivity instanceof Date ? lastActivity.toISOString() : new Date().toISOString(),
            completed: row.enrollment.completedAt !== null,
            status: studentStatus,
          };
        })
      );

      // Filter by status if not 'all'
      const students = status === 'all'
        ? allStudents
        : allStudents.filter((s) => s.status === status);

      // Get total count
      const totalResult = await ctx.db
        .select({ count: count() })
        .from(enrollments)
        .innerJoin(users, eq(enrollments.userId, users.id))
        .where(and(...whereConditions));
      const totalStudents = totalResult[0]?.count || 0;

      const courseTitle =
        (course.title as Record<string, string>)?.['vi'] ||
        (course.title as Record<string, string>)?.['en'] ||
        'Untitled';

      return {
        courseId,
        courseTitle,
        totalStudents,
        students,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalStudents / limit),
          limit,
          totalStudents,
        },
      };
    }),

  // Export roster to CSV
  exportRosterCsv: protectedProcedure
    .input(
      z.object({
        courseId: z.string().uuid(),
        locale: z.enum(['vi', 'en', 'zh']).default('vi'),
      })
    )
    .query(async ({ ctx, input }) => {
      const { courseId, locale } = input;

      // Get course
      const course = await ctx.db.query.courses.findFirst({
        where: eq(courses.id, courseId),
      });

      if (!course) {
        throw new Error('Course not found');
      }

      // Get total lessons
      const lessonCountResult = await ctx.db
        .select({ count: count() })
        .from(lessons)
        .where(eq(lessons.courseId, courseId));
      const totalLessons = lessonCountResult[0]?.count || 0;

      // Get all enrollments
      const allEnrollments = await ctx.db
        .select({
          enrollment: enrollments,
          user: users,
        })
        .from(enrollments)
        .innerJoin(users, eq(enrollments.userId, users.id))
        .where(eq(enrollments.courseId, courseId))
        .orderBy(desc(enrollments.enrolledAt));

      // Build CSV rows
      const headers = {
        vi: ['Tên', 'Email', 'Ngày đăng ký', 'Tiến độ (%)', 'Bài học hoàn thành', 'Tổng bài học', 'Trạng thái'],
        en: ['Name', 'Email', 'Enrolled Date', 'Progress (%)', 'Completed Lessons', 'Total Lessons', 'Status'],
        zh: ['姓名', '邮箱', '注册日期', '进度 (%)', '完成课程', '总课程', '状态'],
      };

      const statusLabels = {
        vi: { completed: 'Hoàn thành', inProgress: 'Đang học', notStarted: 'Chưa bắt đầu' },
        en: { completed: 'Completed', inProgress: 'In Progress', notStarted: 'Not Started' },
        zh: { completed: '已完成', inProgress: '进行中', notStarted: '未开始' },
      };

      const rows: string[][] = [headers[locale]];

      for (const row of allEnrollments) {
        // Get progress
        const progressResult = await ctx.db
          .select({ completedCount: count() })
          .from(userProgress)
          .innerJoin(lessons, eq(userProgress.lessonId, lessons.id))
          .where(
            and(
              eq(userProgress.userId, row.user.id),
              eq(lessons.courseId, courseId),
              eq(userProgress.status, 'COMPLETED')
            )
          );

        const completedLessons = progressResult[0]?.completedCount || 0;
        const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        const userName =
          (row.user.name as Record<string, string>)?.[locale] ||
          (row.user.name as Record<string, string>)?.['vi'] ||
          row.user.email.split('@')[0];

        const status =
          row.enrollment.completedAt !== null
            ? statusLabels[locale].completed
            : progress > 0
              ? statusLabels[locale].inProgress
              : statusLabels[locale].notStarted;

        rows.push([
          userName,
          row.user.email,
          row.enrollment.enrolledAt.toISOString().split('T')[0],
          String(progress),
          String(completedLessons),
          String(totalLessons),
          status,
        ]);
      }

      // Convert to CSV string
      const csvContent = rows
        .map((row) =>
          row.map((cell) => {
            // Escape quotes and wrap in quotes if contains comma
            const escaped = cell.replace(/"/g, '""');
            return escaped.includes(',') || escaped.includes('"') ? `"${escaped}"` : escaped;
          }).join(',')
        )
        .join('\n');

      const courseTitle =
        (course.title as Record<string, string>)?.[locale] ||
        (course.title as Record<string, string>)?.['vi'] ||
        'course';

      return {
        filename: `roster-${courseTitle.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`,
        content: csvContent,
        totalStudents: allEnrollments.length,
      };
    }),
});
