/**
 * Deploy Prisma Migrations via Docker
 * Task: ved-4r86 (Fixed version)
 */

const VPSConnection = require('./vps-connection');

async function deployPrismaMigrationsDocker() {
  console.log('==============================================');
  console.log('VED-4R86: Deploy Prisma Migrations (Docker)');
  console.log('==============================================\n');

  const vps = new VPSConnection();
  const DB_URL = 'postgresql://postgres:Halinh!@34@172.17.0.1:5432/vedfinance';

  try {
    await vps.connect();

    // Step 1: Pull Node.js Docker image (Debian for OpenSSL compatibility)
    console.log('[1/4] Pulling Node.js Docker image...');
    await vps.exec('docker pull node:20-bookworm-slim');
    console.log('✓ Image ready\n');

    // Step 2: Create Prisma migration script on VPS
    console.log('[2/4] Creating migration script...');
    const migrationScript = `#!/bin/sh
set -e

echo "Installing OpenSSL..."
apt-get update -y && apt-get install -y openssl

echo "Installing Prisma CLI v5..."
npm install -g prisma@5.22.0

echo "Generating Prisma Client..."
cd /app/apps/api/prisma
npx prisma generate

echo "Running migrations..."
npx prisma migrate deploy

echo "Migration completed successfully!"
`;

    await vps.exec(`cat > /tmp/migrate.sh << 'MIGRATE_EOF'\n${migrationScript}\nMIGRATE_EOF`);
    await vps.exec('chmod +x /tmp/migrate.sh');
    console.log('✓ Script created\n');

    // Step 3: Run migration in Docker container
    console.log('[3/4] Running migrations in Docker...');
    console.log('This may take 2-3 minutes...\n');
    
    const dockerCmd = `docker run --rm \\
      --network host \\
      -e DATABASE_URL="${DB_URL}" \\
      -v /root/v-edfinance:/app \\
      -v /tmp/migrate.sh:/migrate.sh \\
      node:20-bookworm-slim \\
      sh /migrate.sh`;

    const result = await vps.exec(dockerCmd);
    console.log(result.stdout);
    
    if (result.code !== 0) {
      console.error('STDERR:', result.stderr);
      throw new Error('Migration failed');
    }
    console.log('✓ Migrations completed\n');

    // Step 4: Verify tables
    console.log('[4/4] Verifying database tables...');
    const verifyCmd = `docker exec v-edfinance-postgres psql -U postgres -d vedfinance -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"`;
    const verifyResult = await vps.exec(verifyCmd);
    console.log(verifyResult.stdout);

    console.log('\n==============================================');
    console.log('✅ VED-4R86 Completed Successfully!');
    console.log('==============================================');
    console.log('\nDatabase ready for API deployment');
    console.log('\nNext: bd close ved-4r86 --reason "Migrations deployed via Docker"');

  } catch (error) {
    console.error('\n❌ Failed:', error.message);
    process.exit(1);
  } finally {
    vps.disconnect();
  }
}

deployPrismaMigrationsDocker();
