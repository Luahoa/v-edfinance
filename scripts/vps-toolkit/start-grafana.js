#!/usr/bin/env node
const VPSConnection = require('./vps-connection.js');

async function startGrafana() {
  const vps = new VPSConnection();
  
  try {
    await vps.connect();
    
    console.log('🚀 Starting Grafana container...\n');
    
    // Start the existing container directly
    console.log('▶️  Starting container...');
    const startResult = await vps.exec('docker start v-edfinance-grafana');
    console.log(startResult.stdout);
    
    // Wait for startup
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check status
    console.log('\n📊 Container status:');
    const statusResult = await vps.exec('docker ps | grep grafana');
    console.log(statusResult.stdout);
    
    // Check logs
    console.log('\n📋 Startup logs:');
    const logsResult = await vps.exec('docker logs v-edfinance-grafana --tail 30');
    console.log(logsResult.stdout);
    
    // Test HTTP access
    console.log('\n🌐 Testing HTTP access...');
    const httpTest = await vps.exec('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000');
    console.log(`HTTP Status: ${httpTest.stdout}`);
    
    console.log('\n✅ Grafana started!');
    console.log('🌐 Access at: http://103.54.153.248:3003');
    console.log('🔐 Credentials: admin/admin');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    vps.disconnect();
  }
}

startGrafana();
