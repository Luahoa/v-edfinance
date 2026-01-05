@echo off
REM ============================================================================
REM SSH Key Rotation - Deploy New Public Key to VPS
REM ============================================================================
REM Part of: GitHub Security Cleanup (Phase 1)
REM Purpose: Add new SSH public key to VPS authorized_keys
REM Uses: Bitvise CLI + OpenSSH
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ========================================
echo   SSH Key Rotation - Deploy New Key
echo ========================================
echo.

REM Configuration
set VPS_HOST=103.54.153.248
set VPS_USER=root
set OLD_KEY=%USERPROFILE%\.ssh\amp_vps_private_key
set NEW_KEY=%USERPROFILE%\.ssh\vps_new_key
set NEW_PUB=%USERPROFILE%\.ssh\vps_new_key.pub

echo [INFO] VPS: %VPS_USER%@%VPS_HOST%
echo [INFO] Old Key: %OLD_KEY%
echo [INFO] New Key: %NEW_KEY%
echo.

REM ============================================================================
REM Phase 1: Verify Prerequisites
REM ============================================================================
echo [PHASE 1] Verifying Prerequisites...
echo.

REM Check new public key exists
if not exist "%NEW_PUB%" (
    echo [ERROR] New public key not found: %NEW_PUB%
    echo Please generate key first: ssh-keygen -t ed25519 -f %NEW_KEY%
    pause
    exit /b 1
)
echo [OK] New public key found

REM Check old key exists (needed for current connection)
if not exist "%OLD_KEY%" (
    echo [WARNING] Old key not found: %OLD_KEY%
    echo Trying to connect with new key directly...
    set CURRENT_KEY=%NEW_KEY%
) else (
    echo [OK] Old key found (using for connection)
    set CURRENT_KEY=%OLD_KEY%
)

echo.

REM ============================================================================
REM Phase 2: Read New Public Key
REM ============================================================================
echo [PHASE 2] Reading New Public Key...
echo.

REM Read public key content
set /p NEW_PUB_CONTENT=<"%NEW_PUB%"
echo [OK] Public key loaded
echo Key fingerprint: %NEW_PUB_CONTENT:~0,60%...
echo.

REM ============================================================================
REM Phase 3: Test Current Connection
REM ============================================================================
echo [PHASE 3] Testing Current VPS Connection...
echo.

ssh -i "%CURRENT_KEY%" -o StrictHostKeyChecking=no -o ConnectTimeout=10 %VPS_USER%@%VPS_HOST% "echo 'Connection OK'" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Cannot connect to VPS with current key
    echo Please verify VPS access and key permissions
    pause
    exit /b 1
)
echo [OK] Connection successful
echo.

REM ============================================================================
REM Phase 4: Check If New Key Already Exists
REM ============================================================================
echo [PHASE 4] Checking authorized_keys...
echo.

ssh -i "%CURRENT_KEY%" -o StrictHostKeyChecking=no %VPS_USER%@%VPS_HOST% "grep -q 'amp-agent-new@v-edfinance' ~/.ssh/authorized_keys" >nul 2>&1
if errorlevel 1 (
    echo [INFO] New key not found in authorized_keys
    set NEED_ADD=1
) else (
    echo [INFO] New key already exists in authorized_keys
    set NEED_ADD=0
)
echo.

REM ============================================================================
REM Phase 5: Deploy New Public Key
REM ============================================================================
if !NEED_ADD!==1 (
    echo [PHASE 5] Deploying New Public Key...
    echo.
    
    REM Add new public key to authorized_keys
    ssh -i "%CURRENT_KEY%" -o StrictHostKeyChecking=no %VPS_USER%@%VPS_HOST% "echo '%NEW_PUB_CONTENT%' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
    
    if errorlevel 1 (
        echo [ERROR] Failed to add new key
        pause
        exit /b 1
    )
    
    echo [OK] New key added to authorized_keys
) else (
    echo [PHASE 5] New key already deployed (skipped)
)
echo.

REM ============================================================================
REM Phase 6: Verify New Key Works
REM ============================================================================
echo [PHASE 6] Testing New Key Connection...
echo.

ssh -i "%NEW_KEY%" -o StrictHostKeyChecking=no -o ConnectTimeout=10 %VPS_USER%@%VPS_HOST% "echo 'New key works!' && whoami && hostname"
if errorlevel 1 (
    echo [ERROR] New key connection failed!
    echo [WARNING] Do NOT revoke old key yet!
    pause
    exit /b 1
)

echo.
echo [OK] New key connection successful!
echo.

REM ============================================================================
REM Phase 7: Get VPS Info
REM ============================================================================
echo [PHASE 7] VPS System Information...
echo.

ssh -i "%NEW_KEY%" %VPS_USER%@%VPS_HOST% "echo 'Hostname:' && hostname && echo 'OS:' && lsb_release -d && echo 'Uptime:' && uptime -p"

echo.

REM ============================================================================
REM Success Summary
REM ============================================================================
echo.
echo ========================================
echo   SSH Key Rotation - SUCCESS
echo ========================================
echo.
echo [OK] New SSH key deployed and verified
echo [OK] VPS accessible with new key: %NEW_KEY%
echo.
echo NEXT STEPS:
echo 1. Update vps-connection.js (already done - uses vps_new_key)
echo 2. Test all VPS scripts with new key
echo 3. ONLY THEN revoke old key: scripts\vps-toolkit\revoke-old-ssh-key.bat
echo.
echo OLD KEY STATUS: Still active (safe for now)
echo NEW KEY STATUS: Active and working
echo.
pause
