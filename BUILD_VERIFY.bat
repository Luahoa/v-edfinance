@echo off
cd /d "%~dp0"
echo Building web app...
call pnpm --filter web build
if %ERRORLEVEL% EQU 0 (
    echo ✓ Web build SUCCESS
) else (
    echo ✗ Web build FAILED
)

echo.
echo Building API...
call pnpm --filter api build
if %ERRORLEVEL% EQU 0 (
    echo ✓ API build SUCCESS
) else (
    echo ✗ API build FAILED
)

pause
