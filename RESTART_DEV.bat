@echo off
echo ========================================
echo RESTARTING DEV SERVERS
echo ========================================
echo.

echo [1/4] Killing existing processes on ports 3000 and 3001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do (
    echo Killing process %%a on port 3000...
    taskkill /F /PID %%a 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001"') do (
    echo Killing process %%a on port 3001...
    taskkill /F /PID %%a 2>nul
)
echo.

echo [2/4] Waiting for ports to be released...
timeout /t 3 /nobreak >nul
echo.

echo [3/4] Cleaning Next.js cache...
cd "%~dp0apps\web"
if exist ".next" (
    echo Deleting .next folder...
    rmdir /s /q .next
)
cd "%~dp0"
echo.

echo [4/4] Starting dev servers...
echo.
call START_DEV.bat
