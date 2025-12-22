@echo off
echo ========================================
echo V-EdFinance - Option 1: Quick Test
echo ========================================
echo.

cd apps\api

echo [Running Tests...]
echo.
call pnpm test

echo.
echo ========================================
echo Test Complete!
echo ========================================
echo.
echo Next: Check results above
echo Press any key to continue...
pause >nul
