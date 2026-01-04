/**
 * Upload fixed migration and retry deployment
 */

const VPSConnection = require('./vps-connection');
const fs = require('fs');
const path = require('path');

async function uploadFixedMigration() {
  console.log('==============================================');
  console.log('Uploading Fixed GIN Index Migration');
  console.log('==============================================\n');

  const vps = new VPSConnection();

  try {
  await vps.connect();

  console.log('[1/2] Uploading fixed migration file...');
  
  // Create migration SQL content on VPS directly
  const migrationSQL = `-- CreateGinIndexes
  -- GIN indexes for JSONB searches (10x faster for metadata queries)

  -- GIN index for User metadata (preferences, settings, etc.)
  -- Use case: Filter users by metadata.preferences.theme = 'dark'
  -- Performance: 10x faster for @> operator queries
  CREATE INDEX IF NOT EXISTS "User_metadata_gin_idx"
  ON "User" USING GIN (metadata jsonb_path_ops);

  -- GIN index for BehaviorLog payload
  -- Use case: Search event payloads by specific fields
  CREATE INDEX IF NOT EXISTS "BehaviorLog_payload_gin_idx"
  ON "BehaviorLog" USING GIN (payload jsonb_path_ops);

  -- GIN index for SocialPost content
  -- Use case: Search post content (multilingual)
  CREATE INDEX IF NOT EXISTS "SocialPost_content_gin_idx"
  ON "SocialPost" USING GIN (content jsonb_path_ops);

  -- Comments for documentation
  COMMENT ON INDEX "User_metadata_gin_idx" IS 'GIN index for fast JSONB containment queries on user metadata';
  COMMENT ON INDEX "BehaviorLog_payload_gin_idx" IS 'GIN index for event payload searches - 10x faster';
  COMMENT ON INDEX "SocialPost_content_gin_idx" IS 'GIN index for multilingual content searches';`;

  await vps.exec(`cat > /root/v-edfinance/apps/api/prisma/migrations/20251223_add_gin_indexes/migration.sql << 'MIGRATION_EOF'
  ${migrationSQL}
  MIGRATION_EOF`);
  console.log('✓ Migration file updated\n');

    console.log('[2/2] Resolving previous failed state...');
    const resolveCmd = `docker run --rm \\
      --network host \\
      -e DATABASE_URL="postgresql://postgres:Halinh!@34@172.17.0.1:5432/vedfinance" \\
      -v /root/v-edfinance:/app \\
      node:20-bookworm-slim \\
      sh -c "apt-get update -y && apt-get install -y openssl && npm install -g prisma@5.22.0 && cd /app/apps/api/prisma && npx prisma migrate resolve --rolled-back 20251223_add_gin_indexes"`;
    
    await vps.exec(resolveCmd);
    console.log('✓ Migration state reset\n');

    console.log('==============================================');
    console.log('✅ Ready for Migration Deployment!');
    console.log('==============================================');
    console.log('\nNext: node scripts/vps-toolkit/deploy-prisma-docker.js');

  } catch (error) {
    console.error('\n❌ Failed:', error.message);
    process.exit(1);
  } finally {
    vps.disconnect();
  }
}

uploadFixedMigration();
