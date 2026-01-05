/**
 * Comprehensive migration resolution and deployment
 */

const VPSConnection = require('./vps-connection');

async function deployAllMigrations() {
  console.log('==============================================');
  console.log('VED-4R86: Complete Migration Deployment');
  console.log('==============================================\n');

  const vps = new VPSConnection();
  const DB_URL = 'postgresql://postgres:Halinh!@34@172.17.0.1:5432/vedfinance';

  try {
    await vps.connect();

    // Step 1: Resolve 20251223_add_gin_indexes as rolled back
    console.log('[1/4] Resolving 20251223_add_gin_indexes failed state...');
    const resolveGin = `docker run --rm \\
      --network host \\
      -e DATABASE_URL="${DB_URL}" \\
      -v /root/v-edfinance:/app \\
      node:20-bookworm-slim \\
      sh -c "apt-get update -qq && apt-get install -y -qq openssl > /dev/null 2>&1 && npm install -g prisma@5.22.0 > /dev/null 2>&1 && cd /app/apps/api/prisma && npx prisma migrate resolve --rolled-back 20251223_add_gin_indexes"`;
    
    await vps.exec(resolveGin);
    console.log('✓ GIN indexes migration resolved\n');

    // Step 2: Run full migration deployment
    console.log('[2/4] Deploying all pending migrations...');
    const migrateCmd = `docker run --rm \\
      --network host \\
      -e DATABASE_URL="${DB_URL}" \\
      -v /root/v-edfinance:/app \\
      node:20-bookworm-slim \\
      sh -c "apt-get update -qq && apt-get install -y -qq openssl && npm install -g prisma@5.22.0 && cd /app/apps/api/prisma && npx prisma generate && npx prisma migrate deploy"`;
    
    const migrationResult = await vps.exec(migrateCmd);
    console.log(migrationResult.stdout);
    
    if (migrationResult.code !== 0) {
      console.error('STDERR:', migrationResult.stderr);
      throw new Error('Migration deployment failed');
    }
    console.log('✓ All migrations deployed\n');

    // Step 3: Verify database tables
    console.log('[3/4] Verifying database schema...');
    const verifyCmd = `docker exec v-edfinance-postgres psql -U postgres -d vedfinance -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"`;
    const verifyResult = await vps.exec(verifyCmd);
    console.log(verifyResult.stdout);

    // Step 4: Check migration history
    console.log('[4/4] Checking migration history...');
    const historyCmd = `docker exec v-edfinance-postgres psql -U postgres -d vedfinance -c "SELECT migration_name, finished_at, applied_steps_count FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 10;"`;
    const historyResult = await vps.exec(historyCmd);
    console.log(historyResult.stdout);

    console.log('\n==============================================');
    console.log('✅ VED-4R86 Complete!');
    console.log('==============================================');
    console.log('\nDatabase migrations fully deployed ✓');
    console.log('\nNext Steps:');
    console.log('1. beads close ved-4r86 --reason "Migrations deployed successfully"');
    console.log('2. Continue with ved-43oq (API Deployment)');

  } catch (error) {
    console.error('\n❌ Failed:', error.message);
    process.exit(1);
  } finally {
    vps.disconnect();
  }
}

deployAllMigrations();
