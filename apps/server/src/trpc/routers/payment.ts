import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';

import { router, protectedProcedure } from '../trpc';
import { transactions, courses } from '../../../drizzle/schema';

export const paymentRouter = router({
  // List user's transactions
  listTransactions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
        status: z
          .enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED'])
          .optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const whereConditions = [eq(transactions.userId, ctx.user.id)];

      if (input.status) {
        whereConditions.push(eq(transactions.status, input.status));
      }

      const result = await ctx.db.query.transactions.findMany({
        where: and(...whereConditions),
        limit: input.limit,
        offset: input.offset,
        orderBy: desc(transactions.createdAt),
        with: {
          course: true,
        },
      });

      return result;
    }),

  // Get transaction by ID
  getTransaction: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const transaction = await ctx.db.query.transactions.findFirst({
        where: and(
          eq(transactions.id, input.id),
          eq(transactions.userId, ctx.user.id)
        ),
        with: {
          course: true,
        },
      });

      return transaction;
    }),

  // Create checkout session for course purchase
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        courseId: z.string().uuid(),
        currency: z.string().default('vnd'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get course details
      const course = await ctx.db.query.courses.findFirst({
        where: eq(courses.id, input.courseId),
      });

      if (!course) {
        throw new Error('Course not found');
      }

      // Check if already purchased
      const existing = await ctx.db.query.transactions.findFirst({
        where: and(
          eq(transactions.userId, ctx.user.id),
          eq(transactions.courseId, input.courseId),
          eq(transactions.status, 'COMPLETED')
        ),
      });

      if (existing) {
        throw new Error('Course already purchased');
      }

      // Create pending transaction
      const transaction = await ctx.db
        .insert(transactions)
        .values({
          userId: ctx.user.id,
          courseId: input.courseId,
          amount: course.price,
          currency: input.currency,
          status: 'PENDING',
          type: 'COURSE_PURCHASE',
        })
        .returning();

      // TODO: Integrate with Stripe/Polar to create actual checkout session
      // For now, return placeholder
      return {
        transactionId: transaction[0].id,
        sessionUrl: `/checkout/${transaction[0].id}`,
        amount: course.price,
        currency: input.currency,
      };
    }),

  // Check if user purchased a course
  getTransactionByCourse: protectedProcedure
    .input(z.object({ courseId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const transaction = await ctx.db.query.transactions.findFirst({
        where: and(
          eq(transactions.userId, ctx.user.id),
          eq(transactions.courseId, input.courseId),
          eq(transactions.status, 'COMPLETED')
        ),
      });

      return {
        purchased: !!transaction,
        transaction,
      };
    }),

  // Complete transaction (webhook handler helper)
  completeTransaction: protectedProcedure
    .input(
      z.object({
        transactionId: z.string().uuid(),
        stripePaymentIntentId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db
        .update(transactions)
        .set({
          status: 'COMPLETED',
          stripePaymentIntentId: input.stripePaymentIntentId,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(transactions.id, input.transactionId),
            eq(transactions.userId, ctx.user.id)
          )
        )
        .returning();

      return updated[0];
    }),
});
