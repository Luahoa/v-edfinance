import { z } from 'zod';
import { eq, and, desc, sql, gte, lt, sum, count } from 'drizzle-orm';

import { router, protectedProcedure } from '../trpc';
import { transactions, courses, users } from '../../../drizzle/schema';

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

  // ============================================================================
  // TEACHER REVENUE DASHBOARD
  // ============================================================================

  // Get revenue stats for teacher
  getRevenueStats: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get courses owned by this teacher
    const teacherCourses = await ctx.db.query.courses.findMany({
      where: eq(courses.instructorId, ctx.user.id),
      columns: { id: true },
    });

    if (teacherCourses.length === 0) {
      return {
        totalEarnings: 0,
        thisMonth: 0,
        lastMonth: 0,
        courseCount: 0,
      };
    }

    const courseIds = teacherCourses.map(c => c.id);

    // Total earnings (all time, completed transactions)
    const totalResult = await ctx.db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          sql`${transactions.courseId} IN ${courseIds}`,
          eq(transactions.status, 'COMPLETED')
        )
      );

    // This month earnings
    const thisMonthResult = await ctx.db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          sql`${transactions.courseId} IN ${courseIds}`,
          eq(transactions.status, 'COMPLETED'),
          gte(transactions.completedAt, thisMonthStart)
        )
      );

    // Last month earnings
    const lastMonthResult = await ctx.db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          sql`${transactions.courseId} IN ${courseIds}`,
          eq(transactions.status, 'COMPLETED'),
          gte(transactions.completedAt, lastMonthStart),
          lt(transactions.completedAt, thisMonthStart)
        )
      );

    return {
      totalEarnings: Number(totalResult[0]?.total) || 0,
      thisMonth: Number(thisMonthResult[0]?.total) || 0,
      lastMonth: Number(lastMonthResult[0]?.total) || 0,
      courseCount: teacherCourses.length,
    };
  }),

  // Get revenue by course
  getRevenueByCourse: protectedProcedure.query(async ({ ctx }) => {
    const teacherCourses = await ctx.db.query.courses.findMany({
      where: eq(courses.instructorId, ctx.user.id),
    });

    if (teacherCourses.length === 0) {
      return [];
    }

    const result = await Promise.all(
      teacherCourses.map(async (course) => {
        const stats = await ctx.db
          .select({
            sales: count(transactions.id),
            revenue: sum(transactions.amount),
          })
          .from(transactions)
          .where(
            and(
              eq(transactions.courseId, course.id),
              eq(transactions.status, 'COMPLETED')
            )
          );

        return {
          courseId: course.id,
          courseTitle: course.title,
          sales: Number(stats[0]?.sales) || 0,
          revenue: Number(stats[0]?.revenue) || 0,
        };
      })
    );

    return result.sort((a, b) => b.revenue - a.revenue);
  }),

  // Get recent transactions for teacher's courses
  getRecentTransactions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 10;

      const teacherCourses = await ctx.db.query.courses.findMany({
        where: eq(courses.instructorId, ctx.user.id),
        columns: { id: true },
      });

      if (teacherCourses.length === 0) {
        return [];
      }

      const courseIds = teacherCourses.map(c => c.id);

      const recentTxs = await ctx.db.query.transactions.findMany({
        where: and(
          sql`${transactions.courseId} IN ${courseIds}`,
          eq(transactions.status, 'COMPLETED')
        ),
        orderBy: desc(transactions.completedAt),
        limit,
        with: {
          course: true,
          user: {
            columns: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      return recentTxs.map(tx => ({
        id: tx.id,
        courseTitle: tx.course?.title,
        amount: tx.amount,
        currency: tx.currency,
        date: tx.completedAt,
        studentName: tx.user?.name,
        studentEmail: tx.user?.email,
      }));
    }),
});
