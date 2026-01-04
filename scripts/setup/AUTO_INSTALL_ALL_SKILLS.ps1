# Auto-Install AI Skills - Complete Workflow
# Usage: .\AUTO_INSTALL_ALL_SKILLS.ps1

param(
    [switch]$SkipDownload = $false
)

$ErrorActionPreference = "Continue"

Write-Host @"
╔═══════════════════════════════════════════════════════════╗
║     AI Skills Auto-Installer for V-EdFinance             ║
║     Installing 4 Additional Skills                        ║
╚═══════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# Configuration
$skills = @(
    @{
        Name = "wshobson-commands"
        URL = "https://github.com/wshobson/commands/archive/refs/heads/main.zip"
        Stars = "1,484"
        Description = "Production-ready slash commands"
    },
    @{
        Name = "n8n-skills"
        URL = "https://github.com/czlonkowski/n8n-skills/archive/refs/heads/main.zip"
        Stars = "1,003"
        Description = "n8n workflow automation"
    },
    @{
        Name = "claude-command-suite"
        URL = "https://github.com/qdhenry/Claude-Command-Suite/archive/refs/heads/main.zip"
        Stars = "871"
        Description = "Professional command suite"
    },
    @{
        Name = "swarm"
        URL = "https://github.com/parruda/swarm/archive/refs/heads/main.zip"
        Stars = "1,540"
        Description = "AI agent orchestration (Ruby)"
    }
)

# Step 1: Create directories
Write-Host "`n[Step 1/5] Creating directories..." -ForegroundColor Yellow

$directories = @(
    ".claude\skills",
    ".cursor\commands",
    ".windsurf\workflows",
    ".agent\workflows",
    ".shared\ai-skills",
    "temp_skills\downloads",
    "temp_skills\extracted"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "  ✓ Created: $dir" -ForegroundColor Green
    } else {
        Write-Host "  ○ Exists: $dir" -ForegroundColor Gray
    }
}

# Step 2: Download skills
if (-not $SkipDownload) {
    Write-Host "`n[Step 2/5] Downloading skills..." -ForegroundColor Yellow
    
    foreach ($skill in $skills) {
        $zipPath = "temp_skills\downloads\$($skill.Name).zip"
        
        Write-Host "`n  Downloading: $($skill.Name) ($($skill.Stars)⭐)" -ForegroundColor Cyan
        Write-Host "  $($skill.Description)" -ForegroundColor Gray
        
        try {
            Invoke-WebRequest -Uri $skill.URL -OutFile $zipPath -UseBasicParsing
            Write-Host "  ✓ Downloaded successfully" -ForegroundColor Green
        }
        catch {
            Write-Host "  ✗ Download failed: $_" -ForegroundColor Red
        }
    }
} else {
    Write-Host "`n[Step 2/5] Skipping download (using existing files)..." -ForegroundColor Yellow
}

# Step 3: Extract archives
Write-Host "`n[Step 3/5] Extracting archives..." -ForegroundColor Yellow

foreach ($skill in $skills) {
    $zipPath = "temp_skills\downloads\$($skill.Name).zip"
    $extractPath = "temp_skills\extracted\$($skill.Name)"
    
    if (Test-Path $zipPath) {
        Write-Host "  Extracting: $($skill.Name)" -ForegroundColor Cyan
        try {
            Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force
            Write-Host "  ✓ Extracted successfully" -ForegroundColor Green
        }
        catch {
            Write-Host "  ✗ Extraction failed: $_" -ForegroundColor Red
        }
    } else {
        Write-Host "  ○ Skipped: $($skill.Name) (file not found)" -ForegroundColor Gray
    }
}

# Step 4: Install skills
Write-Host "`n[Step 4/5] Installing skills..." -ForegroundColor Yellow

# Install wshobson/commands
Write-Host "`n  [1/4] Installing wshobson-commands..." -ForegroundColor Cyan
$commandsSource = "temp_skills\extracted\wshobson-commands\commands-main"
if (Test-Path $commandsSource) {
    # Copy to .claude
    $claudeDest = ".claude\skills\wshobson-commands"
    Copy-Item -Path $commandsSource -Destination $claudeDest -Recurse -Force
    Write-Host "    ✓ Installed to .claude\skills\wshobson-commands" -ForegroundColor Green
    
    # Copy README to other assistants
    if (Test-Path "$commandsSource\README.md") {
        Copy-Item -Path "$commandsSource\README.md" -Destination ".cursor\commands\wshobson-commands.md" -Force
        Copy-Item -Path "$commandsSource\README.md" -Destination ".windsurf\workflows\wshobson-commands.md" -Force
        Write-Host "    ✓ Installed to Cursor & Windsurf" -ForegroundColor Green
    }
} else {
    Write-Host "    ✗ Source not found" -ForegroundColor Red
}

# Install n8n-skills
Write-Host "`n  [2/4] Installing n8n-skills..." -ForegroundColor Cyan
$n8nSource = "temp_skills\extracted\n8n-skills\n8n-skills-main"
if (Test-Path $n8nSource) {
    # Check for .claude folder
    if (Test-Path "$n8nSource\.claude\skills") {
        Copy-Item -Path "$n8nSource\.claude\skills\*" -Destination ".claude\skills\n8n" -Recurse -Force
        Write-Host "    ✓ Installed n8n skills to .claude" -ForegroundColor Green
    } else {
        # Copy entire repo
        Copy-Item -Path $n8nSource -Destination ".claude\skills\n8n" -Recurse -Force
        Write-Host "    ✓ Installed n8n repo to .claude" -ForegroundColor Green
    }
} else {
    Write-Host "    ✗ Source not found" -ForegroundColor Red
}

# Install claude-command-suite
Write-Host "`n  [3/4] Installing claude-command-suite..." -ForegroundColor Cyan
$suiteSource = "temp_skills\extracted\claude-command-suite\Claude-Command-Suite-main"
if (Test-Path $suiteSource) {
    Copy-Item -Path $suiteSource -Destination ".claude\skills\command-suite" -Recurse -Force
    Write-Host "    ✓ Installed command-suite to .claude" -ForegroundColor Green
} else {
    Write-Host "    ✗ Source not found" -ForegroundColor Red
}

# Install swarm (just documentation - it's Ruby gems)
Write-Host "`n  [4/4] Installing swarm (documentation)..." -ForegroundColor Cyan
$swarmSource = "temp_skills\extracted\swarm\swarm-main"
if (Test-Path $swarmSource) {
    Copy-Item -Path "$swarmSource\README.md" -Destination ".shared\ai-skills\swarm-guide.md" -Force
    Copy-Item -Path "$swarmSource\docs" -Destination ".shared\ai-skills\swarm-docs" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "    ✓ Installed swarm docs to .shared" -ForegroundColor Green
    Write-Host "    ℹ Note: Swarm is Ruby gem, install with: gem install swarm-sdk" -ForegroundColor Yellow
} else {
    Write-Host "    ✗ Source not found" -ForegroundColor Red
}

# Step 5: Verification
Write-Host "`n[Step 5/5] Verifying installation..." -ForegroundColor Yellow

$installed = @()
$failed = @()

# Check each skill
if (Test-Path ".claude\skills\wshobson-commands") { $installed += "wshobson-commands" } else { $failed += "wshobson-commands" }
if (Test-Path ".claude\skills\n8n") { $installed += "n8n-skills" } else { $failed += "n8n-skills" }
if (Test-Path ".claude\skills\command-suite") { $installed += "claude-command-suite" } else { $failed += "claude-command-suite" }
if (Test-Path ".shared\ai-skills\swarm-guide.md") { $installed += "swarm (docs)" } else { $failed += "swarm" }

Write-Host "`n✓ Successfully installed: $($installed.Count)/4 skills" -ForegroundColor Green
foreach ($skill in $installed) {
    Write-Host "  ✓ $skill" -ForegroundColor Green
}

if ($failed.Count -gt 0) {
    Write-Host "`n✗ Failed to install: $($failed.Count) skills" -ForegroundColor Red
    foreach ($skill in $failed) {
        Write-Host "  ✗ $skill" -ForegroundColor Red
    }
}

# Summary
Write-Host @"

╔═══════════════════════════════════════════════════════════╗
║                Installation Summary                        ║
╠═══════════════════════════════════════════════════════════╣
║  Total Skills: $($skills.Count)                                          ║
║  Installed: $($installed.Count)                                            ║
║  Failed: $($failed.Count)                                               ║
╠═══════════════════════════════════════════════════════════╣
║  Locations:                                               ║
║    .claude\skills\     - Claude Code skills               ║
║    .cursor\commands\   - Cursor commands                  ║
║    .windsurf\workflows\ - Windsurf workflows              ║
║    .shared\ai-skills\  - Shared documentation             ║
╚═══════════════════════════════════════════════════════════╝

Next Steps:
1. Restart your AI assistants (Claude Code, Cursor, etc.)
2. Test skills with slash commands: /commands, /n8n, etc.
3. Read docs: .shared\ai-skills\
4. Clean up: Remove-Item temp_skills -Recurse -Force

View full guide: docs\AI_SKILLS_INSTALLATION_GUIDE.md

"@ -ForegroundColor Cyan

Write-Host "Installation complete! 🎉" -ForegroundColor Green
