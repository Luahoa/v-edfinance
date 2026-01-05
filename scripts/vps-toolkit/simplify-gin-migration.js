/**
 * Create simplified GIN migration for existing tables only
 */

const VPSConnection = require('./vps-connection');

async function createSimplifiedGinMigration() {
  const vps = new VPSConnection();

  try {
    await vps.connect();

    console.log('Creating simplified GIN migration...\n');
    
    // Only create indexes for tables that exist: User, BehaviorLog
    await vps.exec(`echo '-- CreateGinIndexes (Simplified for existing tables)' > /root/v-edfinance/apps/api/prisma/migrations/20251223_add_gin_indexes/migration.sql`);
    await vps.exec(`echo '-- GIN indexes for JSONB searches (10x faster for metadata queries)' >> /root/v-edfinance/apps/api/prisma/migrations/20251223_add_gin_indexes/migration.sql`);
    await vps.exec(`echo '' >> /root/v-edfinance/apps/api/prisma/migrations/20251223_add_gin_indexes/migration.sql`);
    await vps.exec(`echo '-- GIN index for User metadata' >> /root/v-edfinance/apps/api/prisma/migrations/20251223_add_gin_indexes/migration.sql`);
    await vps.exec(`echo 'CREATE INDEX IF NOT EXISTS "User_metadata_gin_idx"' >> /root/v-edfinance/apps/api/prisma/migrations/20251223_add_gin_indexes/migration.sql`);
    await vps.exec(`echo 'ON "User" USING GIN (metadata jsonb_path_ops);' >> /root/v-edfinance/apps/api/prisma/migrations/20251223_add_gin_indexes/migration.sql`);
    await vps.exec(`echo '' >> /root/v-edfinance/apps/api/prisma/migrations/20251223_add_gin_indexes/migration.sql`);
    await vps.exec(`echo '-- GIN index for BehaviorLog payload' >> /root/v-edfinance/apps/api/prisma/migrations/20251223_add_gin_indexes/migration.sql`);
    await vps.exec(`echo 'CREATE INDEX IF NOT EXISTS "BehaviorLog_payload_gin_idx"' >> /root/v-edfinance/apps/api/prisma/migrations/20251223_add_gin_indexes/migration.sql`);
    await vps.exec(`echo 'ON "BehaviorLog" USING GIN (payload jsonb_path_ops);' >> /root/v-edfinance/apps/api/prisma/migrations/20251223_add_gin_indexes/migration.sql`);

    console.log('✓ Migration file updated');

    // Verify
    const result = await vps.exec('cat /root/v-edfinance/apps/api/prisma/migrations/20251223_add_gin_indexes/migration.sql');
    console.log('\nFile content:');
    console.log(result.stdout);

    console.log('\n✅ Done! Now resolve and retry migration');

  } catch (error) {
    console.error('Failed:', error.message);
  } finally {
    vps.disconnect();
  }
}

createSimplifiedGinMigration();
