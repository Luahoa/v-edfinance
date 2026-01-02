@echo off
echo ================================
echo COMPLETE DATABASE SETUP
echo ================================
echo.

cd /d "C:\Users\luaho\Demo project\v-edfinance"

REM Ensure Docker is running with clean state
echo [Step 1] Starting clean Docker PostgreSQL...
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d

echo Waiting 10 seconds for PostgreSQL...
timeout /t 10 /nobreak > nul
echo.

REM Enable pgvector
echo [Step 2] Enabling pgvector extension...
docker exec v-edfinance-db psql -U postgres -d v_edfinance -c "CREATE EXTENSION IF NOT EXISTS vector;"
echo.

REM Setup database schema
cd apps\api

echo [Step 3] Resetting database with fresh migrations...
call npx prisma migrate reset --force --skip-seed

if %errorlevel% neq 0 (
    echo ERROR: Migration failed
    echo.
    echo Trying alternative approach (db push)...
    call npx prisma db push --accept-data-loss --force-reset
    
    if %errorlevel% neq 0 (
        echo FATAL: Cannot setup database
        pause
        exit /b 1
    )
)
echo.

echo [Step 4] Generating Prisma Client...
call npx prisma generate
echo.

echo [Step 5] Running dev scenario seed...
call npx ts-node prisma/seeds/index.ts dev

if %errorlevel% equ 0 (
    echo.
    echo ================================
    echo SUCCESS! Database is ready
    echo ================================
    echo.
    echo Data seeded:
    echo - 50 users
    echo - 10 courses  
    echo - ~350 behavior logs
    echo - 5 buddy groups
    echo.
    echo Open Prisma Studio to view: npx prisma studio
    echo.
    echo Next: Run tests
    echo   pnpm test database.service.seed.spec.ts
    echo   pnpm test ai-agent-data.spec.ts
    echo.
) else (
    echo.
    echo ================================
    echo SEED FAILED
    echo ================================
    echo.
    echo Checking database state...
    call npx prisma studio
)

pause
