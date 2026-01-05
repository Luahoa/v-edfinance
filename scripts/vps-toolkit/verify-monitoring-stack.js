/**
 * Verify Monitoring Stack Deployment
 * Task: ved-drx
 */

const VPSConnection = require('./vps-connection');

async function verifyMonitoring() {
  console.log('==============================================');
  console.log('VED-DRX: Verify Monitoring Stack');
  console.log('==============================================\n');

  const vps = new VPSConnection();

  try {
    await vps.connect();

    // Monitoring endpoints to check
    const endpoints = [
      { name: 'Grafana', url: 'http://103.54.153.248:3003/api/health' },
      { name: 'Prometheus', url: 'http://103.54.153.248:9090/-/healthy' },
      { name: 'Netdata', url: 'http://103.54.153.248:19999/api/v1/info' },
      { name: 'Uptime Kuma', url: 'http://103.54.153.248:3002' },
      { name: 'Glances', url: 'http://103.54.153.248:61208/api/3/system' },
    ];

    console.log('Checking monitoring endpoints:\n');

    for (const endpoint of endpoints) {
      const cmd = `curl -s -o /dev/null -w "%{http_code}" ${endpoint.url} 2>/dev/null || echo "000"`;
      const result = await vps.exec(cmd);
      const statusCode = result.stdout.trim();
      
      const status = statusCode === '200' ? '✅' : 
                     statusCode === '000' ? '❌' :
                     `⚠️  ${statusCode}`;
      
      console.log(`  ${status} ${endpoint.name.padEnd(20)} ${endpoint.url}`);
    }

    // Check Docker containers status
    console.log('\n\nDocker Containers Status:\n');
    const dockerCmd = `docker ps --filter 'name=v-edfinance' --format 'table {{.Names}}\\t{{.Status}}'`;
    const dockerResult = await vps.exec(dockerCmd);
    console.log(dockerResult.stdout);

    console.log('\n==============================================');
    console.log('✅ VED-DRX Monitoring Verification Complete');
    console.log('==============================================');
    console.log('\nAccess URLs:');
    console.log('  • Grafana:     http://103.54.153.248:3003 (admin/admin)');
    console.log('  • Prometheus:  http://103.54.153.248:9090');
    console.log('  • Netdata:     http://103.54.153.248:19999');
    console.log('  • Uptime Kuma: http://103.54.153.248:3002');
    console.log('  • Glances:     http://103.54.153.248:61208');

  } catch (error) {
    console.error('\n❌ Failed:', error.message);
    process.exit(1);
  } finally {
    vps.disconnect();
  }
}

verifyMonitoring();
