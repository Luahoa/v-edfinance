#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * Validates required secrets before deployment
 * Usage: node scripts/validate-env.js [environment]
 * Environments: dev, staging, production
 */

const fs = require('fs');
const path = require('path');

const ENV = process.argv[2] || 'dev';
const ENV_FILE = path.join(__dirname, '..', '.env');

console.log(`🔍 Validating environment variables for: ${ENV.toUpperCase()}\n`);

// Load .env file
if (!fs.existsSync(ENV_FILE)) {
  console.error('❌ .env file not found! Copy .env.deployment.template to .env');
  process.exit(1);
}

require('dotenv').config({ path: ENV_FILE });

// Validation rules
const VALIDATIONS = {
  // Critical - All Environments
  critical: [
    { key: 'JWT_SECRET', test: (v) => v && v.length >= 64, error: 'Must be 64+ char hex string' },
    { key: 'DATABASE_URL', test: (v) => v && v.startsWith('postgresql://'), error: 'Must be valid PostgreSQL URL' },
  ],
  
  // Development Only
  dev: [],
  
  // Staging Required
  staging: [
    { key: 'JWT_SECRET_STAGING', test: (v) => v && v.length >= 64, error: 'Must be 64+ char hex string' },
    { key: 'R2_ACCOUNT_ID', test: (v) => v && v.length > 5, error: 'Required for file uploads' },
    { key: 'R2_ACCESS_KEY_ID', test: (v) => v && v.length > 5, error: 'Required for R2 access' },
    { key: 'R2_SECRET_ACCESS_KEY', test: (v) => v && v.length > 10, error: 'Required for R2 access' },
  ],
  
  // Production Required
  production: [
    { key: 'JWT_SECRET_PROD', test: (v) => v && v.length >= 64, error: 'Must be 64+ char hex string' },
    { key: 'JWT_REFRESH_SECRET_PROD', test: (v) => v && v.length >= 64, error: 'Must be 64+ char hex string' },
    { key: 'ENCRYPTION_KEY_PROD', test: (v) => v && v.length >= 32, error: 'Must be 32+ char hex string' },
    { key: 'POSTGRES_PASSWORD', test: (v) => v && v.length >= 16, error: 'Must be 16+ chars strong password' },
    { key: 'R2_ACCOUNT_ID', test: (v) => v && v.length > 5, error: 'Required for file uploads' },
    { key: 'R2_ACCESS_KEY_ID', test: (v) => v && v.length > 5, error: 'Required for R2 access' },
    { key: 'R2_SECRET_ACCESS_KEY', test: (v) => v && v.length > 10, error: 'Required for R2 access' },
    { key: 'R2_PUBLIC_URL', test: (v) => v && v.startsWith('https://'), error: 'Must be HTTPS URL' },
    { key: 'GEMINI_API_KEY', test: (v) => v && v.startsWith('AIza'), error: 'Must be valid Gemini API key' },
  ],
  
  // Security Checks (All Environments)
  security: [
    {
      name: 'JWT secrets must differ',
      test: () => {
        const secrets = [
          process.env.JWT_SECRET,
          process.env.JWT_SECRET_DEV,
          process.env.JWT_SECRET_STAGING,
          process.env.JWT_SECRET_PROD,
          process.env.JWT_REFRESH_SECRET,
          process.env.JWT_REFRESH_SECRET_PROD,
        ].filter(Boolean);
        
        return secrets.length === new Set(secrets).size;
      },
      error: 'All JWT secrets must be different!',
    },
    {
      name: 'No default placeholders',
      test: () => {
        const env = fs.readFileSync(ENV_FILE, 'utf8');
        return !env.includes('CHANGE_THIS') && !env.includes('your-') && !env.includes('xxx');
      },
      error: 'Found placeholder values (CHANGE_THIS, your-, xxx). Replace with real secrets!',
    },
  ],
};

// Run validations
let errors = 0;
let warnings = 0;

console.log('📋 CRITICAL CHECKS (All Environments):\n');
VALIDATIONS.critical.forEach((rule) => {
  const value = process.env[rule.key];
  const passed = rule.test(value);
  
  if (passed) {
    console.log(`✅ ${rule.key}: OK`);
  } else {
    console.error(`❌ ${rule.key}: ${rule.error}`);
    errors++;
  }
});

if (VALIDATIONS[ENV]) {
  console.log(`\n📋 ${ENV.toUpperCase()} ENVIRONMENT CHECKS:\n`);
  VALIDATIONS[ENV].forEach((rule) => {
    const value = process.env[rule.key];
    const passed = rule.test(value);
    
    if (passed) {
      console.log(`✅ ${rule.key}: OK`);
    } else {
      console.error(`❌ ${rule.key}: ${rule.error}`);
      errors++;
    }
  });
}

console.log('\n🔒 SECURITY CHECKS:\n');
VALIDATIONS.security.forEach((rule) => {
  const passed = rule.test();
  
  if (passed) {
    console.log(`✅ ${rule.name}: OK`);
  } else {
    console.error(`❌ ${rule.name}: ${rule.error}`);
    errors++;
  }
});

// Optional checks (warnings only)
console.log('\n⚠️  OPTIONAL CHECKS:\n');

const OPTIONAL = [
  { key: 'YOUTUBE_API_KEY', desc: 'YouTube integration' },
  { key: 'E2B_API_KEY', desc: 'Code execution features' },
  { key: 'REDIS_URL', desc: 'Session caching' },
];

OPTIONAL.forEach((opt) => {
  if (process.env[opt.key]) {
    console.log(`✅ ${opt.key}: Configured (${opt.desc})`);
  } else {
    console.log(`⚠️  ${opt.key}: Not set (${opt.desc} disabled)`);
    warnings++;
  }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 VALIDATION SUMMARY');
console.log('='.repeat(50));

if (errors > 0) {
  console.error(`\n❌ FAILED: ${errors} critical error(s) found`);
  console.error('Fix errors before deploying!\n');
  process.exit(1);
}

if (warnings > 0) {
  console.log(`\n⚠️  ${warnings} optional variable(s) missing (non-blocking)`);
}

console.log(`\n✅ SUCCESS: All required secrets validated for ${ENV.toUpperCase()}`);
console.log('\n🚀 Ready to deploy!\n');
process.exit(0);
