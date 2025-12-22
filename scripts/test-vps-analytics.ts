#!/usr/bin/env ts-node
/**
 * VPS Analytics Performance Test
 * Tests Kysely queries against staging database on VPS
 * Run: pnpm ts-node scripts/test-vps-analytics.ts
 */

import axios from 'axios';

const VPS_API_BASE = process.env.VPS_API_URL || 'http://103.54.153.248:3001';

interface PerformanceMetric {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  cached?: boolean;
  error?: string;
}

const metrics: PerformanceMetric[] = [];

async function testEndpoint(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  data?: unknown
): Promise<PerformanceMetric> {
  const start = Date.now();
  try {
    const response = await axios({
      method,
      url: `${VPS_API_BASE}${endpoint}`,
      data,
      timeout: 10000,
    });

    const duration = Date.now() - start;
    return {
      endpoint,
      method,
      duration,
      status: response.status,
      cached: response.headers['x-cache'] === 'HIT',
    };
  } catch (error: unknown) {
    const duration = Date.now() - start;
    return {
      endpoint,
      method,
      duration,
      status: error.response?.status || 500,
      error: error.message,
    };
  }
}

async function runTests() {
  console.log('🚀 V-EdFinance VPS Analytics Performance Test\n');
  console.log(`📍 Target: ${VPS_API_BASE}\n`);

  // Health check first
  console.log('1️⃣ Health Check...');
  const health = await testEndpoint('/api/health');
  metrics.push(health);
  if (health.status !== 200) {
    console.error('❌ VPS is not responding. Aborting tests.');
    process.exit(1);
  }
  console.log(`✅ VPS healthy (${health.duration}ms)\n`);

  // Test analytics endpoints
  const analyticsTests = [
    { name: 'Daily Active Users', endpoint: '/api/analytics/dau?days=30' },
    { name: 'Monthly Active Users', endpoint: '/api/analytics/mau?months=12' },
    { name: 'Learning Funnel', endpoint: '/api/analytics/funnel' },
    { name: 'Cohort Retention', endpoint: '/api/analytics/cohort-retention?weeks=12' },
    {
      name: 'Leaderboard (Global, 1st call)',
      endpoint: '/api/analytics/leaderboard?timeframe=week&limit=10',
    },
    {
      name: 'Leaderboard (Global, 2nd call - cached)',
      endpoint: '/api/analytics/leaderboard?timeframe=week&limit=10',
    },
    { name: 'Top Courses', endpoint: '/api/analytics/top-courses?limit=10' },
    { name: 'Course Completion by Level', endpoint: '/api/analytics/course-completion-by-level' },
  ];

  console.log('2️⃣ Testing Kysely Analytics Queries...\n');

  for (const test of analyticsTests) {
    process.stdout.write(`   ${test.name}... `);
    const metric = await testEndpoint(test.endpoint);
    metrics.push(metric);

    if (metric.status === 200) {
      const cacheStatus = metric.cached ? '📦 CACHED' : '🔍 DB';
      const perfEmoji = metric.duration < 100 ? '⚡' : metric.duration < 500 ? '✅' : '⚠️';
      console.log(`${perfEmoji} ${metric.duration}ms ${cacheStatus}`);
    } else {
      console.log(`❌ ${metric.status} - ${metric.error}`);
    }
  }

  // Performance summary
  console.log('\n📊 Performance Summary:\n');

  const successful = metrics.filter((m) => m.status === 200 && m.endpoint !== '/api/health');
  if (successful.length === 0) {
    console.log('❌ No successful queries to analyze');
    return;
  }

  const durations = successful.map((m) => m.duration);
  const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
  const max = Math.max(...durations);
  const min = Math.min(...durations);
  const p95 = durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)];

  console.log(`   Average: ${avg.toFixed(2)}ms`);
  console.log(`   Min: ${min}ms`);
  console.log(`   Max: ${max}ms`);
  console.log(`   P95: ${p95}ms`);
  console.log(`   Target P95: <500ms ${p95 < 500 ? '✅' : '⚠️ NEEDS OPTIMIZATION'}`);

  // Cache effectiveness
  const cachedQueries = successful.filter((m) => m.cached);
  if (cachedQueries.length > 0) {
    const cacheHitRate = ((cachedQueries.length / successful.length) * 100).toFixed(1);
    console.log(`\n💾 Cache Hit Rate: ${cacheHitRate}%`);
    console.log(
      `   Cached avg: ${(cachedQueries.reduce((a, b) => a + b.duration, 0) / cachedQueries.length).toFixed(2)}ms`
    );
  }

  // Failures
  const failures = metrics.filter((m) => m.status !== 200);
  if (failures.length > 0) {
    console.log(`\n❌ Failed Requests: ${failures.length}`);
    for (const f of failures) {
      console.log(`   ${f.endpoint} - ${f.status} ${f.error || ''}`);
    }
  }

  console.log('\n✅ Test Complete!\n');
}

runTests().catch(console.error);
