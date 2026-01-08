/**
 * Setup and build images on VPS with background execution
 */

const VPSConnection = require('./vps-connection');

async function main() {
  const vps = new VPSConnection();
  
  try {
    await vps.connect();
    
    console.log('='.repeat(60));
    console.log('VPS SETUP AND BUILD');
    console.log('='.repeat(60));
    
    // 1. Remove old incomplete repo and clone fresh
    console.log('\n📁 Setting up repository...');
    const setup = await vps.exec(`
      rm -rf /root/v-edfinance
      cd /root && git clone https://github.com/Luahoa/v-edfinance.git
      cd /root/v-edfinance && git log -1 --oneline
    `);
    console.log(setup.stdout);
    if (setup.stderr) console.error('STDERR:', setup.stderr);
    
    // 2. Create build script
    console.log('\n📝 Creating build script...');
    const buildScript = `#!/bin/bash
set -e
cd /root/v-edfinance

echo "=== Building API ===" | tee -a /root/build.log
docker build -t luahoa/v-edfinance-api:staging -f apps/api/Dockerfile . 2>&1 | tee -a /root/build.log

echo "=== Building Web ===" | tee -a /root/build.log  
docker build -t luahoa/v-edfinance-web:staging -f apps/web/Dockerfile . 2>&1 | tee -a /root/build.log

echo "=== Building Nginx ===" | tee -a /root/build.log
docker build -t luahoa/v-edfinance-nginx:staging -f docker/nginx/Dockerfile . 2>&1 | tee -a /root/build.log

echo "=== Build Complete ===" | tee -a /root/build.log
docker images --filter "reference=luahoa/v-edfinance*" | tee -a /root/build.log
echo "BUILD_SUCCESS" >> /root/build.log
`;
    
    await vps.exec(`cat > /root/build-images.sh << 'SCRIPT'
${buildScript}
SCRIPT`);
    await vps.exec('chmod +x /root/build-images.sh');
    console.log('Build script created at /root/build-images.sh');
    
    // 3. Start build in background with nohup
    console.log('\n🚀 Starting background build (nohup)...');
    const startBuild = await vps.exec('nohup /root/build-images.sh > /root/build.log 2>&1 &');
    console.log('Build started in background!');
    
    // 4. Wait a few seconds and check if it's running
    console.log('\n⏳ Waiting 5 seconds to verify build started...');
    await new Promise(r => setTimeout(r, 5000));
    
    const checkProcess = await vps.exec('ps aux | grep "docker build" | grep -v grep || echo "No build running"');
    console.log('Process check:', checkProcess.stdout);
    
    const tailLog = await vps.exec('tail -20 /root/build.log 2>/dev/null || echo "Log not ready yet"');
    console.log('Build log tail:\n', tailLog.stdout);
    
    console.log('\n' + '='.repeat(60));
    console.log('BUILD STARTED IN BACKGROUND');
    console.log('Monitor with: ssh root@103.54.153.248 "tail -f /root/build.log"');
    console.log('Check images: ssh root@103.54.153.248 "docker images | grep v-edfinance"');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    vps.disconnect();
  }
}

main().catch(console.error);
