# Complete Installation of Claude Command Suite
# Workaround for Windows filename limitations

Write-Host "=== Installing Claude Command Suite (Complete) ===" -ForegroundColor Cyan

# Base paths
$baseDir = ".agents/skills/command-suite"
$apiUrl = "https://api.github.com/repos/qdhenry/Claude-Command-Suite/git/trees/main?recursive=1"

# Get all files from repo
Write-Host "`nFetching file list from GitHub..." -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri $apiUrl -Headers @{"User-Agent"="PowerShell"}

# Filter for .md files only, exclude files with invalid Windows chars
$files = $response.tree | Where-Object { 
    $_.type -eq "blob" -and 
    $_.path -like "*.md" -and
    $_.path -notlike "*:*" -and  # Skip files with colons
    $_.path -notlike "*`"*" -and  # Skip files with quotes
    $_.path -notlike "*<*" -and   # Skip files with < >
    $_.path -notlike "*>*" -and
    $_.path -notlike "*|*" -and   # Skip files with pipes
    $_.path -notlike "*?*"        # Skip files with question marks
}

Write-Host "Found $($files.Count) valid files to download" -ForegroundColor Green

# Download files
$downloaded = 0
$skipped = 0
$failed = 0

foreach ($file in $files) {
    $relativePath = $file.path
    $destPath = Join-Path $baseDir $relativePath
    $destDir = Split-Path $destPath -Parent
    
    # Create directory if needed
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }
    
    # Download file
    $rawUrl = "https://raw.githubusercontent.com/qdhenry/Claude-Command-Suite/main/$relativePath"
    
    Write-Host "  Downloading: $relativePath" -ForegroundColor Cyan
    Invoke-WebRequest -Uri $rawUrl -OutFile $destPath -UseBasicParsing -ErrorAction SilentlyContinue
    
    if (Test-Path $destPath) {
        $downloaded++
        Write-Host "    ✓ OK" -ForegroundColor Green
    } else {
        $failed++
        Write-Host "    ✗ Failed" -ForegroundColor Red
    }
}

# Summary
Write-Host "`n=== Installation Summary ===" -ForegroundColor Cyan
Write-Host "  Downloaded: $downloaded files" -ForegroundColor Green
Write-Host "  Failed: $failed files" -ForegroundColor $(if($failed -gt 0){"Red"}else{"Green"})

# List installed files
Write-Host "`n=== Installed Files ===" -ForegroundColor Cyan
Get-ChildItem -Path $baseDir -Recurse -File | ForEach-Object {
    $relative = $_.FullName.Replace("$baseDir\", "")
    Write-Host "  ✓ $relative" -ForegroundColor Gray
}

Write-Host "`nDone! Check $baseDir/" -ForegroundColor Green
