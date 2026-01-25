const VPSConnection = require('./vps-connection');

async function main() {
  const vps = new VPSConnection();
  
  try {
    await vps.connect();
    
    console.log('=== KILLING DOCKER BUILDS ===');
    await vps.exec('pkill -9 -f "docker build" 2>/dev/null || true');
    
    console.log('=== STOPPING ALL CONTAINERS ===');
    await vps.exec('docker stop $(docker ps -q) 2>/dev/null || true');
    
    // Wait for system to calm down
    console.log('Waiting 10 seconds...');
    await new Promise(r => setTimeout(r, 10000));
    
    console.log('\n=== SYSTEM STATUS AFTER CLEANUP ===');
    const uptime = await vps.exec('uptime');
    console.log(uptime.stdout);
    
    const free = await vps.exec('free -h');
    console.log(free.stdout);
    
    console.log('\n=== ALL DOCKER IMAGES ===');
    const images = await vps.exec('docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"');
    console.log(images.stdout);
    
    console.log('\n=== ALL CONTAINERS ===');
    const containers = await vps.exec('docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"');
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
