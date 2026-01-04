#!/usr/bin/env node
const VPSConnection = require('./vps-connection.js');

async function fixMountIssue() {
  const vps = new VPSConnection();
  
  try {
    await vps.connect();
    
    console.log('🔧 Fixing mount paths...\n');
    
    // Check current files
    console.log('📁 Current files:');
    const filesCheck = await vps.exec('ls -la /root/monitoring/grafana/ && ls -la /root/monitoring/grafana/dashboards/');
    console.log(filesCheck.stdout);
    
    // Remove broken container
    await vps.exec('docker rm -f v-edfinance-grafana');
    
    // Create Grafana with simplified mounts (directory only, not individual files for dashboards)
    console.log('\n🚀 Creating container with fixed mounts...');
    const createCmd = `
docker run -d \\
  --name v-edfinance-grafana \\
  --restart unless-stopped \\
  -p 3003:3000 \\
  -e GF_SECURITY_ADMIN_USER=admin \\
  -e GF_SECURITY_ADMIN_PASSWORD=admin \\
  -e GF_INSTALL_PLUGINS=grafana-clock-panel,grafana-simple-json-datasource \\
  -v grafana-data:/var/lib/grafana \\
  -v /root/monitoring/grafana/datasources.yml:/etc/grafana/provisioning/datasources/datasources.yml:ro \\
  -v /root/monitoring/grafana/dashboards.yml:/etc/grafana/provisioning/dashboards/dashboards.yml:ro \\
  -v /root/monitoring/grafana/dashboards:/var/lib/grafana/dashboards:ro \\
  --network v-edfinance-monitoring \\
  grafana/grafana:latest
    `.trim();
    
    const createResult = await vps.exec(createCmd);
    console.log(createResult.stdout);
    
    // Wait
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // Check
    console.log('\n✅ Status:');
    const statusResult = await vps.exec('docker ps | grep grafana');
    console.log(statusResult.stdout);
    
    const logsResult = await vps.exec('docker logs v-edfinance-grafana --tail 15');
    console.log('\n📋 Logs:\n' + logsResult.stdout);
    
    const healthResult = await vps.exec('curl -s http://localhost:3000/api/health');
    console.log('\n🏥 Health:\n' + healthResult.stdout);
    
    console.log('\n✅ http://103.54.153.248:3003');
    
  } catch (error) {
    console.error('❌', error.message);
  } finally {
    vps.disconnect();
  }
}

fixMountIssue();
