@echo off
REM Windows wrapper for enable-pg-stat-statements.sh
REM Requires Git Bash or WSL

echo ================================================
echo  Enable pg_stat_statements Extension
echo ================================================
echo.

REM Check if running in WSL or Git Bash
where bash >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: bash not found. Install Git Bash or WSL.
    pause
    exit /b 1
)

REM Run the bash script
bash "%~dp0enable-pg-stat-statements.sh"

if %errorlevel% equ 0 (
    echo.
    echo ================================================
    echo  SUCCESS: pg_stat_statements enabled!
    echo ================================================
) else (
    echo.
    echo ================================================
    echo  FAILED: Check error messages above
    echo ================================================
)

pause
