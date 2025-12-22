# Simple Complete Installation
Write-Host "Installing Claude Command Suite..." -ForegroundColor Cyan

$baseDir = ".agents/skills/command-suite"
$apiUrl = "https://api.github.com/repos/qdhenry/Claude-Command-Suite/git/trees/main?recursive=1"

# Get file list
$response = Invoke-RestMethod -Uri $apiUrl
$mdFiles = $response.tree | Where-Object { $_.type -eq "blob" -and $_.path -like "*.md" -and $_.path -notlike "*:*" }

Write-Host "Found $($mdFiles.Count) files"

$count = 0
foreach ($file in $mdFiles) {
    $path = $file.path
    $dest = Join-Path $baseDir $path
    $dir = Split-Path $dest -Parent
    
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    
    $url = "https://raw.githubusercontent.com/qdhenry/Claude-Command-Suite/main/$path"
    Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing -ErrorAction SilentlyContinue
    
    if (Test-Path $dest) {
        $count++
        Write-Host "  OK: $path" -ForegroundColor Green
    }
}

Write-Host "`nDownloaded: $count/$($mdFiles.Count) files" -ForegroundColor Cyan
Write-Host "Done!" -ForegroundColor Green
