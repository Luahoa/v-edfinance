@echo off
echo ========================================
echo R2 FULL AUTO SETUP
echo ========================================
echo.
echo This script will:
echo 1. Install dependencies
echo 2. Configure .env file
echo 3. Start backend server
echo 4. Test upload
echo.
pause

REM ========================================
REM Step 1: Install Dependencies
REM ========================================
echo.
echo [1/4] Installing dependencies...
cd apps\api
call npx pnpm add @aws-sdk/client-s3 unstorage
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo ✓ Dependencies installed
cd ..\..

REM ========================================
REM Step 2: Configure .env
REM ========================================
echo.
echo [2/4] Configuring .env file...

REM Create .env file with R2 credentials
(
echo # ========================================
echo # Storage Configuration
echo # ========================================
echo STORAGE_DRIVER=r2
echo.
echo # ========================================
echo # Cloudflare R2 Configuration
echo # ========================================
echo R2_ACCOUNT_ID=687e1106150b9e7b88fdd1d65c382de
echo R2_BUCKET_NAME=vedfinance-prod
echo R2_ACCESS_KEY_ID=793ca47c2ce02352ea1ee34c99e672002
echo R2_SECRET_ACCESS_KEY=aa49f07530e1a80266903d883c5229461a48f1e6628d460c37580029470d0a07c8
echo R2_PUBLIC_URL=https://pub-b8dc3c47c48a4816b7856fe61c0b2.r2.dev/vedfinance-prod
echo R2_ENDPOINT=https://687e1106150b9e7b88fdd1d65c382de.r2.cloudflarestorage.com
echo.
echo # ========================================
echo # Database Configuration
echo # ========================================
echo DATABASE_URL=postgresql://postgres:postgres@localhost:5432/v_edfinance
echo.
echo # ========================================
echo # JWT Configuration
echo # ========================================
echo JWT_SECRET=v-edfinance-super-secret-key-change-in-production-2025
echo JWT_EXPIRES_IN=7d
echo.
echo # ========================================
echo # API Keys
echo # ========================================
echo GEMINI_API_KEY=your-gemini-api-key-here
) > apps\api\.env

echo ✓ .env file created with R2 credentials

REM ========================================
REM Step 3: Start Backend (in new window)
REM ========================================
echo.
echo [3/4] Starting backend server...
echo Opening new terminal window for backend...
start "V-EdFinance Backend" cmd /k "cd apps\api && npm run start:dev"

REM Wait for backend to start
echo Waiting 15 seconds for backend to initialize...
timeout /t 15 /nobreak

REM ========================================
REM Step 4: Test Upload
REM ========================================
echo.
echo [4/4] Testing R2 upload...

REM Create test file
echo Hello from V-EdFinance R2 Auto Setup! > test-upload.txt
echo ✓ Test file created

REM Test upload
echo.
echo Uploading to R2...
curl -X POST http://localhost:3001/api/storage/upload -F "file=@test-upload.txt"

echo.
echo.
echo ========================================
echo SETUP COMPLETE!
echo ========================================
echo.
echo Backend is running in separate window
echo Check the response above for R2 URL
echo.
echo Next steps:
echo 1. Open R2 URL in browser to verify
echo 2. Check Cloudflare R2 dashboard - Objects tab
echo 3. Start developing!
echo.
pause
