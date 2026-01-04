#!/usr/bin/env node
const VPSConnection = require('./vps-connection.js');

async function checkStatus() {
  const vps = new VPSConnection();
  
  try {
    await vps.connect();
    
    const allContainers = await vps.exec('docker ps -a --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"');
    console.log('📦 All containers:\n' + allContainers.stdout);
    
    const port3003 = await vps.exec('netstat -tulpn | grep 3003 || echo "Port 3003 not bound"');
    console.log('\n🌐 Port 3003:\n' + port3003.stdout);
    
  } catch (error) {
    console.error('❌', error.message);
  } finally {
    vps.disconnect();
  }
}

checkStatus();
