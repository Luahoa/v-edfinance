@echo off
setlocal enabledelayedexpansion

set "PROJECT_ROOT=%~dp0"
cd /d "%PROJECT_ROOT%"

echo ========================================
echo FIXING DUPLICATE NEXT.JS ISSUE
echo ========================================
echo.

echo [1/3] Removing duplicate Next.js in apps/web...
if exist "apps\web\node_modules\next" (
    rmdir /s /q "apps\web\node_modules\next"
    echo ✓ Removed apps/web/node_modules/next
) else (
    echo Already clean
)
echo.

echo [2/3] Cleaning npm cache...
call npm cache clean --force
echo.

echo [3/3] Reinstalling workspace dependencies...
call npm install
echo.

echo ========================================
echo ✓ CLEANUP COMPLETE
echo ========================================
echo.
echo Now run: npm run build -w apps/web
pause
