@echo off
REM V-EdFinance Automated Testing System - Windows Launcher

echo ========================================
echo V-EdFinance Automated Testing System
echo ========================================
echo.

:MENU
echo Choose an option:
echo.
echo 1. Run AI Test Generator (Generate missing tests)
echo 2. Run Swarm Test Orchestrator (Parallel test generation)
echo 3. Update Beads Test Tasks (Track coverage)
echo 4. Run All Tests + Coverage Report
echo 5. Open Test Dashboard
echo 6. Setup CI/CD (GitHub Actions)
echo 7. Exit
echo.

set /p choice="Enter choice (1-7): "

if "%choice%"=="1" goto AI_TEST_GEN
if "%choice%"=="2" goto SWARM_TEST
if "%choice%"=="3" goto BEADS_UPDATE
if "%choice%"=="4" goto RUN_TESTS
if "%choice%"=="5" goto DASHBOARD
if "%choice%"=="6" goto CICD_SETUP
if "%choice%"=="7" goto EXIT

echo Invalid choice. Please try again.
goto MENU

:AI_TEST_GEN
echo.
echo [Running AI Test Generator...]
pnpm ts-node scripts/ai-test-generator.ts
echo.
pause
goto MENU

:SWARM_TEST
echo.
echo [Checking Swarm CLI installation...]
where swarm >nul 2>nul
if %errorlevel% neq 0 (
    echo Swarm CLI not found. Installing...
    gem install swarm_cli
)

echo [Running Swarm Test Orchestrator...]
swarm run swarms/test-orchestrator-swarm.yml
echo.
pause
goto MENU

:BEADS_UPDATE
echo.
echo [Updating Beads Test Tasks...]
bash scripts/beads-test-tracker.sh
echo.
pause
goto MENU

:RUN_TESTS
echo.
echo [Running All Tests with Coverage...]
cd apps\api
pnpm test:cov
echo.
echo [Opening Coverage Report...]
start coverage\lcov-report\index.html
cd ..\..
pause
goto MENU

:DASHBOARD
echo.
echo [Opening Test Dashboard...]
start scripts/test-dashboard.html
pause
goto MENU

:CICD_SETUP
echo.
echo [Setting up GitHub Actions CI/CD...]
echo.
echo Copy .github/workflows/automated-testing.yml to your repository
echo Configure secrets:
echo   - ANTHROPIC_API_KEY (for AI test generation)
echo   - BEADS_API_KEY (for Beads integration)
echo.
echo Then commit and push:
echo   git add .github/workflows/automated-testing.yml
echo   git commit -m "Enable automated testing CI/CD"
echo   git push
echo.
pause
goto MENU

:EXIT
echo.
echo ========================================
echo Thank you for using V-EdFinance Automated Testing!
echo ========================================
exit
