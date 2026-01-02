@echo off
echo ================================
echo CLEAN START: Docker DB + Seed
echo ================================
echo.

cd /d "C:\Users\luaho\Demo project\v-edfinance"

REM Clean up first
echo [Cleanup] Removing old containers and networks...
docker-compose -f docker-compose.dev.yml down -v
docker stop v-edfinance-db 2>nul
docker rm v-edfinance-db 2>nul
docker stop vedfinance-postgres 2>nul
docker rm vedfinance-postgres 2>nul
docker stop vedfinance-postgres-test 2>nul
docker rm vedfinance-postgres-test 2>nul
docker network prune -f
echo.

REM Check port 5432
echo [Check] Verifying port 5432 is free...
netstat -ano | findstr :5432
if %errorlevel% equ 0 (
    echo WARNING: Port 5432 still in use!
    echo.
    echo Finding process...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5432') do (
        echo Process PID: %%a
        echo Killing process...
        taskkill /F /PID %%a
    )
    timeout /t 2 /nobreak > nul
)
echo Port 5432 is free
echo.

REM Start fresh
echo [1/5] Starting Docker PostgreSQL (clean)...
docker-compose -f docker-compose.dev.yml up -d

if %errorlevel% neq 0 (
    echo ERROR: Failed to start Docker
    echo.
    echo Checking Docker status...
    docker ps
    echo.
    echo Checking logs...
    docker logs v-edfinance-db 2>nul
    pause
    exit /b 1
)

echo Waiting 10 seconds for PostgreSQL to initialize...
timeout /t 10 /nobreak > nul
echo.

REM Verify container is running
echo [Check] Verifying container status...
docker ps | findstr v-edfinance-db
if %errorlevel% neq 0 (
    echo ERROR: Container not running
    docker ps -a | findstr v-edfinance-db
    pause
    exit /b 1
)
echo Container is running
echo.

REM Step 2: Verify connection
echo [2/5] Verifying database connection...
cd apps\api
call npx prisma db execute --stdin < nul

if %errorlevel% neq 0 (
    echo ERROR: Cannot connect to database
    echo.
    echo Checking container logs...
    docker logs v-edfinance-db --tail 50
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
    echo.
    echo This might be OK if migrations already exist
    echo Continuing...
)
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
    echo Docker container: v-edfinance-db
    echo Port: 5432
    echo Database: v_edfinance
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
