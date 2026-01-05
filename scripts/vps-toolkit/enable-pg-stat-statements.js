/**
 * Enable pg_stat_statements on VPS PostgreSQL
 * Task: ved-y1u
 */

const VPSConnection = require('./vps-connection');

async function enablePgStatStatements() {
  console.log('==============================================');
  console.log('VED-Y1U: Enable pg_stat_statements');
  console.log('==============================================\n');

  const vps = new VPSConnection();

  try {
    await vps.connect();

    // Step 1: Update postgresql.conf
    console.log('[1/4] Updating postgresql.conf...');
    const updateConfigCmd = `docker exec v-edfinance-postgres bash -c "echo \\"shared_preload_libraries = 'pg_stat_statements'\\" >> /var/lib/postgresql/data/postgresql.conf"`;
    await vps.exec(updateConfigCmd);
    console.log('✓ Config updated\n');

    // Step 2: Restart PostgreSQL container
    console.log('[2/4] Restarting PostgreSQL container...');
    await vps.exec('docker restart v-edfinance-postgres');
    console.log('✓ Container restarted');
    console.log('Waiting 10 seconds for PostgreSQL to start...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    console.log('✓ PostgreSQL should be ready\n');

    // Step 3: Create extension
    console.log('[3/4] Creating pg_stat_statements extension...');
    const createExtCmd = `docker exec v-edfinance-postgres psql -U postgres -d vedfinance -c "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"`;
    const createResult = await vps.exec(createExtCmd);
    console.log(createResult.stdout);
    console.log('✓ Extension created\n');

    // Step 4: Verify
    console.log('[4/4] Verifying pg_stat_statements...');
    const verifyCmd = `docker exec v-edfinance-postgres psql -U postgres -d vedfinance -c "SELECT COUNT(*) as tracked_queries FROM pg_stat_statements;"`;
    const verifyResult = await vps.exec(verifyCmd);
    console.log(verifyResult.stdout);

    console.log('\n==============================================');
    console.log('✅ VED-Y1U Completed Successfully!');
    console.log('==============================================');
    console.log('\nNext steps:');
    console.log('  1. Close beads task: bd close ved-y1u --reason "pg_stat_statements enabled"');
    console.log('  2. Verify metrics endpoint: http://103.54.153.248:3001/api/debug/database/analyze');

  } catch (error) {
    console.error('\n==============================================');
    console.error('❌ Failed:', error.message);
    console.error('==============================================');
    process.exit(1);
  } finally {
    vps.disconnect();
  }
}

enablePgStatStatements();
