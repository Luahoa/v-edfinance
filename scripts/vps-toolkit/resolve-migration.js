/**
 * Resolve failed migration state
 * Marks failed migration as rolled back so deploy can continue
 */

const VPSConnection = require('./vps-connection');

async function resolveFailedMigration() {
  console.log('==============================================');
  console.log('Resolving Failed Migration State');
  console.log('==============================================\n');

  const vps = new VPSConnection();

  try {
    await vps.connect();

    console.log('[1/2] Marking failed migration as rolled back...');
    const resolveCmd = `docker run --rm \\
      --network host \\
      -e DATABASE_URL="postgresql://postgres:Halinh!@34@172.17.0.1:5432/vedfinance" \\
      -v /root/v-edfinance:/app \\
      node:20-bookworm-slim \\
      sh -c "apt-get update -y && apt-get install -y openssl && npm install -g prisma@5.22.0 && cd /app/apps/api/prisma && npx prisma migrate resolve --rolled-back 20251222050000_add_optimization_log"`;
    
    const result = await vps.exec(resolveCmd);
    console.log(result.stdout);
    console.log('✓ Migration marked as rolled back\n');

    console.log('[2/2] Checking migration status...');
    const statusCmd = `docker run --rm \\
      --network host \\
      -e DATABASE_URL="postgresql://postgres:Halinh!@34@172.17.0.1:5432/vedfinance" \\
      -v /root/v-edfinance:/app \\
      node:20-bookworm-slim \\
      sh -c "apt-get update -y && apt-get install -y openssl && npm install -g prisma@5.22.0 && cd /app/apps/api/prisma && npx prisma migrate status"`;
    
    const statusResult = await vps.exec(statusCmd);
    console.log(statusResult.stdout);

    console.log('\n==============================================');
    console.log('✅ Migration State Resolved!');
    console.log('==============================================');
    console.log('\nNext: node scripts/vps-toolkit/deploy-prisma-docker.js');

  } catch (error) {
    console.error('\n❌ Failed:', error.message);
    process.exit(1);
  } finally {
    vps.disconnect();
  }
}

resolveFailedMigration();
