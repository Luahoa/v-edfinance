@echo off
echo ================================
echo FIX POSTGRESQL CONNECTION
echo ================================
echo.

echo [Step 1] Checking if PostgreSQL service exists...
sc query | findstr /i "postgresql" > nul
if %errorlevel% equ 0 (
    echo PostgreSQL service found
) else (
    echo ERROR: PostgreSQL not installed or service not found
    echo.
    echo Please:
    echo 1. Install PostgreSQL from: https://www.postgresql.org/download/windows/
    echo 2. Or start Docker PostgreSQL: docker-compose up -d db
    pause
    exit /b 1
)
echo.

echo [Step 2] Checking PostgreSQL service status...
sc query postgresql-x64-16 | findstr /i "running" > nul
if %errorlevel% equ 0 (
    echo PostgreSQL is RUNNING
) else (
    echo PostgreSQL is STOPPED
    echo.
    echo Attempting to start PostgreSQL service...
    net start postgresql-x64-16
    
    if %errorlevel% equ 0 (
        echo PostgreSQL started successfully
    ) else (
        echo ERROR: Failed to start PostgreSQL
        echo.
        echo Try manually:
        echo 1. Open Services (services.msc)
        echo 2. Find "postgresql-x64-16" 
        echo 3. Right-click and Start
        echo.
        echo Or use Docker:
        echo docker-compose up -d db
        pause
        exit /b 1
    )
)
echo.

echo [Step 3] Testing database connection...
cd /d "C:\Users\luaho\Demo project\v-edfinance\apps\api"

call npx prisma db execute --stdin < nul
if %errorlevel% equ 0 (
    echo Database connection: SUCCESS
) else (
    echo Database connection: FAILED
    echo.
    echo Please check:
    echo 1. PostgreSQL is running on port 5432
    echo 2. DATABASE_URL in .env is correct
    echo 3. Database "v_edfinance" exists
    echo.
    echo Current DATABASE_URL:
    type .env | findstr DATABASE_URL
    pause
    exit /b 1
)

echo.
echo ================================
echo PostgreSQL is ready!
echo ================================
echo.
echo Next: Run dev seed again
echo Command: npx ts-node prisma/seeds/index.ts dev
echo.
pause
