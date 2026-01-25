const VPSConnection = require('./vps-connection');

async function main() {
  const vps = new VPSConnection();
  
  try {
    await vps.connect();
    
    console.log('=== DISK USAGE ===');
    const df = await vps.exec('df -h /');
    console.log(df.stdout);
    
    console.log('\n=== TOP DISK CONSUMERS (>100MB) ===');
    const du = await vps.exec('du -sh /* 2>/dev/null | sort -rh | head -20');
    console.log(du.stdout);
    
    console.log('\n=== DOCKER CONTAINERS (ALL) ===');
    const containers = await vps.exec('docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Size}}"');
    console.log(containers.stdout);
    
    console.log('\n=== DOCKER IMAGES ===');
    const images = await vps.exec('docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"');
    console.log(images.stdout);
    
    console.log('\n=== DOCKER SYSTEM USAGE ===');
    const system = await vps.exec('docker system df');
    console.log(system.stdout);
    
    console.log('\n=== DOKPLOY STATUS ===');
    const dokploy = await vps.exec('docker ps -a | grep -i dokploy || echo "No Dokploy containers"');
    console.log(dokploy.stdout);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    vps.disconnect();
  }
}

main();
