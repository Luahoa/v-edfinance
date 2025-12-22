@echo off
REM ====================================================================
REM V-EdFinance VPS Backup Quick Start
REM ====================================================================
REM Run this from Windows to execute backup on VPS via Bitvise SSH
REM ====================================================================

echo 🚀 V-EdFinance VPS Backup Quick Start
echo ====================================
echo.

REM Check if Bitvise is installed
set BITVISE_PATH="C:\Program Files\Bitvise SSH Client\BvSsh.exe"
if not exist %BITVISE_PATH% (
    echo ⚠️  Bitvise SSH Client not found at: %BITVISE_PATH%
    echo Please update the path in this script or use manual SSH.
    echo.
    goto MANUAL
)

echo ✅ Bitvise SSH Client found
echo.

REM Display options
echo Select operation:
echo [1] Backup database on VPS
echo [2] List available backups
echo [3] Download latest backup
echo [4] Restore database on VPS
echo [5] Manual SSH instructions
echo.

set /p CHOICE="Enter choice (1-5): "

if "%CHOICE%"=="1" goto BACKUP
if "%CHOICE%"=="2" goto LIST
if "%CHOICE%"=="3" goto DOWNLOAD
if "%CHOICE%"=="4" goto RESTORE
if "%CHOICE%"=="5" goto MANUAL

echo ❌ Invalid choice
goto END

:BACKUP
echo.
echo 📤 Creating backup on VPS...
echo.
echo Using Bitvise to execute backup script...
%BITVISE_PATH% -host=103.54.153.248 -user=root -cmd="bash /root/scripts/vps-backup.sh"
echo.
echo ✅ Backup command sent. Check VPS console for output.
goto END

:LIST
echo.
echo 📋 Listing available backups on VPS...
echo.
%BITVISE_PATH% -host=103.54.153.248 -user=root -cmd="ls -lh /root/backups/*.sql.gz"
goto END

:DOWNLOAD
echo.
echo 📥 Downloading latest backup from VPS...
echo.
if not exist "backups\database" mkdir backups\database
echo Note: Use Bitvise SFTP or SCP for file transfer
echo.
echo Manual command:
echo scp root@103.54.153.248:/root/backups/latest.sql.gz ./backups/database/
echo.
echo Starting Bitvise SFTP...
%BITVISE_PATH% -host=103.54.153.248 -user=root -sftp
goto END

:RESTORE
echo.
echo 🔄 Restoring database on VPS...
echo.
echo ⚠️  WARNING: This will overwrite staging database!
echo.
set /p CONFIRM="Are you sure? (yes/no): "
if not "%CONFIRM%"=="yes" (
    echo ❌ Restore cancelled
    goto END
)
echo.
%BITVISE_PATH% -host=103.54.153.248 -user=root -cmd="bash /root/scripts/vps-restore.sh"
goto END

:MANUAL
echo.
echo 📖 Manual SSH Instructions
echo ====================================
echo.
echo 1. Connect to VPS via Bitvise SSH:
echo    Host: 103.54.153.248
echo    User: root
echo    Auth: Use saved session "amp-agent"
echo.
echo 2. Upload backup scripts to VPS:
echo    mkdir -p /root/scripts
echo    # Upload vps-backup.sh and vps-restore.sh
echo.
echo 3. Make scripts executable:
echo    chmod +x /root/scripts/vps-backup.sh
echo    chmod +x /root/scripts/vps-restore.sh
echo.
echo 4. Run backup:
echo    bash /root/scripts/vps-backup.sh
echo.
echo 5. Run restore:
echo    bash /root/scripts/vps-restore.sh [backup_file.sql.gz]
echo.
echo 6. Download backup to local:
echo    scp root@103.54.153.248:/root/backups/latest.sql.gz ./backups/database/
echo.

:END
echo.
echo ====================================
echo For detailed guide, see:
echo docs\DATABASE_BACKUP_GUIDE.md
echo.
pause
