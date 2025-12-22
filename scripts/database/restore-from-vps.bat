@echo off
REM ====================================================================
REM V-EdFinance Database Restore from VPS Script
REM ====================================================================
REM Purpose: Download and restore database backup from staging VPS
REM Target: 103.54.153.248 (Dokploy VPS)
REM ====================================================================

echo 🔄 V-EdFinance Database Restore from VPS
echo ====================================

REM Step 1: Check Docker is running
echo.
echo [1/4] Checking Docker status...
docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Docker is not running. Start Docker Desktop first.
    exit /b 1
)
echo ✅ Docker is running

REM Step 2: Download latest backup from VPS
echo.
echo [2/4] Downloading latest backup from VPS...
echo Note: Ensure SSH key is configured
echo.
echo Manual download command:
echo scp -i ~/.ssh/vedfinance_vps root@103.54.153.248:/root/backups/latest.sql.zip ./backups/database/
echo.
echo Press any key after downloading backup manually...
pause >nul

REM Step 3: Extract backup
echo.
echo [3/4] Extracting backup...
if not exist "backups\database\latest.sql.zip" (
    echo ❌ Backup file not found: backups\database\latest.sql.zip
    exit /b 1
)
powershell -Command "Expand-Archive -Path 'backups\database\latest.sql.zip' -DestinationPath 'backups\database\' -Force"
echo ✅ Backup extracted

REM Step 4: Restore to local database
echo.
echo [4/4] Restoring database to local Docker container...
echo ⚠️  Warning: This will overwrite your local database!
echo Press Ctrl+C to cancel, or any key to continue...
pause >nul

REM Drop existing database and recreate
docker exec -i vedfinance-postgres psql -U postgres -c "DROP DATABASE IF EXISTS postgres;"
docker exec -i vedfinance-postgres psql -U postgres -c "CREATE DATABASE postgres;"

REM Restore from backup
docker exec -i vedfinance-postgres psql -U postgres -d postgres < backups\database\latest.sql
if %ERRORLEVEL% neq 0 (
    echo ❌ Database restore failed
    exit /b 1
)

echo.
echo ====================================
echo ✅ Restore Complete!
echo ====================================
echo 📁 Restored from: backups\database\latest.sql
echo 🎯 Target: Local Docker PostgreSQL
echo.
echo Run migrations to sync schema:
echo cd apps/api ^&^& npx prisma migrate deploy
echo.

pause
