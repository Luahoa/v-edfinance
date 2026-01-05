@echo off
REM Start all 4 monitoring tools via Docker
echo ========================================
echo V-EdFinance Monitoring Stack
echo Starting 4 monitoring dashboards...
echo ========================================
echo.

docker compose -f docker-compose.monitoring.yml up -d

echo.
echo Waiting for services to start...
timeout /t 10 /nobreak > nul

echo.
echo ========================================
echo ✅ Monitoring Stack Online!
echo ========================================
echo.
echo Dashboards:
echo   - Netdata       : http://localhost:19999
echo   - Uptime Kuma   : http://localhost:3002
echo   - Glances       : http://localhost:61208
echo   - Beszel        : http://localhost:8090
echo.
echo Quick Commands:
echo   - Stop all      : docker compose -f docker-compose.monitoring.yml down
echo   - View logs     : docker compose -f docker-compose.monitoring.yml logs -f
echo   - Restart       : docker compose -f docker-compose.monitoring.yml restart
echo.
pause
