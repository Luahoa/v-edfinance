@echo off
REM Quality Gate Script - Windows Compatible
REM Epic: ved-fz9m - Ralph CLI Integration
REM Version: 1.0
REM Date: 2026-01-06

setlocal enabledelayedexpansion

REM Result tracking
set PASSED=0
set FAILED=0
set WARNINGS=0

echo ============================================================
echo          Quality Gate Check - V-EdFinance
echo ============================================================
echo.

REM ============================================================
REM GATE 1: TypeScript Build Validation
REM ============================================================
echo [Gate 1] TypeScript Build
echo.

echo INFO: Building API (NestJS)...
pnpm --filter api build >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [32mPASS:[0m API build successful
    set /a PASSED+=1
) else (
    echo [31mFAIL:[0m API build failed
    set /a FAILED+=1
)

echo INFO: Building Web (Next.js)...
pnpm --filter web build >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [32mPASS:[0m Web build successful
    set /a PASSED+=1
) else (
    echo [31mFAIL:[0m Web build failed
    set /a FAILED+=1
)

echo.

REM ============================================================
REM GATE 2: Lint Check
REM ============================================================
echo [Gate 2] Code Quality
echo.

echo INFO: Running ESLint on API...
pnpm --filter api lint >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [32mPASS:[0m API lint passed
    set /a PASSED+=1
) else (
    echo [33mWARN:[0m API lint warnings found
    set /a WARNINGS+=1
)

echo INFO: Running ESLint on Web...
pnpm --filter web lint >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [32mPASS:[0m Web lint passed
    set /a PASSED+=1
) else (
    echo [33mWARN:[0m Web lint warnings found
    set /a WARNINGS+=1
)

echo.

REM ============================================================
REM GATE 3: Ralph CLI Validation
REM ============================================================
echo [Gate 3] Ralph CLI Health Check
echo.

echo INFO: Testing Ralph CLI...
test-ralph.bat --help >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [32mPASS:[0m Ralph CLI executable
    set /a PASSED+=1
) else (
    echo [31mFAIL:[0m Ralph CLI not working
    set /a FAILED+=1
)

echo.

REM ============================================================
REM FINAL REPORT
REM ============================================================
echo ============================================================
echo                 Quality Gate Summary
echo ============================================================
echo.
echo   PASSED:   %PASSED% checks
echo   FAILED:   %FAILED% checks
echo   WARNINGS: %WARNINGS% checks
echo.

REM Create simple JSON report (compatible with Ralph CLI)
echo { > .quality-gate-result.json
echo   "timestamp": "%date% %time%", >> .quality-gate-result.json
echo   "overall": "%FAILED%", >> .quality-gate-result.json
echo   "summary": { >> .quality-gate-result.json
echo     "passed": %PASSED%, >> .quality-gate-result.json
echo     "failed": %FAILED%, >> .quality-gate-result.json
echo     "warnings": %WARNINGS% >> .quality-gate-result.json
echo   } >> .quality-gate-result.json
echo } >> .quality-gate-result.json

if %FAILED% EQU 0 (
    echo ============================================================
    echo   [32m ALL QUALITY GATES PASSED[0m
    echo ============================================================
    exit /b 0
) else (
    echo ============================================================
    echo   [31m QUALITY GATES FAILED[0m
    echo ============================================================
    exit /b 1
)
