#!/usr/bin/env tsx
/**
 * E2B Automated VPS Database Setup
 * 
 * Executes critical database optimizations on VPS via E2B sandbox:
 * 1. Enable pg_stat_statements extension
 * 2. Deploy cron jobs (AI architect + backup testing)
 * 3. Setup Netdata capacity alerts
 * 
 * Usage:
 *   tsx scripts/e2b-vps-database-setup.ts
 * 
 * Requirements:
 *   - E2B_API_KEY in .env.e2b
 *   - VPS SSH credentials in .env.e2b
 */

import { Sandbox } from '@e2b/code-interpreter';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load E2B config
config({ path: '.env.e2b' });

const VPS_HOST = process.env.VPS_HOST || '103.54.153.248';
const VPS_USER = process.env.VPS_USER || 'deployer';
const VPS_PASSWORD = process.env.VPS_PASSWORD; // Optional (SSH key preferred)
const E2B_API_KEY = process.env.E2B_API_KEY;

if (!E2B_API_KEY) {
  console.error('❌ E2B_API_KEY not found in .env.e2b');
  process.exit(1);
}

interface TaskResult {
  task: string;
  status: 'success' | 'failed' | 'skipped';
  output?: string;
  error?: string;
}

async function main() {
  console.log('🚀 E2B VPS Database Setup - Starting...\n');
  
  const results: TaskResult[] = [];
  
  try {
    // Create E2B sandbox
    console.log('📦 Creating E2B sandbox...');
    const sandbox = await Sandbox.create({ apiKey: E2B_API_KEY });
    console.log('✅ Sandbox created:', sandbox.sandboxId);

    // Read VPS setup script
    const setupScriptPath = join(process.cwd(), 'scripts', 'vps-database-setup.sh');
    let setupScript: string;
    
    try {
      setupScript = readFileSync(setupScriptPath, 'utf-8');
      console.log('✅ Loaded vps-database-setup.sh\n');
    } catch (err) {
      console.error('❌ vps-database-setup.sh not found. Creating it now...');
      // Script will be created in next step
      setupScript = generateSetupScript();
    }

    // Upload setup script to sandbox
    console.log('📤 Uploading setup script to sandbox...');
    await sandbox.files.write('/tmp/vps-setup.sh', setupScript);
    await sandbox.process.start({ cmd: 'chmod +x /tmp/vps-setup.sh' });
    console.log('✅ Script uploaded\n');

    // Task 1: Enable pg_stat_statements
    console.log('🔧 Task 1: Enable pg_stat_statements...');
    try {
      const result = await sandbox.process.start({
        cmd: `sshpass -p "${VPS_PASSWORD}" ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "docker exec vedfinance-postgres psql -U postgres -d vedfinance -c 'CREATE EXTENSION IF NOT EXISTS pg_stat_statements;'"`,
      });

      if (result.exitCode === 0) {
        results.push({
          task: 'Enable pg_stat_statements',
          status: 'success',
          output: result.stdout,
        });
        console.log('✅ pg_stat_statements enabled\n');
      } else {
        throw new Error(result.stderr);
      }
    } catch (err) {
      results.push({
        task: 'Enable pg_stat_statements',
        status: 'failed',
        error: err.message,
      });
      console.error('❌ Failed:', err.message, '\n');
    }

    // Task 2: Deploy cron jobs
    console.log('🔧 Task 2: Deploy cron jobs (AI architect + backup testing)...');
    try {
      // Copy cron scripts to VPS
      const cronScripts = [
        'scripts/db-architect-weekly.sh',
        'scripts/backup-restore-test.sh',
      ];

      for (const script of cronScripts) {
        const scriptContent = readFileSync(join(process.cwd(), script), 'utf-8');
        const scriptName = script.split('/').pop();
        
        // Upload to VPS /opt/scripts/
        const uploadCmd = `sshpass -p "${VPS_PASSWORD}" ssh ${VPS_USER}@${VPS_HOST} "mkdir -p /opt/scripts && cat > /opt/scripts/${scriptName} && chmod +x /opt/scripts/${scriptName}"`;
        
        await sandbox.process.start({
          cmd: `echo '${scriptContent.replace(/'/g, "'\\''")}' | ${uploadCmd}`,
        });
        
        console.log(`  ✅ Uploaded ${scriptName}`);
      }

      // Add to crontab
      const cronEntries = `
0 3 * * 0 /opt/scripts/db-architect-weekly.sh
0 4 * * 0 /opt/scripts/backup-restore-test.sh
`;

      const cronCmd = `sshpass -p "${VPS_PASSWORD}" ssh ${VPS_USER}@${VPS_HOST} "(crontab -l 2>/dev/null; echo '${cronEntries}') | crontab -"`;
      const result = await sandbox.process.start({ cmd: cronCmd });

      if (result.exitCode === 0) {
        results.push({
          task: 'Deploy cron jobs',
          status: 'success',
          output: 'Cron jobs added',
        });
        console.log('✅ Cron jobs deployed\n');
      } else {
        throw new Error(result.stderr);
      }
    } catch (err) {
      results.push({
        task: 'Deploy cron jobs',
        status: 'failed',
        error: err.message,
      });
      console.error('❌ Failed:', err.message, '\n');
    }

    // Task 3: Setup Netdata capacity alerts
    console.log('🔧 Task 3: Setup Netdata capacity alerts...');
    try {
      const netdataConfig = `
alarm: database_size
   on: postgres.database_size
lookup: average -5m
 units: GB
 every: 1h
  warn: \$this > 40
  crit: \$this > 60
  info: Database size threshold (V-EdFinance)

alarm: connection_pool_saturation
   on: postgres.connections
lookup: average -5m
 units: connections
 every: 5m
  warn: \$this > 15
  crit: \$this > 18
  info: PostgreSQL connection pool nearing max (20)
`;

      const netdataCmd = `sshpass -p "${VPS_PASSWORD}" ssh ${VPS_USER}@${VPS_HOST} "echo '${netdataConfig}' | sudo tee /etc/netdata/health.d/db_capacity.conf && sudo systemctl restart netdata"`;
      
      const result = await sandbox.process.start({ cmd: netdataCmd });

      if (result.exitCode === 0) {
        results.push({
          task: 'Setup Netdata alerts',
          status: 'success',
          output: 'Alerts configured',
        });
        console.log('✅ Netdata alerts configured\n');
      } else {
        throw new Error(result.stderr);
      }
    } catch (err) {
      results.push({
        task: 'Setup Netdata alerts',
        status: 'failed',
        error: err.message,
      });
      console.error('❌ Failed:', err.message, '\n');
    }

    // Task 4: Verify deployment
    console.log('🔍 Task 4: Verification...');
    try {
      // Check pg_stat_statements
      const verifyCmd = `sshpass -p "${VPS_PASSWORD}" ssh ${VPS_USER}@${VPS_HOST} "docker exec vedfinance-postgres psql -U postgres -d vedfinance -c 'SELECT * FROM pg_stat_statements LIMIT 1;'"`;
      
      const result = await sandbox.process.start({ cmd: verifyCmd });

      if (result.exitCode === 0) {
        results.push({
          task: 'Verification',
          status: 'success',
          output: 'pg_stat_statements working',
        });
        console.log('✅ Verification passed\n');
      } else {
        throw new Error(result.stderr);
      }
    } catch (err) {
      results.push({
        task: 'Verification',
        status: 'failed',
        error: err.message,
      });
      console.error('❌ Verification failed:', err.message, '\n');
    }

    // Cleanup
    await sandbox.kill();
    console.log('🧹 Sandbox terminated\n');

  } catch (err) {
    console.error('💥 Fatal error:', err.message);
    process.exit(1);
  }

  // Print summary
  console.log('═'.repeat(60));
  console.log('📊 DEPLOYMENT SUMMARY');
  console.log('═'.repeat(60));
  
  const successCount = results.filter(r => r.status === 'success').length;
  const failedCount = results.filter(r => r.status === 'failed').length;

  results.forEach(r => {
    const icon = r.status === 'success' ? '✅' : '❌';
    console.log(`${icon} ${r.task}: ${r.status.toUpperCase()}`);
    if (r.error) console.log(`   Error: ${r.error}`);
  });

  console.log('═'.repeat(60));
  console.log(`Total: ${results.length} tasks | Success: ${successCount} | Failed: ${failedCount}`);
  console.log('═'.repeat(60));

  if (failedCount > 0) {
    console.log('\n⚠️  Some tasks failed. Check manual guide: VPS_DATABASE_SETUP_MANUAL.md');
    process.exit(1);
  } else {
    console.log('\n🎉 All tasks completed successfully!');
    console.log('\n📈 Next steps:');
    console.log('  1. Wait 24 hours for pg_stat_statements data');
    console.log('  2. Test AI Database Architect: GET /api/debug/database/analyze');
    console.log('  3. Monitor Netdata alerts: http://103.54.153.248:19999');
  }
}

function generateSetupScript(): string {
  return `#!/bin/bash
# VPS Database Setup Script
# Auto-generated by E2B deployment

set -e

echo "🔧 VPS Database Setup - Starting..."

# Task 1: Enable pg_stat_statements
echo "📊 Enabling pg_stat_statements..."
docker exec vedfinance-postgres psql -U postgres -d vedfinance -c "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"
echo "✅ pg_stat_statements enabled"

# Task 2: Verify configuration
echo "🔍 Verifying configuration..."
docker exec vedfinance-postgres psql -U postgres -d vedfinance -c "SELECT * FROM pg_stat_statements LIMIT 1;"
echo "✅ Verification passed"

echo "🎉 Setup complete!"
`;
}

// Run
main().catch(console.error);
