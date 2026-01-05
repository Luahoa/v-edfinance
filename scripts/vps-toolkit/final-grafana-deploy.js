#!/usr/bin/env node
const VPSConnection = require('./vps-connection.js');
const path = require('path');

async function finalDeploy() {
  const vps = new VPSConnection();
  
  try {
    await vps.connect();
    
    console.log('🚀 Final Grafana deployment...\n');
    
    // Upload updated docker-compose
    console.log('📤 Uploading updated docker-compose.monitoring.yml...');
    await vps.uploadFile(
      path.join(__dirname, '../../docker-compose.monitoring.yml'),
      '/root/docker-compose.monitoring.yml'
    );
    
    // Remove all containers
    console.log('🗑️ Cleaning up...');
    await vps.exec('docker rm -f $(docker ps -aq --filter "name=grafana") 2>/dev/null || true');
    
    // Deploy with proper compose
    console.log('🚀 Deploying Grafana...');
    const deployResult = await vps.exec('cd /root && docker compose -f docker-compose.monitoring.yml up -d grafana --no-deps');
    console.log(deployResult.stdout);
    
    // Wait for startup
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // Verify
    console.log('\n✅ Verification:');
    const statusResult = await vps.exec('docker ps --format "{{.Names}}: {{.Status}} {{.Ports}}" | grep grafana');
    console.log(statusResult.stdout);
    
    const logsResult = await vps.exec('docker logs v-edfinance-grafana --tail 15');
    console.log('\n📋 Logs:\n' + logsResult.stdout);
    
    console.log('\n✅ Grafana deployed successfully!');
    console.log('🌐 Access: http://103.54.153.248:3003');
    console.log('🔐 Credentials: admin/admin');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    vps.disconnect();
  }
}

finalDeploy();
