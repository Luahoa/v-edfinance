@echo off
REM Start all monitoring tools
echo === Starting All Monitoring Tools ===
echo.

echo Starting monitoring stack (Netdata, Uptime Kuma, Glances, Beszel)...
docker compose -f docker-compose.monitoring.yml up -d

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] All monitoring tools started!
    echo.
    echo Access the dashboards at:
    echo   - Netdata:     http://localhost:19999
    echo   - Uptime Kuma: http://localhost:3002
    echo   - Glances:     http://localhost:61208
    echo   - Beszel:      http://localhost:8090
    echo.
    echo Run VIEW_MONITORING_STATUS.bat to check health
    echo.
) else (
    echo.
    echo [ERROR] Failed to start monitoring tools
    echo.
    pause
    exit /b 1
)

pause
