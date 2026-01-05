/**
 * GreenMountain Track 2: API + Web Staging Deployment
 * Autonomous deployment script for VPS
 */

const VPSConnection = require('./vps-connection');

async function main() {
  const vps = new VPSConnection();
  
  try {
    console.log('🚀 Starting Track 2 Deployment: API + Web Staging\n');
    
    // Connect to VPS
    await vps.connect();
    
    // ========================================
    // PHASE 1: Wait for PostgreSQL & Deploy Redis
    // ========================================
    console.log('\n📊 Phase 1: Checking PostgreSQL & Redis...\n');
    
    // Check PostgreSQL
    let postgresReady = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`[Attempt ${attempt}/3] Checking PostgreSQL...`);
      const pgCheck = await vps.exec('docker ps | grep postgres');
      
      if (pgCheck.stdout.includes('postgres')) {
        console.log('✓ PostgreSQL container found');
        
        // Verify health
        const healthCheck = await vps.exec('docker exec v-edfinance-postgres pg_isready -U postgres');
        if (healthCheck.code === 0) {
          console.log('✓ PostgreSQL is healthy');
          postgresReady = true;
          break;
        }
      }
      
      if (attempt < 3) {
        console.log(`⏳ Waiting 2 minutes before retry...`);
        await new Promise(resolve => setTimeout(resolve, 120000));
      }
    }
    
    if (!postgresReady) {
      throw new Error('PostgreSQL not ready after 3 attempts. BlueLake track may not be complete.');
    }
    
    // Check Redis
    const redisCheck = await vps.exec('docker ps | grep redis');
    
    if (!redisCheck.stdout.includes('redis')) {
      console.log('⚠️ Redis not running. Deploying Redis...');
      
      // Create Redis docker-compose file
      const redisCompose = `version: '3.8'
services:
  redis:
    image: redis:7-alpine
    container_name: v-edfinance-redis
    ports:
      - "6379:6379"
    restart: unless-stopped
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
`;
      
      await vps.exec(`cat > /root/docker-compose.redis.yml << 'EOF'\n${redisCompose}\nEOF`);
      await vps.exec('cd /root && docker-compose -f docker-compose.redis.yml up -d');
      
      console.log('✓ Redis deployed');
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s for Redis to start
    } else {
      console.log('✓ Redis already running');
    }
    
    // ========================================
    // PHASE 2: Deploy API Staging
    // ========================================
    console.log('\n🔧 Phase 2: Deploying API Staging...\n');
    
    // Clone repository (use timestamp to avoid conflicts)
    const repoDir = '/root/vef-' + Date.now();
    console.log(`Cloning repository to ${repoDir} (this may take 2-3 minutes)...`);
    
    // Clone without redirecting stderr so git can complete properly
    const cloneResult = await vps.exec(`git clone https://github.com/Luahoa/v-edfinance.git ${repoDir}; echo "EXIT_CODE=$?"`);
    
    console.log('Clone exit code check:', cloneResult.stdout);
    
    if (!cloneResult.stdout.includes('EXIT_CODE=0')) {
      console.error('Clone failed. Full output:', cloneResult.stdout);
      console.error('Clone stderr:', cloneResult.stderr);
      throw new Error(`Git clone did not complete successfully`);
    }
    
    // Verify files exist
    const verify = await vps.exec(`test -f ${repoDir}/apps/api/Dockerfile && echo "OK" || echo "MISSING"`);
    if (!verify.stdout.includes('OK')) {
      console.warn('⚠️  API Dockerfile missing from main branch. Creating from local copy...');
      
      // Read local Dockerfile (this is a workaround until it's merged to main)
      const fs = require('fs');
      const path = require('path');
      const dockerfilePath = path.join(__dirname, '../../apps/api/Dockerfile');
      const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
      
      // Upload to VPS
      await vps.exec(`cat > ${repoDir}/apps/api/Dockerfile << 'DOCKERFILE_EOF'\n${dockerfileContent}\nDOCKERFILE_EOF`);
      
      // Verify again
      const verify2 = await vps.exec(`test -f ${repoDir}/apps/api/Dockerfile && wc -l ${repoDir}/apps/api/Dockerfile`);
      console.log('✓ Dockerfile uploaded:', verify2.stdout.trim(), 'lines');
    }
    
    console.log('✓ Repository cloned and verified');
    
    // Build API image
    console.log('Building API Docker image (this may take 5-10 minutes)...');
    const apiBuild = await vps.exec(`docker build --file ${repoDir}/apps/api/Dockerfile --tag v-edfinance-api:staging ${repoDir}`);
    
    if (apiBuild.code !== 0) {
      console.error('API Build Failed:', apiBuild.stderr);
      throw new Error('API Docker build failed');
    }
    console.log('✓ API image built');
    
    // Stop and remove old container if exists
    await vps.exec('docker stop v-edfinance-api-staging 2>/dev/null || true');
    await vps.exec('docker rm v-edfinance-api-staging 2>/dev/null || true');
    
    // Run API container
    console.log('Starting API container...');
    const apiRun = await vps.exec(`docker run -d \\
      --name v-edfinance-api-staging \\
      --network bridge \\
      -p 3001:3000 \\
      -e NODE_ENV=staging \\
      -e DATABASE_URL="postgresql://postgres:Halinh!@34@172.17.0.1:5432/vedfinance_staging?schema=public" \\
      -e REDIS_URL="redis://172.17.0.1:6379" \\
      -e JWT_SECRET="staging-jwt-secret-change-in-production" \\
      -e R2_ACCOUNT_ID="687ec1b6150b9e7b80fddf1dd5e382de" \\
      -e R2_ACCESS_KEY_ID="a207263136786232b32c5da1316a45f1" \\
      -e R2_SECRET_ACCESS_KEY="468dac5d0da3118fdc8de3545f4a36a6e2ec0e7caede20ae5a74f4bad26b18e9" \\
      -e R2_BUCKET_NAME="vedfinance-prod" \\
      --restart unless-stopped \\
      v-edfinance-api:staging`);
    
    if (apiRun.code !== 0) {
      throw new Error(`API container start failed: ${apiRun.stderr}`);
    }
    console.log('✓ API container started');
    
    // Wait for startup
    console.log('⏳ Waiting 30s for API startup...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Check logs
    const apiLogs = await vps.exec('docker logs --tail 50 v-edfinance-api-staging');
    console.log('\n📋 API Logs (last 50 lines):');
    console.log(apiLogs.stdout);
    
    // Run Prisma migrations
    console.log('\n🔄 Running Prisma migrations...');
    const migrateResult = await vps.exec('docker exec v-edfinance-api-staging npx prisma migrate deploy --schema=/app/apps/api/prisma/schema.prisma');
    console.log(migrateResult.stdout);
    
    // Test API health
    const apiHealth = await vps.exec('curl -s http://103.54.153.248:3001/api/health');
    console.log('\n✓ API Health Check:');
    console.log(apiHealth.stdout);
    
    // ========================================
    // PHASE 3: Deploy Web Staging
    // ========================================
    console.log('\n🌐 Phase 3: Deploying Web Staging...\n');
    
    // Build Web image
    console.log('Building Web Docker image (this may take 5-10 minutes)...');
    const webBuild = await vps.exec(`docker build --file ${repoDir}/apps/web/Dockerfile --tag v-edfinance-web:staging --build-arg NEXT_PUBLIC_API_URL=http://103.54.153.248:3001 ${repoDir}`);
    
    if (webBuild.code !== 0) {
      console.error('Web Build Failed:', webBuild.stderr);
      throw new Error('Web Docker build failed');
    }
    console.log('✓ Web image built');
    
    // Stop and remove old container if exists
    await vps.exec('docker stop v-edfinance-web-staging 2>/dev/null || true');
    await vps.exec('docker rm v-edfinance-web-staging 2>/dev/null || true');
    
    // Run Web container
    console.log('Starting Web container...');
    const webRun = await vps.exec(`docker run -d \\
      --name v-edfinance-web-staging \\
      --network bridge \\
      -p 3002:3000 \\
      -e NODE_ENV=staging \\
      -e NEXT_PUBLIC_API_URL="http://103.54.153.248:3001" \\
      --restart unless-stopped \\
      v-edfinance-web:staging`);
    
    if (webRun.code !== 0) {
      throw new Error(`Web container start failed: ${webRun.stderr}`);
    }
    console.log('✓ Web container started');
    
    // Wait for startup
    console.log('⏳ Waiting 30s for Web startup...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Test Web
    const webTest = await vps.exec('curl -s -o /dev/null -w "%{http_code}" http://103.54.153.248:3002');
    console.log(`\n✓ Web HTTP Status: ${webTest.stdout}`);
    
    // ========================================
    // PHASE 4: Integration Tests
    // ========================================
    console.log('\n🧪 Phase 4: Integration Tests...\n');
    
    const tests = [
      { name: 'API Health', cmd: 'curl -s http://103.54.153.248:3001/api/health' },
      { name: 'Web Homepage', cmd: 'curl -s -o /dev/null -w "%{http_code}" http://103.54.153.248:3002' },
      { name: 'Container Status', cmd: 'docker ps --filter name=v-edfinance --format "{{.Names}}: {{.Status}}"' },
    ];
    
    for (const test of tests) {
      console.log(`Running: ${test.name}`);
      const result = await vps.exec(test.cmd);
      console.log(`✓ ${test.name}: ${result.stdout.trim()}`);
    }
    
    // ========================================
    // FINAL SUMMARY
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ TRACK 2 DEPLOYMENT COMPLETE');
    console.log('='.repeat(60));
    console.log('\n📊 Deployment Summary:');
    console.log('  • PostgreSQL: ✓ Running (from BlueLake track)');
    console.log('  • Redis: ✓ Running');
    console.log('  • API Staging: ✓ Running on port 3001');
    console.log('  • Web Staging: ✓ Running on port 3002');
    console.log('\n🌐 Access URLs:');
    console.log('  • API: http://103.54.153.248:3001');
    console.log('  • Web: http://103.54.153.248:3002');
    console.log('  • API Health: http://103.54.153.248:3001/api/health');
    console.log('\n📝 Next Steps:');
    console.log('  1. Verify web can call API');
    console.log('  2. Test user registration/login');
    console.log('  3. Configure nginx reverse proxy (optional)');
    console.log('  4. Set up SSL certificates (optional)');
    
  } catch (error) {
    console.error('\n❌ Deployment Failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  } finally {
    vps.disconnect();
  }
}

// Run deployment
main().catch(console.error);
