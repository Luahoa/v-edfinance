/**
 * Free up VPS resources by stopping non-essential containers
 */

const VPSConnection = require('./vps-connection');

async function main() {
  const vps = new VPSConnection();
  
  try {
    await vps.connect();
    
    console.log('='.repeat(60));
    console.log('FREEING VPS RESOURCES');
    console.log('='.repeat(60));
    
    // 1. Current resource state
    console.log('\n💻 Current state:');
    const before = await vps.exec('free -h && echo "---" && uptime');
    console.log(before.stdout);
    
    // 2. List containers consuming resources
    console.log('\n📦 Running containers:');
    const containers = await vps.exec('docker ps --format "table {{.Names}}\t{{.Status}}"');
    console.log(containers.stdout);
    
    // 3. Stop non-essential monitoring containers temporarily
    console.log('\n🛑 Stopping monitoring containers to free resources...');
    const stopMonitoring = await vps.exec(`
      docker stop v-edfinance-grafana 2>/dev/null || true
      docker stop v-edfinance-prometheus 2>/dev/null || true
      docker stop v-edfinance-glances 2>/dev/null || true
      docker stop v-edfinance-netdata 2>/dev/null || true
      docker stop v-edfinance-beszel-agent 2>/dev/null || true
      docker stop v-edfinance-uptime-kuma 2>/dev/null || true
      echo "Stopped monitoring containers"
    `);
    console.log(stopMonitoring.stdout);
    
    // 4. Prune unused images and containers
    console.log('\n🧹 Pruning unused Docker resources...');
    const prune = await vps.exec('docker system prune -f 2>&1 | tail -5');
    console.log(prune.stdout);
    
    // 5. Check resources after cleanup
    console.log('\n💻 After cleanup:');
    const after = await vps.exec('free -h && echo "---" && uptime && echo "---" && df -h /');
    console.log(after.stdout);
    
    // 6. Check if build is still running
    console.log('\n🔨 Build process status:');
    const build = await vps.exec('ps aux | grep "docker build" | grep -v grep || echo "Build not running"');
    console.log(build.stdout);
    
    console.log('\n' + '='.repeat(60));
    console.log('CLEANUP COMPLETE - Resources freed');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    vps.disconnect();
  }
}

main().catch(console.error);
