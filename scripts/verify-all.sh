#!/bin/bash
# Standard Step 5 & 7: Automated Runner & Evaluation

echo "🚀 Starting Full System Verification..."

# 1. API Build Check
echo "📦 Checking API Build Integrity..."
pnpm --filter api build
if [ $? -eq 0 ]; then
  echo "✅ API Build Passed"
else
  echo "❌ API Build Failed"
  exit 1
fi

# 2. E2E Tests
echo "🎭 Running Holy Trinity E2E Tests (Multi-locale)..."
pnpm --filter web exec playwright test
if [ $? -eq 0 ]; then
  echo "✅ E2E Tests Passed"
else
  echo "❌ E2E Tests Failed"
  exit 1
fi

echo "🏁 All checks completed successfully. System is healthy."
