const VPSConnection = require('./vps-connection');

async function main() {
  const vps = new VPSConnection();
  
  try {
    await vps.connect();
    
    console.log('=== Building Web image ===');
    const webBuild = await vps.exec(`
      cd /root/v-edfinance && \
      nohup docker build -t luahoa/v-edfinance-web:staging -f apps/web/Dockerfile . > /root/web-rebuild.log 2>&1 && \
      echo WEB_BUILD_SUCCESS >> /root/web-rebuild.log &
    `);
    console.log('Web build started in background');
    console.log('Monitor: tail -f /root/web-rebuild.log');
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    vps.disconnect();
  }
}

main();
