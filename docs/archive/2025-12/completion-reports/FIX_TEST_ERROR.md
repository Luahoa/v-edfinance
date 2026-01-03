# 🔧 Quick Fix Instructions

## Error You Encountered:

```
The system cannot find the path specified.
'test' is not recognized as an internal or external command
```

## Problem:
The batch script had incorrect directory navigation and pnpm command syntax.

## ✅ FIXED - Try Again:

### Option 1: Use Fixed Batch Script
```powershell
# Double-click this file:
VERIFY_SECURITY_FIX.bat

# OR run in PowerShell:
.\VERIFY_SECURITY_FIX.bat
```

### Option 2: Manual Commands (RECOMMENDED)
```powershell
# Make sure you're in project root
cd "c:\Users\luaho\Demo project\v-edfinance"

# Run auth tests
pnpm --filter api test auth.service.spec.ts
```

### Option 3: Run All Tests
```powershell
cd "c:\Users\luaho\Demo project\v-edfinance"

# Run all API tests
pnpm --filter api test

# Or run with coverage
pnpm --filter api test:cov
```

---

## Expected Output (After Fix):

```
 ✓ src/auth/auth.service.spec.ts (45 tests) 1200ms
   ✓ Password Reset Race Conditions (S001)
     ✓ should prevent timing attacks on user lookup (250ms)

 Test Files  1 passed (1)
      Tests  45 passed (45)
   Duration  1.2s
```

---

## Next Steps:

1. ✅ Run `pnpm --filter api test auth.service.spec.ts`
2. ✅ Verify timing attack test passes
3. ✅ Run full coverage: `pnpm --filter api test:cov`
4. ✅ Commit the security fix

---

**Quick Command (Copy-Paste):**
```powershell
cd "c:\Users\luaho\Demo project\v-edfinance" && pnpm --filter api test auth.service.spec.ts
```
