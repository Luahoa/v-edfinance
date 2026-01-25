import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';

import { router, protectedProcedure } from '../trpc';
import { chatThreads, chatMessages } from '../../../drizzle/schema';

export const aiRouter = router({
  // List user's chat threads
  listThreads: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const threads = await ctx.db.query.chatThreads.findMany({
        where: eq(chatThreads.userId, ctx.user.id),
        limit: input.limit,
        offset: input.offset,
        orderBy: desc(chatThreads.updatedAt),
      });

      return threads;
    }),

  // Get thread with messages
  getThread: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const thread = await ctx.db.query.chatThreads.findFirst({
        where: and(
          eq(chatThreads.id, input.id),
          eq(chatThreads.userId, ctx.user.id)
        ),
        with: {
          messages: {
            orderBy: chatMessages.createdAt,
          },
        },
      });

      return thread;
    }),

  // Create new chat thread
  createThread: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        module: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const created = await ctx.db
        .insert(chatThreads)
        .values({
          userId: ctx.user.id,
          title: input.title,
          module: input.module,
        })
        .returning();

      return created[0];
    }),

  // Send message to thread
  sendMessage: protectedProcedure
    .input(
      z.object({
        threadId: z.string().uuid(),
        content: z.string().min(1),
        metadata: z.record(z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify thread ownership
      const thread = await ctx.db.query.chatThreads.findFirst({
        where: and(
          eq(chatThreads.id, input.threadId),
          eq(chatThreads.userId, ctx.user.id)
        ),
      });

      if (!thread) {
        throw new Error('Thread not found');
      }

      // Create user message
      const message = await ctx.db
        .insert(chatMessages)
        .values({
          threadId: input.threadId,
          role: 'USER',
          content: input.content,
          metadata: input.metadata,
        })
        .returning();

      // Update thread's updatedAt
      await ctx.db
        .update(chatThreads)
        .set({ updatedAt: new Date() })
        .where(eq(chatThreads.id, input.threadId));

      return message[0];
    }),

  // Delete thread
  deleteThread: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const thread = await ctx.db.query.chatThreads.findFirst({
        where: and(
          eq(chatThreads.id, input.id),
          eq(chatThreads.userId, ctx.user.id)
        ),
      });

      if (!thread) {
        throw new Error('Thread not found');
      }

      // Delete messages first (cascade should handle this but being explicit)
      await ctx.db
        .delete(chatMessages)
        .where(eq(chatMessages.threadId, input.id));

      // Delete thread
      await ctx.db.delete(chatThreads).where(eq(chatThreads.id, input.id));

      return { success: true };
    }),
});
