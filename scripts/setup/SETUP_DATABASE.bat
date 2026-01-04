@echo off
REM =============================================================================
REM ULTIMATE DATABASE SEED SETUP - Single Script Solution
REM =============================================================================
REM Purpose: Complete database setup from scratch
REM - Starts Docker PostgreSQL with pgvector
REM - Runs migrations/schema push
REM - Seeds dev data (50 users, 10 courses)
REM - Runs tests
REM =============================================================================

setlocal enabledelayedexpansion

cd /d "C:\Users\luaho\Demo project\v-edfinance"

echo.
echo ========================================
echo ULTIMATE DATABASE SEED SETUP
echo ========================================
echo.
echo This will:
echo [1] Start Docker PostgreSQL (with pgvector)
echo [2] Setup database schema
echo [3] Seed dev data (50 users, 10 courses)
echo [4] Run verification tests
echo.
echo Estimated time: 3-5 minutes
echo.
set /p continue="Continue? (Y/N): "
if /i not "%continue%"=="Y" goto :EOF

REM =============================================================================
REM STEP 1: Docker PostgreSQL Setup
REM =============================================================================
echo.
echo ========================================
echo [1/4] Docker PostgreSQL Setup
echo ========================================
echo.

REM Check Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker not installed
    echo.
    echo Please install Docker Desktop:
    echo https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Clean start
echo Stopping old containers...
docker-compose -f docker-compose.dev.yml down -v >nul 2>&1
docker stop v-edfinance-db vedfinance-postgres vedfinance-postgres-test >nul 2>&1
docker rm v-edfinance-db vedfinance-postgres vedfinance-postgres-test >nul 2>&1
docker volume rm v-edfinance_postgres_data >nul 2>&1

echo Starting PostgreSQL container...
docker-compose -f docker-compose.dev.yml up -d

if %errorlevel% neq 0 (
    echo ERROR: Failed to start Docker
    echo.
    echo Check:
    echo - Docker Desktop is running
    echo - Port 5432 is available
    pause
    exit /b 1
)

echo Waiting 15 seconds for PostgreSQL...
timeout /t 15 /nobreak >nul

REM Verify container
docker ps | findstr v-edfinance-db >nul
if %errorlevel% neq 0 (
    echo ERROR: Container not running
    docker ps -a | findstr v-edfinance-db
    pause
    exit /b 1
)

echo Enabling pgvector extension...
docker exec v-edfinance-db psql -U postgres -d v_edfinance -c "CREATE EXTENSION IF NOT EXISTS vector;" >nul 2>&1

echo [1/4] Docker Setup: COMPLETE
timeout /t 2 /nobreak >nul

REM =============================================================================
REM STEP 2: Database Schema Setup
REM =============================================================================
echo.
echo ========================================
echo [2/4] Database Schema Setup
echo ========================================
echo.

REM Fix DATABASE_URL if needed
echo Checking DATABASE_URL...
powershell -Command "(Get-Content apps\api\.env -ErrorAction SilentlyContinue) -replace 'DATABASE_URL=.*', 'DATABASE_URL=\"postgresql://postgres:postgres@localhost:5432/v_edfinance\"' | Set-Content apps\api\.env" >nul 2>&1

cd apps\api

REM Test connection
call npx prisma db execute --stdin < nul >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Cannot connect to database
    docker logs v-edfinance-db --tail 20
    pause
    exit /b 1
)
echo Database connection: OK

REM Clean migration history
echo Resetting migration history...
docker exec v-edfinance-db psql -U postgres -d v_edfinance -c "DROP TABLE IF EXISTS \"_prisma_migrations\" CASCADE;" >nul 2>&1

REM Push schema
echo Pushing schema to database...
call npx prisma db push --force-reset --accept-data-loss

if %errorlevel% neq 0 (
    echo ERROR: Schema push failed
    pause
    exit /b 1
)

echo Generating Prisma Client...
call npx prisma generate >nul 2>&1

echo [2/4] Schema Setup: COMPLETE
timeout /t 2 /nobreak >nul

REM =============================================================================
REM STEP 3: Seed Dev Data
REM =============================================================================
echo.
echo ========================================
echo [3/4] Seeding Dev Data
echo ========================================
echo.

call npx ts-node prisma/seeds/index.ts dev

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Seed failed
    echo.
    echo Diagnostics:
    docker exec v-edfinance-db psql -U postgres -d v_edfinance -c "\dt"
    pause
    exit /b 1
)

echo [3/4] Data Seeding: COMPLETE
timeout /t 2 /nobreak >nul

REM =============================================================================
REM STEP 4: Run Tests
REM =============================================================================
echo.
echo ========================================
echo [4/4] Running Tests
echo ========================================
echo.

set /p run_tests="Run test suites? (Y/N): "
if /i "%run_tests%"=="Y" (
    echo.
    echo Running Triple-ORM tests...
    call pnpm test database.service.seed.spec.ts
    
    echo.
    echo Running AI Agent tests...
    call pnpm test ai-agent-data.spec.ts
    
    echo [4/4] Tests: COMPLETE
) else (
    echo [4/4] Tests: SKIPPED
)

REM =============================================================================
REM SUCCESS SUMMARY
REM =============================================================================
echo.
echo ========================================
echo SUCCESS! Database is Ready
echo ========================================
echo.
echo Status:
echo  [x] Docker PostgreSQL running
echo  [x] Schema synchronized
echo  [x] Dev data seeded
echo.
echo Data:
echo  - 50 users (mixed roles)
echo  - 10 courses (multi-lingual)
echo  - ~350 behavior logs
echo  - 5 buddy groups
echo.
echo Next steps:
echo  1. View data: npx prisma studio
echo  2. Run API: cd apps\api ^&^& pnpm start
echo  3. Run web: cd apps\web ^&^& pnpm dev
echo.
echo Docker container: v-edfinance-db
echo Database: v_edfinance
echo Port: 5432
echo.

pause
