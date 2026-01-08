/**
 * Build Docker images directly on VPS using git clone + docker build
 * Bypasses Docker Hub if credentials are invalid
 */

const VPSConnection = require('./vps-connection');

async function main() {
  const vps = new VPSConnection();
  
  try {
    await vps.connect();
    
    console.log('='.repeat(60));
    console.log('BUILDING IMAGES DIRECTLY ON VPS');
    console.log('='.repeat(60));
    
    // 1. Check if repo already exists
    console.log('\n📁 Checking for existing repo...');
    const checkRepo = await vps.exec('ls -la /root/v-edfinance 2>/dev/null || echo "NOT_FOUND"');
    console.log(checkRepo.stdout);
    
    // 2. Clone or pull latest code
    if (checkRepo.stdout.includes('NOT_FOUND')) {
      console.log('\n📥 Cloning repository...');
      const clone = await vps.exec('cd /root && git clone https://github.com/Luahoa/v-edfinance.git 2>&1');
      console.log(clone.stdout);
      if (clone.stderr) console.error(clone.stderr);
    } else {
      console.log('\n🔄 Pulling latest changes...');
      const pull = await vps.exec('cd /root/v-edfinance && git pull 2>&1');
      console.log(pull.stdout);
    }
    
    // 3. Check disk space
    console.log('\n💾 Disk space check:');
    const disk = await vps.exec('df -h /');
    console.log(disk.stdout);
    
    // 4. Build API image
    console.log('\n🔨 Building API image...');
    console.log('This may take several minutes...');
    const buildApi = await vps.exec('cd /root/v-edfinance && docker build -t luahoa/v-edfinance-api:staging -f apps/api/Dockerfile . 2>&1');
    console.log(buildApi.stdout.slice(-2000)); // Last 2000 chars
    if (buildApi.code !== 0) {
      console.error('❌ API build failed!');
      console.error(buildApi.stderr);
    }
    
    // 5. Build Web image  
    console.log('\n🔨 Building Web image...');
    const buildWeb = await vps.exec('cd /root/v-edfinance && docker build -t luahoa/v-edfinance-web:staging -f apps/web/Dockerfile . 2>&1');
    console.log(buildWeb.stdout.slice(-2000)); // Last 2000 chars
    if (buildWeb.code !== 0) {
      console.error('❌ Web build failed!');
      console.error(buildWeb.stderr);
    }
    
    // 6. Build Nginx image
    console.log('\n🔨 Building Nginx image...');
    const buildNginx = await vps.exec('cd /root/v-edfinance && docker build -t luahoa/v-edfinance-nginx:staging -f docker/nginx/Dockerfile . 2>&1');
    console.log(buildNginx.stdout.slice(-2000)); // Last 2000 chars
    if (buildNginx.code !== 0) {
      console.error('❌ Nginx build failed!');
      console.error(buildNginx.stderr);
    }
    
    // 7. Verify images
    console.log('\n✅ Verifying built images:');
    const verify = await vps.exec('docker images --filter "reference=luahoa/v-edfinance*" --format "{{.Repository}}:{{.Tag}}\\t{{.Size}}\\t{{.CreatedAt}}"');
    console.log(verify.stdout || 'No images found!');
    
    console.log('\n' + '='.repeat(60));
    console.log('BUILD COMPLETE');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    vps.disconnect();
  }
}

main().catch(console.error);
