import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

// TODO: Create notifications table in drizzle/schema.ts with columns:
// - id (uuid, primary key)
// - userId (uuid, foreign key to users)
// - type (enum: 'achievement', 'course', 'social', 'system')
// - title (jsonb for i18n)
// - message (jsonb for i18n)
// - isRead (boolean, default false)
// - data (jsonb for additional metadata)
// - createdAt (timestamp)

export const notificationRouter = router({
  // TODO: Query notifications table filtered by ctx.user.id
  list: protectedProcedure.query(async () => {
    return [];
  }),

  // TODO: Update notification isRead = true where id = input.notificationId AND userId = ctx.user.id
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.string().uuid() }))
    .mutation(async () => {
      return { success: true };
    }),

  // TODO: Update all notifications isRead = true where userId = ctx.user.id
  markAllRead: protectedProcedure.mutation(async () => {
    return { success: true, count: 0 };
  }),

  // TODO: Count notifications where userId = ctx.user.id AND isRead = false
  getUnreadCount: protectedProcedure.query(async () => {
    return { count: 0 };
  }),
});
