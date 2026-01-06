@echo off
REM Ralph CLI Installation Script for New Projects
REM Usage: install-ralph.bat <target-project-path>

if "%1"=="" (
    echo Error: Please provide target project path
    echo Usage: install-ralph.bat C:\path\to\project
    exit /b 1
)

set TARGET=%1
set SOURCE=%~dp0

echo ============================================================
echo       Installing Ralph CLI to %TARGET%
echo ============================================================
echo.

REM Create ralph-cli directory in target
if not exist "%TARGET%\libs" mkdir "%TARGET%\libs"
xcopy /E /I /Y "%SOURCE%libs\ralph-cli" "%TARGET%\libs\ralph-cli"

REM Copy config files
copy /Y "%SOURCE%ralph.config.json" "%TARGET%\ralph.config.json"
copy /Y "%SOURCE%test-ralph.bat" "%TARGET%\test-ralph.bat"

REM Copy quality gate scripts
if not exist "%TARGET%\scripts" mkdir "%TARGET%\scripts"
copy /Y "%SOURCE%scripts\quality-gate-ultra-fast.bat" "%TARGET%\scripts\"
copy /Y "%SOURCE%scripts\quality-gate-fast.bat" "%TARGET%\scripts\"

REM Create history directory
if not exist "%TARGET%\history" mkdir "%TARGET%\history"

REM Copy documentation
if not exist "%TARGET%\docs" mkdir "%TARGET%\docs"
copy /Y "%SOURCE%RALPH_QUICK_START.md" "%TARGET%\RALPH_QUICK_START.md"

echo.
echo ============================================================
echo   Ralph CLI Installation Complete!
echo ============================================================
echo.
echo Next steps:
echo   1. cd %TARGET%
echo   2. pnpm install
echo   3. Edit ralph.config.json for your project
echo   4. test-ralph.bat --help
echo.
