// Edge-compatible tRPC context
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';

import { createEdgeAuth } from '../lib/auth-edge';
import { createEdgeDb } from '../lib/db-edge';

interface EdgeEnv {
  DATABASE_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  BETTER_AUTH_SECRET: string;
}

export async function createEdgeContext(
  { req }: FetchCreateContextFnOptions,
  env: EdgeEnv
) {
  const db = createEdgeDb(env.DATABASE_URL);
  const auth = createEdgeAuth(env);

  const session = await auth.api.getSession({
    headers: req.headers,
  });

  return {
    db,
    session: session?.session ?? null,
    user: session?.user ?? null,
    req,
  };
}

export type EdgeContext = Awaited<ReturnType<typeof createEdgeContext>>;
