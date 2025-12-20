@echo off
REM View status of all monitoring tools
echo === Monitoring Tools Status ===
echo.

docker compose -f docker-compose.monitoring.yml ps

echo.
echo === Direct Links ===
echo Netdata:     http://localhost:19999
echo Uptime Kuma: http://localhost:3002
echo Glances:     http://localhost:61208
echo Beszel:      http://localhost:8090
echo.

pause
