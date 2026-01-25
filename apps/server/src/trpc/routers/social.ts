import { z } from 'zod';
import { eq, desc, and } from 'drizzle-orm';

import { router, protectedProcedure } from '../trpc';
import { 
  buddyGroups, 
  buddyMembers, 
  socialPosts,
  userRelationships 
} from '../../../drizzle/schema';

export const socialRouter = router({
  // Get social feed
  feed: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const posts = await ctx.db.query.socialPosts.findMany({
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: desc(socialPosts.createdAt),
        limit: input.limit,
        offset: input.offset,
      });
      return posts;
    }),

  // Create post
  createPost: protectedProcedure
    .input(
      z.object({
        type: z.enum(['ACHIEVEMENT', 'MILESTONE', 'NUDGE', 'DISCUSSION']),
        content: z.record(z.string(), z.unknown()).optional(),
        groupId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [post] = await ctx.db
        .insert(socialPosts)
        .values({
          userId: ctx.user.id,
          type: input.type,
          content: input.content,
          groupId: input.groupId,
        })
        .returning();
      return post;
    }),

  // Get user's groups
  myGroups: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.db.query.buddyMembers.findMany({
      where: eq(buddyMembers.userId, ctx.user.id),
      with: {
        group: true,
      },
    });
    return memberships.map((m) => ({ ...m.group, role: m.role }));
  }),

  // Get group by ID
  getGroup: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const group = await ctx.db.query.buddyGroups.findFirst({
        where: eq(buddyGroups.id, input.id),
        with: {
          members: {
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  role: true,
                  points: true,
                },
              },
            },
          },
          feedPosts: {
            orderBy: desc(socialPosts.createdAt),
            limit: 20,
          },
        },
      });
      return group;
    }),

  // Join group
  joinGroup: protectedProcedure
    .input(z.object({ groupId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if already member
      const existing = await ctx.db.query.buddyMembers.findFirst({
        where: and(
          eq(buddyMembers.groupId, input.groupId),
          eq(buddyMembers.userId, ctx.user.id)
        ),
      });

      if (existing) {
        return existing;
      }

      const [member] = await ctx.db
        .insert(buddyMembers)
        .values({
          groupId: input.groupId,
          userId: ctx.user.id,
          role: 'MEMBER',
        })
        .returning();
      return member;
    }),

  // Leave group
  leaveGroup: protectedProcedure
    .input(z.object({ groupId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(buddyMembers)
        .where(
          and(
            eq(buddyMembers.groupId, input.groupId),
            eq(buddyMembers.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),

  // Follow user
  follow: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id) {
        throw new Error('Cannot follow yourself');
      }

      const existing = await ctx.db.query.userRelationships.findFirst({
        where: and(
          eq(userRelationships.followerId, ctx.user.id),
          eq(userRelationships.followedId, input.userId)
        ),
      });

      if (existing) {
        return existing;
      }

      const [relationship] = await ctx.db
        .insert(userRelationships)
        .values({
          followerId: ctx.user.id,
          followedId: input.userId,
          status: 'FOLLOWING',
        })
        .returning();
      return relationship;
    }),

  // Unfollow user
  unfollow: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(userRelationships)
        .where(
          and(
            eq(userRelationships.followerId, ctx.user.id),
            eq(userRelationships.followedId, input.userId)
          )
        );
      return { success: true };
    }),
});
