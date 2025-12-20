@echo off
REM Install all DevOps modernization dependencies
REM Bypasses PowerShell execution policy issues

echo ========================================
echo V-EdFinance - DevOps Tools Installation
echo 3-Day Sprint: Day 1 Setup
echo ========================================
echo.

echo [1/3] Installing testing tools...
echo - Biome (linting/formatting)
echo - Vitest (test runner)
echo - MSW (API mocking)
echo - Autocannon (load testing)
echo.

REM Use npx with pnpm to bypass execution policy
npx -y pnpm@9.15.0 install

echo.
echo [2/3] Verifying installations...
npx -y pnpm@9.15.0 list @biomejs/biome vitest msw autocannon unstorage

echo.
echo [3/3] Running initial format...
npx -y pnpm@9.15.0 biome check --write .

echo.
echo ========================================
echo ✅ Installation complete!
echo ========================================
echo.
echo Next steps:
echo 1. Run 'npm run test' to start Vitest
echo 2. Run 'npm run test:ui' for UI mode
echo 3. Run 'npm run lint' for Biome check
echo.
pause
