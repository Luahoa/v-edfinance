@echo off
REM ============================================================================
REM SSH Key Rotation - Revoke Old Compromised Key
REM ============================================================================
REM WARNING: Only run this AFTER verifying new key works!
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ========================================
echo   SSH Key Rotation - REVOKE OLD KEY
echo ========================================
echo.
echo [WARNING] This will permanently remove the old SSH key from VPS
echo [WARNING] Make sure new key works before proceeding!
echo.

set VPS_HOST=103.54.153.248
set VPS_USER=root
set NEW_KEY=%USERPROFILE%\.ssh\vps_new_key

echo Press Ctrl+C to cancel, or
pause

REM ============================================================================
REM Verify New Key Still Works
REM ============================================================================
echo.
echo [VERIFY] Testing new key connection...
echo.

ssh -i "%NEW_KEY%" -o StrictHostKeyChecking=no %VPS_USER%@%VPS_HOST% "echo 'Connection OK'"
if errorlevel 1 (
    echo [ERROR] New key connection failed!
    echo [ABORT] Cannot revoke old key - would lose VPS access!
    pause
    exit /b 1
)
echo [OK] New key works
echo.

REM ============================================================================
REM Remove Old Key from authorized_keys
REM ============================================================================
echo [EXECUTE] Removing old key from authorized_keys...
echo.

REM Backup first
ssh -i "%NEW_KEY%" %VPS_USER%@%VPS_HOST% "cp ~/.ssh/authorized_keys ~/.ssh/authorized_keys.backup.%date:~10,4%%date:~4,2%%date:~7,2%"
echo [OK] Backup created

REM Remove old key (keep only amp-agent-new)
ssh -i "%NEW_KEY%" %VPS_USER%@%VPS_HOST% "grep -v 'amp_vps_private_key' ~/.ssh/authorized_keys > ~/.ssh/authorized_keys.tmp && mv ~/.ssh/authorized_keys.tmp ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"

if errorlevel 1 (
    echo [ERROR] Failed to remove old key
    pause
    exit /b 1
)

echo [OK] Old key removed from authorized_keys
echo.

REM ============================================================================
REM Final Verification
REM ============================================================================
echo [VERIFY] Final connection test with new key...
echo.

ssh -i "%NEW_KEY%" %VPS_USER%@%VPS_HOST% "echo 'Final test OK' && cat ~/.ssh/authorized_keys | grep -c 'ssh-ed25519'"

echo.
echo ========================================
echo   OLD KEY REVOKED - SUCCESS
echo ========================================
echo.
echo [OK] Old compromised key removed from VPS
echo [OK] Only new key remains active
echo.
echo FINAL STEPS:
echo 1. Delete old local key: del %USERPROFILE%\.ssh\amp_vps_private_key
echo 2. Document in SECRETS_ROTATION.md
echo 3. Update .gitignore to prevent future leaks
echo.
pause
