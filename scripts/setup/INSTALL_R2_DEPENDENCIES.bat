@echo off
echo ========================================
echo Installing R2 Storage Dependencies
echo ========================================
echo.

cd apps\api

echo Installing AWS SDK for S3 (R2 compatibility)...
call npx pnpm add @aws-sdk/client-s3

echo.
echo Installing Unstorage S3 driver...
call npx pnpm add unstorage

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Copy apps/api/.env.example to apps/api/.env
echo 2. Fill in your R2 credentials
echo 3. Run: npm run start:dev
echo.
pause
