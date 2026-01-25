import { z } from 'zod';
import { eq, and, desc, gte, sql } from 'drizzle-orm';
import { router, protectedProcedure } from '../trpc';
import { behaviorLogs, userProgress, userStreaks } from '../../../drizzle/schema';

export const analyticsRouter = router({
  // Create behavior log entry
  logEvent: protectedProcedure
    .input(
      z.object({
        action: z.string(),
        metadata: z.record(z.unknown()).optional(),
        module: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const created = await ctx.db
        .insert(behaviorLogs)
        .values({
          userId: ctx.user.id,
          sessionId: crypto.randomUUID(),
          path: input.module ?? '/',
          eventType: input.action,
          actionCategory: input.module,
          payload: input.metadata,
        })
        .returning();

      return created[0];
    }),

  // Get user's recent behavior logs
  getRecentActivity: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(50),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;

      const logs = await ctx.db.query.behaviorLogs.findMany({
        where: eq(behaviorLogs.userId, ctx.user.id),
        orderBy: desc(behaviorLogs.timestamp),
        limit,
      });

      return logs;
    }),

  // Get aggregated learning stats
  getLearningStats: protectedProcedure.query(async ({ ctx }) => {
    const progressRows = await ctx.db
      .select({
        lessonsCompleted: sql<number>`count(*) filter (where ${userProgress.status} = 'COMPLETED')`,
        totalTimeSpent: sql<number>`coalesce(sum(${userProgress.durationSpent}), 0)`,
        lessonsStarted: sql<number>`count(*)`,
      })
      .from(userProgress)
      .where(eq(userProgress.userId, ctx.user.id));

    const stats = progressRows[0] ?? {
      lessonsCompleted: 0,
      totalTimeSpent: 0,
      lessonsStarted: 0,
    };

    return {
      lessonsCompleted: Number(stats.lessonsCompleted),
      totalTimeSpent: Number(stats.totalTimeSpent),
      lessonsStarted: Number(stats.lessonsStarted),
    };
  }),

  // Get current learning streak
  getStreak: protectedProcedure.query(async ({ ctx }) => {
    const streak = await ctx.db.query.userStreaks.findFirst({
      where: eq(userStreaks.userId, ctx.user.id),
    });

    if (!streak) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
      };
    }

    return {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastActivityDate: streak.lastActivityDate,
    };
  }),
});
