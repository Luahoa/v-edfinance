@echo off
REM Stop all monitoring tools
echo === Stopping All Monitoring Tools ===
echo.

echo Stopping monitoring stack...
docker compose -f docker-compose.monitoring.yml down

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] All monitoring tools stopped
    echo.
) else (
    echo.
    echo [ERROR] Failed to stop monitoring tools
    echo.
    pause
    exit /b 1
)

pause
