/**
 * Spike 2: Test Native SSH via Bash Tool
 * Time-box: 30 minutes
 * Question: Can Bash tool execute SSH without timing out?
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function testNativeSSH() {
  console.log('==============================================');
  console.log('Spike 2: Native SSH Test');
  console.log('==============================================\n');

  const sshCommand = (cmd) => `ssh -i "C:\\Users\\luaho\\.ssh\\amp_vps_key" root@103.54.153.248 "${cmd}"`;

  try {
    // Step 1: Short command
    console.log('[1/4] Testing short command...');
    const { stdout: output1, stderr: error1 } = await execAsync(sshCommand('echo "Hello from native SSH!" && hostname'));
    
    console.log('Output:');
    console.log(output1);
    if (error1) console.log('Stderr:', error1);
    console.log('✅ Short command works!\n');

    // Step 2: System info
    console.log('[2/4] Getting system information...');
    const { stdout: output2 } = await execAsync(sshCommand('uptime && free -h | grep Mem && docker --version 2>&1 || echo "Docker not installed"'));
    
    console.log('System Info:');
    console.log(output2);
    console.log('✅ System info retrieved!\n');

    // Step 3: File upload (scp)
    console.log('[3/4] Testing file upload via scp...');
    const fs = require('fs');
    const testFile = 'test-scp-upload.txt';
    fs.writeFileSync(testFile, `Test file created at ${new Date().toISOString()}`);

    const scpCmd = `scp -i "C:\\Users\\luaho\\.ssh\\amp_vps_key" "${testFile}" root@103.54.153.248:/root/`;
    await execAsync(scpCmd);
    
    console.log('✅ File uploaded!\n');

    // Step 4: Verify upload
    console.log('[4/4] Verifying uploaded file...');
    const { stdout: output4 } = await execAsync(sshCommand('cat /root/test-scp-upload.txt'));
    
    console.log('File content on VPS:');
    console.log(output4);
    
    // Cleanup
    fs.unlinkSync(testFile);
    await execAsync(sshCommand('rm /root/test-scp-upload.txt'));

    console.log('\n==============================================');
    console.log('✅ ALL TESTS PASSED!');
    console.log('==============================================');
    console.log('\nConclusion:');
    console.log('Native SSH via Bash tool WORKS PERFECTLY.');
    console.log('This can be used as reliable fallback (Layer 2).');
    console.log('\nBenefit: No library dependencies, proven to work.');
    console.log('Drawback: Platform-dependent, less structured output.');

    return true;

  } catch (error) {
    console.error('\n==============================================');
    console.error('❌ TEST FAILED');
    console.error('==============================================');
    console.error('\nError:', error.message);
    console.error('Stderr:', error.stderr);
    console.error('\nConclusion:');
    console.error('Native SSH also failed. Check VPS key authorization.');

    return false;
  }
}

// Run spike
testNativeSSH()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
