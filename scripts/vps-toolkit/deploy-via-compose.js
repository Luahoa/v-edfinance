#!/usr/bin/env node

/**
 * Deploy V-EdFinance to VPS via Docker Compose
 * Part of ved-et78 (Option B: Docker Compose Fallback)
 * 
 * Workflow:
 * 1. Pull latest images from Docker Hub
 * 2. Restart services with zero-downtime
 * 3. Verify health checks
 * 4. Report deployment status
 */

const VPSConnection = require('./vps-connection');

const DEPLOY_DIR = '/root/v-edfinance';
const COMPOSE_FILE = 'docker-compose.production.yml';
const SERVICES = ['postgres', 'api', 'web', 'nginx'];

async function deployViaCompose() {
  const vps = new VPSConnection();
  
  try {
    console.log('🚀 Starting deployment to VPS via Docker Compose\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    await vps.connect();
    
    // Step 1: Verify deployment directory exists
    console.log('📁 Step 1: Verifying deployment directory...');
    const dirCheck = await vps.exec(`ls -la ${DEPLOY_DIR}/${COMPOSE_FILE} 2>&1`);
    
    if (dirCheck.stdout.includes('No such file or directory')) {
      throw new Error(`Deployment directory not found: ${DEPLOY_DIR}/${COMPOSE_FILE}`);
    }
    console.log(`   ✅ Found: ${DEPLOY_DIR}/${COMPOSE_FILE}\n`);
    
    // Step 2: Pull latest images from Docker Hub
    console.log('📥 Step 2: Pulling latest images from Docker Hub...');
    console.log('   This may take 2-5 minutes depending on network speed...\n');
    
    const pullResult = await vps.exec(
      `cd ${DEPLOY_DIR} && docker-compose -f ${COMPOSE_FILE} pull`,
      { timeout: 300000 } // 5 minute timeout
    );
    
    if (pullResult.code !== 0) {
      console.error('   ❌ Pull failed:', pullResult.stderr);
      throw new Error('Failed to pull images');
    }
    
    console.log('   ✅ Images pulled successfully\n');
    
    // Step 3: Restart services (zero-downtime with recreate)
    console.log('🔄 Step 3: Restarting services with new images...');
    console.log('   Using --force-recreate for zero-downtime deployment...\n');
    
    const upResult = await vps.exec(
      `cd ${DEPLOY_DIR} && docker-compose -f ${COMPOSE_FILE} up -d --force-recreate`,
      { timeout: 180000 } // 3 minute timeout
    );
    
    if (upResult.code !== 0) {
      console.error('   ❌ Service restart failed:', upResult.stderr);
      throw new Error('Failed to restart services');
    }
    
    console.log('   ✅ Services restarted\n');
    
    // Step 4: Wait for services to stabilize
    console.log('⏳ Step 4: Waiting for services to stabilize (30 seconds)...\n');
    await sleep(30000);
    
    // Step 5: Verify services are running
    console.log('🔍 Step 5: Verifying service status...\n');
    
    const psResult = await vps.exec(
      `cd ${DEPLOY_DIR} && docker-compose -f ${COMPOSE_FILE} ps --format json`
    );
    
    console.log('   Service Status:');
    const serviceLines = psResult.stdout.trim().split('\n').filter(line => line.trim());
    
    for (const line of serviceLines) {
      try {
        const service = JSON.parse(line);
        const status = service.State === 'running' ? '✅' : '❌';
        console.log(`   ${status} ${service.Service.padEnd(12)} - ${service.State}`);
      } catch (e) {
        // Fallback for non-JSON output
        console.log(`   ${line}`);
      }
    }
    console.log('');
    
    // Step 6: Run health checks
    console.log('🏥 Step 6: Running health checks...\n');
    
    const healthChecks = [
      {
        name: 'PostgreSQL',
        command: 'docker exec $(docker ps -qf "name=postgres") pg_isready -U postgres || echo "FAILED"'
      },
      {
        name: 'API Health',
        command: 'curl -f http://localhost:3001/health || echo "FAILED"'
      },
      {
        name: 'Web',
        command: 'curl -f http://localhost:3000 || echo "FAILED"'
      },
      {
        name: 'Nginx',
        command: 'curl -f http://localhost/health || echo "FAILED"'
      }
    ];
    
    let allHealthy = true;
    
    for (const check of healthChecks) {
      const result = await vps.exec(check.command);
      const isHealthy = !result.stdout.includes('FAILED') && result.code === 0;
      
      if (isHealthy) {
        console.log(`   ✅ ${check.name}`);
      } else {
        console.log(`   ❌ ${check.name} - FAILED`);
        console.log(`      Error: ${result.stderr || result.stdout}`);
        allHealthy = false;
      }
    }
    console.log('');
    
    // Step 7: Show service logs (last 10 lines each)
    if (!allHealthy) {
      console.log('📋 Service Logs (last 10 lines):\n');
      
      for (const service of SERVICES) {
        console.log(`   === ${service.toUpperCase()} ===`);
        const logs = await vps.exec(
          `cd ${DEPLOY_DIR} && docker-compose -f ${COMPOSE_FILE} logs --tail=10 ${service}`
        );
        console.log(logs.stdout.split('\n').map(l => `   ${l}`).join('\n'));
        console.log('');
      }
    }
    
    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (allHealthy) {
      console.log('✅ DEPLOYMENT SUCCESSFUL!\n');
      console.log('🌐 Access your application:');
      console.log('   - Web: http://103.54.153.248:3000');
      console.log('   - API: http://103.54.153.248:3001/health');
      console.log('   - Nginx: http://103.54.153.248\n');
      
      // Get image tags
      console.log('📦 Deployed Images:');
      const imagesResult = await vps.exec(
        `cd ${DEPLOY_DIR} && docker-compose -f ${COMPOSE_FILE} images --format json`
      );
      
      const imageLines = imagesResult.stdout.trim().split('\n').filter(line => line.trim());
      for (const line of imageLines) {
        try {
          const img = JSON.parse(line);
          if (img.Repository && img.Tag) {
            console.log(`   - ${img.Repository}:${img.Tag}`);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
      
      console.log('');
      return true;
    } else {
      console.log('⚠️ DEPLOYMENT COMPLETED WITH WARNINGS\n');
      console.log('Some health checks failed. Please review logs above.\n');
      console.log('To troubleshoot:');
      console.log('   1. Check logs: docker-compose -f docker-compose.production.yml logs <service>');
      console.log('   2. Restart failed services: docker-compose -f docker-compose.production.yml restart <service>');
      console.log('   3. Rollback: docker-compose -f docker-compose.production.yml down && docker-compose up -d\n');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ DEPLOYMENT FAILED\n');
    console.error('Error:', error.message);
    console.error('\nStack trace:', error.stack);
    
    console.log('\n🔧 Troubleshooting steps:');
    console.log('   1. Verify VPS connection: node test-connection.js');
    console.log('   2. Check Docker status: ssh vps "docker ps"');
    console.log('   3. Check compose file: ssh vps "cat /root/v-edfinance/docker-compose.production.yml"');
    console.log('   4. Manual deploy: ssh vps "cd /root/v-edfinance && docker-compose -f docker-compose.production.yml up -d"\n');
    
    process.exit(1);
  } finally {
    vps.disconnect();
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run deployment
console.log('V-EdFinance Deployment Script');
console.log('Epic: ved-et78 (CI/CD Deployment)');
console.log('Track: 2 (GreenCastle - Docker Compose)\n');

deployViaCompose()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
