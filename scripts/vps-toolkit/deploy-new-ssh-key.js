#!/usr/bin/env node
/**
 * Deploy New SSH Key to VPS
 * Phase 1 of SSH Key Rotation (Security Cleanup)
 */

const VPSConnection = require('./vps-connection.js');
const fs = require('fs');
const path = require('path');

async function deployNewSSHKey() {
  console.log('🔑 SSH Key Rotation - Phase 1: Deploy New Key\n');
  
  const vps = new VPSConnection();
  
  try {
    // Read new public key
    const pubKeyPath = path.join(
      process.env.USERPROFILE || process.env.HOME,
      '.ssh',
      'vps_new_key.pub'
    );
    
    if (!fs.existsSync(pubKeyPath)) {
      throw new Error(`Public key not found at: ${pubKeyPath}`);
    }
    
    const newPublicKey = fs.readFileSync(pubKeyPath, 'utf8').trim();
    console.log('✓ New public key loaded');
    console.log(`  Key: ${newPublicKey.substring(0, 50)}...`);
    
    // Connect to VPS (using existing key)
    console.log('\n🔌 Connecting to VPS...');
    await vps.connect();
    
    // Check if new key already exists
    console.log('\n📋 Checking authorized_keys...');
    const checkResult = await vps.exec('grep "amp-agent-new@v-edfinance" ~/.ssh/authorized_keys || echo "NOT_FOUND"');
    
    if (checkResult.stdout.includes('NOT_FOUND')) {
      console.log('  New key not found. Adding...');
      
      // Add new public key
      const addKeyCommand = `echo '${newPublicKey}' >> ~/.ssh/authorized_keys`;
      await vps.exec(addKeyCommand);
      
      console.log('✓ New SSH key added to authorized_keys');
    } else {
      console.log('  New key already exists in authorized_keys');
    }
    
    // Set correct permissions
    console.log('\n🔒 Setting permissions...');
    await vps.execMultiple([
      'chmod 700 ~/.ssh',
      'chmod 600 ~/.ssh/authorized_keys',
    ]);
    
    // Verify key was added
    console.log('\n✅ Verifying...');
    const verifyResult = await vps.exec('cat ~/.ssh/authorized_keys | grep "amp-agent-new"');
    
    if (verifyResult.code === 0) {
      console.log('✓ New SSH key successfully deployed!');
      console.log('\n📝 Next steps:');
      console.log('  1. Test new key connection: node scripts/vps-toolkit/test-new-key.js');
      console.log('  2. If successful, revoke old key: node scripts/vps-toolkit/revoke-old-key.js');
    } else {
      throw new Error('Failed to verify new key deployment');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    vps.disconnect();
  }
}

deployNewSSHKey();
