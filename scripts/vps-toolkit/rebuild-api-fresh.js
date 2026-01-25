const VPSConnection = require('./vps-connection');

async function main() {
  const vps = new VPSConnection();
  
  try {
    await vps.connect();
    
    console.log('=== Killing existing builds ===');
    await vps.exec('pkill -f "docker build" || true');
    
    console.log('=== Cleaning up build cache ===');
    await vps.exec('docker builder prune -af');
    
    console.log('=== Starting fresh build with Debian image ===');
    const build = await vps.exec(`
      cd /root/v-edfinance && \
      nohup docker build --no-cache -t luahoa/v-edfinance-api:staging -f apps/api/Dockerfile . > /root/api-rebuild.log 2>&1 && \
      echo API_BUILD_SUCCESS >> /root/api-rebuild.log &
    `);
    console.log('Build started in background');
    console.log('Monitor: tail -f /root/api-rebuild.log');
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    vps.disconnect();
  }
}

main();
