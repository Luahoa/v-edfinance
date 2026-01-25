const VPSConnection = require('./vps-connection');

async function main() {
  const vps = new VPSConnection();
  
  try {
    await vps.connect();
    
    // Just check build logs - minimal command
    const log = await vps.exec('tail -10 /root/full-build.log 2>/dev/null || tail -10 /root/web-rebuild.log 2>/dev/null || echo "No logs"');
    console.log('=== BUILD LOG ===');
    console.log(log.stdout);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    vps.disconnect();
  }
}

main();
