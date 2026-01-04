#!/usr/bin/env node
const VPSConnection = require('./vps-connection.js');

async function verifyComplete() {
  const vps = new VPSConnection();
  
  try {
    await vps.connect();
    
    console.log('✅ Final Verification\n');
    
    // Health check
    const healthResult = await vps.exec('curl -s http://localhost:3000/api/health');
    console.log('🏥 Grafana Health:');
    console.log(healthResult.stdout);
    
    // Test datasource
    console.log('\n🔌 Testing Prometheus datasource:');
    const dsResult = await vps.exec('curl -s -u admin:admin http://localhost:3000/api/datasources');
    console.log(dsResult.stdout);
    
    // Test Prometheus connection from Grafana
    console.log('\n📊 Testing Prometheus query:');
    const queryResult = await vps.exec('curl -s "http://localhost:9090/api/v1/query?query=up"');
    console.log(queryResult.stdout);
    
    // List all monitoring tools
    console.log('\n📦 All monitoring tools:');
    const toolsResult = await vps.exec('docker ps --format "{{.Names}}: http://103.54.153.248:{{.Ports}}" | grep v-edfinance | sed "s/0.0.0.0://" | sed "s/->.*//"');
    console.log(toolsResult.stdout);
    
    console.log('\n✅ Deployment Complete!');
    console.log('\n🌐 Access Points:');
    console.log('Grafana:      http://103.54.153.248:3003 (admin/admin)');
    console.log('Prometheus:   http://103.54.153.248:9090');
    console.log('Netdata:      http://103.54.153.248:19999');
    console.log('Uptime Kuma:  http://103.54.153.248:3002');
    console.log('Glances:      http://103.54.153.248:61208');
    
  } catch (error) {
    console.error('❌', error.message);
  } finally {
    vps.disconnect();
  }
}

verifyComplete();
