#!/usr/bin/env node
/**
 * Start Docker containers on VPS using pre-built images
 * Images must already be built (via build-all-bg.js)
 */

const VPSConnection = require('./vps-connection.js');

async function main() {
  const vps = new VPSConnection();
  
  try {
    console.log('🚀 Starting Docker Containers on VPS\n');
    
    await vps.connect();
    
    // Step 1: Check images exist
    console.log('1️⃣ Verifying images exist...');
    const images = await vps.exec('docker images --format "{{.Repository}}:{{.Tag}}" | grep v-edfinance');
    console.log('Available images:\n' + images.stdout);
    
    const hasApi = images.stdout.includes('v-edfinance-api:staging');
    const hasWeb = images.stdout.includes('v-edfinance-web:staging');
    const hasNginx = images.stdout.includes('v-edfinance-nginx:staging');
    
    if (!hasApi || !hasWeb || !hasNginx) {
      console.error('❌ Missing images. Run build-all-bg.js first.');
      process.exit(1);
    }
    console.log('✓ All images present\n');
    
    // Step 2: Check .env.production exists
    console.log('2️⃣ Checking environment file...');
    const envCheck = await vps.exec('test -f /opt/v-edfinance/.env.production && echo "exists" || echo "missing"');
    if (envCheck.stdout.trim() === 'missing') {
      console.log('Creating .env.production from template...');
      await vps.exec(`cat > /opt/v-edfinance/.env.production << 'EOF'
POSTGRES_PASSWORD=vedfinance_secure_password_2026
JWT_SECRET=super_secret_jwt_key_vedfinance_2026
JWT_REFRESH_SECRET=super_secret_refresh_key_vedfinance_2026
ALLOWED_ORIGINS=http://103.54.153.248,http://localhost
WEB_PUBLIC_URL=http://103.54.153.248
NODE_ENV=production
EOF`);
      console.log('✓ Created .env.production\n');
    } else {
      console.log('✓ .env.production exists\n');
    }
    
    // Step 3: Check docker-compose.production.yml
    console.log('3️⃣ Checking docker-compose file...');
    const composeCheck = await vps.exec('test -f /opt/v-edfinance/docker-compose.production.yml && echo "exists" || echo "missing"');
    if (composeCheck.stdout.trim() === 'missing') {
      console.log('❌ docker-compose.production.yml missing. Run git pull first.');
      process.exit(1);
    }
    console.log('✓ docker-compose.production.yml exists\n');
    
    // Step 4: Stop existing containers
    console.log('4️⃣ Stopping existing containers...');
    await vps.exec('cd /opt/v-edfinance && docker compose -f docker-compose.production.yml down 2>/dev/null || true');
    console.log('✓ Stopped existing containers\n');
    
    // Step 5: Start containers
    console.log('5️⃣ Starting containers with docker compose...');
    const start = await vps.exec('cd /opt/v-edfinance && docker compose -f docker-compose.production.yml up -d 2>&1');
    console.log(start.stdout);
    if (start.stderr) console.log(start.stderr);
    
    if (start.code !== 0) {
      console.error('❌ Failed to start containers');
      const logs = await vps.exec('cd /opt/v-edfinance && docker compose -f docker-compose.production.yml logs --tail=50');
      console.log('Logs:', logs.stdout);
      process.exit(1);
    }
    console.log('✓ Containers started\n');
    
    // Step 6: Wait for services to be healthy
    console.log('6️⃣ Waiting for health checks (45 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 45000));
    
    // Step 7: Check status
    console.log('7️⃣ Checking container status...');
    const status = await vps.exec('docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(postgres|api|web|nginx|NAMES)"');
    console.log(status.stdout);
    
    // Step 8: Quick health check
    console.log('\n8️⃣ Health checks...');
    const healthChecks = await vps.execMultiple([
      'curl -sf http://localhost:3001/health || echo "API: FAILED"',
      'curl -sf http://localhost:3000 -o /dev/null && echo "Web: OK" || echo "Web: FAILED"',
      'curl -sf http://localhost:80 -o /dev/null && echo "Nginx: OK" || echo "Nginx: FAILED"'
    ]);
    
    console.log('  API Health:', healthChecks[0].stdout.includes('FAILED') ? '❌ FAILED' : '✓ OK');
    console.log('  Web Health:', healthChecks[1].stdout.includes('OK') ? '✓ OK' : '❌ FAILED');
    console.log('  Nginx Health:', healthChecks[2].stdout.includes('OK') ? '✓ OK' : '❌ FAILED');
    
    console.log('\n✅ Deployment Complete!');
    console.log('\n📍 Access URL: http://103.54.153.248');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    vps.disconnect();
  }
}

main().catch(console.error);
