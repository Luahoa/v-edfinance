import { z } from 'zod';
import { eq } from 'drizzle-orm';

import { router, publicProcedure, protectedProcedure } from '../trpc';
import { users } from '../../../drizzle/schema';

export const userRouter = router({
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
});
