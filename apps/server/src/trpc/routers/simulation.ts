import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';

import { router, publicProcedure, protectedProcedure } from '../trpc';
import { simulationScenarios, simulationCommitments, virtualPortfolios } from '../../../drizzle/schema';

export const simulationRouter = router({
  // List simulation scenarios
  listScenarios: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query.simulationScenarios.findMany({
        limit: input.limit,
        offset: input.offset,
        orderBy: desc(simulationScenarios.createdAt),
      });

      return result;
    }),

  // Get scenario by ID with commitments
  getScenario: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const scenario = await ctx.db.query.simulationScenarios.findFirst({
        where: eq(simulationScenarios.id, input.id),
        with: {
          commitments: {
            orderBy: desc(simulationCommitments.createdAt),
          },
        },
      });

      return scenario;
    }),

  // User commits to a scenario decision
  createCommitment: protectedProcedure
    .input(
      z.object({
        scenarioId: z.string().uuid(),
        commitment: z.string().min(1).max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const scenario = await ctx.db.query.simulationScenarios.findFirst({
        where: eq(simulationScenarios.id, input.scenarioId),
      });

      if (!scenario) {
        throw new Error('Scenario not found');
      }

      const created = await ctx.db
        .insert(simulationCommitments)
        .values({
          userId: ctx.user.id,
          scenarioId: input.scenarioId,
          commitment: input.commitment,
        })
        .returning();

      return created[0];
    }),

  // Get user's virtual portfolio
  getPortfolio: protectedProcedure.query(async ({ ctx }) => {
    const portfolio = await ctx.db.query.virtualPortfolios.findFirst({
      where: eq(virtualPortfolios.userId, ctx.user.id),
    });

    if (!portfolio) {
      // Create default portfolio if none exists
      const created = await ctx.db
        .insert(virtualPortfolios)
        .values({
          userId: ctx.user.id,
          balance: 10000000,
          holdings: [],
          transactions: [],
        })
        .returning();

      return created[0];
    }

    return portfolio;
  }),

  // Update portfolio after simulation
  updatePortfolio: protectedProcedure
    .input(
      z.object({
        balance: z.number().optional(),
        holdings: z.array(z.record(z.unknown())).optional(),
        transactions: z.array(z.record(z.unknown())).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.virtualPortfolios.findFirst({
        where: eq(virtualPortfolios.userId, ctx.user.id),
      });

      if (!existing) {
        const created = await ctx.db
          .insert(virtualPortfolios)
          .values({
            userId: ctx.user.id,
            balance: input.balance ?? 10000000,
            holdings: input.holdings ?? [],
            transactions: input.transactions ?? [],
          })
          .returning();

        return created[0];
      }

      const updated = await ctx.db
        .update(virtualPortfolios)
        .set({
          balance: input.balance ?? existing.balance,
          holdings: input.holdings ?? existing.holdings,
          transactions: input.transactions ?? existing.transactions,
          updatedAt: new Date(),
        })
        .where(eq(virtualPortfolios.id, existing.id))
        .returning();

      return updated[0];
    }),
});
