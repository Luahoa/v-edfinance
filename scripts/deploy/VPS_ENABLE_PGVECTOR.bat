@echo off
REM VED-6YB: Enable Pgvector Extension on VPS PostgreSQL
REM Windows wrapper to execute script on VPS via SSH

echo ========================================
echo VED-6YB: Enable Pgvector on VPS
echo ========================================
echo.

echo Uploading script to VPS...
scp scripts/vps/enable-pgvector.sh root@103.54.153.248:/tmp/enable-pgvector.sh
if errorlevel 1 (
    echo ERROR: Failed to upload script
    pause
    exit /b 1
)

echo.
echo Executing script on VPS...
ssh root@103.54.153.248 "chmod +x /tmp/enable-pgvector.sh && bash /tmp/enable-pgvector.sh"
if errorlevel 1 (
    echo ERROR: Script execution failed
    pause
    exit /b 1
)

echo.
echo Cleaning up...
ssh root@103.54.153.248 "rm /tmp/enable-pgvector.sh"

echo.
echo ========================================
echo SUCCESS! Pgvector enabled on VPS
echo ========================================
echo.
echo Next: Run "beads.exe close ved-6yb --reason 'Enabled pgvector on all VPS databases'"
pause
