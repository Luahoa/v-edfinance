#!/usr/bin/env node

/**
 * Check if Dokploy is installed on VPS
 * Part of ved-et78-dokploy-project (Track 2)
 */

const VPSConnection = require('./vps-connection');

async function checkDokploy() {
  const vps = new VPSConnection();
  
  try {
    console.log('🔍 Checking VPS for Dokploy installation...\n');
    await vps.connect();
    
    // Check 1: Docker containers
    console.log('1. Checking Docker containers for Dokploy...');
    const dockerPs = await vps.exec('docker ps --format "{{.Names}}" | grep -i dokploy || echo "NOT_FOUND"');
    
    if (dockerPs.stdout.trim() !== 'NOT_FOUND' && dockerPs.stdout.trim() !== '') {
      console.log('   ✅ Found Dokploy containers:');
      console.log(`   ${dockerPs.stdout.trim()}\n`);
    } else {
      console.log('   ❌ No Dokploy containers found\n');
    }
    
    // Check 2: Dokploy CLI
    console.log('2. Checking for Dokploy CLI...');
    const dokployCli = await vps.exec('which dokploy || echo "NOT_FOUND"');
    
    if (dokployCli.stdout.trim() !== 'NOT_FOUND') {
      console.log('   ✅ Dokploy CLI found at:', dokployCli.stdout.trim());
      
      // Get version
      const version = await vps.exec('dokploy version || echo "VERSION_UNKNOWN"');
      console.log('   Version:', version.stdout.trim(), '\n');
    } else {
      console.log('   ❌ Dokploy CLI not found\n');
    }
    
    // Check 3: Dokploy directories
    console.log('3. Checking for Dokploy directories...');
    const dokployDirs = await vps.exec('ls -la /etc/dokploy 2>&1 || echo "NOT_FOUND"');
    
    if (!dokployDirs.stdout.includes('No such file or directory')) {
      console.log('   ✅ Dokploy directory exists: /etc/dokploy\n');
    } else {
      console.log('   ❌ Dokploy directory not found\n');
    }
    
    // Check 4: Check if port 3000 is in use (Dokploy default)
    console.log('4. Checking for Dokploy web interface (port 3000)...');
    const port3000 = await vps.exec('netstat -tuln | grep :3000 || echo "NOT_LISTENING"');
    
    if (port3000.stdout.trim() !== 'NOT_LISTENING') {
      console.log('   ✅ Port 3000 is listening (likely Dokploy UI)');
      console.log(`   ${port3000.stdout.trim()}\n`);
    } else {
      console.log('   ❌ Port 3000 not listening\n');
    }
    
    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const isDokployInstalled = 
      dockerPs.stdout.trim() !== 'NOT_FOUND' && dockerPs.stdout.trim() !== '' ||
      dokployCli.stdout.trim() !== 'NOT_FOUND' ||
      port3000.stdout.trim() !== 'NOT_LISTENING';
    
    if (isDokployInstalled) {
      console.log('✅ RESULT: Dokploy IS installed on VPS');
      console.log('\n📋 Next steps for ved-et78-dokploy-project:');
      console.log('   1. Access Dokploy UI: http://103.54.153.248:3000');
      console.log('   2. Create project: v-edfinance-staging');
      console.log('   3. Generate webhook URL');
      console.log('   4. Configure 4 services (PostgreSQL, API, Web, Nginx)');
    } else {
      console.log('❌ RESULT: Dokploy NOT installed on VPS');
      console.log('\n📋 Fallback options:');
      console.log('   Option A: Install Dokploy (requires manual installation)');
      console.log('   Option B: Use docker-compose.production.yml directly');
      console.log('   Option C: Use GitHub Actions → Docker Hub → Manual deploy');
      console.log('\n💡 Recommendation: Use Option B (docker-compose) for ved-et78');
      console.log('   - GitHub Actions builds images → Docker Hub');
      console.log('   - VPS pulls images via docker-compose pull');
      console.log('   - No Dokploy dependency needed');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('❌ Error checking Dokploy:', error.message);
    process.exit(1);
  } finally {
    vps.disconnect();
  }
}

// Run check
checkDokploy().catch(console.error);
