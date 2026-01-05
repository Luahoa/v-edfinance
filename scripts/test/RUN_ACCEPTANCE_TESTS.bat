@echo off
SETLOCAL EnableDelayedExpansion

echo ====================================================
echo   🎭 V-EDFINANCE E2E ACCEPTANCE TEST RUNNER (PRO)
echo ====================================================

:: Check for Administrator privileges
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Running with Administrator privileges.
) else (
    echo [WARN] Not running as Administrator. Some port cleanup might fail.
)

:: 1. Clean up existing ports (3000, 3001) to avoid ECONNREFUSED
echo [1/4] Cleaning up environment (Ports 3000, 3001)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
echo [OK] Ports cleared.

:: 2. Build backend to ensure integrity
echo [2/4] Checking Backend Integrity...
cd /d "%~dp0apps\api"
call pnpm build
if %errorlevel% neq 0 (
    echo ❌ Backend build failed!
    pause
    exit /b %errorlevel%
)
cd /d "%~dp0"

:: 3. Prepare Test Browsers
echo [3/4] Preparing Playwright Browsers...
cd /d "%~dp0apps\web"
call npx playwright install chromium
cd /d "%~dp0"

:: 4. Run the Holy Trinity E2E Tests
echo [4/4] Running Holy Trinity E2E Tests (Multi-locale)...
echo.
echo Mode: Full Hermetic Mock (Using Next.js Mock API Proxy)
echo Locales: vi, en, zh
echo.

cd /d "%~dp0apps\web"
:: Set environment variables for the test run
set NEXT_PUBLIC_API_URL=http://localhost:3000/api/mock
set NODE_ENV=test

call pnpm test e2e/holy-trinity.spec.ts --reporter=list,html
if %errorlevel% neq 0 (
    echo.
    echo ❌ E2E Tests Failed! 
    echo ----------------------------------------------------
    echo Nguyen nhan co the do:
    echo 1. Server Next.js khoi dong qua cham (Timeout)
    echo 2. Locator UI thay doi (vui long kiem tra report)
    echo.
    echo Xem chi tiet tai: apps\web\playwright-report\index.html
    echo ----------------------------------------------------
    pause
    exit /b %errorlevel%
)

cd /d "%~dp0"
echo.
echo ✅ ALL ACCEPTANCE TESTS PASSED!
echo System is healthy and follows Behavioral Engineering standards.
echo ====================================================
pause
