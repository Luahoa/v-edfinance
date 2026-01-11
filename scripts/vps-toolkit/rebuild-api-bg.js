const VPS = require('./vps-connection.js');

async function main() {
  const v = new VPS();
  await v.connect();
  
  console.log('Updating repo...');
  await v.exec('cd /root/v-edfinance && git fetch origin && git reset --hard origin/main');
  
  console.log('Building API in background...');
  await v.exec(`nohup bash -c 'cd /root/v-edfinance && docker build -t luahoa/v-edfinance-api:staging -f apps/api/Dockerfile . > /root/api-rebuild.log 2>&1 && echo API_BUILD_SUCCESS >> /root/api-rebuild.log' > /dev/null 2>&1 &`);
  
  console.log('Build started. Monitor: tail -f /root/api-rebuild.log');
  v.disconnect();
}

main().catch(console.error);
