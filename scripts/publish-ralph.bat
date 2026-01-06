@echo off
REM Auto-publish Ralph CLI to GitHub
REM Usage: publish-ralph.bat

echo ============================================================
echo      Publishing Ralph CLI to GitHub
echo ============================================================
echo.

set RALPH_DIR=ralph-cli-standalone
set REPO_URL=https://github.com/Luahoa/ralph-cli.git

REM Check if folder exists
if not exist "%RALPH_DIR%" (
    echo Error: %RALPH_DIR% not found
    exit /b 1
)

cd %RALPH_DIR%

REM Initialize git if needed
if not exist ".git" (
    echo Initializing git repository...
    git init
    git branch -M main
)

REM Add all files
echo Adding files...
git add .

REM Commit
echo Committing...
git commit -m "Update Ralph CLI v1.0.0 - Production ready"

REM Add remote if not exists
git remote get-url origin >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Adding remote...
    git remote add origin %REPO_URL%
)

REM Push
echo Pushing to GitHub...
git push -u origin main --force

echo.
echo ============================================================
echo   Ralph CLI published successfully!
echo ============================================================
echo.
echo Install anywhere with:
echo   pnpm add -g git+%REPO_URL%
echo.
echo Or clone:
echo   git clone %REPO_URL%
echo.

cd ..
