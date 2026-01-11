const VPS = require('./vps-connection.js');

async function main() {
  const v = new VPS();
  await v.connect();
  
  console.log('Starting Web build in background...');
  
  const cmd = `nohup bash -c 'cd /root/v-edfinance && docker build -t luahoa/v-edfinance-web:staging -f apps/web/Dockerfile . 2>&1 | tee /root/web-build.log && echo WEB_BUILD_SUCCESS >> /root/web-build.log' > /dev/null 2>&1 &`;
  
  await v.exec(cmd);
  console.log('Build started in background.');
  console.log('Monitor with: node check-web-build.js');
  
  v.disconnect();
}

main().catch(console.error);
