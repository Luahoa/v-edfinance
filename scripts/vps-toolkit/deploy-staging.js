#!/usr/bin/env node
/**
 * Deploy Staging Services to VPS
 * GreenMountain Track 2: API + Web Staging
 */

const VPSConnection = require('./vps-connection.js');
const fs = require('fs');
const path = require('path');

const STAGING_COMPOSE = `version: '3.8'

services:
  api-staging:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    container_name: api-staging
    restart: unless-stopped
    ports:
      - "3001:3000"
    environment:
      - NODE_ENV=staging
      - DATABASE_URL=postgresql://postgres:\${POSTGRES_PASSWORD}@postgres:5432/vedfinance_staging?schema=public
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=\${JWT_SECRET_STAGING}
      - R2_ACCOUNT_ID=\${R2_ACCOUNT_ID}
      - R2_ACCESS_KEY_ID=\${R2_ACCESS_KEY_ID}
      - R2_SECRET_ACCESS_KEY=\${R2_SECRET_ACCESS_KEY}
      - R2_BUCKET_NAME=\${R2_BUCKET_NAME}
    depends_on:
      - postgres
      - redis
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - staging-network

  web-staging:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    container_name: web-staging
    restart: unless-stopped
    ports:
      - "3002:3000"
    environment:
      - NODE_ENV=staging
      - NEXT_PUBLIC_API_URL=http://103.54.153.248:3001
    depends_on:
      - api-staging
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - staging-network

networks:
  staging-network:
    name: staging-network
    external: true
`;

async function main() {
  const vps = new VPSConnection();
  
  try {
    console.log('🚀 Starting Staging Deployment\n');
    
    // Step 1: Connect
    console.log('1️⃣ Connecting to VPS...');
    await vps.connect();
    
    // Step 2: Check prerequisites
    console.log('\n2️⃣ Checking prerequisites...');
    const checks = await vps.execMultiple([
      'docker --version',
      'docker ps --filter name=postgres --format "{{.Names}} {{.Status}}"',
      'docker ps --filter name=redis --format "{{.Names}} {{.Status}}"',
      'docker network ls --filter name=staging-network --format "{{.Name}}"'
    ]);
    
    const dockerOk = checks[0].code === 0;
    const postgresRunning = checks[1].stdout.includes('postgres') && checks[1].stdout.includes('Up');
    const redisRunning = checks[2].stdout.includes('redis') && checks[2].stdout.includes('Up');
    const networkExists = checks[3].stdout.includes('staging-network');
    
    console.log(`  Docker: ${dockerOk ? '✓' : '✗'}`);
    console.log(`  PostgreSQL: ${postgresRunning ? '✓ Running' : '✗ NOT RUNNING - WAITING'}`);
    console.log(`  Redis: ${redisRunning ? '✓ Running' : '✗ NOT RUNNING - WAITING'}`);
    console.log(`  Network: ${networkExists ? '✓' : '⚠ Will create'}`);
    
    if (!postgresRunning || !redisRunning) {
      console.log('\n⚠️  PostgreSQL or Redis not ready. Coordinate with BlueLake track.');
      console.log('Run this script again after infrastructure is deployed.');
      process.exit(1);
    }
    
    // Step 3: Create network if needed
    if (!networkExists) {
      console.log('\n3️⃣ Creating staging network...');
      await vps.exec('docker network create staging-network');
    }
    
    // Step 4: Clone repository
    console.log('\n4️⃣ Setting up repository...');
    const repoSetup = await vps.execMultiple([
      'rm -rf /opt/v-edfinance',
      'mkdir -p /opt/v-edfinance',
      'cd /opt/v-edfinance && git clone -b staging https://github.com/Luahoa/v-edfinance.git .',
    ]);
    
    if (repoSetup.some(r => r.code !== 0)) {
      console.error('Failed to clone repository');
      process.exit(1);
    }
    console.log('  ✓ Repository cloned (staging branch)');
    
    // Step 5: Upload docker-compose file
    console.log('\n5️⃣ Uploading docker-compose configuration...');
    const tmpFile = path.join(process.env.TEMP || '/tmp', 'docker-compose.staging.yml');
    fs.writeFileSync(tmpFile, STAGING_COMPOSE);
    await vps.uploadFile(tmpFile, '/opt/v-edfinance/docker-compose.staging.yml');
    fs.unlinkSync(tmpFile);
    console.log('  ✓ Configuration uploaded');
    
    // Step 6: Create .env file (need to ask for secrets)
    console.log('\n6️⃣ Environment variables...');
    console.log('⚠️  Need to set secrets in /opt/v-edfinance/.env.staging:');
    console.log('  - POSTGRES_PASSWORD');
    console.log('  - JWT_SECRET_STAGING');
    console.log('  - R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME');
    
    const envCheck = await vps.exec('test -f /opt/v-edfinance/.env.staging && echo "exists" || echo "missing"');
    if (envCheck.stdout.trim() === 'missing') {
      console.log('\n⚠️  .env.staging file not found. Please create it manually on VPS:');
      console.log('  ssh root@103.54.153.248');
      console.log('  nano /opt/v-edfinance/.env.staging');
      console.log('\nSkipping deployment until .env is configured.');
      process.exit(1);
    }
    
    // Step 7: Build and deploy
    console.log('\n7️⃣ Building and deploying services...');
    console.log('  (This may take 5-10 minutes)');
    
    const deployment = await vps.exec(
      'cd /opt/v-edfinance && docker compose -f docker-compose.staging.yml --env-file .env.staging up -d --build'
    );
    
    if (deployment.code !== 0) {
      console.error('Deployment failed:', deployment.stderr);
      process.exit(1);
    }
    console.log('  ✓ Services deployed');
    
    // Step 8: Wait for health checks
    console.log('\n8️⃣ Waiting for services to become healthy (60s)...');
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    // Step 9: Verify deployment
    console.log('\n9️⃣ Verifying deployment...');
    const verify = await vps.execMultiple([
      'docker ps --filter name=api-staging --format "{{.Names}} {{.Status}}"',
      'docker ps --filter name=web-staging --format "{{.Names}} {{.Status}}"',
      'curl -f http://localhost:3001/api/health || echo "FAILED"',
      'curl -f http://localhost:3002 || echo "FAILED"'
    ]);
    
    console.log('\n📊 Deployment Status:');
    console.log('  API Container:', verify[0].stdout.trim() || 'NOT FOUND');
    console.log('  Web Container:', verify[1].stdout.trim() || 'NOT FOUND');
    console.log('  API Health:', verify[2].stdout.includes('FAILED') ? '✗ FAILED' : '✓ OK');
    console.log('  Web Health:', verify[3].stdout.includes('FAILED') ? '✗ FAILED' : '✓ OK');
    
    // Step 10: Integration test
    console.log('\n🔗 Integration Test:');
    const integration = await vps.exec('curl -s http://localhost:3002 | grep -o "<title>.*</title>" || echo "FAILED"');
    console.log('  Homepage title:', integration.stdout.trim() || 'FAILED');
    
    console.log('\n✅ Deployment Complete!');
    console.log('\n📍 Access URLs:');
    console.log('  API: http://103.54.153.248:3001/api/health');
    console.log('  Web: http://103.54.153.248:3002');
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  } finally {
    vps.disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
