@echo off
REM Add new SSH public key to VPS using password authentication
REM Password will be provided via stdin

set SEXEC="C:\Program Files (x86)\Bitvise SSH Client\sexec.exe"
set VPS_IP=103.54.153.248
set VPS_USER=root
set VPS_PASSWORD=NzYFf8CN
set NEW_PUBLIC_KEY=ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHJB6LmszlXL0KRmZo5wS4M2koOTWMoiw9LXI2JoVjAo amp-agent-new@v-edfinance

echo ================================================
echo Adding New SSH Key to VPS
echo ================================================
echo.

echo Step 1: Backup existing authorized_keys...
%SEXEC% %VPS_USER%@%VPS_IP% -pw=%VPS_PASSWORD% -cmd="cp /root/.ssh/authorized_keys /root/.ssh/authorized_keys.backup 2>/dev/null || echo 'No backup needed'"

echo.
echo Step 2: Ensure .ssh directory exists...
%SEXEC% %VPS_USER%@%VPS_IP% -pw=%VPS_PASSWORD% -cmd="mkdir -p /root/.ssh && chmod 700 /root/.ssh"

echo.
echo Step 3: Add new public key to authorized_keys...
%SEXEC% %VPS_USER%@%VPS_IP% -pw=%VPS_PASSWORD% -cmd="echo '%NEW_PUBLIC_KEY%' >> /root/.ssh/authorized_keys"

echo.
echo Step 4: Fix permissions...
%SEXEC% %VPS_USER%@%VPS_IP% -pw=%VPS_PASSWORD% -cmd="chmod 600 /root/.ssh/authorized_keys && chown root:root /root/.ssh/authorized_keys"

echo.
echo Step 5: Verify authorized_keys content...
%SEXEC% %VPS_USER%@%VPS_IP% -pw=%VPS_PASSWORD% -cmd="cat /root/.ssh/authorized_keys"

echo.
echo Step 6: Test new key authentication...
%SEXEC% %VPS_USER%@%VPS_IP% -keypairFile="C:\Users\luaho\.ssh\vps_new_key" -cmd="echo 'SUCCESS! New key works!' && hostname && uptime"

echo.
echo ================================================
echo Done!
echo ================================================
pause
