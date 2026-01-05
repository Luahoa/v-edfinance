/**
 * Install pgvector extension in PostgreSQL
 * Prerequisite for ved-4r86 migration
 */

const VPSConnection = require('./vps-connection');

async function installPgVector() {
  console.log('==============================================');
  console.log('Installing pgvector PostgreSQL Extension');
  console.log('==============================================\n');

  const vps = new VPSConnection();

  try {
    await vps.connect();

    // Step 1: Install pgvector in PostgreSQL container
    console.log('[1/3] Installing pgvector extension...');
    
    const installCmd = `docker exec v-edfinance-postgres sh -c '
apt-get update && 
apt-get install -y postgresql-15-pgvector
'`;
    
    await vps.exec(installCmd);
    console.log('✓ pgvector package installed\n');

    // Step 2: Enable extension in database
    console.log('[2/3] Enabling vector extension in vedfinance database...');
    const enableCmd = `docker exec v-edfinance-postgres psql -U postgres -d vedfinance -c "CREATE EXTENSION IF NOT EXISTS vector;"`;
    const result = await vps.exec(enableCmd);
    console.log(result.stdout);
    console.log('✓ Extension enabled\n');

    // Step 3: Verify installation
    console.log('[3/3] Verifying pgvector installation...');
    const verifyCmd = `docker exec v-edfinance-postgres psql -U postgres -d vedfinance -c "SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';"`;
    const verifyResult = await vps.exec(verifyCmd);
    console.log(verifyResult.stdout);

    console.log('\n==============================================');
    console.log('✅ pgvector Installation Complete!');
    console.log('==============================================');
    console.log('\nNext: node scripts/vps-toolkit/deploy-prisma-docker.js');

  } catch (error) {
    console.error('\n❌ Failed:', error.message);
    process.exit(1);
  } finally {
    vps.disconnect();
  }
}

installPgVector();
