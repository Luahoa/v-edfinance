/**
 * Check deployment status and verify services
 */

const VPSConnection = require('./vps-connection');

async function main() {
  const vps = new VPSConnection();
  
  try {
    await vps.connect();
    
    console.log('='.repeat(60));
    console.log('DEPLOYMENT STATUS CHECK');
    console.log('='.repeat(60));
    
    // 1. Check if build/deploy is running
    console.log('\n🔍 Process check:');
    const procs = await vps.exec('ps aux | grep -E "docker build|deploy.sh" | grep -v grep');
    if (procs.stdout.trim()) {
      console.log('⏳ Build/Deploy in progress:');
      console.log(procs.stdout);
    } else {
      console.log('✓ No build process running');
    }
    
    // 2. Check deploy log
    console.log('\n📋 Last 30 lines of deploy log:');
    const log = await vps.exec('tail -30 /root/deploy.log 2>/dev/null || echo "No log found"');
    console.log(log.stdout);
    
    // 3. Check if deployment succeeded
    const success = await vps.exec('grep "DEPLOY_SUCCESS" /root/deploy.log 2>/dev/null || echo "NOT_COMPLETE"');
    if (success.stdout.includes('DEPLOY_SUCCESS')) {
      console.log('\n✅ DEPLOYMENT SUCCESSFUL!');
    } else if (success.stdout.includes('NOT_COMPLETE')) {
      console.log('\n⏳ Deployment not complete yet - check again later');
      vps.disconnect();
      return;
    }
    
    // 4. Check images
    console.log('\n📦 Built images:');
    const images = await vps.exec('docker images --filter "reference=v-edfinance*" --format "{{.Repository}}:{{.Tag}}\t{{.Size}}"');
    console.log(images.stdout || 'No local images');
    
    // 5. Check running containers
    console.log('\n🐳 Running containers:');
    const containers = await vps.exec('docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "vedfinance|v-edfinance" || echo "None"');
    console.log(containers.stdout);
    
    // 6. Health checks
    console.log('\n🏥 Health checks:');
    const apiHealth = await vps.exec('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health 2>/dev/null || echo "FAIL"');
    console.log(`API (port 3001): ${apiHealth.stdout === '200' ? '✅ OK' : '❌ ' + apiHealth.stdout}`);
    
    const webHealth = await vps.exec('curl -s -o /dev/null -w "%{http_code}" http://localhost:3004 2>/dev/null || echo "FAIL"');
    console.log(`Web (port 3004): ${webHealth.stdout === '200' ? '✅ OK' : '❌ ' + webHealth.stdout}`);
    
    const nginxHealth = await vps.exec('curl -s -o /dev/null -w "%{http_code}" http://localhost:80 2>/dev/null || echo "FAIL"');
    console.log(`Nginx (port 80): ${nginxHealth.stdout === '200' ? '✅ OK' : '❌ ' + nginxHealth.stdout}`);
    
    // 7. Resource usage
    console.log('\n💻 Resource usage:');
    const resources = await vps.exec('free -h | head -2 && uptime');
    console.log(resources.stdout);
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    vps.disconnect();
  }
}

main().catch(console.error);
