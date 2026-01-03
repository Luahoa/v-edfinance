// scripts/validate-env.ts
const REQUIRED_ENV_VARS = {
  // Database
  DATABASE_URL: 'PostgreSQL connection string',
  
  // JWT
  JWT_SECRET: 'JWT signing secret (min 32 chars)',
  JWT_REFRESH_SECRET: 'JWT refresh signing secret',
  
  // Redis
  REDIS_URL: 'Redis connection string',
  
  // API
  PORT: 'API server port',
  NODE_ENV: 'Environment (development|production)',
  
  // Cloudflare (optional in dev)
  CLOUDFLARE_ACCOUNT_ID: 'Cloudflare account ID',
  CLOUDFLARE_API_TOKEN: 'Cloudflare API token',
};

interface ValidationResult {
  variable: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
}

const results: ValidationResult[] = [];

function validateEnvVar(name: string, description: string, optional = false) {
  const value = process.env[name];
  
  if (!value) {
    if (optional && process.env.NODE_ENV === 'development') {
      results.push({
        variable: name,
        status: 'WARN',
        message: `Optional in dev: ${description}`
      });
    } else {
      results.push({
        variable: name,
        status: 'FAIL',
        message: `Missing: ${description}`
      });
    }
    return;
  }
  
  // Additional validation
  if (name.includes('SECRET') && value.length < 32) {
    results.push({
      variable: name,
      status: 'WARN',
      message: `Too short (${value.length} chars, recommended 32+)`
    });
    return;
  }
  
  if (name === 'DATABASE_URL' && !value.startsWith('postgresql://')) {
    results.push({
      variable: name,
      status: 'FAIL',
      message: 'Must start with postgresql://'
    });
    return;
  }
  
  results.push({
    variable: name,
    status: 'PASS',
    message: `OK (${value.substring(0, 20)}...)`
  });
}

console.log('🔍 Validating Environment Variables...\n');

// Validate required vars
Object.entries(REQUIRED_ENV_VARS).forEach(([name, desc]) => {
  const optional = name.includes('CLOUDFLARE');
  validateEnvVar(name, desc, optional);
});

// Print results
results.forEach(result => {
  const icon = result.status === 'PASS' ? '✅' : 
               result.status === 'WARN' ? '⚠️' : '❌';
  console.log(`${icon} ${result.variable}: ${result.message}`);
});

// Summary
const passed = results.filter(r => r.status === 'PASS').length;
const failed = results.filter(r => r.status === 'FAIL').length;
const warnings = results.filter(r => r.status === 'WARN').length;

console.log('\n' + '='.repeat(50));
console.log(`Total: ${results.length} | Pass: ${passed} | Fail: ${failed} | Warn: ${warnings}`);
console.log('='.repeat(50));

if (failed > 0) {
  console.error('\n❌ Environment validation FAILED');
  process.exit(1);
} else if (warnings > 0) {
  console.log('\n⚠️  Environment validation PASSED with warnings');
  process.exit(0);
} else {
  console.log('\n✅ Environment validation PASSED');
  process.exit(0);
}
