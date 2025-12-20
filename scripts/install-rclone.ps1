# Install rclone for Windows
# This script downloads and installs rclone binary

Write-Host "=== Rclone Installation Script ===" -ForegroundColor Cyan
Write-Host ""

# Configuration
$rcloneVersion = "v1.68.2"
$installDir = "C:\rclone"
$downloadUrl = "https://downloads.rclone.org/$rcloneVersion/rclone-$rcloneVersion-windows-amd64.zip"
$zipFile = "$env:TEMP\rclone.zip"
$extractPath = "$env:TEMP\rclone-extract"

# Check if already installed
Write-Host "Checking if rclone is already installed..." -ForegroundColor Yellow
try {
    $currentVersion = & rclone version 2>$null | Select-String "rclone v"
    if ($currentVersion) {
        Write-Host "[OK] Rclone is already installed: $currentVersion" -ForegroundColor Green
        $response = Read-Host "Do you want to reinstall? (y/N)"
        if ($response -ne 'y' -and $response -ne 'Y') {
            Write-Host "Installation cancelled." -ForegroundColor Yellow
            exit 0
        }
    }
} catch {
    Write-Host "Rclone not found. Proceeding with installation..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 1: Downloading rclone $rcloneVersion..." -ForegroundColor Cyan

try {
    # Download with progress
    $ProgressPreference = 'Continue'
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipFile -UseBasicParsing
    Write-Host "[OK] Download complete" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to download rclone: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 2: Extracting archive..." -ForegroundColor Cyan

try {
    # Clean up old extraction
    if (Test-Path $extractPath) {
        Remove-Item -Path $extractPath -Recurse -Force
    }
    
    # Extract
    Expand-Archive -Path $zipFile -DestinationPath $extractPath -Force
    Write-Host "[OK] Extraction complete" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to extract: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 3: Installing to $installDir..." -ForegroundColor Cyan

try {
    # Create install directory
    if (-not (Test-Path $installDir)) {
        New-Item -ItemType Directory -Path $installDir -Force | Out-Null
    }
    
    # Find rclone.exe in extracted files
    $rcloneExe = Get-ChildItem -Path $extractPath -Filter "rclone.exe" -Recurse | Select-Object -First 1
    
    if (-not $rcloneExe) {
        throw "rclone.exe not found in downloaded archive"
    }
    
    # Copy to install directory
    Copy-Item -Path $rcloneExe.FullName -Destination "$installDir\rclone.exe" -Force
    Write-Host "[OK] Rclone installed to $installDir" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to install: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 4: Adding to PATH..." -ForegroundColor Cyan

try {
    # Get current PATH
    $currentPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::User)
    
    # Check if already in PATH
    if ($currentPath -like "*$installDir*") {
        Write-Host "OK Already in PATH" -ForegroundColor Green
    } else {
        # Add to PATH
        $newPath = "$currentPath;$installDir"
        [Environment]::SetEnvironmentVariable("Path", $newPath, [EnvironmentVariableTarget]::User)
        $env:Path = "$env:Path;$installDir"
        Write-Host "OK Added to PATH" -ForegroundColor Green
    }
} catch {
    Write-Host "ERROR Failed to update PATH: $_" -ForegroundColor Red
    Write-Host "You may need to add $installDir to PATH manually" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 5: Cleanup..." -ForegroundColor Cyan

try {
    Remove-Item -Path $zipFile -Force -ErrorAction SilentlyContinue
    Remove-Item -Path $extractPath -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "[OK] Cleanup complete" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Cleanup warning: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 6: Verifying installation..." -ForegroundColor Cyan

try {
    # Refresh PATH for current session
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    $version = & "$installDir\rclone.exe" version 2>&1 | Select-String "rclone v"
    Write-Host "[OK] Installation verified: $version" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Verification failed: $_" -ForegroundColor Red
    Write-Host "Try opening a new PowerShell window and run: rclone version" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "=== Installation Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Open a NEW PowerShell window (to refresh PATH)" -ForegroundColor White
Write-Host "2. Run: rclone config" -ForegroundColor White
Write-Host "3. Configure your R2 or S3 storage" -ForegroundColor White
Write-Host ""
Write-Host "For R2 configuration, you'll need:" -ForegroundColor Yellow
Write-Host "  - Endpoint: https://<account-id>.r2.cloudflarestorage.com" -ForegroundColor White
Write-Host "  - Access Key ID: (from your .env file)" -ForegroundColor White
Write-Host "  - Secret Access Key: (from your .env file)" -ForegroundColor White
Write-Host ""
