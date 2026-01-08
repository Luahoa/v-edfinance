/**
 * Check VPS build status and deploy if complete
 */

const VPSConnection = require('./vps-connection');

async function main() {
  const vps = new VPSConnection();
  
  try {
    await vps.connect();
    
    console.log('='.repeat(60));
    console.log('BUILD STATUS CHECK');
    console.log('='.repeat(60));
    
    // 1. Check if build is still running
    console.log('\n🔍 Checking build process...');
    const checkProcess = await vps.exec('ps aux | grep "docker build" | grep -v grep || echo "NO_BUILD_RUNNING"');
    
    if (checkProcess.stdout.includes('NO_BUILD_RUNNING')) {
      console.log('✓ No build process running - checking results...');
    } else {
      console.log('⏳ Build still in progress:');
      console.log(checkProcess.stdout);
      
      // Show last 30 lines of log
      console.log('\n📋 Last 30 lines of build log:');
      const tail = await vps.exec('tail -30 /root/build.log');
      console.log(tail.stdout);
      
      console.log('\n' + '='.repeat(60));
      console.log('BUILD IN PROGRESS - Run this script again to check status');
      console.log('='.repeat(60));
      vps.disconnect();
      return;
    }
    
    // 2. Check build completion
    console.log('\n📋 Checking build log...');
    const checkSuccess = await vps.exec('grep "BUILD_SUCCESS" /root/build.log || echo "NOT_COMPLETE"');
    
    if (checkSuccess.stdout.includes('NOT_COMPLETE')) {
      console.log('❌ Build did not complete successfully');
      console.log('\nLast 50 lines of build log:');
      const tail = await vps.exec('tail -50 /root/build.log');
      console.log(tail.stdout);
      vps.disconnect();
      return;
    }
    
    console.log('✓ Build completed successfully!');
    
    // 3. Verify images exist
    console.log('\n📦 Verifying images:');
    const images = await vps.exec('docker images --filter "reference=luahoa/v-edfinance*" --format "{{.Repository}}:{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"');
    console.log(images.stdout);
    
    // 4. Check if all 3 images exist
    const hasApi = images.stdout.includes('v-edfinance-api');
    const hasWeb = images.stdout.includes('v-edfinance-web');
    const hasNginx = images.stdout.includes('v-edfinance-nginx');
    
    if (!hasApi || !hasWeb || !hasNginx) {
      console.log(`\n⚠️ Missing images: API=${hasApi}, Web=${hasWeb}, Nginx=${hasNginx}`);
      vps.disconnect();
      return;
    }
    
    console.log('\n✓ All images built successfully!');
    
    // 5. Get postgres password from existing container
    console.log('\n🔑 Getting postgres password...');
    const pgPassword = await vps.exec("docker inspect vedfinance-postgres-4qxzyo.1.miok7eturh4t3hqawduibaz6j 2>/dev/null | grep -o 'POSTGRES_PASSWORD=[^\"]*' | cut -d= -f2 | head -1");
    const password = pgPassword.stdout.trim();
    console.log(`Postgres password: ${password ? '***found***' : 'NOT FOUND'}`);
    
    if (!password) {
      // Try alternative
      const altCheck = await vps.exec("docker service inspect vedfinance-postgres-4qxzyo --format '{{json .Spec.TaskTemplate.ContainerSpec.Env}}' 2>/dev/null");
      console.log('Service env:', altCheck.stdout);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('IMAGES READY - Now need to deploy via Dokploy');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    vps.disconnect();
  }
}

main().catch(console.error);
