@echo off
REM Fix VPS authorized_keys using Bitvise sexec
REM This script uses Bitvise CLI to recreate authorized_keys with correct format

set SEXEC="C:\Program Files (x86)\Bitvise SSH Client\sexec.exe"
set VPS_IP=103.54.153.248
set VPS_USER=root
set SSH_KEY=C:\Users\luaho\.ssh\amp_vps_key
set PUBLIC_KEY=ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGyK1L0sWfKZXKIYDzi0YCQjOZzIPms29NiEBpkWct9b amp-agent@v-edfinance

echo ================================================
echo VPS Authorized Keys Fix Script
echo ================================================
echo.
echo Step 1: Backup current authorized_keys...
%SEXEC% %VPS_USER%@%VPS_IP% -keypairFile=%SSH_KEY% -cmd="cp /root/.ssh/authorized_keys /root/.ssh/authorized_keys.backup 2>/dev/null || echo 'No existing file to backup'"

echo.
echo Step 2: Create new authorized_keys...
%SEXEC% %VPS_USER%@%VPS_IP% -keypairFile=%SSH_KEY% -cmd="echo '%PUBLIC_KEY%' > /root/.ssh/authorized_keys"

echo.
echo Step 3: Fix permissions...
%SEXEC% %VPS_USER%@%VPS_IP% -keypairFile=%SSH_KEY% -cmd="chmod 600 /root/.ssh/authorized_keys && chown root:root /root/.ssh/authorized_keys"

echo.
echo Step 4: Verify file content...
%SEXEC% %VPS_USER%@%VPS_IP% -keypairFile=%SSH_KEY% -cmd="cat /root/.ssh/authorized_keys"

echo.
echo Step 5: Check for hidden characters...
%SEXEC% %VPS_USER%@%VPS_IP% -keypairFile=%SSH_KEY% -cmd="cat -A /root/.ssh/authorized_keys"

echo.
echo Step 6: Verify line count (should be 1)...
%SEXEC% %VPS_USER%@%VPS_IP% -keypairFile=%SSH_KEY% -cmd="wc -l /root/.ssh/authorized_keys"

echo.
echo ================================================
echo Fix complete! Testing connection...
echo ================================================
%SEXEC% %VPS_USER%@%VPS_IP% -keypairFile=%SSH_KEY% -cmd="echo 'SSH Connection Test: SUCCESS!' && hostname"

echo.
echo ================================================
echo Done!
echo ================================================
