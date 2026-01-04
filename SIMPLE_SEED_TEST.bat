@echo off
REM Simple Database Seed Testing
REM Run with admin privileges

echo ================================
echo Database Seed Testing
echo ================================
echo.

cd /d "C:\Users\luaho\Demo project\v-edfinance\apps\api"

echo [Test 1] Checking Prisma installation...
call pnpm exec npx prisma --version
if %errorlevel% neq 0 (
    echo ERROR: Prisma not found
    pause
    exit /b 1
)
echo OK: Prisma installed
echo.

echo [Test 2] Checking database connection...
call pnpm exec npx prisma db execute --stdin < nul
if %errorlevel% neq 0 (
    echo WARNING: Cannot connect to database
    echo Please check DATABASE_URL in .env file
)
echo.

echo [Test 3] Generating Prisma Client...
call pnpm exec npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: Prisma generate failed
    pause
    exit /b 1
)
echo OK: Prisma client generated
echo.

echo [Test 4] Running migrations...
call pnpm exec npx prisma migrate deploy
echo Migration result: %errorlevel%
echo.

echo [Test 5] Running basic seed...
call pnpm exec ts-node prisma/seed.ts
if %errorlevel% neq 0 (
    echo ERROR: Seed failed
    echo Check error above
    pause
    exit /b 1
)
echo OK: Basic seed completed
echo.

echo [Test 6] Verifying seeded data...
echo SELECT COUNT(*) FROM "User"; > temp_query.sql
call pnpm exec npx prisma db execute --file temp_query.sql
del temp_query.sql
echo.

echo ================================
echo Basic Testing Complete
echo ================================
echo.
echo Next steps:
echo 1. Fix any errors above
echo 2. Run full test suite
echo.
pause
