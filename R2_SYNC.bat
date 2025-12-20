@echo off
REM Sync files to Cloudflare R2
echo === R2 Sync Wrapper ===
echo.

REM Default to dry-run for safety
set DRY_RUN=-DryRun

REM Check for --execute flag
if "%1"=="--execute" (
    set DRY_RUN=
    echo [INFO] EXECUTE MODE - Files will be transferred
) else (
    echo [INFO] DRY-RUN MODE - No files will be transferred
    echo [INFO] Use --execute flag to actually sync files
)

echo.

REM Run PowerShell script
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\r2-sync.ps1" %DRY_RUN%

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] Sync operation completed
) else (
    echo.
    echo [ERROR] Sync operation failed
    pause
    exit /b 1
)

pause
