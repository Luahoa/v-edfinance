#!/usr/bin/env node

/**
 * Generate Secure Secrets for V-EdFinance
 * Generates cryptographically secure random secrets
 * Usage: node scripts/generate-secrets.js [output-file]
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = process.argv[2] || path.join(__dirname, '..', '.env.generated');

console.log('🔐 Generating secure secrets for V-EdFinance\n');

// Generate secrets
const secrets = {
  // JWT Secrets (64 bytes = 128 hex chars)
  JWT_SECRET_DEV: crypto.randomBytes(64).toString('hex'),
  JWT_SECRET_STAGING: crypto.randomBytes(64).toString('hex'),
  JWT_SECRET_PROD: crypto.randomBytes(64).toString('hex'),
  
  // JWT Refresh Secrets (64 bytes)
  JWT_REFRESH_SECRET_DEV: crypto.randomBytes(64).toString('hex'),
  JWT_REFRESH_SECRET_STAGING: crypto.randomBytes(64).toString('hex'),
  JWT_REFRESH_SECRET_PROD: crypto.randomBytes(64).toString('hex'),
  
  // Encryption Keys (32 bytes = 64 hex chars)
  ENCRYPTION_KEY_DEV: crypto.randomBytes(32).toString('hex'),
  ENCRYPTION_KEY_STAGING: crypto.randomBytes(32).toString('hex'),
  ENCRYPTION_KEY_PROD: crypto.randomBytes(32).toString('hex'),
  
  // PostgreSQL Password (strong random)
  POSTGRES_PASSWORD: generateStrongPassword(24),
  
  // Redis Password (if needed)
  REDIS_PASSWORD: generateStrongPassword(24),
};

// Display generated secrets
console.log('✅ Generated Secrets:\n');
console.log('─'.repeat(50));

Object.entries(secrets).forEach(([key, value]) => {
  console.log(`${key}:`);
  console.log(`  ${maskSecret(value)}`);
  console.log();
});

console.log('─'.repeat(50));

// Write to file
const envContent = `# ========================================
# GENERATED SECRETS - DO NOT COMMIT!
# ========================================
# Generated: ${new Date().toISOString()}
# IMPORTANT: Copy these to your .env file and DELETE this file!

# JWT Secrets
JWT_SECRET_DEV=${secrets.JWT_SECRET_DEV}
JWT_SECRET_STAGING=${secrets.JWT_SECRET_STAGING}
JWT_SECRET_PROD=${secrets.JWT_SECRET_PROD}

# JWT Refresh Secrets
JWT_REFRESH_SECRET_DEV=${secrets.JWT_REFRESH_SECRET_DEV}
JWT_REFRESH_SECRET_STAGING=${secrets.JWT_REFRESH_SECRET_STAGING}
JWT_REFRESH_SECRET_PROD=${secrets.JWT_REFRESH_SECRET_PROD}

# Encryption Keys
ENCRYPTION_KEY_DEV=${secrets.ENCRYPTION_KEY_DEV}
ENCRYPTION_KEY_STAGING=${secrets.ENCRYPTION_KEY_STAGING}
ENCRYPTION_KEY_PROD=${secrets.ENCRYPTION_KEY_PROD}

# Database Password
POSTGRES_PASSWORD=${secrets.POSTGRES_PASSWORD}

# Redis Password
REDIS_PASSWORD=${secrets.REDIS_PASSWORD}

# ========================================
# NEXT STEPS:
# ========================================
# 1. Copy secrets from this file to .env
# 2. DELETE this file immediately
# 3. Verify .env is in .gitignore
# 4. Run: node scripts/validate-env.js production
`;

fs.writeFileSync(OUTPUT_FILE, envContent);

console.log(`\n📝 Secrets written to: ${OUTPUT_FILE}`);
console.log('\n⚠️  SECURITY WARNING:');
console.log('   1. Copy secrets to .env file');
console.log('   2. DELETE .env.generated immediately');
console.log('   3. Never commit .env to git\n');

// Helper functions
function generateStrongPassword(length) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*-_=+';
  const bytes = crypto.randomBytes(length);
  
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }
  
  return password;
}

function maskSecret(secret) {
  if (!secret) return '[empty]';
  if (secret.length <= 8) return '*'.repeat(secret.length);
  
  return secret.substring(0, 8) + '*'.repeat(secret.length - 16) + secret.substring(secret.length - 8);
}
