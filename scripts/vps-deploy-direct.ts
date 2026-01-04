#!/usr/bin/env tsx
/**
 * Direct VPS Database Setup via SSH2
 * 
 * Uses Node.js ssh2 library to directly connect to VPS and execute setup
 * 
 * Usage:
 *   tsx scripts/vps-deploy-direct.ts
 */

import { Client } from 'ssh2';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load .env.e2b
config({ path: '.env.e2b' });

const VPS_HOST = process.env.VPS_HOST!;
const VPS_USER = process.env.VPS_USER!;
const VPS_PASSWORD = process.env.VPS_PASSWORD!;

if (!VPS_HOST || !VPS_USER || !VPS_PASSWORD) {
  console.error('❌ Missing credentials in .env.e2b');
  process.exit(1);
}

interface Command {
  name: string;
  cmd: string;
}

async function executeCommand(conn: Client, cmd: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);

      let stdout = '';
      let stderr = '';

      stream.on('close', (code: number) => {
        resolve({ stdout, stderr, exitCode: code });
      }).on('data', (data: Buffer) => {
        stdout += data.toString();
      }).stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });
    });
  });
}

async function main() {
  console.log('🚀 Direct VPS Database Setup - Starting...\n');
  console.log(`📡 Connecting to ${VPS_USER}@${VPS_HOST}...\n`);

  const conn = new Client();

  conn.on('ready', async () => {
    console.log('✅ SSH connection established\n');

    try {
      // Read setup script
      const scriptPath = join(process.cwd(), 'scripts', 'vps-database-setup.sh');
      const setupScript = readFileSync(scriptPath, 'utf-8');

      // Upload script to VPS
      console.log('📤 Uploading setup script to VPS...');
      await executeCommand(conn, `cat > /tmp/vps-setup.sh << 'SCRIPT_EOF'\n${setupScript}\nSCRIPT_EOF`);
      await executeCommand(conn, 'chmod +x /tmp/vps-setup.sh');
      console.log('✅ Script uploaded\n');

      // Execute setup script
      console.log('🔧 Executing setup script on VPS...\n');
      console.log('═'.repeat(60));
      
      const result = await executeCommand(conn, 'bash /tmp/vps-setup.sh');
      
      console.log(result.stdout);
      
      if (result.stderr) {
        console.error('⚠️  Warnings/Errors:\n', result.stderr);
      }

      console.log('═'.repeat(60));

      if (result.exitCode === 0) {
        console.log('\n🎉 VPS Database Setup COMPLETE!\n');
        console.log('📈 Next Steps:');
        console.log('  1. Wait 24 hours for pg_stat_statements data');
        console.log('  2. Test AI Database Architect:');
        console.log('     curl http://103.54.153.248:3001/api/debug/database/analyze | jq');
        console.log('  3. Monitor Netdata: http://103.54.153.248:19999');
        console.log('  4. Check logs on VPS:');
        console.log('     tail -f /var/log/db-architect-weekly.log');
        console.log('     tail -f /var/log/backup-restore-test.log\n');
      } else {
        console.error(`\n❌ Setup failed with exit code: ${result.exitCode}`);
        process.exit(1);
      }

      // Cleanup
      await executeCommand(conn, 'rm /tmp/vps-setup.sh');

    } catch (err) {
      console.error('💥 Error during setup:', err);
      process.exit(1);
    } finally {
      conn.end();
    }
  });

  conn.on('error', (err) => {
    console.error('❌ SSH Connection Error:', err.message);
    process.exit(1);
  });

  // Connect to VPS
  conn.connect({
    host: VPS_HOST,
    port: 22,
    username: VPS_USER,
    password: VPS_PASSWORD,
  });
}

main().catch(console.error);
