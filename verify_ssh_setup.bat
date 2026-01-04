@echo off
echo ============================================
echo SSH Key Setup Verification
echo ============================================
echo.

echo [1/5] Checking SSH key files...
if exist "C:\Users\luaho\.ssh\amp_vps_key" (
    echo [OK] Private key exists: C:\Users\luaho\.ssh\amp_vps_key
) else (
    echo [FAIL] Private key NOT found
)

if exist "C:\Users\luaho\.ssh\amp_vps_key.pub" (
    echo [OK] Public key exists: C:\Users\luaho\.ssh\amp_vps_key.pub
) else (
    echo [FAIL] Public key NOT found
)

echo.
echo [2/5] Checking Bitvise import file...
if exist "c:\Users\luaho\Demo project\v-edfinance\amp_vps_private_key.txt" (
    echo [OK] Import file exists: amp_vps_private_key.txt
) else (
    echo [FAIL] Import file NOT found
)

echo.
echo [3/5] Displaying public key (for verification on VPS)...
echo ----------------------------------------
type "C:\Users\luaho\.ssh\amp_vps_key.pub"
echo ----------------------------------------

echo.
echo [4/5] VPS Connection Details:
echo   Host: 103.54.153.248
echo   Port: 22
echo   User: root
echo   Auth: publickey
echo   Key: amp-agent@v-edfinance

echo.
echo [5/5] Testing VPS reachability...
ping -n 1 103.54.153.248 >nul
if %errorlevel%==0 (
    echo [OK] VPS is reachable
) else (
    echo [WARN] VPS ping failed (firewall may block ICMP)
)

echo.
echo ============================================
echo Next Steps:
echo ============================================
echo 1. Open Bitvise SSH Client
echo 2. Import key from: amp_vps_private_key.txt
echo 3. Configure:
echo    - Host: 103.54.153.248
echo    - Port: 22
echo    - Username: root
echo    - Auth: publickey
echo 4. Click Login
echo.
echo See BITVISE_IMPORT_KEY.md for detailed instructions
echo ============================================
pause
