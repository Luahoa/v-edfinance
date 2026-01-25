import { z } from 'zod';
import { eq, and, asc } from 'drizzle-orm';

import { router, publicProcedure, protectedProcedure } from '../trpc';
import { lessons, courses, userProgress } from '../../../drizzle/schema';

export const lessonRouter = router({
  // Get lesson by ID with course info
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const lesson = await ctx.db.query.lessons.findFirst({
        where: eq(lessons.id, input.id),
        with: {
          course: true,
        },
      });

      return lesson;
    }),

  // List lessons for a course
  getByCourse: publicProcedure
    .input(z.object({ courseId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query.lessons.findMany({
        where: and(
          eq(lessons.courseId, input.courseId),
          eq(lessons.published, true)
        ),
        orderBy: asc(lessons.order),
      });

      return result;
    }),

  // Get user's progress for a lesson
  getProgress: protectedProcedure
    .input(z.object({ lessonId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const progress = await ctx.db.query.userProgress.findFirst({
        where: and(
          eq(userProgress.userId, ctx.user.id),
          eq(userProgress.lessonId, input.lessonId)
        ),
      });

      return progress;
    }),

  // Mark lesson as completed
  markComplete: protectedProcedure
    .input(z.object({ lessonId: z.string().uuid() }))
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
            status: 'COMPLETED',
            completedAt: new Date(),
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
          status: 'COMPLETED',
          completedAt: new Date(),
        })
        .returning();

      return created[0];
    }),

  // Update watch time
  updateWatchTime: protectedProcedure
    .input(
      z.object({
        lessonId: z.string().uuid(),
        durationSpent: z.number().min(0),
        progressPercentage: z.number().min(0).max(100).optional(),
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
            durationSpent: input.durationSpent,
            progressPercentage: input.progressPercentage ?? existing.progressPercentage,
            status: existing.status === 'STARTED' ? 'IN_PROGRESS' : existing.status,
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
          durationSpent: input.durationSpent,
          progressPercentage: input.progressPercentage ?? 0,
          status: 'IN_PROGRESS',
        })
        .returning();

      return created[0];
    }),
});
