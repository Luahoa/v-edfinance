// Edge-compatible better-auth configuration
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import { createEdgeDb } from './db-edge';
import * as schema from '../../drizzle/schema';

interface EdgeEnv {
  DATABASE_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  BETTER_AUTH_SECRET: string;
}

export function createEdgeAuth(env: EdgeEnv) {
  const db = createEdgeDb(env.DATABASE_URL);

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: {
        user: schema.authUsers,
        session: schema.authSessions,
        account: schema.authAccounts,
        verification: schema.authVerifications,
      },
    }),
    secret: env.BETTER_AUTH_SECRET,
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5, // 5 minutes
      },
    },
    trustedOrigins: ['http://localhost:3000', 'https://vedfinance.com', 'https://hocchungkhoan.com.vn', 'https://www.hocchungkhoan.com.vn'],
  });
}

export type EdgeAuth = ReturnType<typeof createEdgeAuth>;
