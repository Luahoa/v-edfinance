const VPSConnection = require('./vps-connection');

async function main() {
  const vps = new VPSConnection();
  
  try {
    await vps.connect();
    
    // Check disk space
    console.log('=== Disk Space ===');
    const df = await vps.exec('df -h /');
    console.log(df.stdout || df.stderr);
    
    // Check docker images 
    console.log('=== Docker Images ===');
    const images = await vps.exec('docker images | grep v-edfinance');
    console.log(images.stdout || images.stderr);
    
    // Check if build complete in either log
    console.log('=== Last line of /root/api-rebuild.log ===');
    const log1 = await vps.exec('tail -5 /root/api-rebuild.log 2>/dev/null');
    console.log(log1.stdout || log1.stderr);
    
    console.log('=== Last line of /tmp/api-rebuild.log ===');
    const log2 = await vps.exec('tail -5 /tmp/api-rebuild.log 2>/dev/null');
    console.log(log2.stdout || log2.stderr);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    vps.disconnect();
  }
}

main();
