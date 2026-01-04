@echo off
echo ================================
echo AUTO-NAVIGATE AND RUN SEED TESTS
echo ================================
echo.

REM Navigate to correct project directory
cd /d "C:\Users\luaho\Demo project\v-edfinance"

echo Current directory:
cd
echo.

echo Navigating to API directory...
cd apps\api

echo Current directory:
cd
echo.

echo ================================
echo [Step 1] Checking Prisma Schema
echo ================================
if exist "prisma\schema.prisma" (
    echo OK: Prisma schema found
) else (
    echo ERROR: Prisma schema not found!
    pause
    exit /b 1
)
echo.

echo ================================
echo [Step 2] Installing Dependencies
echo ================================
call pnpm install
echo.

echo ================================
echo [Step 3] Generating Prisma Client
echo ================================
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: Prisma generate failed
    pause
    exit /b 1
)
echo OK: Prisma client generated
echo.

echo ================================
echo [Step 4] Checking Database Connection
echo ================================
call npx prisma db execute --stdin < nul
if %errorlevel% neq 0 (
    echo WARNING: Cannot connect to database
    echo Please check:
    echo 1. PostgreSQL is running
    echo 2. DATABASE_URL in .env file is correct
    echo.
    echo Current .env location: %cd%\.env
    echo.
    pause
)
echo.

echo ================================
echo [Step 5] Running Database Migrations
echo ================================
call npx prisma migrate deploy
echo Migration complete (exit code: %errorlevel%)
echo.

echo ================================
echo [Step 6] Running Basic Seed
echo ================================
call npx ts-node prisma/seed.ts
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Seed failed!
    echo Check the error message above
    echo.
    pause
    exit /b 1
)

echo.
echo ================================
echo SUCCESS!
echo ================================
echo Basic seed completed successfully!
echo.
echo Next steps:
echo 1. Verify data in database
echo 2. Run dev scenario: npx ts-node prisma/seeds/index.ts dev
echo 3. Run tests: pnpm test database.service.seed.spec.ts
echo.
pause
