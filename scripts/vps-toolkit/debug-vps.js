const VPSConnection = require('./vps-connection');

async function main() {
  const vps = new VPSConnection();
  await vps.connect();
  
  try {
    const checkDir = '/root/vef-1767533355400';
    
    console.log(`Checking apps/api files in ${checkDir}...\n`);
    
    const ls = await vps.exec(`ls -la ${checkDir}/apps/api/`);
    console.log('API directory:', ls.stdout);
    
    const pkgCheck = await vps.exec(`cat ${checkDir}/apps/api/package.json 2>&1 | head -20`);
    console.log('\npackage.json content:', pkgCheck.stdout);
    
  } finally {
    vps.disconnect();
  }
}

main().catch(console.error);
