#!/usr/bin/env node
/**
 * Deploy Production Services to VPS
 * Epic ved-et78: Full Application Deployment
 */

const VPSConnection = require('./vps-connection.js');
const fs = require('fs');
const path = require('path');

async function main() {
  const vps = new VPSConnection();
  
  try {
    console.log('🚀 Starting Production Deployment (ved-et78)\\n');
    
    // Step 1: Connect
    console.log('1️⃣ Connecting to VPS...');
    await vps.connect();
    
    // Step 2: Check prerequisites
    console.log('\\n2️⃣ Checking prerequisites...');
    const checks = await vps.execMultiple([
      'docker --version',
      'docker compose version',
      'test -f /root/.ssh/authorized_keys && echo "SSH OK" || echo "SSH MISSING"'
    ]);
    
    const dockerOk = checks[0].code === 0;
    const composeOk = checks[1].code === 0;
    const sshOk = checks[2].stdout.includes('SSH OK');
    
    console.log(`  Docker: ${dockerOk ? '✓' : '✗'}`);
    console.log(`  Docker Compose: ${composeOk ? '✓' : '✗'}`);
    console.log(`  SSH: ${sshOk ? '✓' : '✗'}`);
    
    if (!dockerOk || !composeOk) {
      console.error('\\n❌ Docker or Docker Compose not available');
      process.exit(1);
    }
    
    // Step 3: Setup repository directory
    console.log('\\n3️⃣ Setting up repository...');
    const repoDir = '/root/v-edfinance-staging';
    
    const repoSetup = await vps.execMultiple([
      `mkdir -p ${repoDir}`,
      `test -d ${repoDir}/.git && echo "exists" || echo "missing"`
    ]);
    
    const repoExists = repoSetup[1].stdout.includes('exists');
    
    if (!repoExists) {
      console.log('  Cloning repository...');
      const clone = await vps.exec(
        `cd ${repoDir} && git clone https://github.com/Luahoa/v-edfinance.git .`
      );
      if (clone.code !== 0) {
        console.error('Failed to clone:', clone.stderr);
        process.exit(1);
      }
    } else {
      console.log('  Updating repository...');
      await vps.exec(`cd ${repoDir} && git fetch origin && git reset --hard origin/main`);
    }
    console.log('  ✓ Repository ready');
    
    // Step 4: Upload docker-compose.production.yml
    console.log('\\n4️⃣ Uploading docker-compose configuration...');
    const localCompose = path.join(process.cwd(), 'docker-compose.production.yml');
    
    if (!fs.existsSync(localCompose)) {
      console.error('\\n❌ docker-compose.production.yml not found in workspace');
      process.exit(1);
    }
    
    await vps.uploadFile(localCompose, `${repoDir}/docker-compose.production.yml`);
    console.log('  ✓ Configuration uploaded');
    
    // Step 5: Upload .env.production
    console.log('\\n5️⃣ Uploading environment variables...');
    const localEnv = path.join(process.cwd(), '.env.production');
    
    if (!fs.existsSync(localEnv)) {
      console.error('\\n❌ .env.production not found in workspace');
      console.error('Create it first with:');
      console.error('  DATABASE_URL=postgresql://postgres:Halinh!@34@postgres:5432/v_edfinance');
      console.error('  JWT_SECRET=<your-secret>');
      console.error('  ALLOWED_ORIGINS=https://staging.v-edfinance.com');
      process.exit(1);
    }
    
    await vps.uploadFile(localEnv, `${repoDir}/.env.production`);
    console.log('  ✓ Environment variables uploaded');
    
    // Step 6: Create directory structure
    console.log('\\n6️⃣ Creating directory structure...');
    await vps.execMultiple([
      `mkdir -p ${repoDir}/apps/web`,
      `mkdir -p ${repoDir}/apps/api`,
      `mkdir -p ${repoDir}/docker/nginx`
    ]);
    console.log('  ✓ Directories created');
    
    // Step 7: Upload Dockerfiles and configs
    console.log('\\n7️⃣ Uploading application files...');
    const filesToUpload = [
      { local: 'apps/web/Dockerfile', remote: `${repoDir}/apps/web/Dockerfile` },
      { local: 'apps/api/Dockerfile', remote: `${repoDir}/apps/api/Dockerfile` },
      { local: 'docker/nginx/nginx.conf', remote: `${repoDir}/docker/nginx/nginx.conf` },
      { local: 'docker/nginx/Dockerfile', remote: `${repoDir}/docker/nginx/Dockerfile` }
    ];
    
    for (const file of filesToUpload) {
      const localPath = path.join(process.cwd(), file.local);
      if (fs.existsSync(localPath)) {
        await vps.uploadFile(localPath, file.remote);
        console.log(`  ✓ ${file.local}`);
      } else {
        console.warn(`  ⚠ Skipped ${file.local} (not found)`);
      }
    }
    
    // Step 8: Build and deploy
    console.log('\\n8️⃣ Building and deploying services...');
    console.log('  (This may take 5-15 minutes)');
    
    const deployment = await vps.exec(
      `cd ${repoDir} && docker compose -f docker-compose.production.yml --env-file .env.production up -d --build`,
      { timeout: 900000 } // 15 minutes timeout
    );
    
    if (deployment.code !== 0) {
      console.error('\\n❌ Deployment failed:', deployment.stderr);
      console.log('\\nLogs for debugging:');
      const logs = await vps.exec(`cd ${repoDir} && docker compose -f docker-compose.production.yml logs --tail=50`);
      console.log(logs.stdout);
      process.exit(1);
    }
    console.log('  ✓ Services deployed');
    
    // Step 9: Wait for health checks
    console.log('\\n9️⃣ Waiting for services to become healthy (90s)...');
    await new Promise(resolve => setTimeout(resolve, 90000));
    
    // Step 10: Verify deployment
    console.log('\\n🔟 Verifying deployment...');
    const verify = await vps.execMultiple([
      `cd ${repoDir} && docker compose -f docker-compose.production.yml ps`,
      'docker ps --filter name=nginx --format "{{.Names}} {{.Status}}"',
      'docker ps --filter name=web --format "{{.Names}} {{.Status}}"',
      'docker ps --filter name=api --format "{{.Names}} {{.Status}}"',
      'docker ps --filter name=postgres --format "{{.Names}} {{.Status}}"',
      'curl -f http://localhost/health || echo "NGINX_FAILED"',
      'curl -f http://localhost:3001/health || echo "API_FAILED"',
      'curl -f http://localhost:3000 || echo "WEB_FAILED"'
    ]);
    
    console.log('\\n📊 Deployment Status:');
    console.log('\\n  Container Status:');
    console.log(verify[0].stdout);
    console.log('\\n  Individual Services:');
    console.log('  Nginx:', verify[1].stdout.trim() || '✗ NOT RUNNING');
    console.log('  Web:', verify[2].stdout.trim() || '✗ NOT RUNNING');
    console.log('  API:', verify[3].stdout.trim() || '✗ NOT RUNNING');
    console.log('  PostgreSQL:', verify[4].stdout.trim() || '✗ NOT RUNNING');
    
    console.log('\\n  Health Checks:');
    console.log('  Nginx:', verify[5].stdout.includes('FAILED') ? '✗ FAILED' : '✓ OK');
    console.log('  API:', verify[6].stdout.includes('FAILED') ? '✗ FAILED' : '✓ OK');
    console.log('  Web:', verify[7].stdout.includes('FAILED') ? '✗ FAILED' : '✓ OK');
    
    // Step 11: Database migrations
    console.log('\\n1️⃣1️⃣ Running database migrations...');
    const migrate = await vps.exec(
      `cd ${repoDir} && docker compose -f docker-compose.production.yml exec -T api npx prisma migrate deploy`
    );
    
    if (migrate.code === 0) {
      console.log('  ✓ Migrations applied');
    } else {
      console.warn('  ⚠ Migration warning (may already be applied)');
    }
    
    console.log('\\n✅ Deployment Complete!');
    console.log('\\n📍 Next Steps:');
    console.log('  1. Configure Cloudflare DNS:');
    console.log('     - staging.v-edfinance.com → 103.54.153.248 (A record, Proxied)');
    console.log('     - api.staging.v-edfinance.com → 103.54.153.248 (A record, Proxied)');
    console.log('\\n  2. Verify endpoints:');
    console.log('     - http://103.54.153.248 (Nginx)');
    console.log('     - http://103.54.153.248:3001/health (API direct)');
    console.log('     - http://103.54.153.248:3000 (Web direct)');
    console.log('\\n  3. After Cloudflare DNS:');
    console.log('     - https://staging.v-edfinance.com (Web via CDN)');
    console.log('     - https://api.staging.v-edfinance.com/health (API via CDN)');
    
  } catch (error) {
    console.error('\\n❌ Deployment failed:', error.message);
    process.exit(1);
  } finally {
    vps.disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
