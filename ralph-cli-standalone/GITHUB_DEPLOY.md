# 🚀 Ralph CLI - Automated GitHub Deployment Guide

## Quick Publish to GitHub

### 1. Tạo GitHub Repo Mới

1. Vào https://github.com/new
2. Repository name: `ralph-cli`
3. Description: `Autonomous Epic Execution Engine - CLI tool for automating epic execution with beads integration`
4. Public/Private: **Public** (để dễ install)
5. ✅ Create repository (KHÔNG tạo README, .gitignore, LICENSE)

### 2. Publish Ralph CLI

```bash
# Run auto-publish script
scripts\publish-ralph.bat

# Or manual:
cd ralph-cli-standalone
git init
git add .
git commit -m "Initial release: Ralph CLI v1.0.0"
git branch -M main
git remote add origin https://github.com/Luahoa/ralph-cli.git
git push -u origin main
```

---

## Install from GitHub (After Publish)

### Global Installation

```bash
# Install globally (recommended)
pnpm add -g git+https://github.com/Luahoa/ralph-cli.git

# Use anywhere
ralph --help
ralph start my-epic --max-iter 30
```

### Project-Specific Installation

```bash
# Option 1: As dependency
pnpm add -D git+https://github.com/Luahoa/ralph-cli.git

# Option 2: Clone to libs/
git clone https://github.com/Luahoa/ralph-cli.git libs/ralph-cli
cd libs/ralph-cli
pnpm install
```

### NPX (No Install)

```bash
npx github:Luahoa/ralph-cli start my-epic --max-iter 30
```

---

## Update Ralph CLI

### Push Updates

```bash
cd ralph-cli-standalone
git add .
git commit -m "Update: [description]"
git push
```

### Pull Updates (Users)

```bash
# Global install
pnpm add -g git+https://github.com/Luahoa/ralph-cli.git --force

# Project install
cd libs/ralph-cli
git pull origin main
pnpm install
```

---

## Automated Workflow

### For You (Maintainer)

```bash
# 1. Make changes in v-edfinance/libs/ralph-cli

# 2. Copy to standalone
xcopy /E /I /Y libs\ralph-cli\src ralph-cli-standalone\src
copy libs\ralph-cli\package.json ralph-cli-standalone\

# 3. Publish
scripts\publish-ralph.bat
```

### For Other Developers

```bash
# 1. Install once
pnpm add -g git+https://github.com/Luahoa/ralph-cli.git

# 2. Use in any project
cd /path/to/any/project
ralph start my-epic

# 3. Update when needed
pnpm add -g git+https://github.com/Luahoa/ralph-cli.git --force
```

---

## Example: New Project Setup

```bash
# 1. Install Ralph globally (once)
pnpm add -g git+https://github.com/Luahoa/ralph-cli.git

# 2. Setup new project
cd /path/to/new/project
mkdir -p history scripts

# 3. Create quality gate
curl -o scripts/quality-gate.bat https://raw.githubusercontent.com/Luahoa/ralph-cli/main/examples/quality-gate.bat

# 4. Create config
cat > ralph.config.json << 'EOF'
{
  "maxIterations": 30,
  "qualityGateScript": "scripts/quality-gate.bat"
}
EOF

# 5. Run Ralph!
ralph start my-epic --verbose
```

---

## Benefits of GitHub Approach

✅ **Single Source of Truth** - One repo, nhiều projects dùng  
✅ **Auto Updates** - `pnpm add -g --force` để update  
✅ **Version Control** - Git tags cho versioning  
✅ **Easy Distribution** - Share URL là xong  
✅ **CI/CD Ready** - GitHub Actions tự động test/publish  

---

## Next Steps

1. **Create GitHub repo**: https://github.com/new
2. **Run publish script**: `scripts\publish-ralph.bat`
3. **Test install**: `pnpm add -g git+https://github.com/Luahoa/ralph-cli.git`
4. **Share URL**: Send `git+https://github.com/Luahoa/ralph-cli.git` to team

---

**Status**: Ready to publish! 🚀  
**Repo URL**: https://github.com/Luahoa/ralph-cli  
**Install**: `pnpm add -g git+https://github.com/Luahoa/ralph-cli.git`
