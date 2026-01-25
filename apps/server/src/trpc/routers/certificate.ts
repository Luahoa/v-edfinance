import { z } from 'zod';
import { eq, desc, and } from 'drizzle-orm';

import { router, protectedProcedure } from '../trpc';
import { certificates, courses, userProgress, lessons } from '../../../drizzle/schema';

export const certificateRouter = router({
  // Get user's certificates
  list: protectedProcedure.query(async ({ ctx }) => {
    const userCertificates = await ctx.db.query.certificates.findMany({
      where: eq(certificates.userId, ctx.user.id),
      with: {
        course: true,
      },
      orderBy: desc(certificates.completedAt),
    });
    return userCertificates;
  }),

  // Get certificate by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const certificate = await ctx.db.query.certificates.findFirst({
        where: and(
          eq(certificates.id, input.id),
          eq(certificates.userId, ctx.user.id)
        ),
        with: {
          course: true,
        },
      });
      return certificate;
    }),

  // Check eligibility for course certificate
  checkEligibility: protectedProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get course with lessons
      const course = await ctx.db.query.courses.findFirst({
        where: eq(courses.id, input.courseId),
        with: {
          lessons: {
            where: eq(lessons.published, true),
          },
        },
      });

      if (!course) {
        return { eligible: false, reason: 'Course not found' };
      }

      // Check if already has certificate
      const existingCert = await ctx.db.query.certificates.findFirst({
        where: and(
          eq(certificates.userId, ctx.user.id),
          eq(certificates.courseId, input.courseId)
        ),
      });

      if (existingCert) {
        return { eligible: false, reason: 'Certificate already issued', certificate: existingCert };
      }

      // Check lesson completion
      const lessonIds = course.lessons.map((l) => l.id);
      const progress = await ctx.db.query.userProgress.findMany({
        where: and(
          eq(userProgress.userId, ctx.user.id),
          eq(userProgress.status, 'COMPLETED')
        ),
      });

      const completedLessonIds = new Set(progress.map((p) => p.lessonId));
      const allCompleted = lessonIds.every((id) => completedLessonIds.has(id));

      if (!allCompleted) {
        const completedCount = lessonIds.filter((id) => completedLessonIds.has(id)).length;
        return {
          eligible: false,
          reason: `Complete all lessons first (${completedCount}/${lessonIds.length})`,
          progress: {
            completed: completedCount,
            total: lessonIds.length,
          },
        };
      }

      return { eligible: true };
    }),

  // Generate certificate
  generate: protectedProcedure
    .input(z.object({ courseId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify eligibility first
      const course = await ctx.db.query.courses.findFirst({
        where: eq(courses.id, input.courseId),
      });

      if (!course) {
        throw new Error('Course not found');
      }

      // Check if already has certificate
      const existingCert = await ctx.db.query.certificates.findFirst({
        where: and(
          eq(certificates.userId, ctx.user.id),
          eq(certificates.courseId, input.courseId)
        ),
      });

      if (existingCert) {
        return existingCert;
      }

      // Get user info
      const user = await ctx.db.query.users.findFirst({
        where: eq(ctx.db.users.id, ctx.user.id),
      });

      // Create certificate
      const [certificate] = await ctx.db
        .insert(certificates)
        .values({
          userId: ctx.user.id,
          courseId: input.courseId,
          studentName: user?.name || { vi: 'Học viên', en: 'Student', zh: '学生' },
          courseTitle: course.title,
          completedAt: new Date(),
        })
        .returning();

      return certificate;
    }),
});
