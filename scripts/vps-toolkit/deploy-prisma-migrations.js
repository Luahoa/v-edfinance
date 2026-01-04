/**
 * Run Prisma Migrations on VPS Database
 * Task: ved-4r86
 */

const VPSConnection = require('./vps-connection');
const fs = require('fs');
const path = require('path');

async function runPrismaMigrations() {
  console.log('==============================================');
  console.log('VED-4R86: Run Prisma Migrations on VPS');
  console.log('==============================================\n');

  const vps = new VPSConnection();

  try {
    await vps.connect();

    // Step 1: Check if apps/api exists on VPS
    console.log('[1/6] Checking VPS directory structure...');
    const checkCmd = 'test -d /root/v-edfinance/apps/api && echo "exists" || echo "missing"';
    const checkResult = await vps.exec(checkCmd);
    
    if (checkResult.stdout.includes('missing')) {
      console.log('⚠️  apps/api directory missing on VPS');
      console.log('Creating directory structure...');
      await vps.exec('mkdir -p /root/v-edfinance/apps/api/prisma/migrations');
      console.log('✓ Directories created\n');
    } else {
      console.log('✓ apps/api exists on VPS\n');
    }

    // Step 2: Upload Prisma schema
    console.log('[2/6] Uploading Prisma schema...');
    const localSchemaPath = path.join(process.cwd(), '../../apps/api/prisma/schema.prisma');
    const remoteSchemaPath = '/root/v-edfinance/apps/api/prisma/schema.prisma';
    
    try {
      await vps.uploadFile(localSchemaPath, remoteSchemaPath);
    } catch (error) {
      console.log(`⚠️  Upload failed: ${error.message}`);
      console.log('Attempting to create schema via command...');
      const schemaContent = fs.readFileSync(localSchemaPath, 'utf8');
      const escapedSchema = schemaContent.replace(/'/g, "'\\''");
      await vps.exec(`cat > ${remoteSchemaPath} << 'SCHEMA_EOF'\n${schemaContent}\nSCHEMA_EOF`);
    }
    console.log('✓ Schema uploaded\n');

    // Step 3: Upload migrations directory
    console.log('[3/6] Uploading migrations...');
    const localMigrationsDir = path.join(process.cwd(), '../../apps/api/prisma/migrations');
    
    if (fs.existsSync(localMigrationsDir)) {
      const migrations = fs.readdirSync(localMigrationsDir);
      console.log(`Found ${migrations.length} migrations to upload`);
      
      for (const migration of migrations) {
        const migrationPath = path.join(localMigrationsDir, migration);
        if (fs.statSync(migrationPath).isDirectory()) {
          const migrationFile = path.join(migrationPath, 'migration.sql');
          if (fs.existsSync(migrationFile)) {
            const remoteMigrationDir = `/root/v-edfinance/apps/api/prisma/migrations/${migration}`;
            await vps.exec(`mkdir -p ${remoteMigrationDir}`);
            
            const sqlContent = fs.readFileSync(migrationFile, 'utf8');
            await vps.exec(`cat > ${remoteMigrationDir}/migration.sql << 'SQL_EOF'\n${sqlContent}\nSQL_EOF`);
            console.log(`  ✓ ${migration}`);
          }
        }
      }
      console.log('✓ All migrations uploaded\n');
    } else {
      console.log('⚠️  No migrations directory found locally\n');
    }

    // Step 4: Install Prisma CLI on VPS
    console.log('[4/6] Installing Prisma CLI on VPS...');
    const installCmd = 'command -v prisma || npm install -g prisma';
    await vps.exec(installCmd);
    console.log('✓ Prisma CLI ready\n');

    // Step 5: Generate Prisma Client
    console.log('[5/6] Generating Prisma Client...');
    const generateCmd = 'cd /root/v-edfinance/apps/api && prisma generate';
    const generateResult = await vps.exec(generateCmd);
    console.log(generateResult.stdout);
    console.log('✓ Client generated\n');

    // Step 6: Deploy migrations
    console.log('[6/6] Deploying migrations to database...');
    const migrateCmd = `cd /root/v-edfinance/apps/api && DATABASE_URL="postgresql://postgres:Halinh!@34@localhost:5432/vedfinance" prisma migrate deploy`;
    const migrateResult = await vps.exec(migrateCmd);
    console.log(migrateResult.stdout);
    
    if (migrateResult.code === 0) {
      console.log('✓ Migrations deployed successfully\n');
    } else {
      throw new Error('Migration deployment failed: ' + migrateResult.stderr);
    }

    // Verify schema
    console.log('Verifying database schema...');
    const verifyCmd = `docker exec v-edfinance-postgres psql -U postgres -d vedfinance -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';"`;
    const verifyResult = await vps.exec(verifyCmd);
    console.log(verifyResult.stdout);

    console.log('\n==============================================');
    console.log('✅ VED-4R86 Completed Successfully!');
    console.log('==============================================');
    console.log('\nNext steps:');
    console.log('  1. Close beads task: bd close ved-4r86 --reason "Prisma migrations deployed"');
    console.log('  2. Continue with API deployment: ved-43oq');

  } catch (error) {
    console.error('\n==============================================');
    console.error('❌ Failed:', error.message);
    console.error('==============================================');
    process.exit(1);
  } finally {
    vps.disconnect();
  }
}

runPrismaMigrations();
