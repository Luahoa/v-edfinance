// src/client.ts
import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
import { QueryClient } from "@tanstack/react-query";
import superjson from "superjson";
var api = createTRPCReact();
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1e3 * 60 * 5,
        // 5 minutes
        refetchOnWindowFocus: false
      }
    }
  });
}
function createTRPCClient(baseUrl) {
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
            credentials: "include"
          });
        }
      })
    ]
  });
}
export {
  api,
  createQueryClient,
  createTRPCClient,
  api as trpc
};
