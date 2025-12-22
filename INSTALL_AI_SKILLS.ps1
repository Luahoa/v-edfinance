# Install AI Assistant Skills
# Run: .\INSTALL_AI_SKILLS.ps1

Write-Host "=== Installing AI Assistant Skills ===" -ForegroundColor Cyan

# Create temp directory
$tempDir = "temp_skills"
if (-not (Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir | Out-Null
}

# Skill 1: wshobson/commands (1,484 stars)
Write-Host "`n[1/4] Cloning wshobson/commands..." -ForegroundColor Yellow
git clone --depth 1 https://github.com/wshobson/commands.git "$tempDir/commands"

# Skill 5: czlonkowski/n8n-skills (1,003 stars)
Write-Host "`n[2/4] Cloning czlonkowski/n8n-skills..." -ForegroundColor Yellow
git clone --depth 1 https://github.com/czlonkowski/n8n-skills.git "$tempDir/n8n-skills"

# Skill 6: qdhenry/Claude-Command-Suite (871 stars)
Write-Host "`n[3/4] Cloning qdhenry/Claude-Command-Suite..." -ForegroundColor Yellow
git clone --depth 1 https://github.com/qdhenry/Claude-Command-Suite.git "$tempDir/claude-command-suite"

# Skill 8: parruda/swarm (1,540 stars)
Write-Host "`n[4/4] Cloning parruda/swarm..." -ForegroundColor Yellow
git clone --depth 1 https://github.com/parruda/swarm.git "$tempDir/swarm"

Write-Host "`n=== Analyzing Skills Structure ===" -ForegroundColor Cyan

# Analyze each skill
$skills = @("commands", "n8n-skills", "claude-command-suite", "swarm")

foreach ($skill in $skills) {
    $path = "$tempDir/$skill"
    if (Test-Path $path) {
        Write-Host "`n--- $skill ---" -ForegroundColor Green
        Get-ChildItem -Path $path -Directory | Select-Object Name
    }
}

Write-Host "`n=== Installation Instructions ===" -ForegroundColor Cyan
Write-Host @"

Next steps:
1. Check $tempDir folder
2. Run: .\COPY_AI_SKILLS.ps1
3. Restart AI assistants

Skills will be installed to:
- .claude/skills/
- .cursor/commands/
- .windsurf/workflows/
- .agent/workflows/
- .shared/

"@ -ForegroundColor White

Write-Host "Done! Run 'dir $tempDir' to see downloaded skills." -ForegroundColor Green
