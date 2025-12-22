@echo off
echo ========================================
echo Testing Security Fix - Timing Attack Prevention
echo ========================================
echo.

echo Current directory: %CD%
echo.

echo [Running Auth Service Tests...]
echo.

REM Run from project root
call pnpm --filter api test auth.service.spec.ts

echo.
echo ========================================
echo Test Complete!
echo ========================================
pause
