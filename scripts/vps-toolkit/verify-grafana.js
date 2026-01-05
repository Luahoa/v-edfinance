#!/usr/bin/env node
const VPSConnection = require('./vps-connection.js');

async function verifyGrafana() {
  const vps = new VPSConnection();
  
  try {
    await vps.connect();
    
    console.log('🔍 Verifying Grafana deployment...\n');
    
    // Check all containers with grafana
    const psResult = await vps.exec('docker ps -a | grep grafana');
    console.log('📦 Containers:\n' + psResult.stdout);
    
    // Try to find the running one
    const runningResult = await vps.exec('docker ps --format "{{.ID}}:{{.Names}}:{{.Ports}}" | grep 3003');
    console.log('\n🌐 Port 3003 mappings:\n' + runningResult.stdout);
    
    // Test external access
    console.log('\n🌐 Testing external access...');
    const httpResult = await vps.exec('curl -s http://103.54.153.248:3003/api/health 2>&1');
    console.log(httpResult.stdout);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    vps.disconnect();
  }
}

verifyGrafana();
