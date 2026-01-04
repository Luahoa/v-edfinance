#!/usr/bin/env node
const VPSConnection = require('./vps-connection.js');

async function debugGrafana() {
  const vps = new VPSConnection();
  
  try {
    await vps.connect();
    
    // Check full container info
    console.log('🔍 Full container inspect:');
    const inspectResult = await vps.exec('docker inspect v-edfinance-grafana | grep -A 10 -E "State|Error|Status"');
    console.log(inspectResult.stdout);
    
    // Try to manually run Grafana to see error
    console.log('\n🧪 Testing manual Grafana run:');
    const manualRun = await vps.exec('docker run --rm -p 3003:3000 -v /root/monitoring/grafana/datasources.yml:/etc/grafana/provisioning/datasources/datasources.yml:ro grafana/grafana:latest /run.sh 2>&1 &');
    console.log(manualRun.stdout);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check what's actually running
    console.log('\n📦 All Grafana processes:');
    const psResult = await vps.exec('docker ps -a | grep grafana');
    console.log(psResult.stdout);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    vps.disconnect();
  }
}

debugGrafana();
