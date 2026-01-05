# Generate SSH Key for VPS Access
# Task: ved-y1u - Enable pg_stat_statements on VPS

$sshDir = "C:\Users\luaho\.ssh"
$keyPath = "$sshDir\amp_vps_key"

# Create .ssh directory
if (-not (Test-Path $sshDir)) {
    New-Item -ItemType Directory -Force -Path $sshDir | Out-Null
    Write-Host "Created .ssh directory: $sshDir"
}

# Generate SSH key
Write-Host "Generating SSH key pair..."
Write-Host "Key path: $keyPath"

# Use ssh-keygen
$result = & ssh-keygen -t ed25519 -C "amp-agent@v-edfinance" -f $keyPath -N '""' 2>&1

Write-Host $result

# Display public key
if (Test-Path "$keyPath.pub") {
    Write-Host ""
    Write-Host "=============================================="
    Write-Host "SSH PUBLIC KEY (OpenSSH format)"
    Write-Host "=============================================="
    Get-Content "$keyPath.pub"
    Write-Host "=============================================="
    Write-Host ""
    Write-Host "Public key saved to: $keyPath.pub"
    Write-Host "Private key saved to: $keyPath"
    Write-Host ""
    Write-Host "Copy the public key above and add it to VPS:"
    Write-Host "  ssh root@103.54.153.248"
    Write-Host "  echo 'PUBLIC_KEY' >> ~/.ssh/authorized_keys"
} else {
    Write-Host "Error: Public key not generated!"
}
