/**
 * Configure R2 Backup on VPS
 * Task: ved-8yqm
 */

const VPSConnection = require('./vps-connection');

async function configureR2Backup() {
  console.log('==============================================');
  console.log('VED-8YQM: Configure R2 Backup');
  console.log('==============================================\n');

  const vps = new VPSConnection();

  // R2 Configuration
  const R2_CONFIG = {
    accountId: '687ec1b6150b9e7b80fddf1dd5e382de',
    accessKeyId: 'a207263136786232b32c5da1316a45f1',
    secretAccessKey: '468dac5d0da3118fdc8de3545f4a36a6e2ec0e7caede20ae5a74f4bad26b18e9',
    bucketName: 'vedfinance-prod',
    endpoint: 'https://687ec1b6150b9e7b80fddf1dd5e382de.r2.cloudflarestorage.com'
  };

  try {
    await vps.connect();

    // Step 1: Configure Rclone remote
    console.log('[1/5] Configuring Rclone R2 remote...');
    const rcloneConfigCmd = `
rclone config create r2 s3 \\
  provider=Cloudflare \\
  access_key_id=${R2_CONFIG.accessKeyId} \\
  secret_access_key=${R2_CONFIG.secretAccessKey} \\
  endpoint=${R2_CONFIG.endpoint} \\
  acl=private \\
  no_check_bucket=true \\
  --non-interactive
`.trim();
    
    await vps.exec(rcloneConfigCmd);
    console.log('✓ Rclone remote configured\n');

    // Step 2: Create backup script
    console.log('[2/5] Creating backup script...');
    const backupScript = `#!/bin/bash
# V-EdFinance PostgreSQL Backup to Cloudflare R2
# Created by ved-8yqm

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/tmp/vedfinance-backups"
BACKUP_FILE="vedfinance_\${TIMESTAMP}.sql.gz"
R2_BUCKET="${R2_CONFIG.bucketName}"
R2_PATH="database-backups"

echo "[$(date)] Starting backup..."

# Create backup directory
mkdir -p \${BACKUP_DIR}

# Dump PostgreSQL database
docker exec v-edfinance-postgres pg_dump -U postgres vedfinance | gzip > \${BACKUP_DIR}/\${BACKUP_FILE}

echo "[$(date)] Database dumped: \${BACKUP_FILE}"

# Upload to R2
rclone copy \${BACKUP_DIR}/\${BACKUP_FILE} r2:\${R2_BUCKET}/\${R2_PATH}/ --progress

echo "[$(date)] Uploaded to R2: r2:\${R2_BUCKET}/\${R2_PATH}/\${BACKUP_FILE}"

# Clean up local backup (keep only last 3 days)
find \${BACKUP_DIR} -name "vedfinance_*.sql.gz" -mtime +3 -delete

echo "[$(date)] Backup completed successfully"

# Log to syslog
logger "VedFinance backup completed: \${BACKUP_FILE}"
`;

    const createScriptCmd = `cat > /opt/scripts/backup-to-r2.sh << 'SCRIPT_EOF'
${backupScript}
SCRIPT_EOF`;
    
    await vps.exec('mkdir -p /opt/scripts');
    await vps.exec(createScriptCmd);
    await vps.exec('chmod +x /opt/scripts/backup-to-r2.sh');
    console.log('✓ Backup script created at /opt/scripts/backup-to-r2.sh\n');

    // Step 3: Test backup manually
    console.log('[3/5] Running test backup...');
    console.log('This may take 30-60 seconds...\n');
    const testResult = await vps.exec('bash /opt/scripts/backup-to-r2.sh');
    console.log(testResult.stdout);
    
    if (testResult.code === 0) {
      console.log('✓ Test backup successful\n');
    } else {
      throw new Error('Test backup failed: ' + testResult.stderr);
    }

    // Step 4: Setup cron job (daily at 3 AM)
    console.log('[4/5] Setting up daily cron job (3 AM)...');
    const cronEntry = '0 3 * * * /opt/scripts/backup-to-r2.sh >> /var/log/r2-backup.log 2>&1';
    const addCronCmd = `(crontab -l 2>/dev/null | grep -v backup-to-r2.sh; echo "${cronEntry}") | crontab -`;
    await vps.exec(addCronCmd);
    console.log('✓ Cron job configured\n');

    // Step 5: Verify R2 upload
    console.log('[5/5] Verifying R2 bucket contents...');
    const listCmd = `rclone ls r2:${R2_CONFIG.bucketName}/database-backups/ --max-depth 1`;
    const listResult = await vps.exec(listCmd);
    console.log('R2 Bucket Contents:');
    console.log(listResult.stdout || '(empty)');

    console.log('\n==============================================');
    console.log('✅ VED-8YQM Completed Successfully!');
    console.log('==============================================');
    console.log('\nBackup Configuration:');
    console.log(`  • Bucket: ${R2_CONFIG.bucketName}`);
    console.log('  • Schedule: Daily at 3:00 AM UTC');
    console.log('  • Retention: Last 3 days locally');
    console.log('  • R2 Path: database-backups/');
    console.log('\nNext steps:');
    console.log('  1. Close beads task: bd close ved-8yqm --reason "R2 backup configured"');
    console.log('  2. Monitor logs: ssh vps "tail -f /var/log/r2-backup.log"');
    console.log('  3. Verify daily backups in R2 dashboard');

  } catch (error) {
    console.error('\n==============================================');
    console.error('❌ Failed:', error.message);
    console.error('==============================================');
    console.error('\nDebug info:');
    console.error('  • Check rclone config: rclone config show');
    console.error('  • Test R2 connection: rclone ls r2:');
    process.exit(1);
  } finally {
    vps.disconnect();
  }
}

configureR2Backup();
