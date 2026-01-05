#!/usr/bin/env node
const VPSConnection = require('./vps-connection.js');

async function fixGrafanaPath() {
  const vps = new VPSConnection();
  
  try {
    await vps.connect();
    
    console.log('🔧 Fixing Grafana path issue...\n');
    
    // Remove broken container
    console.log('🗑️ Removing broken container...');
    await vps.exec('docker rm -f v-edfinance-grafana');
    
    // Move files to correct location expected by docker-compose
    console.log('📁 Moving config files to correct location...');
    await vps.exec('mkdir -p /root/v-edfinance/monitoring/grafana/dashboards');
    await vps.exec('cp -r /root/monitoring/grafana/* /root/v-edfinance/monitoring/grafana/');
    
    // Verify files
    console.log('\n✅ Verifying files:');
    const verifyResult = await vps.exec('ls -la /root/v-edfinance/monitoring/grafana/');
    console.log(verifyResult.stdout);
    
    // Recreate container with correct paths
    console.log('\n🚀 Creating Grafana container...');
    const createResult = await vps.exec('cd /root && docker compose -f docker-compose.monitoring.yml up -d grafana --no-deps');
    console.log(createResult.stdout);
    
    // Wait for startup
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // Check status
    console.log('\n📊 Container status:');
    const statusResult = await vps.exec('docker ps | grep grafana');
    console.log(statusResult.stdout);
    
    // Check logs
    console.log('\n📋 Logs:');
    const logsResult = await vps.exec('docker logs v-edfinance-grafana --tail 20');
    console.log(logsResult.stdout);
    
    // Test HTTP
    console.log('\n🌐 Testing HTTP:');
    const httpTest = await vps.exec('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000');
    console.log(`Status: ${httpTest.stdout}`);
    
    console.log('\n✅ Complete!');
    console.log('🌐 http://103.54.153.248:3003');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    vps.disconnect();
  }
}

fixGrafanaPath();
