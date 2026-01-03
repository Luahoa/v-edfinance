# Simple AI Skills Installer - Fixed
# Run: .\FINAL_INSTALL.ps1

Write-Host "=== Installing AI Skills to .agents/skills/ ===" -ForegroundColor Cyan

# Create base directory
New-Item -ItemType Directory -Path ".agents/skills" -Force | Out-Null
New-Item -ItemType Directory -Path "temp_skills" -Force | Out-Null

# Download skills
Write-Host "`nDownloading skills..." -ForegroundColor Yellow

$urls = @(
    "https://github.com/wshobson/commands/archive/refs/heads/main.zip",
    "https://github.com/czlonkowski/n8n-skills/archive/refs/heads/main.zip",
    "https://github.com/qdhenry/Claude-Command-Suite/archive/refs/heads/main.zip",
    "https://github.com/parruda/swarm/archive/refs/heads/main.zip"
)

$names = @("commands", "n8n-skills", "command-suite", "swarm")

for ($i = 0; $i -lt $urls.Count; $i++) {
    $name = $names[$i]
    $url = $urls[$i]
    $zipFile = "temp_skills/$name.zip"
    
    Write-Host "  [$($i+1)/4] $name..." -ForegroundColor White
    Invoke-WebRequest -Uri $url -OutFile $zipFile -UseBasicParsing -ErrorAction SilentlyContinue
    
    if (Test-Path $zipFile) {
        Write-Host "    OK Downloaded" -ForegroundColor Green
        
        # Extract
        $extractPath = "temp_skills/$name"
        Expand-Archive -Path $zipFile -DestinationPath $extractPath -Force -ErrorAction SilentlyContinue
        
        # Find extracted folder (will be like "commands-main")
        $extractedFolder = Get-ChildItem -Path $extractPath -Directory | Select-Object -First 1
        
        if ($extractedFolder) {
            # Copy to .agents/skills/
            $destPath = ".agents/skills/$name"
            Copy-Item -Path $extractedFolder.FullName -Destination $destPath -Recurse -Force
            Write-Host "    OK Installed to .agents/skills/$name" -ForegroundColor Green
        }
    } else {
        Write-Host "    FAIL Download failed" -ForegroundColor Red
    }
}

# Verify
Write-Host "`n=== Verification ===" -ForegroundColor Cyan
Get-ChildItem -Path ".agents/skills" -Directory | ForEach-Object {
    Write-Host "  OK $($_.Name)" -ForegroundColor Green
}

Write-Host "`nDone! Check .agents/skills/ folder" -ForegroundColor Green
