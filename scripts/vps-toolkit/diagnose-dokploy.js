/**
 * Diagnose Dokploy Deployment Status
 * Checks VPS state, container status, and Dokploy CLI availability
 */

const VPSConnection = require('./vps-connection');

async function main() {
  const vps = new VPSConnection();
  
  try {
    console.log('='.repeat(60));
    console.log('DOKPLOY DEPLOYMENT DIAGNOSTICS');
    console.log('='.repeat(60));
    
    await vps.connect();
    
    // 1. Check Docker containers
    console.log('\n📦 Docker Containers:');
    const containers = await vps.exec('docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"');
    console.log(containers.stdout || 'No containers found');
    
    // 2. Check Docker Swarm services
    console.log('\n🐝 Docker Swarm Services:');
    const services = await vps.exec('docker service ls 2>/dev/null || echo "Not in swarm mode"');
    console.log(services.stdout);
    
    // 3. Check if Dokploy CLI is available
    console.log('\n🔧 Dokploy CLI:');
    const dokployCli = await vps.exec('which dokploy 2>/dev/null || which dkp 2>/dev/null || echo "CLI not found"');
    console.log(dokployCli.stdout.trim());
    
    // Check for dokploy in common locations
    const dokploySearch = await vps.exec('find /usr -name "dokploy*" 2>/dev/null | head -5');
    if (dokploySearch.stdout.trim()) {
      console.log('Found dokploy binaries:', dokploySearch.stdout);
    }
    
    // 4. Check Dokploy container
    console.log('\n🐳 Dokploy Container Status:');
    const dokployContainer = await vps.exec('docker ps -a --filter "name=dokploy" --format "{{.Names}}: {{.Status}}"');
    console.log(dokployContainer.stdout || 'Dokploy container not found');
    
    // 5. Check if images exist on VPS
    console.log('\n📦 V-EdFinance Images on VPS:');
    const images = await vps.exec('docker images --filter "reference=luahoa/v-edfinance*" --format "{{.Repository}}:{{.Tag}}\t{{.Size}}"');
    console.log(images.stdout || 'No v-edfinance images found');
    
    // 6. Check Docker networks
    console.log('\n🌐 Docker Networks:');
    const networks = await vps.exec('docker network ls --filter "name=vedfinance" --format "{{.Name}}"');
    console.log(networks.stdout || 'No vedfinance networks found');
    
    // 7. Check postgres container and get password
    console.log('\n🐘 Postgres Container:');
    const postgres = await vps.exec('docker ps --filter "name=postgres" --format "{{.Names}}: {{.Status}}"');
    console.log(postgres.stdout || 'No postgres container found');
    
    // Try to get postgres password from running container
    console.log('\n🔑 Postgres Password (from container env):');
    const postgresEnv = await vps.exec('docker inspect vedfinance-postgres 2>/dev/null | grep -A5 "POSTGRES_PASSWORD" | head -1 || echo "Could not extract"');
    console.log(postgresEnv.stdout.trim());
    
    // Alternative: check from environment or compose files
    const composeCheck = await vps.exec('cat /opt/dokploy/*/docker-compose.yml 2>/dev/null | grep POSTGRES_PASSWORD | head -1 || echo "Not found in compose files"');
    console.log('From compose:', composeCheck.stdout.trim());
    
    // 8. Check Dokploy API/Projects
    console.log('\n📁 Dokploy Projects Directory:');
    const dokployDir = await vps.exec('ls -la /opt/dokploy/ 2>/dev/null || echo "Dokploy directory not found"');
    console.log(dokployDir.stdout);
    
    // 9. Port usage
    console.log('\n🔌 Port Usage (80, 3000, 3001):');
    const ports = await vps.exec('ss -tlnp | grep -E ":80|:3000|:3001" || echo "Ports not in use"');
    console.log(ports.stdout);
    
    // 10. Check Dokploy logs
    console.log('\n📋 Recent Dokploy Logs:');
    const logs = await vps.exec('docker logs dokploy --tail 20 2>&1 || echo "Could not get logs"');
    console.log(logs.stdout);
    
    console.log('\n' + '='.repeat(60));
    console.log('DIAGNOSTICS COMPLETE');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    vps.disconnect();
  }
}

main().catch(console.error);
