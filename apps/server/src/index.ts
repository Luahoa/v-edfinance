import { serve } from '@hono/node-server';
import { trpcServer } from '@hono/trpc-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { appRouter } from './trpc/router';
import { createContext } from './trpc/context';
import { auth } from './lib/auth';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', 'https://vedfinance.com'],
    credentials: true,
  })
);

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// better-auth routes
app.on(['GET', 'POST'], '/api/auth/**', (c) => auth.handler(c.req.raw));

// tRPC routes
app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
    createContext,
  })
);

// Start server
const port = Number(process.env.PORT) || 4000;

console.log(`🚀 Server starting on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
export type { AppRouter } from './trpc/router';
