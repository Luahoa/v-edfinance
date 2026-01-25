const VPSConnection = require('./vps-connection');

async function main() {
  const vps = new VPSConnection();
  
  try {
    await vps.connect();
    
    console.log('=== Contents of /app in API image ===');
    const result = await vps.exec('docker run --rm --entrypoint "" luahoa/v-edfinance-api:staging ls -la /app/');
    console.log(result.stdout || result.stderr);
    
    console.log('\n=== Contents of /app/apps ===');
    const result2 = await vps.exec('docker run --rm --entrypoint "" luahoa/v-edfinance-api:staging ls -la /app/apps/ 2>&1');
    console.log(result2.stdout || result2.stderr);
    
    console.log('\n=== Contents of /app/apps/api ===');
    const result3 = await vps.exec('docker run --rm --entrypoint "" luahoa/v-edfinance-api:staging ls -la /app/apps/api/ 2>&1');
    console.log(result3.stdout || result3.stderr);
    
    console.log('\n=== Contents of /app/apps/api/dist ===');
    const result4 = await vps.exec('docker run --rm --entrypoint "" luahoa/v-edfinance-api:staging ls -la /app/apps/api/dist/ 2>&1');
    console.log(result4.stdout || result4.stderr);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    vps.disconnect();
  }
}

main();
