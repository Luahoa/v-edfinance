@echo off
REM ========================================
REM Dependency Check Script for Windows
REM V-EdFinance Project
REM ========================================

echo.
echo ================================================
echo   V-EdFinance Dependency Check
echo ================================================
echo.

REM Check if pnpm is installed
pnpm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] pnpm is NOT installed!
    echo.
    echo Please install pnpm:
    echo   npm install -g pnpm@9.15.0
    echo.
    echo Or visit: https://pnpm.io/installation
    echo.
    pause
    exit /b 1
)

echo [OK] pnpm is installed
pnpm --version
echo.

REM Check for package-lock.json (should NOT exist)
if exist "package-lock.json" (
    echo [WARNING] Found package-lock.json!
    echo This project uses pnpm, not npm.
    echo.
    choice /C YN /M "Delete package-lock.json?"
    if errorlevel 2 goto skip_delete
    if errorlevel 1 (
        del package-lock.json
        echo [OK] Deleted package-lock.json
    )
    :skip_delete
    echo.
)

REM Check for pnpm-lock.yaml (should exist)
if not exist "pnpm-lock.yaml" (
    echo [WARNING] pnpm-lock.yaml not found!
    echo.
    choice /C YN /M "Run pnpm install to create it?"
    if errorlevel 2 goto skip_install
    if errorlevel 1 (
        echo.
        echo Running: pnpm install
        pnpm install
    )
    :skip_install
    echo.
) else (
    echo [OK] pnpm-lock.yaml exists
    echo.
)

REM Check .npmrc
if not exist ".npmrc" (
    echo [WARNING] .npmrc not found!
    echo This file should contain pnpm configuration.
    echo.
) else (
    echo [OK] .npmrc exists
    echo.
)

REM Run validation script
echo ================================================
echo   Running Validation Script...
echo ================================================
echo.

node scripts\validate-lockfile.js

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Validation failed!
    echo Please fix the issues above.
    pause
    exit /b 1
)

echo.
echo ================================================
echo   All checks passed! ✓
echo ================================================
echo.
pause
