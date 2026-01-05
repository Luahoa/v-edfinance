#!/usr/bin/env node
const VPSConnection = require('./vps-connection.js');

async function diagnoseGrafana() {
  const vps = new VPSConnection();
  
  try {
    await vps.connect();
    
    console.log('🔍 Diagnosing Grafana issue...\n');
    
    // Check all containers (including stopped)
    console.log('📦 All containers:');
    const allContainers = await vps.exec('docker ps -a | grep -E "grafana|CONTAINER"');
    console.log(allContainers.stdout);
    
    // Check if config files exist
    console.log('\n📁 Config files:');
    const configCheck = await vps.exec('ls -la /root/monitoring/grafana/');
    console.log(configCheck.stdout);
    
    // Try to start Grafana specifically
    console.log('\n🚀 Starting Grafana...');
    const startResult = await vps.exec('cd /root && docker compose -f docker-compose.monitoring.yml up -d grafana 2>&1');
    console.log(startResult.stdout);
    
    // Wait and check again
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n📊 Container status after start:');
    const statusAfter = await vps.exec('docker ps -a | grep grafana');
    console.log(statusAfter.stdout);
    
    // Check logs if container exists
    console.log('\n📋 Container logs:');
    const logs = await vps.exec('docker logs v-edfinance-grafana 2>&1 || echo "No container found"');
    console.log(logs.stdout);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    vps.disconnect();
  }
}

diagnoseGrafana();
