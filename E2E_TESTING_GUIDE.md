# ⚠️ Lưu Ý Quan Trọng Trước Khi Test E2E

**Dự án:** V-EdFinance  
**Framework:** Playwright  
**Ngày:** 2025-12-19

---

## 🎯 Tổng Quan

E2E (End-to-End) testing mô phỏng hành vi thực tế của người dùng trên trình duyệt. Khác với unit tests (test riêng lẻ từng function), E2E tests kiểm tra **toàn bộ luồng** từ UI → API → Database → Response.

---

## ⚠️ 10 Điều Cần Lưu Ý

### 1. **Environment Phải Sẵn Sàng** 🔴 CRITICAL

```bash
# Kiểm tra TRƯỚC KHI chạy E2E tests:
# ✅ Frontend đang chạy tại http://localhost:3000
pnpm --filter web dev

# ✅ Backend API đang chạy tại http://localhost:3001
pnpm --filter api dev

# ✅ Database online và có dữ liệu seed
docker-compose up -d postgres
npx prisma db seed
```

**Tại sao quan trọng:**
- E2E tests **không mock** API → Backend phải thật sự chạy
- Tests sẽ tạo/xóa data → Database phải sẵn sàng
- Nếu server không khởi động, tests sẽ timeout sau 30s

---

### 2. **Dữ Liệu Test Phải Độc Lập (Idempotent)** 🔴 CRITICAL

**SAI ❌:** Test phụ thuộc vào data có sẵn
```typescript
// BAD: Giả định email này chưa tồn tại
await page.fill('[name="email"]', 'test@example.com');
// → Nếu chạy lần 2 sẽ fail vì email đã tồn tại!
```

**ĐÚNG ✅:** Mỗi test tạo data riêng
```typescript
// GOOD: Tạo email unique mỗi lần chạy
const timestamp = Date.now();
const email = `user-${timestamp}@example.com`;
await page.fill('[name="email"]', email);
```

**Best Practice:**
```typescript
// tests/helpers/test-data.ts
export function generateTestUser() {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  return {
    email: `test-${uniqueId}@example.com`,
    password: 'SecurePass123!',
    name: `Test User ${uniqueId}`,
  };
}
```

---

### 3. **Clean Up Sau Mỗi Test** 🟡 IMPORTANT

**Vấn đề:** Test để lại "garbage data" trong database
```typescript
// Nếu không cleanup:
// Test 1: Tạo user A
// Test 2: Tạo user B
// Test 3: Tạo user C
// → Database ngày càng phình to, query chậm dần
```

**Giải pháp:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('User Registration', () => {
  let createdUserId: string;

  test.afterEach(async ({ request }) => {
    // Xóa user sau khi test xong
    if (createdUserId) {
      await request.delete(`http://localhost:3001/api/users/${createdUserId}`, {
        headers: { Authorization: 'Bearer ADMIN_TOKEN' },
      });
    }
  });

  test('should register new user', async ({ page }) => {
    // ... test logic
    createdUserId = await page.getAttribute('[data-testid="user-id"]', 'value');
  });
});
```

**Hoặc dùng test database riêng:**
```yaml
# docker-compose.test.yml
services:
  postgres-test:
    image: postgres:16
    environment:
      POSTGRES_DB: v_edfinance_test
    # Có thể reset hoàn toàn sau mỗi test suite
```

---

### 4. **Chờ Đúng Cách (Async Operations)** 🟡 IMPORTANT

**SAI ❌:** Hard-coded delays
```typescript
await page.click('[data-testid="submit-btn"]');
await page.waitForTimeout(3000); // ← BAD! Không biết chính xác cần bao lâu
expect(page.locator('.success-message')).toBeVisible();
```

**ĐÚNG ✅:** Chờ element/network requests
```typescript
await page.click('[data-testid="submit-btn"]');

// Option 1: Chờ element xuất hiện
await page.waitForSelector('.success-message', { state: 'visible' });

// Option 2: Chờ API call hoàn thành
await page.waitForResponse(response => 
  response.url().includes('/api/auth/register') && response.status() === 201
);

// Option 3: Playwright tự động chờ (BEST)
await expect(page.locator('.success-message')).toBeVisible({ timeout: 10000 });
```

---

### 5. **Locators Phải Stable & Semantic** 🟡 IMPORTANT

**Độ ưu tiên (cao → thấp):**

1. **`data-testid`** ⭐ BEST (dành riêng cho testing)
```typescript
await page.click('[data-testid="login-submit-btn"]');
```

2. **ARIA roles** (accessibility-friendly)
```typescript
await page.click('button[aria-label="Submit Login"]');
```

3. **Placeholder/Label** (semantic)
```typescript
await page.fill('input[placeholder="Email"]', email);
```

4. **CSS class** ⚠️ AVOID (dễ thay đổi)
```typescript
await page.click('.btn-primary'); // ← Nếu dev đổi class → test fail
```

5. **XPath** 🔴 NEVER (brittle, khó đọc)
```typescript
await page.click('/html/body/div[2]/form/button[1]'); // ← TERRIBLE
```

**Recommendation:** Thêm `data-testid` vào components
```tsx
// apps/web/src/components/auth/LoginForm.tsx
export function LoginForm() {
  return (
    <form data-testid="login-form">
      <input
        name="email"
        data-testid="login-email-input"
        placeholder="Email"
      />
      <input
        name="password"
        data-testid="login-password-input"
        type="password"
      />
      <button type="submit" data-testid="login-submit-btn">
        Đăng nhập
      </button>
    </form>
  );
}
```

---

### 6. **Test Multi-Language (i18n)** 🟢 NICE TO HAVE

V-EdFinance hỗ trợ 3 ngôn ngữ → Phải test cả 3:

```typescript
test.describe('Login in Vietnamese', () => {
  test('should display Vietnamese UI', async ({ page }) => {
    await page.goto('http://localhost:3000/vi/login');
    await expect(page.locator('h1')).toContainText('Đăng nhập');
  });
});

test.describe('Login in English', () => {
  test('should display English UI', async ({ page }) => {
    await page.goto('http://localhost:3000/en/login');
    await expect(page.locator('h1')).toContainText('Login');
  });
});

test.describe('Login in Chinese', () => {
  test('should display Chinese UI', async ({ page }) => {
    await page.goto('http://localhost:3000/zh/login');
    await expect(page.locator('h1')).toContainText('登录');
  });
});
```

---

### 7. **Xử Lý Failures & Screenshots** 🟡 IMPORTANT

**Playwright tự động:**
- ✅ Chụp screenshot khi test fail
- ✅ Record video (nếu config)
- ✅ Capture trace (debugging)

**Config đã có:**
```typescript
// playwright.config.ts
use: {
  screenshot: 'only-on-failure', // ✅
  trace: 'on-first-retry',       // ✅
}
```

**Xem kết quả:**
```bash
# Chạy tests
pnpm exec playwright test

# Mở HTML report
pnpm exec playwright show-report

# Xem trace nếu test fail
pnpm exec playwright show-trace trace.zip
```

---

### 8. **Performance Testing (Optional)** 🟢 NICE TO HAVE

**Đo thời gian load trang:**
```typescript
test.describe('Performance', () => {
  test('login page should load under 2s', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('http://localhost:3000/vi/login');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(2000); // < 2 seconds
  });
});
```

---

### 9. **Mobile Testing** 🟢 NICE TO HAVE

Test responsive design:

```typescript
// playwright.config.ts
projects: [
  {
    name: 'Desktop Chrome',
    use: { ...devices['Desktop Chrome'] },
  },
  {
    name: 'Mobile Safari',
    use: { ...devices['iPhone 13'] },
  },
  {
    name: 'Tablet',
    use: { ...devices['iPad Pro'] },
  },
],
```

---

### 10. **CI/CD Integration** 🟡 IMPORTANT

**GitHub Actions Example:**
```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: pnpm install
      
      # Start servers
      - run: pnpm --filter api dev &
      - run: pnpm --filter web dev &
      - run: sleep 10 # Wait for servers
      
      # Run E2E tests
      - run: pnpm exec playwright install --with-deps
      - run: pnpm exec playwright test
      
      # Upload artifacts on failure
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 🚀 Quick Checklist Trước Khi Chạy E2E

```bash
# 1. Services đang chạy?
curl http://localhost:3000  # Frontend
curl http://localhost:3001/api/health  # Backend

# 2. Database có data?
docker exec -it postgres psql -U postgres -d v_edfinance -c "SELECT COUNT(*) FROM \"User\";"

# 3. Dependencies đủ chưa?
pnpm exec playwright install chromium

# 4. Config đúng chưa?
cat playwright.config.ts

# 5. Chạy thử 1 test
pnpm exec playwright test --headed  # Xem browser mở
```

---

## 📚 Resources

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [TEST_COVERAGE_PLAN.md](./TEST_COVERAGE_PLAN.md) - Week 3 E2E strategy
- [Playwright Debugging Guide](https://playwright.dev/docs/debug)

---

**Chuẩn bị xong?** → Xem [tests/e2e/auth/login-onboarding.spec.ts](../tests/e2e/auth/login-onboarding.spec.ts) để bắt đầu!
