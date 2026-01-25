const VPSConnection = require('./vps-connection');

async function main() {
  const vps = new VPSConnection();
  
  try {
    await vps.connect();
    
    console.log('=== DOCKER IMAGES ===');
    const images = await vps.exec('docker images');
    console.log(images.stdout);
    
    console.log('\n=== DOCKER CONTAINERS ===');
    const containers = await vps.exec('docker ps -a');
    console.log(containers.stdout);
    
    console.log('\n=== BUILD STATUS ===');
    const ps = await vps.exec('ps aux | grep "docker build" | grep -v grep | head -5');
    console.log(ps.stdout || 'No build running');
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    vps.disconnect();
  }
}

main();
