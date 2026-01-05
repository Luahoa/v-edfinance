/**
 * Quick fix: Upload API Dockerfile to VPS and continue deployment
 */

const fs = require('fs');
const path = require('path');
const VPSConnection = require('./vps-connection');

async function main() {
  const vps = new VPSConnection();
  await vps.connect();
  
  try {
    // Read local Dockerfile
    const dockerfilePath = path.join(__dirname, '../../apps/api/Dockerfile');
    const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
    
    // Find latest deploy directory
    const findDir = await vps.exec('ls -t /root/ | grep vef- | head -1');
    const latestDir = '/root/' + findDir.stdout.trim();
    
    console.log(`Uploading Dockerfile to ${latestDir}/apps/api/...`);
    
    // Create Dockerfile on VPS
    const escapedContent = dockerfileContent.replace(/\$/g, '\\$').replace(/`/g, '\\`').replace(/"/g, '\\"');
    await vps.exec(`cat > ${latestDir}/apps/api/Dockerfile << 'EOFMARKER'\n${dockerfileContent}\nEOFMARKER`);
    
    // Verify
    const check = await vps.exec(`wc -l ${latestDir}/apps/api/Dockerfile`);
    console.log('Dockerfile created:', check.stdout);
    
    console.log('\n✓ Dockerfile uploaded! Now re-running deployment...\n');
    
  } finally {
    vps.disconnect();
  }
}

main().then(() => {
  // Re-run deployment
  require('./deploy-track2');
}).catch(console.error);
