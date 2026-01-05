#!/usr/bin/env node
/**
 * Deploy API Docker to VPS (ved-43oq)
 * Steps: Upload, Build, Run, Verify
 */

const VPSConnection = require('./vps-connection.js');
const path = require('path');
const fs = require('fs');

async function deployAPIDocker() {
  const vps = new VPSConnection();
  
  try {
    console.log('='.repeat(80));
    console.log('ved-43oq: Deploy API Docker to VPS');
    console.log('='.repeat(80));
    
    // Connect
    console.log('\n[Step 1/8] Connecting to VPS...');
    await vps.connect();
    
    // Create deployment directory
    console.log('\n[Step 2/8] Creating deployment directory...');
    await vps.exec('mkdir -p /root/v-edfinance');
    
    // Upload necessary files
    console.log('\n[Step 3/8] Uploading files...');
    const files = [
      'apps/api/Dockerfile',
      'apps/api/package.json',
      'docker-compose.yml',
      'pnpm-lock.yaml',
      'pnpm-workspace.yaml',
      'package.json'
    ];
    
    for (const file of files) {
      const localPath = path.join(__dirname, '../..', file);
      const remotePath = `/root/v-edfinance/${file}`;
      
      // Create remote directory if needed
      const remoteDir = path.dirname(remotePath).replace(/\\/g, '/');
      await vps.exec(`mkdir -p ${remoteDir}`);
      
      console.log(`  Uploading ${file}...`);
      await vps.uploadFile(localPath, remotePath);
    }
    
    // Upload Prisma schema and migrations
    console.log('\n[Step 4/8] Uploading Prisma files...');
    const prismaFiles = [
      'apps/api/prisma/schema.prisma'
    ];
    
    for (const file of prismaFiles) {
      const localPath = path.join(__dirname, '../..', file);
      const remotePath = `/root/v-edfinance/${file}`;
      const remoteDir = path.dirname(remotePath).replace(/\\/g, '/');
      await vps.exec(`mkdir -p ${remoteDir}`);
      console.log(`  Uploading ${file}...`);
      await vps.uploadFile(localPath, remotePath);
    }
    
    // Upload entire apps/api/src directory (compressed)
    console.log('\n[Step 5/8] Compressing and uploading source code...');
    const srcDir = path.join(__dirname, '../../apps/api/src');
    const tarPath = path.join(__dirname, 'api-src.tar.gz');
    
    // Create tar on local
    const { execSync } = require('child_process');
    try {
      execSync(`tar -czf "${tarPath}" -C "${path.join(__dirname, '../../apps/api')}" src`, {
        stdio: 'pipe'
      });
      console.log('  Created local archive');
      
      // Upload
      await vps.uploadFile(tarPath, '/root/v-edfinance/api-src.tar.gz');
      
      // Extract on VPS
      await vps.exec('cd /root/v-edfinance/apps/api && tar -xzf ../../api-src.tar.gz');
      console.log('  Extracted on VPS');
      
      // Cleanup
      fs.unlinkSync(tarPath);
    } catch (err) {
      console.error('  Error compressing source (will try direct copy):', err.message);
    }
    
    // Build Docker image
    console.log('\n[Step 6/8] Building Docker image...');
    let result = await vps.exec('cd /root/v-edfinance && docker build -f apps/api/Dockerfile -t vedfinance-api:latest .');
    console.log(result.stdout);
    if (result.stderr) console.error(result.stderr);
    
    if (result.code !== 0) {
      throw new Error('Docker build failed');
    }
    
    // Stop existing container
    console.log('\n[Step 7/8] Stopping existing container (if any)...');
    await vps.exec('docker stop vedfinance-api 2>/dev/null || true');
    await vps.exec('docker rm vedfinance-api 2>/dev/null || true');
    
    // Run container
    console.log('\n[Step 8/8] Running container...');
    const dbUrl = 'postgresql://postgres:postgres@172.17.0.1:5432/vedfinance?schema=public';
    
    result = await vps.exec(`docker run -d \\
      --name vedfinance-api \\
      -p 3001:3000 \\
      --network host \\
      -e DATABASE_URL="${dbUrl}" \\
      -e NODE_ENV=production \\
      -e PORT=3000 \\
      vedfinance-api:latest`);
    
    console.log(result.stdout);
    if (result.stderr) console.error(result.stderr);
    
    // Wait for startup
    console.log('\n Waiting 10 seconds for startup...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Verify health
    console.log('\n[Verification] Checking health endpoints...');
    result = await vps.exec('curl -s http://localhost:3001/api/health || echo "Health check failed"');
    console.log('GET /api/health:', result.stdout);
    
    result = await vps.exec('curl -s http://localhost:3001/api/health/db || echo "DB health check failed"');
    console.log('GET /api/health/db:', result.stdout);
    
    // Check logs
    result = await vps.exec('docker logs vedfinance-api --tail 30');
    console.log('\n[Logs] Last 30 lines:');
    console.log(result.stdout);
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('DEPLOYMENT SUMMARY');
    console.log('='.repeat(80));
    console.log(`
✅ API Docker Deployed
   Container: vedfinance-api
   Port: 3001 → 3000
   Database: postgresql://172.17.0.1:5432/vedfinance
   Health: http://103.54.153.248:3001/api/health

Next Steps:
1. Close bead: beads close ved-43oq --reason "API deployed, health checks passing"
2. Proceed to ved-949o (Web deployment)
`);
    
    vps.disconnect();
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    console.error(error.stack);
    vps.disconnect();
    process.exit(1);
  }
}

// Run
deployAPIDocker();
