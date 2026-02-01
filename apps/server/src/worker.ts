// Cloudflare Workers entry point
// Uses Neon serverless driver for edge-compatible PostgreSQL

import { trpcServer } from '@hono/trpc-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { appRouter } from './trpc/router';
import { createEdgeContext } from './trpc/context-edge';
import { createEdgeAuth } from './lib/auth-edge';

export interface Env {
  DATABASE_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  BETTER_AUTH_SECRET: string;
  RESEND_API_KEY: string;
  APP_URL?: string;
}

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', 'https://vedfinance.com', 'https://hocchungkhoan.com.vn', 'https://www.hocchungkhoan.com.vn'],
    credentials: true,
  })
);

// Health check
app.get('/health', (c) =>
  c.json({
    status: 'ok',
    runtime: 'cloudflare-workers',
    timestamp: new Date().toISOString(),
  })
);

// better-auth routes (edge version)
app.on(['GET', 'POST'], '/api/auth/**', async (c) => {
  try {
    const auth = createEdgeAuth(c.env);
    const response = await auth.handler(c.req.raw);
    return response;
  } catch (error) {
    console.error('Auth error:', error);
    return c.json({ error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined }, 500);
  }
});

// tRPC routes
app.use('/trpc/*', async (c, next) => {
  const handler = trpcServer({
    router: appRouter,
    createContext: (opts) => createEdgeContext(opts, c.env),
  });
  return handler(c, next);
});

export default app;
