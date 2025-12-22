# 🎯 AI Skills Installation - Quick Start

## ✅ Already Installed

1. **UI/UX Pro Max** - Design intelligence skill
   - Location: `.claude/skills/ui-ux-pro-max/`
   - Usage: Auto-activates for UI/UX tasks

## 🔄 To Install (4 New Skills)

### Method 1: Automatic (Recommended) ⚡

**Windows PowerShell:**
```powershell
.\AUTO_INSTALL_ALL_SKILLS.ps1
```

**That's it!** Script will:
- Download 4 skills
- Extract files
- Copy to correct locations
- Verify installation

---

### Method 2: Manual (Advanced) 📝

See detailed guide: [AI_SKILLS_INSTALLATION_GUIDE.md](AI_SKILLS_INSTALLATION_GUIDE.md)

---

## 📦 Skills Being Installed

| # | Skill | Stars | Purpose |
|---|-------|-------|---------|
| 1 | wshobson/commands | 1,484⭐ | Slash commands for Claude |
| 2 | n8n-skills | 1,003⭐ | Workflow automation |
| 3 | claude-command-suite | 871⭐ | Pro dev workflows |
| 4 | swarm | 1,540⭐ | AI agent orchestration |

---

## 🚀 After Installation

### 1. Restart AI Assistants

Close and reopen:
- Claude Code (Amp)
- Cursor
- Windsurf

### 2. Test Skills

Try these commands:

```
# General
Build a landing page for V-EdFinance

# Specific skills
/commands - View available commands
/n8n - n8n workflow commands
/code-review - Review code

# UI/UX (already works)
Design a fintech dashboard with charts
```

### 3. Browse Installed Skills

```powershell
# View all skills
dir .claude\skills

# Expected:
# - ui-ux-pro-max
# - wshobson-commands
# - n8n
# - command-suite
```

---

## 📚 Documentation

- **Full Installation Guide:** [docs/AI_SKILLS_INSTALLATION_GUIDE.md](docs/AI_SKILLS_INSTALLATION_GUIDE.md)
- **Skills Collection:** [docs/INDIE_AI_SKILLS_COLLECTION.md](docs/INDIE_AI_SKILLS_COLLECTION.md)
- **UI/UX Guide:** [docs/UI_UX_PRO_MAX_GUIDE.md](docs/UI_UX_PRO_MAX_GUIDE.md)

---

## 🧹 Cleanup

After successful installation:

```powershell
# Remove temporary files
Remove-Item -Path "temp_skills" -Recurse -Force
```

---

## ❓ Troubleshooting

### PowerShell Execution Policy Error

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Skills Not Found

1. Check `.claude/skills/` folder exists
2. Verify files were copied correctly
3. Restart AI assistant

### Download Failed

1. Check internet connection
2. Try manual download from GitHub
3. Extract manually and copy folders

---

## 🎯 Next Steps

After installation:

1. ✅ Test each skill
2. ✅ Read skill documentation
3. ✅ Customize for V-EdFinance workflows
4. ✅ Share feedback with team

---

**Time Required:** 5-10 minutes (automatic) / 15-20 minutes (manual)  
**Difficulty:** Easy  
**Prerequisites:** PowerShell, Internet connection
