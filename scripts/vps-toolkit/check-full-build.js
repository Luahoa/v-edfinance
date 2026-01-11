const VPS = require('./vps-connection.js');

async function main() {
  const v = new VPS();
  await v.connect();
  
  const r = await v.exec('grep ALL_BUILDS_SUCCESS /root/full-build.log');
  console.log('Build status:', r.stdout ? 'ALL SUCCESS' : 'in progress');
  
  const r2 = await v.exec('tail -15 /root/full-build.log');
  console.log('Last 15 lines:\n', r2.stdout);
  
  v.disconnect();
}

main().catch(console.error);
