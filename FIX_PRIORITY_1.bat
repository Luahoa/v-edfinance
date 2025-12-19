@echo off
setlocal enabledelayedexpansion

set "PROJECT_ROOT=%~dp0"
cd /d "%PROJECT_ROOT%"

echo ========================================
echo V-EDFINANCE - PRIORITY 1 FIXES
echo ========================================
echo Working directory: %CD%
echo.

echo [1/4] Installing React at workspace root...
call npm install react@19.0.0 react-dom@19.0.0
if errorlevel 1 (
    echo ERROR: Failed to install React
    pause
    exit /b 1
)
echo ✓ React installed successfully
echo.

echo [2/4] Updating Next.js to latest...
cd /d "%PROJECT_ROOT%apps\web"
call npm install next@latest
if errorlevel 1 (
    echo ERROR: Failed to update Next.js
    cd /d "%PROJECT_ROOT%"
    pause
    exit /b 1
)
echo ✓ Next.js updated successfully
echo.

echo [3/4] Installing Zustand...
cd /d "%PROJECT_ROOT%apps\web"
call npm install zustand
if errorlevel 1 (
    echo ERROR: Failed to install Zustand
    cd /d "%PROJECT_ROOT%"
    pause
    exit /b 1
)
echo ✓ Zustand installed successfully
echo.

echo [4/4] Testing frontend build...
cd /d "%PROJECT_ROOT%apps\web"
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed
    cd /d "%PROJECT_ROOT%"
    pause
    exit /b 1
)
cd /d "%PROJECT_ROOT%"
echo ✓ Build successful!
echo.

echo ========================================
echo ALL PRIORITY 1 FIXES COMPLETED!
echo ========================================
pause
