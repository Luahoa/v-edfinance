@echo off
REM Ultra-Fast Quality Gate for Ralph CLI
REM Minimal checks for rapid iteration

setlocal enabledelayedexpansion

set PASSED=3
set FAILED=0

echo ============================================================
echo       Ultra-Fast Quality Gate - Ralph CLI
echo ============================================================
echo.

REM Gate 1: Ralph CLI exists
echo [Gate 1] Ralph CLI exists
if exist "libs\ralph-cli\src\index.ts" (
    echo [32mPASS:[0m Ralph CLI source found
) else (
    echo [31mFAIL:[0m Ralph CLI missing
    set /a FAILED+=1
    set /a PASSED-=1
)

REM Gate 2: Git healthy
echo [Gate 2] Git repository
git rev-parse --git-dir >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [32mPASS:[0m Git healthy
) else (
    echo [31mFAIL:[0m Git error
    set /a FAILED+=1
    set /a PASSED-=1
)

REM Gate 3: Package.json exists
echo [Gate 3] Package configuration
if exist "package.json" (
    echo [32mPASS:[0m Package config found
) else (
    echo [31mFAIL:[0m Package missing
    set /a FAILED+=1
    set /a PASSED-=1
)

echo.
echo Summary: %PASSED% passed, %FAILED% failed
echo.

REM Create JSON report
(
echo {
echo   "timestamp": "%date% %time%",
echo   "mode": "ultra-fast",
echo   "summary": {
echo     "passed": %PASSED%,
echo     "failed": %FAILED%
echo   }
echo }
) > .quality-gate-result.json

if %FAILED% EQU 0 (
    echo [32mALL GATES PASSED[0m
    exit /b 0
) else (
    echo [31mGATES FAILED[0m
    exit /b 1
)
