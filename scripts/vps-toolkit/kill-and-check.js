const VPSConnection = require('./vps-connection');

async function main() {
  const vps = new VPSConnection();
  
  try {
    await vps.connect();
    
    // Kill all builds to free CPU
    console.log('=== KILLING ALL BUILDS ===');
    await vps.exec('pkill -f "docker build" 2>/dev/null || true');
    console.log('Done');
    
    // Wait a bit for CPU to free up
    await new Promise(r => setTimeout(r, 5000));
    
    console.log('\n=== DOCKER IMAGES ===');
    const images = await vps.exec('docker images --format "{{.Repository}}:{{.Tag}}\t{{.Size}}"');
    console.log(images.stdout);
    
    console.log('\n=== ALL CONTAINERS ===');
    const containers = await vps.exec('docker ps -a --format "{{.Names}}\t{{.Status}}"');
    console.log(containers.stdout);
    
    console.log('\n=== DOCKER SYSTEM DF ===');
    const df = await vps.exec('docker system df');
    console.log(df.stdout);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    vps.disconnect();
  }
}

main();
