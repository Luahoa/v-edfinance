# Install AI Skills to .agents/skills/
# Usage: .\INSTALL_TO_AGENTS.ps1

$ErrorActionPreference = "Continue"

Write-Host @"
╔═══════════════════════════════════════════════════════════╗
║   Installing AI Skills to .agents/skills/                ║
║   4 Skills + CLI Tools                                    ║
╚═══════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# Step 1: Create directories
Write-Host "`n[Step 1/6] Creating directories..." -ForegroundColor Yellow

$dirs = @(
    ".agents\skills",
    ".agents\skills\wshobson-commands",
    ".agents\skills\n8n-skills", 
    ".agents\skills\command-suite",
    ".agents\skills\swarm-docs",
    "temp_skills\downloads",
    "temp_skills\extracted"
)

foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "  ✓ Created: $dir" -ForegroundColor Green
    }
}

# Step 2: Download skills as ZIP
Write-Host "`n[Step 2/6] Downloading skills..." -ForegroundColor Yellow

$skills = @{
    "wshobson-commands" = "https://github.com/wshobson/commands/archive/refs/heads/main.zip"
    "n8n-skills" = "https://github.com/czlonkowski/n8n-skills/archive/refs/heads/main.zip"
    "command-suite" = "https://github.com/qdhenry/Claude-Command-Suite/archive/refs/heads/main.zip"
    "swarm" = "https://github.com/parruda/swarm/archive/refs/heads/main.zip"
}

foreach ($name in $skills.Keys) {
    $url = $skills[$name]
    $zipPath = "temp_skills\downloads\$name.zip"
    
    Write-Host "  Downloading: $name" -ForegroundColor Cyan
    Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing -ErrorAction SilentlyContinue
    if (Test-Path $zipPath) {
        Write-Host "  ✓ Downloaded: $name" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Failed: $name" -ForegroundColor Red
    }
}

# Step 3: Extract archives
Write-Host "`n[Step 3/6] Extracting archives..." -ForegroundColor Yellow

foreach ($name in $skills.Keys) {
    $zipPath = "temp_skills\downloads\$name.zip"
    $extractPath = "temp_skills\extracted\$name"
    
    if (Test-Path $zipPath) {
        Write-Host "  Extracting: $name" -ForegroundColor Cyan
        Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force -ErrorAction SilentlyContinue
        if (Test-Path $extractPath) {
            Write-Host "  ✓ Extracted: $name" -ForegroundColor Green
        } else {
            Write-Host "  ✗ Failed: $name" -ForegroundColor Red
        }
    }
}

# Step 4: Copy to .agents/skills/
Write-Host "`n[Step 4/6] Installing to .agents/skills/..." -ForegroundColor Yellow

# Install wshobson/commands
$commandsSource = "temp_skills\extracted\wshobson-commands\commands-main"
if (Test-Path $commandsSource) {
    Copy-Item -Path "$commandsSource\*" -Destination ".agents\skills\wshobson-commands" -Recurse -Force
    Write-Host "  ✓ Installed: wshobson-commands" -ForegroundColor Green
}

# Install n8n-skills
$n8nSource = "temp_skills\extracted\n8n-skills\n8n-skills-main"
if (Test-Path $n8nSource) {
    Copy-Item -Path "$n8nSource\*" -Destination ".agents\skills\n8n-skills" -Recurse -Force
    Write-Host "  ✓ Installed: n8n-skills" -ForegroundColor Green
}

# Install command-suite
$suiteSource = "temp_skills\extracted\command-suite\Claude-Command-Suite-main"
if (Test-Path $suiteSource) {
    Copy-Item -Path "$suiteSource\*" -Destination ".agents\skills\command-suite" -Recurse -Force
    Write-Host "  ✓ Installed: command-suite" -ForegroundColor Green
}

# Install swarm docs
$swarmSource = "temp_skills\extracted\swarm\swarm-main"
if (Test-Path $swarmSource) {
    Copy-Item -Path "$swarmSource\*" -Destination ".agents\skills\swarm-docs" -Recurse -Force
    Write-Host "  ✓ Installed: swarm-docs" -ForegroundColor Green
}

# Step 5: Install CLI tools
Write-Host "`n[Step 5/6] Installing CLI tools..." -ForegroundColor Yellow

# UI/UX Pro Max CLI (already installed)
Write-Host "  Checking: uipro-cli" -ForegroundColor Cyan
$uiproInstalled = npm list -g uipro-cli 2>&1
if ($uiproInstalled -match "uipro-cli") {
    Write-Host "  ✓ Already installed: uipro-cli" -ForegroundColor Green
} else {
    Write-Host "  ○ Not found: uipro-cli (already installed earlier)" -ForegroundColor Gray
}

# Check for other CLI tools
Write-Host "`n  Note: Other skills don't have separate CLI tools" -ForegroundColor Gray
Write-Host "  They work as context/workflows for AI assistants" -ForegroundColor Gray

# Step 6: Verification
Write-Host "`n[Step 6/6] Verifying installation..." -ForegroundColor Yellow

$installed = @()
$failed = @()

$checkPaths = @{
    "wshobson-commands" = ".agents\skills\wshobson-commands\README.md"
    "n8n-skills" = ".agents\skills\n8n-skills\README.md"
    "command-suite" = ".agents\skills\command-suite\README.md"
    "swarm-docs" = ".agents\skills\swarm-docs\README.md"
}

foreach ($skill in $checkPaths.Keys) {
    if (Test-Path $checkPaths[$skill]) {
        $installed += $skill
    } else {
        $failed += $skill
    }
}

# Summary
Write-Host "`n╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                Installation Summary                        ║" -ForegroundColor Cyan
Write-Host "╠═══════════════════════════════════════════════════════════╣" -ForegroundColor Cyan
Write-Host "║  Location: .agents\skills\                                ║" -ForegroundColor Cyan
Write-Host "║  Installed: $($installed.Count)/4 skills                                     ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host "`n✓ Successfully installed:" -ForegroundColor Green
foreach ($skill in $installed) {
    Write-Host "  ✓ $skill" -ForegroundColor Green
}

if ($failed.Count -gt 0) {
    Write-Host "`n✗ Failed:" -ForegroundColor Red
    foreach ($skill in $failed) {
        Write-Host "  ✗ $skill" -ForegroundColor Red
    }
}

# List installed files
Write-Host "`n📂 Installed Skills:" -ForegroundColor Cyan
Get-ChildItem -Path ".agents\skills" -Directory | ForEach-Object {
    Write-Host "  📁 $($_.Name)" -ForegroundColor White
    $readme = Join-Path $_.FullName "README.md"
    if (Test-Path $readme) {
        Write-Host "    ✓ README.md found" -ForegroundColor Gray
    }
}

Write-Host @"

╔═══════════════════════════════════════════════════════════╗
║                     Next Steps                            ║
╠═══════════════════════════════════════════════════════════╣
║  1. Browse: dir .agents\skills\                           ║
║  2. Read READMEs in each skill folder                     ║
║  3. Test skills with Amp (Claude Code)                    ║
║  4. Clean up: Remove-Item temp_skills -Recurse -Force     ║
╚═══════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

Write-Host "Installation complete! 🎉" -ForegroundColor Green
