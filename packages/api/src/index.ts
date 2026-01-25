// Router type placeholder - will be properly typed via build pipeline
// The actual AppRouter type comes from apps/server after it's built
// During development, import directly from apps/server/src/trpc/router

// For now, export a base router type that satisfies tRPC constraints
import type { AnyRouter } from '@trpc/server';

// AppRouter is the root tRPC router from the server
// This type will be replaced by the actual router type in production builds
export type AppRouter = AnyRouter;
