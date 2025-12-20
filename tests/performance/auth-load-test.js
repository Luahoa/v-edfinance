#!/usr/bin/env node
/**
 * Autocannon Load Test - Authentication Endpoints
 * Tests login/register endpoints under load
 */

const autocannon = require('autocannon');

const instance = autocannon({
  url: 'http://localhost:3001',
  connections: 100, // 100 concurrent connections
  duration: 30, // 30 seconds
  pipelining: 1,
  requests: [
    {
      method: 'POST',
      path: '/api/auth/login',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    },
  ],
});

autocannon.track(instance, { renderProgressBar: true });

instance.on('done', (results) => {
  console.log('\n📊 Auth Endpoint Load Test Results:');
  console.log('━'.repeat(50));
  console.log(`Requests:      ${results.requests.total}`);
  console.log(`Duration:      ${results.duration}s`);
  console.log(`Throughput:    ${results.requests.average} req/sec`);
  console.log('');
  console.log('Latency:');
  console.log(`  p50:         ${results.latency.p50}ms`);
  console.log(`  p95:         ${results.latency.p95}ms`);
  console.log(`  p99:         ${results.latency.p99}ms`);
  console.log(`  max:         ${results.latency.max}ms`);
  console.log('');
  console.log(`Errors:        ${results.errors}`);
  console.log(`Timeouts:      ${results.timeouts}`);

  // Performance gates
  if (results.latency.p95 > 100) {
    console.log('\n⚠️  WARNING: p95 latency exceeds 100ms threshold!');
    process.exit(1);
  }

  if (results.errors > 0) {
    console.log('\n❌ FAILED: Errors detected during load test!');
    process.exit(1);
  }

  console.log('\n✅ Performance test PASSED!');
});
