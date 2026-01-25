import { createTRPCReact, httpBatchLink } from '@trpc/react-query';
import { QueryClient } from '@tanstack/react-query';
import superjson from 'superjson';

import type { AppRouter } from './index';

// Create tRPC React hooks with generic type
export const api = createTRPCReact<AppRouter>();

// Create query client
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
      },
    },
  });
}

// Create tRPC client - returns untyped client for now
// Will be properly typed once server types are imported
export function createTRPCClient(baseUrl: string) {
  return api.createClient({
    links: [
      httpBatchLink({
        url: `${baseUrl}/trpc`,
        transformer: superjson,
        headers() {
          return {};
        },
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: 'include',
          });
        },
      }),
    ],
  });
}

export { api as trpc };
