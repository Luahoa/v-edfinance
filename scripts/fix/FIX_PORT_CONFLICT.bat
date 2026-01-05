@echo off
echo ================================
echo FIX PORT 5432 CONFLICT
echo ================================
echo.

REM Find what's using port 5432
echo [Step 1] Finding process on port 5432...
netstat -ano | findstr :5432
echo.

echo [Step 2] Checking for existing Docker containers...
docker ps -a | findstr postgres
echo.

echo [Step 3] Stopping all PostgreSQL containers...
for /f "tokens=1" %%i in ('docker ps -a -q --filter "ancestor=postgres" --filter "ancestor=ankane/pgvector"') do (
    echo Stopping container %%i...
    docker stop %%i
    docker rm %%i
)

REM Also check the orphaned containers mentioned in error
echo.
echo [Step 4] Cleaning up orphaned containers...
docker stop vedfinance-postgres-test 2>nul
docker rm vedfinance-postgres-test 2>nul
docker stop vedfinance-postgres 2>nul
docker rm vedfinance-postgres 2>nul
docker stop v-edfinance-db 2>nul
docker rm v-edfinance-db 2>nul

echo.
echo [Step 5] Removing old networks...
docker network prune -f

echo.
echo ================================
echo Port 5432 should now be free!
echo ================================
echo.
echo Next: Run QUICK_RUN.bat again
echo.
pause
