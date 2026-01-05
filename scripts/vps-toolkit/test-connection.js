/**
 * Test VPS SSH Connection
 * Usage: node test-connection.js
 */

const VPSConnection = require('./vps-connection');

async function testConnection() {
  console.log('==============================================');
  console.log('VPS SSH Connection Test');
  console.log('==============================================\n');

  const vps = new VPSConnection();

  try {
    // Step 1: Connect
    console.log('[1/4] Connecting to VPS...');
    await vps.connect();
    console.log('✓ Connection successful\n');

    // Step 2: Get system information
    console.log('[2/4] Fetching system information...');
    const info = await vps.getSystemInfo();
    console.log('✓ System Information:');
    console.log(`  Hostname: ${info.hostname}`);
    console.log(`  OS: ${info.os}`);
    console.log(`  Kernel: ${info.kernel}`);
    console.log(`  Uptime: ${info.uptime}`);
    console.log(`  Memory: ${info.memory}`);
    console.log(`  Disk: ${info.disk}`);
    console.log(`  CPU Cores: ${info.cpu}`);
    console.log(`  Docker: ${info.docker}\n`);

    // Step 3: Test simple command
    console.log('[3/4] Testing command execution...');
    const result = await vps.exec('echo "Hello from VPS!"');
    console.log(`✓ Command output: ${result.stdout.trim()}\n`);

    // Step 4: Check Docker
    console.log('[4/4] Checking Docker installation...');
    const hasDocker = await vps.checkDocker();
    if (hasDocker) {
      console.log('✓ Docker is installed');
      const dockerInfo = await vps.exec('docker ps --format "table {{.Names}}\t{{.Status}}"');
      console.log('\nRunning containers:');
      console.log(dockerInfo.stdout || 'No containers running');
    } else {
      console.log('⚠ Docker is not installed');
    }

    console.log('\n==============================================');
    console.log('✅ All tests passed!');
    console.log('==============================================');

  } catch (error) {
    console.error('\n==============================================');
    console.error('❌ Test failed:', error.message);
    console.error('==============================================');
    process.exit(1);
  } finally {
    vps.disconnect();
  }
}

// Run test
testConnection();
