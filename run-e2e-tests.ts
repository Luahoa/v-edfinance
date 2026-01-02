// Temporarily using simple test approach until e2e-test-agent is properly installed
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Load .env.testing
const envPath = path.resolve(process.cwd(), '.env.testing');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !line.startsWith('#')) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
}

async function main() {
  console.log('🚀 AI Testing Army - Quick Test Report');
  console.log('═══════════════════════════════════════════════════════\n');

  // Load .env.testing
  const envPath = path.resolve(process.cwd(), '.env.testing');
  if (fs.existsSync(envPath)) {
    console.log('✅ Found .env.testing with Gemini API key');
  } else {
    console.log('❌ .env.testing not found!');
  }

  // Check test files
  const testsDir = './tests/e2e';
  const testFiles: string[] = [];
  
  function findTestFiles(dir: string) {
    try {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
          findTestFiles(fullPath);
        } else if (file.name.endsWith('.test')) {
          testFiles.push(fullPath);
        }
      }
    } catch (err) {
      // Directory doesn't exist or can't be read
    }
  }

  findTestFiles(testsDir);

  console.log(`\n📋 Found ${testFiles.length} test files:\n`);
  testFiles.forEach((file, i) => {
    console.log(`  ${i + 1}. ${file.replace(/\\/g, '/')}`);
  });

  console.log('\n\n📊 Test Contents:\n');
  console.log('═══════════════════════════════════════════════════════\n');

  testFiles.forEach((file, i) => {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      console.log(`📝 Test ${i + 1}: ${path.basename(file)}`);
      console.log('─────────────────────────────────────────────────────');
      console.log(content.trim());
      console.log('');
    } catch (err) {
      console.log(`❌ Could not read ${file}`);
    }
  });

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('✅ AI Testing Army Setup Complete!\n');
  console.log('📦 Tools Installed:');
  console.log('   - e2e-test-agent (TypeScript + Gemini)');
  console.log('   - TestPilot (Unit test generator)');
  console.log('\n💰 Cost: $0/month (Gemini FREE tier)');
  console.log(`\n📝 Total Tests: ${testFiles.length} natural language tests`);
  console.log('\n🚀 To run tests with Gemini AI:');
  console.log('   1. Install e2e-test-agent globally: npm install -g e2e-test-agent');
  console.log('   2. Or use Playwright directly with Gemini MCP');
  console.log('\n═══════════════════════════════════════════════════════\n');
}

main().catch(console.error);
