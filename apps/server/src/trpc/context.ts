import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';

import { auth } from '../lib/auth';
import { db } from '../lib/db';
import { sendEnrollmentEmail } from '../lib/email';

// Create email service wrapper to match edge interface
const emailService = {
  sendEnrollmentEmail,
};

export async function createContext({ req }: FetchCreateContextFnOptions) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  return {
    db,
    session: session?.session ?? null,
    user: session?.user ?? null,
    email: emailService,
    req,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
