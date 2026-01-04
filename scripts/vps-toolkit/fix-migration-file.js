/**
 * Fix migration file directly on VPS
 */

const VPSConnection = require('./vps-connection');

async function fixMigrationFile() {
  const vps = new VPSConnection();

  try {
    await vps.connect();

    console.log('Fixing migration file on VPS...\n');
    
    // Use echo with proper escaping
    await vps.exec(`echo '-- CreateGinIndexes' > /root/v-edfinance/apps/api/prisma/migrations/20251223_add_gin_indexes/migration.sql`);
    await vps.exec(`echo '-- GIN indexes for JSONB searches (10x faster for metadata queries)' >> /root/v-edfinance/apps/api/prisma/migrations/20251223_add_gin_indexes/migration.sql`);
    await vps.exec(`echo '' >> /root/v-edfinance/apps/api/prisma/migrations/20251223_add_gin_indexes/migration.sql`);
    await vps.exec(`echo '-- GIN index for User metadata (preferences, settings, etc.)' >> /root/v-edfinance/apps/api/prisma/migrations/20251223_add_gin_indexes/migration.sql`);
    await vps.exec(`echo "-- Use case: Filter users by metadata.preferences.theme = 'dark'" >> /root/v-edfinance/apps/api/prisma/migrations/20251223_add_gin_indexes/migration.sql`);
    await vps.exec(`echo '-- Performance: 10x faster for @> operator queries' >> /root/v-edfinance/apps/api/prisma/migrations/20251223_add_gin_indexes/migration.sql`);
    await vps.exec(`echo 'CREATE INDEX IF NOT EXISTS "User_metadata_gin_idx"' >> /root/v-edfinance/apps/api/prisma/migrations/20251223_add_gin_indexes/migration.sql`);
    await vps.exec(`echo 'ON "User" USING GIN (metadata jsonb_path_ops);' >> /root/v-edfinance/apps/api/prisma/migrations/20251223_add_gin_indexes/migration.sql`);
    await vps.exec(`echo '' >> /root/v-edfinance/apps/api/prisma/migrations/20251223_add_gin_indexes/migration.sql`);
    await vps.exec(`echo '-- GIN index for BehaviorLog payload' >> /root/v-edfinance/apps/api/prisma/migrations/20251223_add_gin_indexes/migration.sql`);
    await vps.exec(`echo '-- Use case: Search event payloads by specific fields' >> /root/v-edfinance/apps/api/prisma/migrations/20251223_add_gin_indexes/migration.sql`);
    await vps.exec(`echo 'CREATE INDEX IF NOT EXISTS "BehaviorLog_payload_gin_idx"' >> /root/v-edfinance/apps/api/prisma/migrations/20251223_add_gin_indexes/migration.sql`);
    await vps.exec(`echo 'ON "BehaviorLog" USING GIN (payload jsonb_path_ops);' >> /root/v-edfinance/apps/api/prisma/migrations/20251223_add_gin_indexes/migration.sql`);
    await vps.exec(`echo '' >> /root/v-edfinance/apps/api/prisma/migrations/20251223_add_gin_indexes/migration.sql`);
    await vps.exec(`echo '-- GIN index for SocialPost content' >> /root/v-edfinance/apps/api/prisma/migrations/20251223_add_gin_indexes/migration.sql`);
    await vps.exec(`echo '-- Use case: Search post content (multilingual)' >> /root/v-edfinance/apps/api/prisma/migrations/20251223_add_gin_indexes/migration.sql`);
    await vps.exec(`echo 'CREATE INDEX IF NOT EXISTS "SocialPost_content_gin_idx"' >> /root/v-edfinance/apps/api/prisma/migrations/20251223_add_gin_indexes/migration.sql`);
    await vps.exec(`echo 'ON "SocialPost" USING GIN (content jsonb_path_ops);' >> /root/v-edfinance/apps/api/prisma/migrations/20251223_add_gin_indexes/migration.sql`);
    await vps.exec(`echo '' >> /root/v-edfinance/apps/api/prisma/migrations/20251223_add_gin_indexes/migration.sql`);
    await vps.exec(`echo '-- Comments for documentation' >> /root/v-edfinance/apps/api/prisma/migrations/20251223_add_gin_indexes/migration.sql`);
    await vps.exec(`echo "COMMENT ON INDEX \\"User_metadata_gin_idx\\" IS 'GIN index for fast JSONB containment queries on user metadata';" >> /root/v-edfinance/apps/api/prisma/migrations/20251223_add_gin_indexes/migration.sql`);
    await vps.exec(`echo "COMMENT ON INDEX \\"BehaviorLog_payload_gin_idx\\" IS 'GIN index for event payload searches - 10x faster';" >> /root/v-edfinance/apps/api/prisma/migrations/20251223_add_gin_indexes/migration.sql`);
    await vps.exec(`echo "COMMENT ON INDEX \\"SocialPost_content_gin_idx\\" IS 'GIN index for multilingual content searches';" >> /root/v-edfinance/apps/api/prisma/migrations/20251223_add_gin_indexes/migration.sql`);

    console.log('✓ Migration file fixed\n');

    // Verify content
    console.log('Verifying file content:');
    const result = await vps.exec('cat /root/v-edfinance/apps/api/prisma/migrations/20251223_add_gin_indexes/migration.sql');
    console.log(result.stdout);

    console.log('\n✅ Done! Now resolve and retry migration');

  } catch (error) {
    console.error('Failed:', error.message);
  } finally {
    vps.disconnect();
  }
}

fixMigrationFile();
