import { z } from 'zod';
import { eq, sql } from 'drizzle-orm';

import { router, publicProcedure, protectedProcedure } from '../trpc';
import { users, userProgress, userStreaks } from '../../../drizzle/schema';

export const userRouter = router({
  // Test database connection
  testDb: publicProcedure.query(async ({ ctx }) => {
    try {
      const count = await ctx.db.select({ count: sql<number>`count(*)` }).from(users);
      return { success: true, userCount: count[0]?.count ?? 0 };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }),

  // Get current user profile
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.user.id),
    });
    return user;
  }),

  // Get user by ID (public)
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, input.id),
        columns: {
          id: true,
          name: true,
          role: true,
          points: true,
          createdAt: true,
        },
      });
      return user;
    }),

  // Update profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.record(z.string(), z.string()).optional(),
        preferredLocale: z.enum(['vi', 'en', 'zh']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db
        .update(users)
        .set({
          ...(input.name && { name: input.name }),
          ...(input.preferredLocale && { preferredLocale: input.preferredLocale }),
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id))
        .returning();

      return updated[0];
    }),

  // Get dashboard stats
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.user.id),
      columns: { points: true },
    });

    const progressStats = await ctx.db
      .select({
        enrolledCoursesCount: sql<number>`count(distinct ${userProgress.lessonId})`,
        completedLessonsCount: sql<number>`count(*) filter (where ${userProgress.status} = 'COMPLETED')`,
      })
      .from(userProgress)
      .where(eq(userProgress.userId, ctx.user.id));

    const streak = await ctx.db.query.userStreaks.findFirst({
      where: eq(userStreaks.userId, ctx.user.id),
    });

    return {
      enrolledCoursesCount: Number(progressStats[0]?.enrolledCoursesCount ?? 0),
      completedLessonsCount: Number(progressStats[0]?.completedLessonsCount ?? 0),
      points: user?.points ?? 0,
      streak: streak?.currentStreak ?? 0,
    };
  }),
});
