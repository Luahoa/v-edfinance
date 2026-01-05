@echo off
echo ================================
echo FIX MIGRATIONS + ENABLE PGVECTOR
echo ================================
echo.

cd /d "C:\Users\luaho\Demo project\v-edfinance\apps\api"

REM Step 1: Enable pgvector extension
echo [1/4] Enabling pgvector extension in Docker...
docker exec v-edfinance-db psql -U postgres -d v_edfinance -c "CREATE EXTENSION IF NOT EXISTS vector;"
if %errorlevel% neq 0 (
    echo ERROR: Failed to enable pgvector
    echo This might be OK if extension already exists
)
echo.

REM Step 2: Drop failed migration
echo [2/4] Resolving failed migrations...
docker exec v-edfinance-db psql -U postgres -d v_edfinance -c "DELETE FROM \"_prisma_migrations\" WHERE migration_name = '20251222050000_add_optimization_log';"
echo.

REM Step 3: Reset database completely
echo [3/4] Resetting database (fresh start)...
call npx prisma migrate reset --force --skip-seed

if %errorlevel% neq 0 (
    echo ERROR: Reset failed
    pause
    exit /b 1
)
echo Database reset complete
echo.

REM Step 4: Verify schema
echo [4/4] Verifying schema...
call npx prisma db push --accept-data-loss

echo.
echo ================================
echo Migrations Fixed!
echo ================================
echo.
echo Next: Run dev seed
echo Command: npx ts-node prisma/seeds/index.ts dev
echo.
pause
