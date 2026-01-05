#!/usr/bin/env node
/**
 * Deploy Grafana to VPS with config files
 */

const VPSConnection = require('./vps-connection.js');
const path = require('path');

async function deployGrafana() {
  const vps = new VPSConnection();
  
  try {
    console.log('🚀 Starting Grafana deployment...\n');
    
    // Connect
    await vps.connect();
    
    // Step 1: Create directories
    console.log('📁 Creating directories...');
    await vps.exec('mkdir -p /root/monitoring/grafana/datasources /root/monitoring/grafana/dashboards');
    
    // Step 2: Upload config files
    console.log('📤 Uploading configuration files...');
    const baseDir = path.join(__dirname, '../../monitoring/grafana');
    
    await vps.uploadFile(
      path.join(baseDir, 'datasources.yml'),
      '/root/monitoring/grafana/datasources.yml'
    );
    
    await vps.uploadFile(
      path.join(baseDir, 'dashboards.yml'),
      '/root/monitoring/grafana/dashboards.yml'
    );
    
    await vps.uploadFile(
      path.join(baseDir, 'dashboards/system-overview.json'),
      '/root/monitoring/grafana/dashboards/system-overview.json'
    );
    
    // Step 3: Upload docker-compose file
    console.log('📤 Uploading docker-compose.monitoring.yml...');
    await vps.uploadFile(
      path.join(__dirname, '../../docker-compose.monitoring.yml'),
      '/root/docker-compose.monitoring.yml'
    );
    
    // Step 4: Deploy Grafana container
    console.log('🐳 Deploying Grafana container...');
    const deployResult = await vps.exec('cd /root && docker compose -f docker-compose.monitoring.yml up -d grafana');
    console.log(deployResult.stdout);
    if (deployResult.stderr) console.error(deployResult.stderr);
    
    // Step 5: Wait for container to start
    console.log('⏳ Waiting for Grafana to start...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Step 6: Check logs
    console.log('📋 Checking Grafana logs...');
    const logsResult = await vps.exec('docker logs v-edfinance-grafana --tail 30');
    console.log(logsResult.stdout);
    
    // Step 7: Verify container status
    console.log('✅ Verifying deployment...');
    const statusResult = await vps.exec('docker ps | grep grafana');
    console.log(statusResult.stdout);
    
    console.log('\n✅ Grafana deployment complete!');
    console.log('🌐 Access Grafana at: http://103.54.153.248:3003');
    console.log('🔐 Default credentials: admin/admin');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  } finally {
    vps.disconnect();
  }
}

deployGrafana();
