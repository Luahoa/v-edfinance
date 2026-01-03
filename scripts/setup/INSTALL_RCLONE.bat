@echo off
REM Install rclone CLI tool for Windows
echo === Installing Rclone ===
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Running with administrator privileges...
) else (
    echo Warning: Not running as administrator. Some features may not work.
    echo Consider running as administrator for best results.
    echo.
)

echo Starting installation...
echo.

REM Run PowerShell script with execution policy bypass
powershell -ExecutionPolicy Bypass -File "%~dp0install-rclone.ps1"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo === Installation Successful! ===
    echo.
    echo Please RESTART your terminal/PowerShell to use rclone.
    echo.
    pause
) else (
    echo.
    echo === Installation Failed ===
    echo Check the error messages above.
    echo.
    pause
    exit /b 1
)
