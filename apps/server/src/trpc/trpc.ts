import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';

import type { Context } from './context';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof Error ? error.cause.message : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

// Type for roles from schema
type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';

// Protected procedure - requires authenticated session
// IMPORTANT: Spread ctx to preserve db, email, req for downstream routers
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.user,
    },
  });
});

// Role-protected procedure factory - requires specific roles
export const roleProtectedProcedure = (allowedRoles: UserRole[]) =>
  protectedProcedure.use(async ({ ctx, next }) => {
    // Fetch user from app's User table to get role
    // Note: better-auth user.id is text, app User.id is UUID
    // We need to match by email since that's the shared identifier
    const { users } = await import('../../drizzle/schema');
    const { eq } = await import('drizzle-orm');
    
    const appUser = await ctx.db.query.users.findFirst({
      where: eq(users.email, ctx.user.email),
    });

    if (!appUser) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User profile not found',
      });
    }

    if (!allowedRoles.includes(appUser.role as UserRole)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
      });
    }

    return next({
      ctx: {
        ...ctx,
        appUser, // Include the app user with role for downstream use
      },
    });
  });

// Convenience exports for common role combinations
export const teacherProcedure = roleProtectedProcedure(['TEACHER', 'ADMIN']);
export const adminProcedure = roleProtectedProcedure(['ADMIN']);
