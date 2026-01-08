/**
 * Complete Docker-based deployment automation
 * 1. Kill stuck builds
 * 2. Free resources
 * 3. Build with resource limits
 * 4. Deploy with docker-compose
 */

const VPSConnection = require('./vps-connection');

async function main() {
  const vps = new VPSConnection();
  
  try {
    await vps.connect();
    
    console.log('='.repeat(60));
    console.log('DOCKER CLI DEPLOYMENT AUTOMATION');
    console.log('='.repeat(60));
    
    // PHASE 1: Kill stuck builds and free resources
    console.log('\n🛑 PHASE 1: Killing stuck builds...');
    await vps.exec('pkill -f "docker build" 2>/dev/null || true');
    await vps.exec('pkill -f "docker-buildx" 2>/dev/null || true');
    await vps.exec('pkill -f "buildkit" 2>/dev/null || true');
    console.log('Killed build processes');
    
    // PHASE 2: Stop non-essential containers
    console.log('\n🧹 PHASE 2: Stopping monitoring containers...');
    const stopCmds = [
      'docker stop v-edfinance-grafana 2>/dev/null || true',
      'docker stop v-edfinance-prometheus 2>/dev/null || true', 
      'docker stop v-edfinance-glances 2>/dev/null || true',
      'docker stop v-edfinance-netdata 2>/dev/null || true',
      'docker stop v-edfinance-beszel-agent 2>/dev/null || true',
      'docker stop v-edfinance-uptime-kuma 2>/dev/null || true',
    ];
    for (const cmd of stopCmds) {
      await vps.exec(cmd);
    }
    console.log('Stopped monitoring containers');
    
    // PHASE 3: Prune Docker system
    console.log('\n🗑️ PHASE 3: Pruning Docker...');
    const prune = await vps.exec('docker system prune -af --volumes 2>&1 | tail -3');
    console.log(prune.stdout);
    
    // Check resources
    console.log('\n💻 Resource check:');
    const resources = await vps.exec('free -h | head -2 && df -h / | tail -1');
    console.log(resources.stdout);
    
    // PHASE 4: Get postgres password from swarm
    console.log('\n🔑 PHASE 4: Getting postgres password...');
    const pgEnv = await vps.exec("docker service inspect vedfinance-postgres-4qxzyo --format '{{json .Spec.TaskTemplate.ContainerSpec.Env}}' 2>/dev/null");
    console.log('Postgres env:', pgEnv.stdout);
    
    // Parse password
    let pgPassword = '';
    try {
      const envArray = JSON.parse(pgEnv.stdout);
      for (const env of envArray) {
        if (env.startsWith('POSTGRES_PASSWORD=')) {
          pgPassword = env.split('=')[1];
          break;
        }
      }
    } catch (e) {
      console.log('Could not parse password, will use default');
      pgPassword = 'vedfinance_secure_password';
    }
    console.log(`Password found: ${pgPassword ? '***' : 'NO'}`);
    
    // PHASE 5: Create .env.production file
    console.log('\n📝 PHASE 5: Creating environment file...');
    const jwtSecret = 'vedfinance_jwt_secret_' + Date.now();
    const envContent = `
POSTGRES_PASSWORD=${pgPassword || 'vedfinance_secure_password'}
JWT_SECRET=${jwtSecret}
JWT_REFRESH_SECRET=${jwtSecret}
ALLOWED_ORIGINS=http://103.54.153.248,http://localhost
WEB_PUBLIC_URL=http://103.54.153.248
NODE_ENV=production
`;
    await vps.exec(`cat > /root/v-edfinance/.env.production << 'EOF'
${envContent}
EOF`);
    console.log('Created .env.production');
    
    // PHASE 6: Create optimized docker-compose for VPS
    console.log('\n📝 PHASE 6: Creating optimized docker-compose...');
    const composeContent = `
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    image: v-edfinance-api:local
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DATABASE_URL=postgresql://postgres:\${POSTGRES_PASSWORD}@vedfinance-postgres:5432/v_edfinance
      - JWT_SECRET=\${JWT_SECRET}
      - JWT_REFRESH_SECRET=\${JWT_REFRESH_SECRET}
    ports:
      - "3001:3001"
    networks:
      - vedfinance-net
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    image: v-edfinance-web:local
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=http://api:3001
      - NEXT_PUBLIC_APP_URL=http://103.54.153.248
    ports:
      - "3004:3000"
    networks:
      - vedfinance-net
    restart: unless-stopped
    depends_on:
      api:
        condition: service_healthy
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'

  nginx:
    build:
      context: .
      dockerfile: docker/nginx/Dockerfile
    image: v-edfinance-nginx:local
    ports:
      - "80:80"
    networks:
      - vedfinance-net
    restart: unless-stopped
    depends_on:
      - web
      - api

networks:
  vedfinance-net:
    external: true
`;
    
    await vps.exec(`cat > /root/v-edfinance/docker-compose.local.yml << 'EOF'
${composeContent}
EOF`);
    console.log('Created docker-compose.local.yml');
    
    // PHASE 7: Create network if not exists
    console.log('\n🌐 PHASE 7: Creating network...');
    await vps.exec('docker network create vedfinance-net 2>/dev/null || true');
    
    // PHASE 8: Build images one at a time with limits
    console.log('\n🔨 PHASE 8: Building images (this will take time)...');
    console.log('Starting background build with nohup...');
    
    const buildScript = `#!/bin/bash
set -e
cd /root/v-edfinance
export DOCKER_BUILDKIT=1

echo "=== Starting build at $(date) ===" | tee /root/deploy.log

# Build API first (smallest)
echo "Building API..." | tee -a /root/deploy.log
docker build --memory=1g --cpu-period=100000 --cpu-quota=50000 \\
  -t v-edfinance-api:local -f apps/api/Dockerfile . 2>&1 | tee -a /root/deploy.log

# Build Nginx (very small)
echo "Building Nginx..." | tee -a /root/deploy.log
docker build --memory=512m \\
  -t v-edfinance-nginx:local -f docker/nginx/Dockerfile . 2>&1 | tee -a /root/deploy.log

# Build Web (largest - needs more memory)
echo "Building Web..." | tee -a /root/deploy.log
docker build --memory=1.5g --cpu-period=100000 --cpu-quota=50000 \\
  -t v-edfinance-web:local -f apps/web/Dockerfile . 2>&1 | tee -a /root/deploy.log

# Deploy
echo "Deploying with docker-compose..." | tee -a /root/deploy.log
docker compose -f docker-compose.local.yml --env-file .env.production up -d 2>&1 | tee -a /root/deploy.log

echo "=== Deployment complete at $(date) ===" | tee -a /root/deploy.log
echo "DEPLOY_SUCCESS" >> /root/deploy.log
`;

    await vps.exec(`cat > /root/v-edfinance/deploy.sh << 'SCRIPT'
${buildScript}
SCRIPT`);
    await vps.exec('chmod +x /root/v-edfinance/deploy.sh');
    
    // Start deployment in background
    await vps.exec('cd /root/v-edfinance && nohup ./deploy.sh > /root/deploy.log 2>&1 &');
    console.log('Deployment started in background!');
    
    // Wait and check
    console.log('\n⏳ Waiting 10 seconds to verify...');
    await new Promise(r => setTimeout(r, 10000));
    
    const checkProc = await vps.exec('ps aux | grep -E "docker build|deploy.sh" | grep -v grep | head -3');
    console.log('Running processes:', checkProc.stdout || 'None found');
    
    const checkLog = await vps.exec('tail -20 /root/deploy.log 2>/dev/null || echo "Log not ready"');
    console.log('Deploy log:', checkLog.stdout);
    
    console.log('\n' + '='.repeat(60));
    console.log('DEPLOYMENT STARTED');
    console.log('Monitor: node scripts/vps-toolkit/check-deploy-status.js');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    vps.disconnect();
  }
}

main().catch(console.error);
