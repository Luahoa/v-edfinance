import { z } from 'zod';
import { eq, desc, and, sql } from 'drizzle-orm';

import { router, protectedProcedure, publicProcedure } from '../trpc';
import { users, userStreaks, userAchievements, achievements } from '../../../drizzle/schema';

export const gamificationRouter = router({
  // Get leaderboard
  leaderboard: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        period: z.enum(['all', 'weekly', 'monthly']).default('all'),
      })
    )
    .query(async ({ ctx, input }) => {
      const topUsers = await ctx.db.query.users.findMany({
        columns: {
          id: true,
          name: true,
          points: true,
          role: true,
        },
        orderBy: desc(users.points),
        limit: input.limit,
      });
      return topUsers;
    }),

  // Get user's streak
  getStreak: protectedProcedure.query(async ({ ctx }) => {
    const streak = await ctx.db.query.userStreaks.findFirst({
      where: eq(userStreaks.userId, ctx.user.id),
    });
    return streak || { currentStreak: 0, longestStreak: 0, lastActivityDate: null };
  }),

  // Update streak (called on daily activity)
  updateStreak: protectedProcedure.mutation(async ({ ctx }) => {
    const existing = await ctx.db.query.userStreaks.findFirst({
      where: eq(userStreaks.userId, ctx.user.id),
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (existing) {
      const lastActivity = existing.lastActivityDate
        ? new Date(existing.lastActivityDate)
        : null;
      
      if (lastActivity) {
        lastActivity.setHours(0, 0, 0, 0);
        const diffDays = Math.floor(
          (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 0) {
          // Already logged today
          return existing;
        }

        if (diffDays === 1) {
          // Consecutive day - increment streak
          const newStreak = existing.currentStreak + 1;
          const [updated] = await ctx.db
            .update(userStreaks)
            .set({
              currentStreak: newStreak,
              longestStreak: Math.max(newStreak, existing.longestStreak),
              lastActivityDate: today,
              updatedAt: new Date(),
            })
            .where(eq(userStreaks.id, existing.id))
            .returning();
          return updated;
        }

        // Streak broken - reset to 1
        const [updated] = await ctx.db
          .update(userStreaks)
          .set({
            currentStreak: 1,
            lastActivityDate: today,
            updatedAt: new Date(),
          })
          .where(eq(userStreaks.id, existing.id))
          .returning();
        return updated;
      }
    }

    // First activity ever
    const [created] = await ctx.db
      .insert(userStreaks)
      .values({
        userId: ctx.user.id,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: today,
      })
      .returning();
    return created;
  }),

  // Get user's achievements
  getAchievements: protectedProcedure.query(async ({ ctx }) => {
    const userAchievementsList = await ctx.db.query.userAchievements.findMany({
      where: eq(userAchievements.userId, ctx.user.id),
    });
    return userAchievementsList;
  }),

  // Add points to user
  addPoints: protectedProcedure
    .input(
      z.object({
        points: z.number().min(1).max(1000),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(users)
        .set({
          points: sql`${users.points} + ${input.points}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id))
        .returning();
      return updated;
    }),
});
