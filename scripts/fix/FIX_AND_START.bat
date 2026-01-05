@echo off
echo ====================================================
echo V-EdFinance: Phase 1 Automation Setup (Fixed Path)
echo ====================================================

:: Use the directory where the script is located
set ROOT_DIR=%~dp0
cd /d "%ROOT_DIR%"

echo [1/5] Working Directory: %cd%

echo [1/5] Installing Root dependencies...
call npm install

echo.
echo [2/5] Installing API dependencies (apps/api)...
cd /d "%ROOT_DIR%apps\api"
if exist package.json (
    call npm install
) else (
    echo ERROR: apps/api/package.json not found!
)

echo.
echo [3/5] Setting up Database (Prisma)...
cd /d "%ROOT_DIR%apps\api"
:: Generate Prisma Client
call npx prisma generate
:: Run Migrations
echo Applying migrations...
call npx prisma migrate dev --name init
:: Seed Data
echo Seeding data...
call npx prisma db seed

echo.
echo [4/5] Installing Web dependencies (apps/web)...
cd /d "%ROOT_DIR%apps\web"
if exist package.json (
    call npm install
) else (
    echo ERROR: apps/web/package.json not found!
)

echo.
echo [5/5] Finalizing...
echo ====================================================
echo Setup Complete! 
echo Current Directory: %cd%
echo ====================================================
pause
