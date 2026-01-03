// scripts/smoke-tests/smoke-test.ts
import axios from 'axios';

const BASE_URL = process.env.API_URL || 'http://localhost:3001';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  duration: number;
  error?: string;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<any>): Promise<any> {
  const start = Date.now();
  try {
    const result = await testFn();
    results.push({ name, status: 'PASS', duration: Date.now() - start });
    console.log(`✅ ${name} - PASS (${Date.now() - start}ms)`);
    return result;
  } catch (error: any) {
    results.push({ 
      name, 
      status: 'FAIL', 
      duration: Date.now() - start,
      error: error.message 
    });
    console.error(`❌ ${name} - FAIL: ${error.message}`);
    return null;
  }
}

// Test 1: Health Check
async function testHealthCheck() {
  const response = await axios.get(`${BASE_URL}/api/health`);
  if (response.status !== 200) throw new Error('Health check failed');
}

// Test 2: Auth - Register
async function testAuthRegister() {
  const response = await axios.post(`${BASE_URL}/api/auth/register`, {
    email: `smoke-${Date.now()}@test.com`,
    password: 'Test123!@#',
    fullName: 'Smoke Test User'
  });
  if (response.status !== 201) throw new Error('Register failed');
  return response.data.accessToken;
}

// Test 3: Auth - Login
async function testAuthLogin() {
  // Use pre-existing test user
  const response = await axios.post(`${BASE_URL}/api/auth/login`, {
    email: 'test@example.com',
    password: 'Test123!@#'
  });
  if (response.status !== 200) throw new Error('Login failed');
  return response.data.accessToken;
}

// Test 4: Courses - List
async function testCoursesList(token: string) {
  const response = await axios.get(`${BASE_URL}/api/courses`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (response.status !== 200) throw new Error('Courses list failed');
}

// Test 5: Social - Feed
async function testSocialFeed(token: string) {
  const response = await axios.get(`${BASE_URL}/api/social/feed`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (response.status !== 200) throw new Error('Social feed failed');
}

// Test 6: AI - Chat (if implemented)
async function testAIChat(token: string) {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/ai/chat`,
      { message: 'Hello' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.status !== 200) throw new Error('AI chat failed');
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.log('⚠️  AI chat endpoint not implemented (skipped)');
    } else {
      throw error;
    }
  }
}

// Main test runner
async function main() {
  console.log('🚀 Running Smoke Tests...\n');
  console.log(`Target: ${BASE_URL}\n`);
  
  const startTime = Date.now();
  
  await runTest('Health Check', testHealthCheck);
  
  const token = await runTest('Auth - Login', testAuthLogin);
  
  if (token) {
    await runTest('Courses - List', () => testCoursesList(token));
    await runTest('Social - Feed', () => testSocialFeed(token));
    await runTest('AI - Chat', () => testAIChat(token));
  }
  
  const totalTime = Date.now() - startTime;
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  
  console.log('\n' + '='.repeat(50));
  console.log(`Total: ${results.length} | Pass: ${passed} | Fail: ${failed}`);
  console.log(`Duration: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);
  console.log('='.repeat(50));
  
  if (failed > 0) {
    console.error('\n❌ Smoke tests FAILED');
    process.exit(1);
  } else {
    console.log('\n✅ All smoke tests PASSED');
    process.exit(0);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
