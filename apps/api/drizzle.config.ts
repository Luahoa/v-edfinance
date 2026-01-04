/**
 * Drizzle Kit Configuration
 * 
 * 🔥 IMPORTANT: DO NOT RUN MIGRATIONS!
 * - This config is for type generation ONLY
 * - Prisma owns all migrations via schema.prisma
 * - Drizzle schema is kept in sync manually with Prisma
 * 
 * Usage:
 * - pnpm drizzle-kit generate:pg  # Generate types (safe)
 * - pnpm drizzle-kit push:pg      # ❌ NEVER RUN - breaks Prisma migrations!
 * - pnpm drizzle-kit migrate      # ❌ NEVER RUN - breaks Prisma migrations!
 */

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/database/drizzle-schema.ts',
  out: './drizzle', // Separate from Prisma migrations
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
