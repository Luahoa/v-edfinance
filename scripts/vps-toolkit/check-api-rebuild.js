const VPSConnection = require('./vps-connection');

async function main() {
  const vps = new VPSConnection();
  
  try {
    await vps.connect();
    
    // Check API rebuild log
    const result = await vps.exec('tail -30 /root/api-rebuild.log 2>/dev/null || echo "No log yet"');
    console.log('=== API Rebuild Log (last 30 lines) ===');
    console.log(result.stdout || result.stderr);
    
    // Check if build is still running
    const ps = await vps.exec('ps aux | grep "docker build" | grep -v grep || echo "No build process running"');
    console.log('\n=== Build Process ===');
    console.log(ps.stdout || ps.stderr);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    vps.disconnect();
  }
}

main();
