@echo off
echo ========================================
echo V-EdFinance Testing Suite
echo ========================================
echo.

echo [1/4] Installing dependencies...
call pnpm install

echo.
echo [2/4] Running Unit Tests...
cd apps\api
call pnpm test

echo.
echo [3/4] Generating Coverage Report...
call pnpm test:coverage

echo.
echo [4/4] Opening Coverage Report...
start coverage\lcov-report\index.html

echo.
echo ========================================
echo Testing Complete!
echo ========================================
pause
