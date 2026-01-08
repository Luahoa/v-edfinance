#!/usr/bin/env node
/**
 * Upload Build Context to VPS
 * Targeted upload - only essential files for Docker build
 */

const VPSConnection = require('./vps-connection.js');
const fs = require('fs');
const path = require('path');

const FILES_TO_UPLOAD = [
  // Root workspace files
  'package.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'turbo.json',
  
  // Web app files
  'apps/web/package.json',
  'apps/web/next.config.ts',
  'apps/web/tsconfig.json',
  'apps/web/.dockerignore',
  
  // API app files
  'apps/api/package.json',
  'apps/api/nest-cli.json',
  'apps/api/tsconfig.json',
  'apps/api/tsconfig.build.json',
  'apps/api/.dockerignore'
];

const DIRECTORIES_TO_UPLOAD = [
  'apps/web/src',
  'apps/web/public',
  'apps/api/src',
  'apps/api/prisma'
];

async function uploadDirectory(vps, localDir, remoteDir) {
  const files = fs.readdirSync(localDir, { withFileTypes: true });
  
  for (const file of files) {
    const localPath = path.join(localDir, file.name);
    const remotePath = `${remoteDir}/${file.name}`;
    
    if (file.isDirectory()) {
      await vps.exec(`mkdir -p ${remotePath}`);
      await uploadDirectory(vps, localPath, remotePath);
    } else {
      await vps.uploadFile(localPath, remotePath);
    }
  }
}

async function main() {
  const vps = new VPSConnection();
  const baseDir = '/root/v-edfinance-staging';
  
  try {
    console.log('📤 Uploading Build Context to VPS\\n');
    
    // Connect
    console.log('1️⃣ Connecting to VPS...');
    await vps.connect();
    
    // Upload individual files
    console.log('\\n2️⃣ Uploading workspace files...');
    for (const file of FILES_TO_UPLOAD) {
      const localPath = path.join(process.cwd(), file);
      const remotePath = `${baseDir}/${file}`;
      
      if (fs.existsSync(localPath)) {
        await vps.uploadFile(localPath, remotePath);
        console.log(`  ✓ ${file}`);
      } else {
        console.warn(`  ⚠ Skipped ${file} (not found)`);
      }
    }
    
    // Upload directories
    console.log('\\n3️⃣ Uploading source directories...');
    for (const dir of DIRECTORIES_TO_UPLOAD) {
      const localPath = path.join(process.cwd(), dir);
      const remotePath = `${baseDir}/${dir}`;
      
      if (fs.existsSync(localPath)) {
        console.log(`  Uploading ${dir}...`);
        await vps.exec(`mkdir -p ${remotePath}`);
        await uploadDirectory(vps, localPath, remotePath);
        console.log(`  ✓ ${dir}`);
      } else {
        console.warn(`  ⚠ Skipped ${dir} (not found)`);
      }
    }
    
    // Verify
    console.log('\\n4️⃣ Verifying files on VPS...');
    const verify = await vps.execMultiple([
      `cd ${baseDir} && ls -lh package.json pnpm-lock.yaml pnpm-workspace.yaml 2>&1`,
      `cd ${baseDir} && ls -lh apps/web/package.json apps/api/package.json 2>&1`,
      `cd ${baseDir} && ls -d apps/web/src apps/api/src 2>&1`
    ]);
    
    console.log('\\n  Root files:', verify[0].code === 0 ? '✓' : '✗');
    console.log('  App package.json:', verify[1].code === 0 ? '✓' : '✗');
    console.log('  Source dirs:', verify[2].code === 0 ? '✓' : '✗');
    
    console.log('\\n✅ Upload Complete!');
    console.log('\\n📍 Next Steps:');
    console.log('  1. Run: ssh root@103.54.153.248');
    console.log('  2. Run: cd /root/v-edfinance-staging');
    console.log('  3. Run: docker compose -f docker-compose.production.yml build --no-cache');
    console.log('  4. Run: docker compose -f docker-compose.production.yml up -d');
    
  } catch (error) {
    console.error('\\n❌ Upload failed:', error.message);
    process.exit(1);
  } finally {
    vps.disconnect();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
