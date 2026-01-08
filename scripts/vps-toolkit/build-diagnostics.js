/**
 * Detailed build diagnostics
 */

const VPSConnection = require('./vps-connection');

async function main() {
  const vps = new VPSConnection();
  
  try {
    await vps.connect();
    
    console.log('='.repeat(60));
    console.log('BUILD DIAGNOSTICS');
    console.log('='.repeat(60));
    
    // 1. Check system resources
    console.log('\n💻 System Resources:');
    const resources = await vps.exec('free -h && echo "---" && df -h / && echo "---" && uptime');
    console.log(resources.stdout);
    
    // 2. Check docker build processes
    console.log('\n🐳 Docker processes:');
    const docker = await vps.exec('ps aux | grep -E "docker|buildkit" | grep -v grep');
    console.log(docker.stdout || 'No docker processes');
    
    // 3. Check last 100 lines of build log
    console.log('\n📋 Last 100 lines of build log:');
    const log = await vps.exec('tail -100 /root/build.log');
    console.log(log.stdout);
    
    // 4. Check if build process is stuck or consuming resources
    console.log('\n📊 Docker stats (snapshot):');
    const stats = await vps.exec('docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null | head -10');
    console.log(stats.stdout);
    
    // 5. Check for OOM or other issues
    console.log('\n⚠️ Recent kernel/OOM messages:');
    const dmesg = await vps.exec('dmesg -T | tail -20 | grep -iE "oom|kill|memory|error" || echo "No OOM messages"');
    console.log(dmesg.stdout);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    vps.disconnect();
  }
}

main().catch(console.error);
