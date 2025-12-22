# AI Skills Installation Guide for V-EdFinance

## 🚀 Quick Start - 4 Skills Installation

**Skills to install:**
1. **wshobson/commands** (1,484⭐) - Claude slash commands
2. **czlonkowski/n8n-skills** (1,003⭐) - n8n workflows
3. **qdhenry/Claude-Command-Suite** (871⭐) - Pro commands
4. **parruda/swarm** (1,540⭐) - AI agent orchestration

---

## Method 1: Automatic Installation (Recommended)

### Windows PowerShell

```powershell
# Run this command in PowerShell
.\QUICK_INSTALL_SKILLS.ps1
```

### Windows Command Prompt

```batch
INSTALL_AI_SKILLS.bat
```

---

## Method 2: Manual Installation

### Step 1: Download Skills

Visit these URLs and click "Code" → "Download ZIP":

1. https://github.com/wshobson/commands → `commands-main.zip`
2. https://github.com/czlonkowski/n8n-skills → `n8n-skills-main.zip`
3. https://github.com/qdhenry/Claude-Command-Suite → `Claude-Command-Suite-main.zip`
4. https://github.com/parruda/swarm → `swarm-main.zip`

### Step 2: Extract Files

Extract all ZIP files to `temp_skills/` folder:

```
v-edfinance/
├── temp_skills/
│   ├── commands-main/
│   ├── n8n-skills-main/
│   ├── Claude-Command-Suite-main/
│   └── swarm-main/
```

### Step 3: Analyze Structure

Check what each skill contains:

#### wshobson/commands
```
commands-main/
├── README.md
├── commands/
│   ├── code-review.md
│   ├── feature.md
│   ├── security-audit.md
│   └── ...
```

**Copy to:** `.claude/skills/commands/`

#### n8n-skills
```
n8n-skills-main/
├── README.md
├── .claude/
│   └── skills/
│       └── n8n/
```

**Copy to:** `.claude/skills/n8n/`

#### Claude-Command-Suite
```
Claude-Command-Suite-main/
├── README.md
├── .claudecode/
│   ├── commands/
│   └── workflows/
```

**Copy to:** `.claude/skills/command-suite/`

#### parruda/swarm
```
swarm-main/
├── README.md
├── lib/
│   └── swarm/
├── docs/
```

**This is Ruby gems - different approach**

---

## Method 3: Git Clone (For Developers)

```bash
# Create temp directory
mkdir temp_skills
cd temp_skills

# Clone all repos
git clone https://github.com/wshobson/commands.git
git clone https://github.com/czlonkowski/n8n-skills.git
git clone https://github.com/qdhenry/Claude-Command-Suite.git
git clone https://github.com/parruda/swarm.git

# Go back to root
cd ..
```

---

## Installation Mapping

### For Claude Code (Amp)

Copy to `.claude/skills/`:

```
.claude/
└── skills/
    ├── ui-ux-pro-max/          (✅ Already installed)
    ├── commands/               (NEW - wshobson)
    ├── n8n/                    (NEW - czlonkowski)
    ├── command-suite/          (NEW - qdhenry)
    └── swarm/                  (NEW - parruda)
```

### For Cursor

Copy to `.cursor/commands/`:

```
.cursor/
└── commands/
    ├── ui-ux-pro-max.md        (✅ Already installed)
    ├── commands.md             (NEW)
    ├── n8n-skills.md           (NEW)
    └── command-suite.md        (NEW)
```

### For Windsurf

Copy to `.windsurf/workflows/`:

```
.windsurf/
└── workflows/
    ├── ui-ux-pro-max.md
    ├── commands.md
    ├── n8n-skills.md
    └── command-suite.md
```

---

## Step-by-Step Manual Copy

### Skill 1: wshobson/commands

```powershell
# Extract commands-main.zip to temp_skills/commands-main/
# Then copy:

# For Claude
Copy-Item -Path "temp_skills\commands-main\commands" -Destination ".claude\skills\wshobson-commands" -Recurse

# For Cursor (if exists)
Copy-Item -Path "temp_skills\commands-main\README.md" -Destination ".cursor\commands\wshobson-commands.md"
```

### Skill 2: n8n-skills

```powershell
# Extract n8n-skills-main.zip
# Check structure first
dir temp_skills\n8n-skills-main

# Copy .claude folder if exists
if (Test-Path "temp_skills\n8n-skills-main\.claude") {
    Copy-Item -Path "temp_skills\n8n-skills-main\.claude\skills\*" -Destination ".claude\skills\n8n" -Recurse
}
```

### Skill 3: Claude-Command-Suite

```powershell
# Extract Claude-Command-Suite-main.zip
dir temp_skills\Claude-Command-Suite-main

# Copy commands
Copy-Item -Path "temp_skills\Claude-Command-Suite-main\.claudecode\*" -Destination ".claude\skills\command-suite" -Recurse
```

### Skill 4: parruda/swarm (Ruby Gems)

**Note:** This is a Ruby library, not a skill file. Installation:

```bash
# Install Ruby gem (if Ruby installed)
gem install swarm-sdk

# Or use in project
# Add to Gemfile (if using Ruby backend)
```

---

## Verification

### Check Installed Skills

```powershell
# List all installed skills
dir .claude\skills
dir .cursor\commands
dir .windsurf\workflows
```

Expected output:

```
.claude\skills:
- ui-ux-pro-max
- wshobson-commands
- n8n
- command-suite

.shared\ui-ux-pro-max:
- colors/
- fonts/
- styles/
```

### Test Skills

#### Test in Amp (Claude Code)

```
# Try slash commands
/commands
/n8n
/command-suite
```

#### Test UI/UX Pro Max

```
Build a landing page for V-EdFinance with Fintech colors
```

Should automatically use UI/UX database.

---

## Troubleshooting

### Skill not found

1. Check file paths are correct
2. Restart AI assistant
3. Verify folder structure matches

### Permission errors

Run PowerShell as Administrator:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Skills not activating

1. Check `.claude/skills/` folder exists
2. Verify skill files are `.md` or have proper structure
3. Restart Amp/Claude

---

## Cleanup

After installation, remove temp files:

```powershell
# Remove temp directory
Remove-Item -Path "temp_skills" -Recurse -Force

# Remove downloaded ZIPs
Remove-Item -Path "*.zip"
```

---

## Quick Reference

| Skill | Command/Usage | Purpose |
|-------|---------------|---------|
| UI/UX Pro Max | Auto-activates | Design system |
| wshobson/commands | `/commands` | Slash commands |
| n8n-skills | `/n8n` | Workflow automation |
| command-suite | `/command-suite` | Pro dev workflows |
| swarm | Ruby gem | Agent orchestration |

---

## Next Steps

After installation:

1. ✅ Restart AI assistants
2. ✅ Test each skill
3. ✅ Read skill documentation
4. ✅ Customize for V-EdFinance

---

**Status:** Ready to install  
**Time Required:** 10-15 minutes  
**Difficulty:** Easy (manual) / Very Easy (automatic)
