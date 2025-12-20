import * as dotenv from 'dotenv';
dotenv.config(); // Call immediately at the top

import { Sandbox } from '@e2b/code-interpreter';
import { join } from 'path';

async function testE2BConnection() {
  console.log('🚀 Testing E2B Connection...');
  console.log('Environment check:', process.env.E2B_API_KEY ? 'Key found' : 'Key MISSING');
  if (!process.env.E2B_API_KEY) {
    console.error('❌ E2B_API_KEY not found in .env');
    process.exit(1);
  }

  try {
    const sbx = await Sandbox.create();
    console.log('✅ Sandbox created successfully!');
    console.log('Sandbox ID:', sbx.sandboxId);

    const execution = await sbx.runCode('print("Hello from E2B Sandbox!")');
    console.log('Output:', execution.logs.stdout.join('\n'));

    await sbx.kill();
    console.log('✅ Sandbox closed successfully!');
  } catch (error) {
    console.error('❌ E2B Connection failed:', error);
    process.exit(1);
  }
}

testE2BConnection();
