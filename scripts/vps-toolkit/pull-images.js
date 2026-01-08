/**
 * Get Dokploy project info and pull v-edfinance images
 */

const VPSConnection = require('./vps-connection');

async function main() {
  const vps = new VPSConnection();
  
  try {
    await vps.connect();
    
    console.log('='.repeat(60));
    console.log('DOKPLOY PROJECT INVESTIGATION & IMAGE PULL');
    console.log('='.repeat(60));
    
    // 1. Check Dokploy data location
    console.log('\n📁 Finding Dokploy data directory...');
    const dataDir = await vps.exec('docker inspect dokploy.1.7g0b0su72nzqg16nnw2wt5k3f 2>/dev/null | grep -A5 "Binds" | head -6 || echo "Could not inspect"');
    console.log(dataDir.stdout);
    
    // Alternative data locations
    const altDirs = await vps.exec('ls -la /data/dokploy 2>/dev/null || ls -la /var/lib/dokploy 2>/dev/null || echo "Checking swarm volumes..."');
    console.log(altDirs.stdout);
    
    // 2. Check Docker volumes for Dokploy
    console.log('\n📦 Docker Volumes:');
    const volumes = await vps.exec('docker volume ls | grep -E "dokploy|vedfinance"');
    console.log(volumes.stdout);
    
    // 3. Pull v-edfinance images from Docker Hub
    console.log('\n🔄 Pulling v-edfinance images from Docker Hub...');
    
    const images = [
      'luahoa/v-edfinance-api:staging',
      'luahoa/v-edfinance-web:staging', 
      'luahoa/v-edfinance-nginx:staging'
    ];
    
    for (const image of images) {
      console.log(`\nPulling ${image}...`);
      const result = await vps.exec(`docker pull ${image} 2>&1`);
      console.log(result.stdout);
      if (result.stderr) console.error(result.stderr);
    }
    
    // 4. Verify images exist
    console.log('\n✅ Verifying pulled images:');
    const verify = await vps.exec('docker images --filter "reference=luahoa/v-edfinance*" --format "{{.Repository}}:{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"');
    console.log(verify.stdout || 'No images found!');
    
    // 5. Check Dokploy project via swarm inspection
    console.log('\n🔍 Inspecting Dokploy swarm services:');
    const swarmServices = await vps.exec('docker service inspect vedfinance-postgres-4qxzyo --pretty 2>/dev/null | head -30');
    console.log(swarmServices.stdout);
    
    // 6. Check for v-edfinance related swarm services
    console.log('\n🔍 Looking for v-edfinance services (not postgres):');
    const vedServices = await vps.exec('docker service ls --filter "name=vedfinance" 2>/dev/null');
    console.log(vedServices.stdout);
    
    // 7. Try to get Dokploy API token
    console.log('\n🔑 Checking Dokploy environment for API access:');
    const dokployEnv = await vps.exec('docker inspect dokploy.1.7g0b0su72nzqg16nnw2wt5k3f 2>/dev/null | grep -E "DOKPLOY|API_KEY" | head -10');
    console.log(dokployEnv.stdout || 'Could not extract env');
    
    // 8. Test Dokploy API
    console.log('\n🌐 Testing Dokploy API:');
    const apiTest = await vps.exec('curl -s http://localhost:3000/api/trpc/auth.get 2>&1 | head -c 500');
    console.log(apiTest.stdout);
    
    console.log('\n' + '='.repeat(60));
    console.log('INVESTIGATION COMPLETE');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    vps.disconnect();
  }
}

main().catch(console.error);
