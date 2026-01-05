@echo off
REM VPS Database Setup Launcher
REM Automatically installs dependencies and deploys to VPS

echo ═══════════════════════════════════════════════════════════
echo 🚀 V-EdFinance VPS Database Setup Launcher
echo ═══════════════════════════════════════════════════════════
echo.

echo 📦 Step 1: Installing dependencies...
call pnpm add ssh2 @types/ssh2 -D
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    exit /b 1
)
echo ✅ Dependencies installed
echo.

echo 🔧 Step 2: Deploying to VPS...
call npx tsx scripts/vps-deploy-direct.ts
if %errorlevel% neq 0 (
    echo ❌ Deployment failed
    exit /b 1
)

echo.
echo ═══════════════════════════════════════════════════════════
echo 🎉 VPS Database Setup Complete!
echo ═══════════════════════════════════════════════════════════
echo.
echo 📊 Verification:
echo   1. Check pg_stat_statements: http://103.54.153.248:3001/api/debug/database/analyze
echo   2. Monitor Netdata: http://103.54.153.248:19999
echo   3. Wait 24 hours for data collection
echo.
pause
