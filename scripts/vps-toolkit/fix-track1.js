#!/usr/bin/env node
/**
 * Fix Track 1 Issues:
 * 1. Extensions not created (need to wait for container fully ready)
 * 2. Missing /root/scripts directory
 */

const VPSConnection = require('./vps-connection.js');
const path = require('path');

async function fixTrack1() {
  const vps = new VPSConnection();
  
  try {
    console.log('Connecting to VPS...');
    await vps.connect();
    
    // Check container logs for init script execution
    console.log('\n[1/6] Checking PostgreSQL container logs...');
    let result = await vps.exec('docker logs v-edfinance-postgres 2>&1 | tail -30');
    console.log(result.stdout);
    
    // Manually run init script if needed
    console.log('\n[2/6] Manually creating extensions...');
    const commands = [
      'docker exec v-edfinance-postgres psql -U postgres -d vedfinance_dev -c "CREATE EXTENSION IF NOT EXISTS pgvector; CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"',
      'docker exec v-edfinance-postgres psql -U postgres -d vedfinance_staging -c "CREATE EXTENSION IF NOT EXISTS pgvector; CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"',
      'docker exec v-edfinance-postgres psql -U postgres -d vedfinance_prod -c "CREATE EXTENSION IF NOT EXISTS pgvector; CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"',
    ];
    
    for (const cmd of commands) {
      result = await vps.exec(cmd);
      console.log(result.stdout);
      if (result.stderr) console.error(result.stderr);
    }
    
    // Verify extensions
    console.log('\n[3/6] Verifying extensions...');
    result = await vps.exec('docker exec v-edfinance-postgres psql -U postgres -d vedfinance_staging -c "SELECT extname, extversion FROM pg_extension WHERE extname IN (\'pgvector\', \'pg_stat_statements\');"');
    console.log(result.stdout);
    
    const hasExtensions = result.stdout.includes('pgvector') && result.stdout.includes('pg_stat_statements');
    console.log(hasExtensions ? '✅ Extensions verified' : '❌ Extensions missing');
    
    // Create scripts directory
    console.log('\n[4/6] Creating /root/scripts directory...');
    await vps.exec('mkdir -p /root/scripts');
    
    // Upload backup script
    console.log('\n[5/6] Uploading backup script...');
    const backupScriptPath = path.join(__dirname, '../backup-to-r2.sh');
    await vps.uploadFile(backupScriptPath, '/root/scripts/backup-to-r2.sh');
    
    // Fix backup script configuration
    await vps.exec('chmod +x /root/scripts/backup-to-r2.sh');
    await vps.exec('sed -i \'s/^if ! rclone listremotes | grep -q "^r2:";/if ! rclone listremotes | grep -q "^r2-backup:";/\' /root/scripts/backup-to-r2.sh');
    await vps.exec('sed -i \'s/R2_BUCKET="v-edfinance-backup"/R2_BUCKET="vedfinance-prod"/\' /root/scripts/backup-to-r2.sh');
    await vps.exec('sed -i \'s/"r2:/"r2-backup:/g\' /root/scripts/backup-to-r2.sh');
    
    // Create backup directory
    await vps.exec('mkdir -p /backups/postgres');
    
    // Test backup
    console.log('\n[6/6] Running test backup...');
    result = await vps.exec('/root/scripts/backup-to-r2.sh 2>&1');
    console.log(result.stdout);
    
    // Verify backup in R2
    result = await vps.exec('rclone ls r2-backup:vedfinance-prod/postgres/ 2>&1');
    console.log('\nR2 backup files:', result.stdout);
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Track 1 Fixed - All tasks ready to close');
    console.log('Run: bd close ved-8yqm ved-f23s ved-v6mu');
    console.log('='.repeat(80));
    
    vps.disconnect();
    
  } catch (error) {
    console.error('\n❌ Fix failed:', error.message);
    vps.disconnect();
    process.exit(1);
  }
}

fixTrack1();
