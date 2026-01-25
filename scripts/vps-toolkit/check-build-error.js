const VPSConnection = require('./vps-connection');

async function main() {
  const vps = new VPSConnection();
  
  try {
    await vps.connect();
    
    console.log('=== Full API Rebuild Log (last 80 lines) ===');
    const log = await vps.exec('tail -80 /root/api-rebuild.log');
    console.log(log.stdout || log.stderr);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    vps.disconnect();
  }
}

main();
