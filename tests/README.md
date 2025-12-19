# 🚀 Quick Start: E2E Testing

## Chạy Tests

```bash
# 1. Cài đặt Playwright browsers (chỉ cần 1 lần)
pnpm exec playwright install chromium

# 2. Khởi động dev servers (terminal 1)
pnpm dev

# 3. Chạy E2E tests (terminal 2)
pnpm exec playwright test

# 4. Xem report
pnpm exec playwright show-report
```

## Chạy Tests Cụ Thể

```bash
# Chỉ test Login & Onboarding
pnpm exec playwright test login-onboarding

# Chạy với browser hiển thị (debug mode)
pnpm exec playwright test --headed

# Chạy interactive mode
pnpm exec playwright test --ui

# Chạy với thiết bị cụ thể
pnpm exec playwright test --project="Mobile Safari"
```

## Debug Failed Tests

```bash
# Xem trace nếu test fail
pnpm exec playwright show-trace trace.zip

# Chạy với debugger
pnpm exec playwright test --debug
```

## File Structure

```
tests/
├── e2e/
│   └── auth/
│       └── login-onboarding.spec.ts   # ← Main test file
├── helpers/
│   └── test-utils.ts                  # ← Reusable utilities
└── behavioral/
    └── gamification-flow.spec.ts      # Existing tests
```

## Xem Thêm

- [E2E_TESTING_GUIDE.md](../E2E_TESTING_GUIDE.md) - Lưu ý quan trọng
- [TEST_COVERAGE_PLAN.md](../TEST_COVERAGE_PLAN.md) - Full testing strategy
