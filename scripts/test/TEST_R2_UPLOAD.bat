@echo off
echo ========================================
echo Testing R2 File Upload
echo ========================================
echo.

REM Create test file
echo Hello from V-EdFinance R2 Test! > test-upload.txt
echo Test file created: test-upload.txt
echo.

REM Test upload via curl
echo Uploading to backend API...
curl -X POST http://localhost:3001/api/storage/upload -F "file=@test-upload.txt"

echo.
echo.
echo ========================================
echo Test Complete!
echo ========================================
echo.
echo Check the response above for the R2 URL
echo Then open that URL in your browser to verify
echo.
pause
