#!/usr/bin/env node
/**
 * Deploy Web Docker Image to VPS (ved-949o)
 * Uses existing built images, creates .env.production, starts containers
 */

const VPSConnection = require('./vps-connection.js');

async function main() {
  const vps = new VPSConnection();
  
  try {
    console.log('🚀 Deploying Web to VPS (ved-949o)\n');
    
    // Connect
    console.log('1️⃣ Connecting to VPS...');
    await vps.connect();
    console.log('  ✓ Connected');
    
    // Check existing images
    console.log('\n2️⃣ Checking Docker images...');
    const images = await vps.exec('docker images --filter "reference=luahoa/v-edfinance*" --format "{{.Repository}}:{{.Tag}}"');
    console.log('  Images found:');
    console.log(images.stdout.split('\n').map(i => `    - ${i}`).join('\n'));
    
    // Create .env.production
    console.log('\n3️⃣ Creating .env.production...');
    const envContent = `# Production Environment Variables
NODE_ENV=production

# Database - connects to postgres container
DATABASE_URL=postgresql://postgres:Halinh!@34@postgres:5432/vedfinance

# JWT
JWT_SECRET=v-edfinance-jwt-secret-staging-2026
JWT_REFRESH_SECRET=v-edfinance-refresh-secret-staging-2026

# CORS
ALLOWED_ORIGINS=https://staging.v-edfinance.com,http://103.54.153.248

# Ports
PORT=3001
NEXT_PUBLIC_API_URL=http://api:3001
NEXT_PUBLIC_APP_URL=https://staging.v-edfinance.com

# Postgres password for container
POSTGRES_PASSWORD=Halinh!@34

# Web
WEB_PUBLIC_URL=https://staging.v-edfinance.com
`;

    await vps.exec(`cat > /root/v-edfinance/.env.production << 'ENVEOF'
${envContent}
ENVEOF`);
    console.log('  ✓ .env.production created');
    
    // Stop existing containers (if any)
    console.log('\n4️⃣ Stopping existing containers...');
    await vps.exec('cd /root/v-edfinance && docker compose -f docker-compose.production.yml down 2>/dev/null || true');
    console.log('  ✓ Stopped');
    
    // Start containers
    console.log('\n5️⃣ Starting production containers...');
    console.log('  (This may take 1-2 minutes)');
    const deploy = await vps.exec(
      'cd /root/v-edfinance && docker compose -f docker-compose.production.yml --env-file .env.production up -d',
      { timeout: 180000 }
    );
    
    if (deploy.code !== 0) {
      console.error('  ✗ Deployment failed:', deploy.stderr);
      throw new Error('Docker compose failed');
    }
    console.log('  ✓ Containers started');
    
    // Wait for health
    console.log('\n6️⃣ Waiting for services (60s)...');
    await new Promise(r => setTimeout(r, 60000));
    
    // Verify
    console.log('\n7️⃣ Verifying deployment...');
    const status = await vps.exec('docker ps --filter "name=v-edfinance" --format "table {{.Names}}\t{{.Status}}"');
    console.log('\n  Container Status:');
    console.log(status.stdout.split('\n').map(l => `    ${l}`).join('\n'));
    
    // Health checks
    const healthApi = await vps.exec('curl -sf http://localhost:3001/health || echo "FAILED"');
    const healthWeb = await vps.exec('curl -sf http://localhost:3000 2>/dev/null | head -c 100 || echo "FAILED"');
    const healthNginx = await vps.exec('curl -sf http://localhost:80/health 2>/dev/null || curl -sf http://localhost:80 2>/dev/null | head -c 100 || echo "FAILED"');
    
    console.log('\n  Health Checks:');
    console.log('    API (3001):', healthApi.stdout.includes('FAILED') ? '✗ FAILED' : '✓ OK');
    console.log('    Web (3000):', healthWeb.stdout.includes('FAILED') ? '✗ FAILED' : '✓ OK');
    console.log('    Nginx (80):', healthNginx.stdout.includes('FAILED') ? '✗ FAILED' : '✓ OK');
    
    console.log('\n✅ Deployment Complete!');
    console.log('\n📍 Access:');
    console.log('  - http://103.54.153.248 (via Nginx)');
    console.log('  - http://103.54.153.248:3000 (Web direct)');
    console.log('  - http://103.54.153.248:3001/health (API direct)');
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    
    // Get logs on failure
    try {
      const logs = await vps.exec('cd /root/v-edfinance && docker compose -f docker-compose.production.yml logs --tail=30');
      console.log('\nRecent logs:');
      console.log(logs.stdout);
    } catch (e) {}
    
    process.exit(1);
  } finally {
    vps.disconnect();
  }
}

main().catch(console.error);
