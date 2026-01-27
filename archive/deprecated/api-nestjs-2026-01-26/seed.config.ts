import { defineConfig } from '@snaplet/seed/config';
import { SeedPostgres } from '@snaplet/seed/adapter-postgres';

export default defineConfig({
  adapter: () => new SeedPostgres(process.env.DATABASE_URL!),
  select: [
    '!_prisma_migrations',
    '!SystemSettings',
  ],
});
