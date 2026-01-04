#!/usr/bin/env node
const VPSConnection = require('./vps-connection.js');

async function finalFix() {
  const vps = new VPSConnection();
  
  try {
    await vps.connect();
    
    console.log('🔧 Final fix - using correct container...\n');
    
    // Stop and remove the wrongly named container
    console.log('🗑️ Removing old container...');
    await vps.exec('docker rm -f modest_buck');
    
    // Start the properly named one
    console.log('▶️  Starting v-edfinance-grafana...');
    await vps.exec('docker start v-edfinance-grafana');
    
    // Wait
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Verify
    console.log('\n✅ Verification:');
    const psResult = await vps.exec('docker ps --format "{{.Names}}: {{.Status}} {{.Ports}}" | grep grafana');
    console.log(psResult.stdout);
    
    const logsResult = await vps.exec('docker logs v-edfinance-grafana --tail 10');
    console.log('\n📋 Logs:\n' + logsResult.stdout);
    
    const healthResult = await vps.exec('curl -s http://localhost:3000/api/health');
    console.log('\n🏥 Health check:\n' + healthResult.stdout);
    
    console.log('\n✅ Complete! http://103.54.153.248:3003');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    vps.disconnect();
  }
}

finalFix();
