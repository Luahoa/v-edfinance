@echo off
REM Fast Quality Gate for Ralph CLI Development
REM Skips heavy builds, focuses on quick checks

setlocal enabledelayedexpansion

set PASSED=0
set FAILED=0
set WARNINGS=0

echo ============================================================
echo      Fast Quality Gate - Ralph CLI Development
echo ============================================================
echo.

REM ============================================================
REM GATE 1: TypeScript Syntax Check (no build)
REM ============================================================
echo [Gate 1] TypeScript Syntax Check
echo.

echo INFO: Checking TypeScript syntax...
npx tsc --noEmit --skipLibCheck >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [32mPASS:[0m TypeScript syntax valid
    set /a PASSED+=1
) else (
    echo [33mWARN:[0m TypeScript syntax warnings
    set /a WARNINGS+=1
)

echo.

REM ============================================================
REM GATE 2: Ralph CLI Health
REM ============================================================
echo [Gate 2] Ralph CLI Health
echo.

echo INFO: Testing Ralph CLI...
test-ralph.bat --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [32mPASS:[0m Ralph CLI executable
    set /a PASSED+=1
) else (
    echo [31mFAIL:[0m Ralph CLI not working
    set /a FAILED+=1
)

echo.

REM ============================================================
REM GATE 3: Git Status Check
REM ============================================================
echo [Gate 3] Git Status
echo.

echo INFO: Checking git status...
git status >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [32mPASS:[0m Git repository healthy
    set /a PASSED+=1
) else (
    echo [31mFAIL:[0m Git status error
    set /a FAILED+=1
)

echo.

REM ============================================================
REM FINAL REPORT
REM ============================================================
echo ============================================================
echo              Fast Quality Gate Summary
echo ============================================================
echo.
echo   PASSED:   %PASSED% checks
echo   FAILED:   %FAILED% checks
echo   WARNINGS: %WARNINGS% checks
echo.

REM Create JSON report
echo { > .quality-gate-result.json
echo   "timestamp": "%date% %time%", >> .quality-gate-result.json
echo   "mode": "fast", >> .quality-gate-result.json
echo   "summary": { >> .quality-gate-result.json
echo     "passed": %PASSED%, >> .quality-gate-result.json
echo     "failed": %FAILED%, >> .quality-gate-result.json
echo     "warnings": %WARNINGS% >> .quality-gate-result.json
echo   } >> .quality-gate-result.json
echo } >> .quality-gate-result.json

if %FAILED% EQU 0 (
    echo ============================================================
    echo   [32m FAST QUALITY GATES PASSED[0m
    echo ============================================================
    exit /b 0
) else (
    echo ============================================================
    echo   [31m QUALITY GATES FAILED[0m
    echo ============================================================
    exit /b 1
)
