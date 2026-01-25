const VPSConnection = require('./vps-connection');

async function main() {
  const vps = new VPSConnection();
  
  try {
    await vps.connect();
    
    console.log('=== Cleaning up stale containers ===');
    
    // Stop and remove all v-edfinance containers
    console.log('Stopping all v-edfinance containers...');
    await vps.exec('docker ps -a --filter "name=v-edfinance" -q | xargs -r docker stop 2>/dev/null || true');
    
    console.log('Removing all v-edfinance containers...');
    await vps.exec('docker ps -a --filter "name=v-edfinance" -q | xargs -r docker rm -f 2>/dev/null || true');
    
    // Remove v-edfinance network
    console.log('Removing v-edfinance network...');
    await vps.exec('docker network rm v-edfinance_vedfinance-net 2>/dev/null || true');
    
    // Prune dangling images/containers
    console.log('Pruning dangling resources...');
    await vps.exec('docker container prune -f');
    
    console.log('✓ Cleanup complete');
    
    // Check disk space
    const df = await vps.exec('df -h /');
    console.log('\n=== Disk Space ===');
    console.log(df.stdout);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    vps.disconnect();
  }
}

main();
