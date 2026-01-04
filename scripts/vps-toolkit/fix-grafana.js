#!/usr/bin/env node
/**
 * Fix Grafana deployment - Remove conflicting containers and redeploy
 */

const VPSConnection = require('./vps-connection.js');

async function fixGrafana() {
  const vps = new VPSConnection();
  
  try {
    await vps.connect();
    
    console.log('🔧 Fixing Grafana deployment...\n');
    
    // Remove all monitoring containers
    console.log('🗑️ Removing existing containers...');
    await vps.exec('cd /root && docker compose -f docker-compose.monitoring.yml down');
    
    // Deploy all services fresh
    console.log('🚀 Deploying fresh monitoring stack...');
    const deployResult = await vps.exec('cd /root && docker compose -f docker-compose.monitoring.yml up -d');
    console.log(deployResult.stdout);
    
    // Wait for startup
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check all containers
    console.log('\n📊 Container status:');
    const statusResult = await vps.exec('docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}" | grep v-edfinance');
    console.log(statusResult.stdout);
    
    // Grafana logs
    console.log('\n📋 Grafana logs:');
    const logsResult = await vps.exec('docker logs v-edfinance-grafana --tail 20');
    console.log(logsResult.stdout);
    
    console.log('\n✅ Deployment complete!');
    console.log('🌐 Grafana: http://103.54.153.248:3003');
    console.log('🌐 Prometheus: http://103.54.153.248:9090');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    vps.disconnect();
  }
}

fixGrafana();
