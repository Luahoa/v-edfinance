import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';

import { auth } from '../lib/auth';
import { db } from '../lib/db';

export async function createContext({ req }: FetchCreateContextFnOptions) {
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

export type Context = Awaited<ReturnType<typeof createContext>>;
