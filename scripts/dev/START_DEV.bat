@echo off
setlocal enabledelayedexpansion

set "PROJECT_ROOT=%~dp0"
cd /d "%PROJECT_ROOT%"

echo ========================================
echo V-EDFINANCE - DEV SERVER STARTUP
echo ========================================
echo.

echo [STEP 1/4] Checking Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker not found. Please install Docker Desktop.
    pause
    exit /b 1
)
echo ✓ Docker is available
echo.

echo [STEP 2/4] Starting PostgreSQL container...
docker-compose up -d postgres
if errorlevel 1 (
    echo ❌ Failed to start PostgreSQL
    pause
    exit /b 1
)
echo ✓ PostgreSQL container started
echo Waiting 5 seconds for DB to be ready...
timeout /t 5 /nobreak >nul
echo.

echo [STEP 3/4] Checking environment files...
if not exist "apps\api\.env" (
    echo ❌ apps/api/.env not found
    echo Please create it with DATABASE_URL and other configs
    pause
    exit /b 1
)
if not exist "apps\web\.env.local" (
    echo ⚠️ apps/web/.env.local not found (optional)
)
echo ✓ Environment files checked
echo.

echo ========================================
echo READY TO START DEV SERVERS
echo ========================================
echo.
echo You can now start the servers:
echo.
echo 1. Backend API (port 3001):
echo    cd apps\api
echo    npm run start:dev
echo.
echo 2. Frontend Web (port 3000):
echo    cd apps\web
echo    npm run dev
echo.
echo Or use Turborepo to start both:
echo    npm run dev
echo.
echo ========================================
echo.
echo Press any key to start Turborepo dev mode...
pause >nul

echo Starting all dev servers with Turborepo...
npm run dev
