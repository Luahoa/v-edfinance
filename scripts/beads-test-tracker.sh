#!/bin/bash
# V-EdFinance Beads Test Coverage Tracker
# Automatically creates Beads tasks for low-coverage modules

set -e

echo "🔍 Beads Test Coverage Tracker"
echo "================================"
echo ""

# Check if coverage file exists
COVERAGE_FILE="apps/api/coverage/coverage-final.json"

if [ ! -f "$COVERAGE_FILE" ]; then
  echo "⚠️  Coverage file not found. Running tests..."
  cd apps/api
  pnpm test:cov --silent > /dev/null 2>&1 || true
  cd ../..
fi

if [ ! -f "$COVERAGE_FILE" ]; then
  echo "❌ Could not generate coverage report"
  exit 1
fi

echo "📊 Analyzing coverage..."
echo ""

# Parse coverage and create Beads tasks
node -e "
const fs = require('fs');
const { execSync } = require('child_process');

const coverage = JSON.parse(fs.readFileSync('$COVERAGE_FILE', 'utf-8'));
const lowCoverage = [];

for (const [file, data] of Object.entries(coverage)) {
  const fileCoverage = (data.lines.covered / data.lines.total) * 100;
  
  if (fileCoverage < 80) {
    const shortFile = file.replace('apps/api/src/', '');
    lowCoverage.push({
      file: shortFile,
      coverage: fileCoverage.toFixed(2)
    });
  }
}

console.log(\`Found \${lowCoverage.length} files with <80% coverage\`);
console.log('');

// Create Beads task for each
for (const item of lowCoverage) {
  const taskTitle = \`Test: Improve coverage for \${item.file}\`;
  
  // Check if task already exists
  try {
    const existing = execSync('bd list', { encoding: 'utf-8' });
    
    if (existing.includes(taskTitle)) {
      console.log(\`✅ Task exists: \${item.file} (\${item.coverage}%)\`);
      continue;
    }
  } catch (e) {}
  
  // Create new task
  const taskBody = \`Current coverage: \${item.coverage}%
Target: 80%+

Generate tests using:
pnpm ts-node scripts/ai-test-generator.ts

Or use Swarm:
swarm run swarms/test-orchestrator-swarm.yml -p \"Generate tests for \${item.file}\"\`;
  
  try {
    execSync(\`bd create \"\${taskTitle}\" --type task --priority 2 --body \"\${taskBody.replace(/\"/g, '\\\\'')}\"\`, {
      stdio: 'inherit'
    });
    
    console.log(\`📝 Created task: \${item.file} (\${item.coverage}%)\`);
  } catch (e) {
    console.error(\`❌ Failed to create task: \${item.file}\`);
  }
}

console.log('');
console.log('✅ Beads sync complete');
console.log('📋 View tasks: bd list --filter test');
"

echo ""
echo "================================"
echo "✅ Beads Test Tracker Complete"
