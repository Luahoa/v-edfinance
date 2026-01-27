// Edge-compatible database connection using Neon serverless driver
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import * as schema from '../../drizzle/schema';

export function createEdgeDb(databaseUrl: string) {
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

export type EdgeDatabase = ReturnType<typeof createEdgeDb>;
