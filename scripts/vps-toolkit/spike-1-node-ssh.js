/**
 * Spike 1: Test node-ssh library
 * Time-box: 30 minutes
 * Question: Does node-ssh successfully connect to VPS?
 */

const { NodeSSH } = require('node-ssh');
const path = require('path');
const fs = require('fs');

async function testNodeSSH() {
  console.log('==============================================');
  console.log('Spike 1: node-ssh Library Test');
  console.log('==============================================\n');

  const ssh = new NodeSSH();
  const keyPath = path.join(process.env.USERPROFILE || process.env.HOME, '.ssh', 'amp_vps_key');

  try {
    // Step 1: Connection
    console.log('[1/4] Attempting connection...');
    console.log(`Key path: ${keyPath}`);
    console.log(`Key exists: ${fs.existsSync(keyPath)}`);

    await ssh.connect({
      host: '103.54.153.248',
      port: 22,
      username: 'root',
      privateKeyPath: keyPath,
      readyTimeout: 20000,
    });

    console.log('✅ Connection successful!\n');

    // Step 2: Command execution
    console.log('[2/4] Testing command execution...');
    const result = await ssh.execCommand('echo "Hello from node-ssh!" && hostname && uptime');
    
    console.log('Command output:');
    console.log(result.stdout);
    
    if (result.stderr) {
      console.log('Errors:', result.stderr);
    }
    console.log(`Exit code: ${result.code}\n`);

    // Step 3: SFTP upload
    console.log('[3/4] Testing SFTP upload...');
    const testFile = path.join(__dirname, 'test-upload.txt');
    fs.writeFileSync(testFile, `Test file created at ${new Date().toISOString()}`);

    await ssh.putFile(testFile, '/root/test-upload.txt');
    console.log('✅ File uploaded successfully\n');

    // Step 4: Verify upload
    console.log('[4/4] Verifying uploaded file...');
    const verify = await ssh.execCommand('cat /root/test-upload.txt');
    console.log('File content on VPS:');
    console.log(verify.stdout);
    
    // Cleanup
    fs.unlinkSync(testFile);
    await ssh.execCommand('rm /root/test-upload.txt');

    console.log('\n==============================================');
    console.log('✅ ALL TESTS PASSED!');
    console.log('==============================================');
    console.log('\nConclusion:');
    console.log('node-ssh library works perfectly for VPS access.');
    console.log('Recommend using this as Layer 1 (primary method).');

    return true;

  } catch (error) {
    console.error('\n==============================================');
    console.error('❌ TEST FAILED');
    console.error('==============================================');
    console.error('\nError:', error.message);
    console.error('\nFull error:', error);
    
    console.error('\nConclusion:');
    console.error('node-ssh failed. Fall back to Spike 2 (native SSH).');

    return false;

  } finally {
    ssh.dispose();
  }
}

// Run spike
testNodeSSH()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
