# Quick Install AI Skills - Direct Download
# Run this in PowerShell: .\QUICK_INSTALL_SKILLS.ps1

$ErrorActionPreference = "Stop"

Write-Host "=== Quick Install AI Skills ===" -ForegroundColor Cyan

# Create directories
$dirs = @(".claude\skills", ".cursor\commands", ".windsurf\workflows", ".agent\workflows", ".shared")
foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

# Download and extract skills
$skills = @{
    "wshobson-commands" = "https://github.com/wshobson/commands/archive/refs/heads/main.zip"
    "n8n-skills" = "https://github.com/czlonkowski/n8n-skills/archive/refs/heads/main.zip"
    "claude-command-suite" = "https://github.com/qdhenry/Claude-Command-Suite/archive/refs/heads/main.zip"
    "swarm" = "https://github.com/parruda/swarm/archive/refs/heads/main.zip"
}

$tempDir = "temp_skills"
if (-not (Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir | Out-Null
}

foreach ($skill in $skills.Keys) {
    Write-Host "`nDownloading $skill..." -ForegroundColor Yellow
    $zipPath = "$tempDir\$skill.zip"
    
    try {
        Invoke-WebRequest -Uri $skills[$skill] -OutFile $zipPath
        Write-Host "  Downloaded $skill" -ForegroundColor Green
        
        # Extract
        Expand-Archive -Path $zipPath -DestinationPath "$tempDir\$skill" -Force
        Write-Host "  Extracted $skill" -ForegroundColor Green
    }
    catch {
        Write-Host "  Failed: $_" -ForegroundColor Red
    }
}

Write-Host "`n=== Installation Complete ===" -ForegroundColor Cyan
Write-Host @"

Skills downloaded to: temp_skills\

Next steps:
1. Review: dir temp_skills
2. Manual copy commands to .claude, .cursor, etc.
3. Or run the auto-copy script (coming next)

"@ -ForegroundColor White
