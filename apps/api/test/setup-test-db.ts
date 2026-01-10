/**
 * Test Database Setup Utility
 * 
 * This script sets up the test database for integration tests.
 * 
 * Usage:
 *   1. Start test DB: pnpm --filter api test:db:start
 *   2. Run this setup: npx ts-node test/setup-test-db.ts
 *   3. Run tests: TEST_DATABASE_URL=... pnpm --filter api test
 *   4. Stop test DB: pnpm --filter api test:db:stop
 */

import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test environment
dotenv.config({ path: path.join(__dirname, '../.env.test') });

async function setupTestDatabase(): Promise<void> {
  console.log('🔧 Setting up test database...\n');

  const testDbUrl = process.env.TEST_DATABASE_URL;
  if (!testDbUrl) {
    console.error('❌ TEST_DATABASE_URL not set in .env.test');
    process.exit(1);
  }

  try {
    // Run Prisma migrations
    console.log('📦 Running Prisma migrations...');
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: testDbUrl },
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });

    // Generate Prisma client
    console.log('\n🔄 Generating Prisma client...');
    execSync('npx prisma generate', {
      env: { ...process.env, DATABASE_URL: testDbUrl },
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });

    console.log('\n✅ Test database setup complete!');
    console.log('\nTo run integration tests:');
    console.log('  TEST_DATABASE_URL=' + testDbUrl + ' pnpm --filter api test');
  } catch (error) {
    console.error('❌ Failed to setup test database:', error);
    process.exit(1);
  }
}

setupTestDatabase();
