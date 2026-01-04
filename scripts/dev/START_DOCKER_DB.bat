@echo off
echo ================================
echo START DOCKER POSTGRESQL WITH PGVECTOR
echo ================================
echo.

cd /d "C:\Users\luaho\Demo project\v-edfinance"

echo [Step 1] Checking Docker...
docker --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker not installed or not running
    echo.
    echo Please:
    echo 1. Install Docker Desktop: https://www.docker.com/products/docker-desktop
    echo 2. Start Docker Desktop
    echo 3. Run this script again
    pause
    exit /b 1
)
echo OK: Docker is available
echo.

echo [Step 2] Stopping any existing containers...
docker-compose down
echo.

echo [Step 3] Starting PostgreSQL with pgvector...
docker-compose up -d db
if %errorlevel% neq 0 (
    echo ERROR: Failed to start PostgreSQL container
    pause
    exit /b 1
)
echo.

echo [Step 4] Waiting for PostgreSQL to be ready...
timeout /t 5 /nobreak > nul
echo.

echo [Step 5] Verifying PostgreSQL is running...
docker ps | findstr postgres
if %errorlevel% neq 0 (
    echo WARNING: PostgreSQL container not found
    echo Showing all containers:
    docker ps -a
    pause
    exit /b 1
)
echo.

echo [Step 6] Enabling pgvector extension...
docker exec v-edfinance-db-1 psql -U postgres -d v_edfinance -c "CREATE EXTENSION IF NOT EXISTS vector;"
if %errorlevel% neq 0 (
    echo WARNING: Could not enable pgvector extension
    echo This might be OK if using a different postgres image
)
echo.

echo [Step 7] Testing database connection...
cd apps\api
call npx prisma db execute --stdin < nul
if %errorlevel% neq 0 (
    echo ERROR: Cannot connect to database
    echo.
    echo Checking container logs:
    docker logs v-edfinance-db-1
    pause
    exit /b 1
)
echo.

echo ================================
echo SUCCESS: PostgreSQL is ready!
echo ================================
echo.
echo Container: v-edfinance-db-1
echo Port: 5432
echo Database: v_edfinance
echo User: postgres
echo.
echo Next steps:
echo 1. Run migrations: npx prisma migrate reset --force --skip-seed
echo 2. Run dev seed: npx ts-node prisma/seeds/index.ts dev
echo.
pause
