const VPSConnection = require('./vps-connection');

async function main() {
  const vps = new VPSConnection();
  
  try {
    await vps.connect();
    
    console.log('=== UPTIME & LOAD ===');
    const uptime = await vps.exec('uptime');
    console.log(uptime.stdout);
    
    console.log('\n=== DISK FREE ===');
    const df = await vps.exec('df -h /');
    console.log(df.stdout);
    
    console.log('\n=== MEMORY ===');
    const free = await vps.exec('free -h');
    console.log(free.stdout);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    vps.disconnect();
  }
}

main();
