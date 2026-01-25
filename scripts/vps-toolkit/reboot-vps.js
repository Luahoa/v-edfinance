const VPSConnection = require('./vps-connection');

async function main() {
  const vps = new VPSConnection();
  
  try {
    await vps.connect();
    
    console.log('=== REBOOTING VPS ===');
    console.log('VPS will be unavailable for ~1 minute');
    
    // Schedule reboot in 1 second and disconnect
    await vps.exec('nohup sh -c "sleep 1 && reboot" > /dev/null 2>&1 &');
    console.log('Reboot scheduled');
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    vps.disconnect();
  }
}

main();
