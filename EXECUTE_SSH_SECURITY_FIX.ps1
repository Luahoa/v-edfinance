# Track E2: SSH Private Key Security Fix
# Move private key out of repository

$ErrorActionPreference = "Stop"

Write-Host "=== Track E2: SSH Private Key Security Fix ===" -ForegroundColor Cyan

# 1. Check if file exists
$keyFile = "amp_vps_private_key.txt"
if (-not (Test-Path $keyFile)) {
    Write-Host "Private key file not found in repository (already moved or deleted)" -ForegroundColor Green
    exit 0
}

# 2. Create ~/.ssh directory
$sshDir = "$env:USERPROFILE\.ssh"
if (-not (Test-Path $sshDir)) {
    Write-Host "Creating SSH directory: $sshDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $sshDir -Force | Out-Null
}
else {
    Write-Host "SSH directory exists: $sshDir" -ForegroundColor Green
}

# 3. Move file
$destFile = "$sshDir\amp_vps_private_key"
Write-Host "Moving private key to: $destFile" -ForegroundColor Yellow
Move-Item $keyFile -Destination $destFile -Force

# 4. Set proper permissions
Write-Host "Setting permissions (remove inheritance, grant user full control)" -ForegroundColor Yellow
icacls $destFile /inheritance:r /grant:r "${env:USERNAME}:F" | Out-Null

Write-Host "Private key moved and secured" -ForegroundColor Green
Write-Host "  Location: $destFile" -ForegroundColor Gray

# 5. Update .gitignore
Write-Host "`nUpdating .gitignore..." -ForegroundColor Yellow
$gitignorePath = ".gitignore"
$gitignoreContent = Get-Content $gitignorePath -Raw

$entriesToAdd = @(
    "*_private_key.txt",
    "amp_vps_private_key.txt",
    "amp_vps_private_key"
)

$modified = $false
foreach ($entry in $entriesToAdd) {
    if ($gitignoreContent -notmatch [regex]::Escape($entry)) {
        Add-Content $gitignorePath "`n$entry"
        Write-Host "  Added: $entry" -ForegroundColor Gray
        $modified = $true
    }
    else {
        Write-Host "  Already exists: $entry" -ForegroundColor Gray
    }
}

if ($modified) {
    Write-Host ".gitignore updated" -ForegroundColor Green
}
else {
    Write-Host ".gitignore already contains security entries" -ForegroundColor Green
}

# 6. Verify file no longer in working tree
Write-Host "`nVerifying git status..." -ForegroundColor Yellow
$gitStatus = git status --porcelain | Select-String "amp_vps_private_key"
if ($gitStatus) {
    Write-Host "File detected as deleted/modified in git" -ForegroundColor Green
}
else {
    Write-Host "File no longer tracked by git" -ForegroundColor Green
}

Write-Host "`n=== Security Fix Complete ===" -ForegroundColor Cyan
Write-Host "Next step: Run git add and git commit" -ForegroundColor Yellow
