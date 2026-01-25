const VPSConnection = require('./vps-connection');

async function main() {
  const vps = new VPSConnection();
  
  try {
    await vps.connect();
    
    // Check VPS repo state
    console.log('=== VPS Repo Git Log ===');
    const log = await vps.exec('cd /root/v-edfinance && git log --oneline -5');
    console.log(log.stdout);
    
    console.log('\n=== Current Dockerfile base image ===');
    const dockerfile = await vps.exec('cd /root/v-edfinance && head -5 apps/api/Dockerfile');
    console.log(dockerfile.stdout);
    
    console.log('\n=== Pull latest ===');
    const pull = await vps.exec('cd /root/v-edfinance && git pull origin main');
    console.log(pull.stdout);
    
    console.log('\n=== After Pull - Dockerfile base image ===');
    const dockerfile2 = await vps.exec('cd /root/v-edfinance && head -5 apps/api/Dockerfile');
    console.log(dockerfile2.stdout);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    vps.disconnect();
  }
}

main();
