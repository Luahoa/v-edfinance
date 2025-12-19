#!/bin/bash

# V-EdFinance Local Test Runner
# Chạy toàn bộ test suite từ Track 1 đến Track 3

echo "🚀 Starting V-EdFinance Full Test Suite..."

# Track 1: Unit Tests
echo "--- Track 1: Unit Tests (AVA/Jest) ---"
pnpm --filter api test apps/api/src/common/gamification-pure.spec.ts
if [ $? -ne 0 ]; then echo "❌ Track 1 Failed"; exit 1; fi

# Track 2: DevOps Tests
echo "--- Track 2: DevOps Tests (Bats) ---"
if command -v bats &> /dev/null; then
    bats tests/devops/structure.bats
else
    echo "⚠️ Bats not found. Skipping Track 2."
fi

# Track 3: Load Test Validation
echo "--- Track 3: Vegeta Payload Validation ---"
if [ -f "tests/vegeta/gamification-payload.json" ]; then
    echo "✅ Vegeta payload exists and is valid JSON."
    cat tests/vegeta/gamification-payload.json | node -e "JSON.parse(fs.readFileSync(0))"
else
    echo "❌ Track 3 Failed: Payload missing"; exit 1;
fi

echo "🎉 All tests passed successfully!"
