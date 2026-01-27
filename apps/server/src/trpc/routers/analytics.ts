import { z } from 'zod';
import { eq, and, desc, gte, sql, count } from 'drizzle-orm';
import { router, protectedProcedure } from '../trpc';
import { behaviorLogs, userProgress, userStreaks, lessons, courses } from '../../../drizzle/schema';

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

  // Get time spent per lesson (for chart)
  getTimeSpentPerLesson: protectedProcedure
    .input(
      z.object({
        courseId: z.string().uuid().optional(),
        limit: z.number().min(1).max(20).default(10),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 10;
      
      const query = ctx.db
        .select({
          lessonId: userProgress.lessonId,
          lessonTitle: lessons.title,
          courseTitle: courses.title,
          timeSpent: sql<number>`coalesce(${userProgress.durationSpent}, 0)`,
          progressPercentage: userProgress.progressPercentage,
        })
        .from(userProgress)
        .innerJoin(lessons, eq(userProgress.lessonId, lessons.id))
        .innerJoin(courses, eq(lessons.courseId, courses.id))
        .where(eq(userProgress.userId, ctx.user.id))
        .orderBy(desc(userProgress.updatedAt))
        .limit(limit);

      const results = await query;
      
      return results.map((r) => ({
        lessonId: r.lessonId,
        lessonTitle: (r.lessonTitle as Record<string, string>)?.['vi'] || 
                     (r.lessonTitle as Record<string, string>)?.['en'] || 
                     'Untitled',
        courseTitle: (r.courseTitle as Record<string, string>)?.['vi'] || 
                     (r.courseTitle as Record<string, string>)?.['en'] || 
                     'Untitled',
        timeSpent: Number(r.timeSpent),
        progressPercentage: r.progressPercentage ?? 0,
      }));
    }),

  // Get completion trend over time (last 7/14/30 days)
  getCompletionTrend: protectedProcedure
    .input(
      z.object({
        days: z.number().min(7).max(90).default(7),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const days = input?.days ?? 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const results = await ctx.db
        .select({
          date: sql<string>`date_trunc('day', ${userProgress.completedAt})::date`,
          completedCount: count(),
        })
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, ctx.user.id),
            eq(userProgress.status, 'COMPLETED'),
            gte(userProgress.completedAt, startDate)
          )
        )
        .groupBy(sql`date_trunc('day', ${userProgress.completedAt})::date`)
        .orderBy(sql`date_trunc('day', ${userProgress.completedAt})::date`);

      // Fill in missing days with 0 completions
      const trendData: Array<{ date: string; completed: number }> = [];
      const dateMap = new Map(results.map(r => [r.date, Number(r.completedCount)]));
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        trendData.push({
          date: dateStr,
          completed: dateMap.get(dateStr) ?? 0,
        });
      }
      
      return trendData;
    }),

  // Get engagement summary (completion rate, avg time, etc.)
  getEngagementSummary: protectedProcedure.query(async ({ ctx }) => {
    const stats = await ctx.db
      .select({
        total: count(),
        completed: sql<number>`count(*) filter (where ${userProgress.status} = 'COMPLETED')`,
        totalTime: sql<number>`coalesce(sum(${userProgress.durationSpent}), 0)`,
        avgProgress: sql<number>`coalesce(avg(${userProgress.progressPercentage}), 0)`,
      })
      .from(userProgress)
      .where(eq(userProgress.userId, ctx.user.id));

    const result = stats[0] ?? { total: 0, completed: 0, totalTime: 0, avgProgress: 0 };
    const completionRate = result.total > 0 
      ? Math.round((Number(result.completed) / Number(result.total)) * 100) 
      : 0;

    return {
      totalLessons: Number(result.total),
      completedLessons: Number(result.completed),
      completionRate,
      totalTimeMinutes: Math.round(Number(result.totalTime) / 60),
      avgProgress: Math.round(Number(result.avgProgress)),
    };
  }),
});
