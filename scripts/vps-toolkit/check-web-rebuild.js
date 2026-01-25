const VPSConnection = require('./vps-connection');

async function main() {
  const vps = new VPSConnection();
  
  try {
    await vps.connect();
    
    console.log('=== Disk Space ===');
    const df = await vps.exec('df -h /');
    console.log(df.stdout);
    
    console.log('=== Docker Images ===');
    const images = await vps.exec('docker images | grep v-edfinance');
    console.log(images.stdout || images.stderr || 'No images');
    
    console.log('=== Web Rebuild Log (last 30 lines) ===');
    const log = await vps.exec('tail -30 /root/web-rebuild.log 2>/dev/null || echo "No log yet"');
    console.log(log.stdout || log.stderr);
    
    console.log('=== Build Process ===');
    const ps = await vps.exec('ps aux | grep "docker build" | grep -v grep || echo "No build running"');
    console.log(ps.stdout || ps.stderr);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    vps.disconnect();
  }
}

main();
