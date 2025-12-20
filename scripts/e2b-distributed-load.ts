import { join } from 'node:path';
import { Sandbox } from '@e2b/code-interpreter';
import * as dotenv from 'dotenv';

dotenv.config();

const CONCURRENT_SANDBOXES = 2; // Test with 2 sandboxes first
const TARGET_URL = 'https://httpbin.org/get';
const DURATION = '10s';
const RATE = 50; // Requests per second per sandbox

async function runDistributedLoad() {
  console.log(`🚀 Starting Distributed Load Test with ${CONCURRENT_SANDBOXES} sandboxes...`);
  console.log(`🎯 Target: ${TARGET_URL} | Duration: ${DURATION} | Rate: ${RATE} req/s per sandbox`);

  const sandboxes = await Promise.all(
    Array.from({ length: CONCURRENT_SANDBOXES }).map(() => Sandbox.create())
  );

  try {
    console.log('📦 Downloading Vegeta in sandboxes...');
    const setupCmd = `
      wget https://github.com/tsenart/vegeta/releases/download/v12.12.0/vegeta_12.12.0_linux_amd64.tar.gz &&
      tar -zxvf vegeta_12.12.0_linux_amd64.tar.gz &&
      sudo mv vegeta /usr/local/bin/
    `;
    await Promise.all(sandboxes.map((sb) => sb.commands.run(setupCmd)));

    console.log('⚡ Launching simultaneous attacks...');
    const startTime = Date.now();

    const results = await Promise.all(
      sandboxes.map(async (sb, index) => {
        console.log(`[Sandbox ${index}] Attacking...`);
        const cmd = `echo "GET ${TARGET_URL}" | vegeta attack -duration=${DURATION} -rate=${RATE} | vegeta report`;
        const exec = await sb.commands.run(cmd);
        return exec.stdout;
      })
    );

    const endTime = Date.now();
    console.log(`✅ Attack completed in ${((endTime - startTime) / 1000).toFixed(2)}s`);

    // Log a summary (in reality, we would aggregate the metrics)
    results.forEach((res, i) => {
      console.log(`\n--- Result from Sandbox ${i} ---`);
      console.log(res);
    });
  } catch (error) {
    console.error('❌ Load test failed:', error);
  } finally {
    await Promise.all(sandboxes.map((sb) => sb.kill()));
    console.log('🏁 All sandboxes closed.');
  }
}

runDistributedLoad().catch(console.error);
