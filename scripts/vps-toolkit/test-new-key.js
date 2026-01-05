#!/usr/bin/env node
/**
 * Test New SSH Key Connection
 * Verifies that vps_new_key can successfully connect
 */

const VPSConnection = require('./vps-connection.js');

async function testNewKey() {
  console.log('🧪 Testing new SSH key connection...\n');
  
  const vps = new VPSConnection();
  
  try {
    // Connect using new key
    await vps.connect();
    
    // Run simple test command
    const result = await vps.exec('echo "New key works!" && whoami && hostname');
    
    console.log('\n✅ New SSH key connection successful!');
    console.log('\nOutput:');
    console.log(result.stdout);
    
    // Get system info
    console.log('\n📊 System Info:');
    const info = await vps.getSystemInfo();
    console.log(JSON.stringify(info, null, 2));
    
    console.log('\n✓ Ready to revoke old key');
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    console.error('\n⚠️  Do NOT revoke old key yet!');
    process.exit(1);
  } finally {
    vps.disconnect();
  }
}

testNewKey();
