/**
 * Deploy API to VPS using VPS Toolkit
 * Revised strategy: Use remote build with increased timeout
 */

const VPSConnection = require('./vps-connection');

async function deployAPI() {
  console.log('==============================================');
  console.log('Deploying API to VPS (Revised Strategy)');
  console.log('==============================================\n');

  const vps = new VPSConnection();

  try {
    await vps.connect();

    // Step 1: Check if code is already on VPS
    console.log('[1/6] Checking code on VPS...');
    const lsResult = await vps.exec('ls -la /root/v-edfinance');
    console.log('✓ Code present on VPS\n');

    // Step 2: Pull latest changes (if git repo)
    console.log('[2/6] Updating code...');
    const pullResult = await vps.exec('cd /root/v-edfinance && git pull || echo "Not a git repo, skipping"');
    console.log(pullResult.stdout);
    console.log('✓ Code updated\n');

    // Step 3: Stop existing API container
    console.log('[3/6] Stopping existing API container...');
    await vps.exec('docker stop v-edfinance-api || true');
    await vps.exec('docker rm v-edfinance-api || true');
    console.log('✓ Old container removed\n');

    // Step 4: Build API image (with verbose output)
    console.log('[4/6] Building API Docker image...');
    console.log('⚠️  This may take 5-10 minutes. Please wait...\n');
    
    const buildResult = await vps.exec('cd /root/v-edfinance && docker compose build --no-cache --progress=plain api 2>&1');
    
    // Show last 50 lines of build output
    const buildLines = buildResult.stdout.split('\n');
    const lastLines = buildLines.slice(-50).join('\n');
    console.log(lastLines);
    
    if (buildResult.code !== 0) {
      throw new Error(`Build failed: ${buildResult.stderr}`);
    }
    console.log('✓ API image built\n');

    // Step 5: Start API container
    console.log('[5/6] Starting API container...');
    await vps.exec('cd /root/v-edfinance && docker compose up -d api');
    console.log('✓ API container started\n');

    // Step 6: Verify health
    console.log('[6/6] Verifying API health...');
    
    // Wait 10 seconds for startup
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    const healthResult = await vps.exec('curl -f http://localhost:3000/api/health || echo "Health check failed"');
    console.log('Health check response:', healthResult.stdout);
    
    const containerStatus = await vps.exec('docker ps --filter name=v-edfinance-api --format "{{.Status}}"');
    console.log('Container status:', containerStatus.stdout);

    console.log('\n==============================================');
    console.log('✅ API Deployment Complete!');
    console.log('==============================================');
    console.log('\nAccess: http://103.54.153.248:3000/api/health');

  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check logs: docker logs v-edfinance-api');
    console.error('2. Verify build: docker images | grep api');
    console.error('3. Check network: docker network ls');
    process.exit(1);
  } finally {
    vps.disconnect();
  }
}

deployAPI();
