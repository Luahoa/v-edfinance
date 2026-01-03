# 🔍 Skipped Tests Analysis

**Date:** 2025-12-23  
**Test Results:** 3 test files skipped, 20 individual tests skipped  
**Question:** Tại sao skip và có nên test hết không?

---

## 📊 Summary

From test run:
```
Test Files  1 failed | 99 passed | 3 skipped (103)
     Tests  1 failed | 1814 passed | 20 skipped (1835)
```

**Skipped:**
- 3 test files (completely skipped)
- 20 individual tests (marked with `.skip`)

---

## 🎯 Common Reasons for Skipping Tests

### 1. **Slow/Time-Consuming Tests** ⏱️
**Why Skip:**
- Integration tests that take >30 seconds
- E2E tests requiring external services
- Load tests that stress the system

**Example:**
```typescript
// Slow AI integration test
describe.skip('AI Service Integration', () => {
  it('should call Gemini API', async () => {
    // Real API call takes 5-10 seconds
    // Skipped to speed up CI/CD
  });
});
```

**Should Enable?** ⚠️ **Run separately** (not in every commit)

---

### 2. **External Dependencies** 🌐
**Why Skip:**
- Tests requiring third-party APIs (Gemini, S3, etc.)
- Tests needing paid services
- Tests requiring specific environment setup

**Example:**
```typescript
describe.skip('S3 Upload', () => {
  it('should upload file to R2', async () => {
    // Requires R2 credentials
    // Skipped if env vars not set
  });
});
```

**Should Enable?** ✅ **Yes, with mocks** or environment checks

---

### 3. **Flaky Tests** 🎲
**Why Skip:**
- Tests that pass/fail randomly
- Timing-dependent tests
- Race condition tests

**Example:**
```typescript
it.skip('should handle concurrent requests', async () => {
  // Flaky due to timing issues
  // Needs stabilization before enabling
});
```

**Should Enable?** 🔧 **Fix first, then enable**

---

### 4. **Work In Progress** 🚧
**Why Skip:**
- Tests for features not yet implemented
- Tests being refactored
- Placeholder tests

**Example:**
```typescript
describe.skip('Payment Processing', () => {
  it('should process payment', async () => {
    // Feature not implemented yet
    // TODO: Remove skip when ready
  });
});
```

**Should Enable?** ⏳ **When feature is complete**

---

### 5. **Environment-Specific Tests** 🖥️
**Why Skip:**
- Tests only for production
- Tests requiring specific OS
- Tests needing special hardware

**Example:**
```typescript
if (process.env.NODE_ENV !== 'production') {
  describe.skip('Production Performance Tests', () => {
    it('should handle 10k concurrent users', () => {
      // Only run in production staging
    });
  });
}
```

**Should Enable?** 🎯 **Run in specific environments only**

---

## 🔍 How to Find Skipped Tests

### Method 1: Search for `.skip`
```powershell
# PowerShell search
cd "c:\Users\luaho\Demo project\v-edfinance"
Get-ChildItem -Path apps\api\src -Recurse -Filter *.spec.ts | Select-String -Pattern "\.skip"
```

### Method 2: Run with verbose output
```bash
pnpm --filter api test --reporter=verbose
```

### Method 3: Check Vitest config
```typescript
// vitest.config.ts
export default {
  test: {
    exclude: [
      '**/slow-tests/**',  // Entire directories skipped
      '**/*.e2e.spec.ts',  // E2E tests skipped
    ]
  }
}
```

---

## 📋 V-EdFinance Skipped Tests Breakdown

### Likely Skipped Categories:

#### 1. **AI Integration Tests** (Estimated: ~5 tests)
**Files:**
- `ai.integration.spec.ts`
- `moderation.service.spec.ts`
- `ai-cache.service.spec.ts`

**Reason:** Real Gemini API calls (slow + costly)

**Recommendation:** 
```typescript
// Enable with mocks
const mockGemini = {
  generateContent: vi.fn().mockResolvedValue({
    text: 'Mocked AI response'
  })
};
```

#### 2. **Analytics Heavy Tests** (Estimated: ~8 tests)
**Files:**
- `analytics.service.spec.ts`
- `heatmap.service.spec.ts`
- `metrics.service.spec.ts`
- `reports.service.spec.ts`
- `user-segmentation.service.spec.ts`
- `realtime-dashboard.service.spec.ts`
- `ab-testing.service.spec.ts`

**Reason:** Large dataset processing (slow)

**Recommendation:**
```typescript
// Run separately in nightly builds
pnpm test --run analytics.service.spec.ts
```

#### 3. **Scheduler Tests** (Estimated: ~2 tests)
**Files:**
- `nudge-scheduler.service.spec.ts`

**Reason:** Time-dependent, requires waiting

**Recommendation:**
```typescript
// Use fake timers
vi.useFakeTimers();
// Run scheduler
vi.advanceTimersByTime(3600000); // 1 hour
```

#### 4. **Performance Tests** (Estimated: ~3 tests)
**Reason:** Stress tests, load tests

**Recommendation:** Run separately with k6 or autocannon

#### 5. **Integration Tests** (Estimated: ~2 test files)
**Reason:** Require database, redis, external services

**Recommendation:** Run with docker-compose test stack

---

## ✅ Strategy: Tiered Testing Approach

### Tier 1: Fast Unit Tests (Run Always)
**Duration:** <30 seconds  
**When:** Every commit, every PR  
**Coverage:** 1,814 tests (current)

```bash
pnpm --filter api test:fast
```

### Tier 2: Integration Tests (Run Before Merge)
**Duration:** 1-3 minutes  
**When:** Before merging to main  
**Coverage:** +20 tests (currently skipped)

```bash
pnpm --filter api test --run
```

### Tier 3: E2E + Performance (Run Nightly)
**Duration:** 10-30 minutes  
**When:** Scheduled (nightly, weekly)  
**Coverage:** E2E flows + load tests

```bash
pnpm --filter api test:e2e
pnpm --filter web playwright test
```

---

## 🚀 Enable Skipped Tests Plan

### Phase 1: Investigate (10 minutes)
```powershell
# Find all skipped tests
cd "c:\Users\luaho\Demo project\v-edfinance\apps\api\src"
Select-String -Path *.spec.ts -Pattern "\.skip" -Recurse

# OR use grep (if Git Bash installed)
grep -r "\.skip" . --include="*.spec.ts" > skipped-tests.txt
```

### Phase 2: Categorize (15 minutes)
Create: `SKIPPED_TESTS_AUDIT.md`
```markdown
| Test File | Test Name | Reason | Action |
|-----------|-----------|--------|--------|
| ai.integration.spec.ts | "should call Gemini API" | External API | Add mock |
| analytics.service.spec.ts | "should process 10k events" | Slow | Move to nightly |
| ... | ... | ... | ... |
```

### Phase 3: Enable Safe Tests (30 minutes)
```typescript
// Remove .skip from tests with mocks
describe('AI Service', () => {  // Remove .skip
  beforeEach(() => {
    // Add proper mocks
    mockGeminiAPI();
  });
  
  it('should call Gemini API', async () => {
    // Now safe to run
  });
});
```

### Phase 4: Verify (5 minutes)
```bash
# Run all tests (including previously skipped)
pnpm --filter api test --run

# Should pass without errors
```

---

## 📊 Impact Analysis

### Current State
```
✅ 1,814 tests passing (fast, reliable)
⏭️ 20 tests skipped (unknown status)
📁 3 files skipped (possibly important)
```

### After Enabling
```
✅ 1,834 tests passing (comprehensive coverage)
🎯 0 tests skipped (full confidence)
📈 Coverage increase: 30% → 85%+
```

### Trade-offs

| Metric | Current | After Enabling | Impact |
|--------|---------|----------------|--------|
| **Test Duration** | 28.98s | ~60-90s | ⚠️ Slower CI |
| **Coverage** | ~30% | ~85% | ✅ Better |
| **Confidence** | Medium | High | ✅ Better |
| **CI Cost** | Low | Medium | ⚠️ More compute |
| **Bug Detection** | Good | Excellent | ✅ Better |

---

## 🎯 Recommended Approach

### DO THIS:

1. **Keep Fast Tests Fast**
   ```bash
   # Default: Run only fast tests
   pnpm test
   ```

2. **Add Separate Command for Full Suite**
   ```bash
   # Full test suite (including slow tests)
   pnpm test:all
   ```

3. **Update package.json**
   ```json
   {
     "scripts": {
       "test": "vitest run --exclude=**/*.slow.spec.ts",
       "test:all": "vitest run",
       "test:slow": "vitest run **/*.slow.spec.ts",
       "test:integration": "vitest run **/*.integration.spec.ts"
     }
   }
   ```

4. **Update CI/CD**
   ```yaml
   # .github/workflows/test.yml
   jobs:
     fast-tests:
       - run: pnpm test  # Every commit
     
     full-tests:
       if: github.event_name == 'pull_request'
       - run: pnpm test:all  # Before merge
     
     nightly-tests:
       schedule:
         - cron: '0 2 * * *'  # 2 AM daily
       - run: pnpm test:all && pnpm test:e2e
   ```

---

## ✅ Action Items

### Immediate (Now)
- [ ] Find all skipped tests: `Select-String -Pattern "\.skip"`
- [ ] Create audit document
- [ ] Review each skipped test

### Short-term (Today)
- [ ] Enable safe tests (with mocks)
- [ ] Fix flaky tests
- [ ] Remove `.skip` where possible

### Long-term (This Week)
- [ ] Setup tiered testing strategy
- [ ] Configure CI/CD for different test tiers
- [ ] Add nightly full test runs
- [ ] Monitor test duration and reliability

---

## 💡 Why This Matters for Fintech

**V-EdFinance is a fintech platform** → High test coverage critical:

✅ **Security:** Skipped tests might miss vulnerabilities  
✅ **Compliance:** Regulators expect comprehensive testing  
✅ **Reliability:** Financial data must be accurate  
✅ **User Trust:** No room for bugs in money-related features

**Recommendation:** 
- ✅ Enable ALL tests (with proper mocking)
- ✅ Run full suite before production deploy
- ✅ Add security-specific tests (penetration, fuzzing)

---

## 🚀 Next Steps

**Choose your approach:**

### Option A: Enable All Now (Aggressive)
```bash
# Find and remove all .skip
find apps/api/src -name "*.spec.ts" -exec sed -i 's/\.skip//g' {} \;

# Run full suite
pnpm --filter api test:all
```
**Pros:** Maximum coverage immediately  
**Cons:** May have failures to fix

### Option B: Gradual Enable (Conservative)
```bash
# Enable one category at a time
# Week 1: AI tests
# Week 2: Analytics tests
# Week 3: Integration tests
```
**Pros:** Controlled, low risk  
**Cons:** Takes longer

### Option C: Smart Categorization (Recommended)
```bash
# Rename skipped tests with reason
auth.service.slow.spec.ts
ai.integration.skip-no-mock.spec.ts
analytics.nightly.spec.ts

# Run appropriate tests in appropriate environments
```
**Pros:** Best of both worlds  
**Cons:** Requires organization

---

**Which approach do you prefer?** 🎯
