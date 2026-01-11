const VPS = require('./vps-connection.js');

async function main() {
  const v = new VPS();
  await v.connect();
  
  console.log('Starting full build (API + Web + Nginx)...');
  
  const cmd = `nohup bash -c 'cd /root/v-edfinance && \\
    echo "=== Building API ===" > /root/full-build.log && \\
    docker build -t luahoa/v-edfinance-api:staging -f apps/api/Dockerfile . >> /root/full-build.log 2>&1 && \\
    echo "=== Building Web ===" >> /root/full-build.log && \\
    docker build -t luahoa/v-edfinance-web:staging -f apps/web/Dockerfile . >> /root/full-build.log 2>&1 && \\
    echo "=== Building Nginx ===" >> /root/full-build.log && \\
    docker build -t luahoa/v-edfinance-nginx:staging -f docker/nginx/Dockerfile . >> /root/full-build.log 2>&1 && \\
    echo "=== ALL_BUILDS_SUCCESS ===" >> /root/full-build.log' > /dev/null 2>&1 &`;
  
  await v.exec(cmd);
  console.log('Build started in background.');
  console.log('Monitor: tail -f /root/full-build.log');
  
  v.disconnect();
}

main().catch(console.error);
