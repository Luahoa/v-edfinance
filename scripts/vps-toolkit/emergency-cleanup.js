const VPSConnection = require('./vps-connection');

async function main() {
  const vps = new VPSConnection();
  
  try {
    await vps.connect();
    
    console.log('=== Emergency disk cleanup ===');
    
    // Prune build cache (can be large)
    console.log('Pruning Docker builder cache...');
    const prune = await vps.exec('docker builder prune -f --keep-storage=1GB');
    console.log(prune.stdout);
    
    // Prune unused images
    console.log('Pruning unused images...');
    const images = await vps.exec('docker image prune -af --filter "until=24h"');
    console.log(images.stdout);
    
    // Check disk space
    const df = await vps.exec('df -h /');
    console.log('\n=== Disk Space After Cleanup ===');
    console.log(df.stdout);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    vps.disconnect();
  }
}

main();
