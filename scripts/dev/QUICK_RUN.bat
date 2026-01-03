@echo off
echo ================================
echo QUICK START: Docker DB + Seed
echo ================================
echo.

cd /d "C:\Users\luaho\Demo project\v-edfinance"

REM Step 1: Start Docker PostgreSQL with pgvector
echo [1/5] Starting Docker PostgreSQL...
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d

if %errorlevel% neq 0 (
    echo ERROR: Failed to start Docker
    echo.
    echo Please check:
    echo 1. Docker Desktop is installed and running
    echo 2. No other PostgreSQL on port 5432
    pause
    exit /b 1
)

echo Waiting 10 seconds for PostgreSQL to initialize...
timeout /t 10 /nobreak > nul
echo.

REM Step 2: Verify connection
echo [2/5] Verifying database connection...
cd apps\api
call npx prisma db execute --stdin < nul

if %errorlevel% neq 0 (
    echo ERROR: Cannot connect to database
    echo Checking Docker logs...
    docker logs v-edfinance-db
    pause
    exit /b 1
)
echo Database connection: OK
echo.

REM Step 3: Run migrations
echo [3/5] Running database migrations...
call npx prisma migrate deploy

if %errorlevel% neq 0 (
    echo ERROR: Migrations failed
    pause
    exit /b 1
)
echo Migrations: OK
echo.

REM Step 4: Generate Prisma Client
echo [4/5] Generating Prisma Client...
call npx prisma generate
echo.

REM Step 5: Run dev seed
echo [5/5] Running dev scenario seed...
call npx ts-node prisma/seeds/index.ts dev

if %errorlevel% equ 0 (
    echo.
    echo ================================
    echo SUCCESS!
    echo ================================
    echo.
    echo Database seeded with:
    echo - 50 users
    echo - 10 courses
    echo - ~350 behavior logs
    echo - 5 buddy groups
    echo.
    echo View data: npx prisma studio
    echo.
) else (
    echo.
    echo ================================
    echo SEED FAILED
    echo ================================
    echo Check errors above
    echo.
)

pause
