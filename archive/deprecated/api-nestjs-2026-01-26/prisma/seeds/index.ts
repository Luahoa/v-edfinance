#!/usr/bin/env ts-node
import { execSync } from 'child_process';
import { resolve } from 'path';

const SCENARIOS = ['dev', 'test', 'demo', 'benchmark'] as const;
type Scenario = (typeof SCENARIOS)[number];

function printUsage() {
  console.log(`
🌱 V-EdFinance Seed Orchestrator

Usage: npx ts-node prisma/seeds/index.ts <scenario>

Scenarios:
  dev        Development (50 users, 10 courses, 7 days logs)
  test       CI/CD Testing (20 users, 5 courses, minimal data)
  demo       Demo/Staging (200 users, 25 courses, 30 days logs)
  benchmark  Performance (10k users, 100 courses, 90 days logs)

Examples:
  npx ts-node prisma/seeds/index.ts dev
  pnpm db:seed:dev
  `);
}

async function main() {
  const scenario = process.argv[2] as Scenario;

  if (!scenario || !SCENARIOS.includes(scenario)) {
    printUsage();
    process.exit(scenario ? 1 : 0);
  }

  console.log(`\n🚀 Running ${scenario.toUpperCase()} seed scenario...\n`);

  const seedFile = resolve(__dirname, `scenarios/${scenario}.seed.ts`);

  try {
    execSync(`npx ts-node "${seedFile}"`, {
      stdio: 'inherit',
      cwd: resolve(__dirname, '../..'),
    });

    console.log(`\n✅ ${scenario.toUpperCase()} seed completed successfully!`);
  } catch (error) {
    console.error(`\n❌ ${scenario.toUpperCase()} seed failed!`);
    process.exit(1);
  }
}

main();
