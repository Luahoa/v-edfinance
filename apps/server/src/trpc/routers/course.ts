import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';

import { router, publicProcedure, protectedProcedure } from '../trpc';
import { courses, lessons, userProgress } from '../../../drizzle/schema';

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
});
