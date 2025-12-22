@echo off
REM ====================================================================
REM V-EdFinance Database Backup to VPS Script
REM ====================================================================
REM Purpose: Backup local PostgreSQL database and sync to staging VPS
REM Target: 103.54.153.248 (Dokploy VPS)
REM ====================================================================

echo 🚀 V-EdFinance Database Backup to VPS
echo ====================================

REM Step 1: Check Docker is running
echo.
echo [1/5] Checking Docker status...
docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Docker is not running. Start Docker Desktop first.
    exit /b 1
)
echo ✅ Docker is running

REM Step 2: Create backup directory
echo.
echo [2/5] Creating backup directory...
if not exist "backups\database" mkdir backups\database
set BACKUP_FILE=backups\database\vedfinance_%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%.sql
set BACKUP_FILE=%BACKUP_FILE: =0%
echo ✅ Backup directory ready

REM Step 3: Dump local database
echo.
echo [3/5] Dumping database from Docker container...
docker exec vedfinance-postgres pg_dump -U postgres -d postgres > "%BACKUP_FILE%"
if %ERRORLEVEL% neq 0 (
    echo ❌ Database dump failed
    exit /b 1
)
echo ✅ Database dumped to: %BACKUP_FILE%

REM Step 4: Compress backup
echo.
echo [4/5] Compressing backup...
powershell -Command "Compress-Archive -Path '%BACKUP_FILE%' -DestinationPath '%BACKUP_FILE%.zip' -Force"
if %ERRORLEVEL% neq 0 (
    echo ❌ Compression failed
    exit /b 1
)
echo ✅ Backup compressed: %BACKUP_FILE%.zip

REM Step 5: Upload to VPS using SCP
echo.
echo [5/5] Uploading to VPS (103.54.153.248)...
echo Note: Ensure SSH key is configured (temp_pub_key.pub)
echo.
echo Manual upload command:
echo scp -i ~/.ssh/vedfinance_vps "%BACKUP_FILE%.zip" root@103.54.153.248:/root/backups/
echo.
echo Or use this to restore on VPS:
echo ssh -i ~/.ssh/vedfinance_vps root@103.54.153.248
echo docker exec -i dokploy-postgres psql -U postgres -d vedfinance_staging ^< backup.sql
echo.

REM Step 6: Summary
echo.
echo ====================================
echo ✅ Backup Complete!
echo ====================================
echo 📁 Local Backup: %BACKUP_FILE%.zip
echo 🔐 SSH Key: temp_pub_key.pub
echo 🎯 VPS Target: 103.54.153.248
echo 📊 Database: vedfinance_staging
echo.
echo Next Steps:
echo 1. Configure SSH key: Copy temp_pub_key.pub to VPS
echo 2. Manual upload: Use SCP command above
echo 3. Restore on VPS: Use docker exec command
echo.

pause
