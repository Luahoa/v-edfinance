# 🎯 Ralph CLI - Complete Deployment Guide

## 3 Cách Sử Dụng Ralph CLI

### ✅ Method 1: GitHub Install (RECOMMENDED - Tự động nhất)

**Steps để setup:**

#### 1. Create GitHub Repo (One-time)
```bash
# Go to: https://github.com/new
# - Repo name: ralph-cli
# - Public repo
# - No README/License (already have)
```

#### 2. Publish Ralph CLI
```bash
cd e:\Demo project\v-edfinance
scripts\publish-ralph.bat
```

#### 3. Install Anywhere (Automatic!)
```bash
# Global install - use in ALL projects
pnpm add -g git+https://github.com/Luahoa/ralph-cli.git

# Now use anywhere:
cd E:\AnyProject
ralph start my-epic --max-iter 30

# Update later
pnpm add -g git+https://github.com/Luahoa/ralph-cli.git --force
```

**Advantages:**
- ⚡ **Fastest**: 1 command install
- 🔄 **Auto update**: Simple force reinstall
- 🌍 **Global**: Work in all projects
- 📦 **Version control**: Git tags for versions
- 👥 **Team sharing**: Share GitHub URL

---

### ✅ Method 2: Portable Package (Good for offline)

**Steps:**

#### 1. Extract portable package
```bash
# Copy folder or extract ZIP
xcopy /E /I ralph-cli-portable E:\MyProject\

# Or
powershell Expand-Archive ralph-cli-portable-v1.0.0.zip E:\MyProject\
```

#### 2. Install dependencies
```bash
cd E:\MyProject\libs\ralph-cli
pnpm install
```

#### 3. Use
```bash
cd E:\MyProject
test-ralph.bat start my-epic
```

**Advantages:**
- 📦 **Self-contained**: No internet needed after download
- 🎨 **Customizable**: Can modify per project
- 🔒 **Stable**: Won't change unless you update

**Location:** `e:\Demo project\v-edfinance\ralph-cli-portable\`

---

### ✅ Method 3: Copy Source Manually (For developers)

**Steps:**

#### 1. Copy libs/ralph-cli
```bash
xcopy /E /I libs\ralph-cli E:\MyProject\libs\ralph-cli
cd E:\MyProject\libs\ralph-cli
pnpm install
```

#### 2. Copy config files
```bash
copy ralph.config.json E:\MyProject\
copy test-ralph.bat E:\MyProject\
xcopy /E /I scripts\quality-gate*.bat E:\MyProject\scripts\
```

#### 3. Use
```bash
cd E:\MyProject
test-ralph.bat start my-epic
```

---

## 🚀 Recommended Workflow

### For You (Maintainer)

```bash
# 1. Make changes in v-edfinance/libs/ralph-cli
# ... code changes ...

# 2. Test locally
cd e:\Demo project\v-edfinance
test-ralph.bat start ved-59th --dry-run

# 3. Update standalone version
xcopy /E /I /Y libs\ralph-cli\src ralph-cli-standalone\src
copy libs\ralph-cli\package.json ralph-cli-standalone\

# 4. Publish to GitHub
scripts\publish-ralph.bat

# 5. Done! Others can now:
#    pnpm add -g git+https://github.com/Luahoa/ralph-cli.git --force
```

### For Other Projects (Team)

```bash
# One-time setup
pnpm add -g git+https://github.com/Luahoa/ralph-cli.git

# Use in any project
cd E:\NewProject
mkdir -p history scripts

# Create quality gate
curl -o scripts/quality-gate.bat \
  https://raw.githubusercontent.com/Luahoa/ralph-cli/main/examples/quality-gate.bat

# Create config
cat > ralph.config.json << 'EOF'
{
  "maxIterations": 30,
  "qualityGateScript": "scripts/quality-gate.bat"
}
EOF

# Run Ralph!
ralph start my-epic --verbose

# Update Ralph when new version available
pnpm add -g git+https://github.com/Luahoa/ralph-cli.git --force
```

---

## 📊 Comparison

| Method | Speed | Updates | Offline | Global | Best For |
|--------|-------|---------|---------|--------|----------|
| **GitHub** | ⚡⚡⚡ | Auto | ❌ | ✅ | **Most projects** |
| **Portable** | ⚡⚡ | Manual | ✅ | ❌ | Offline/Isolated |
| **Source Copy** | ⚡ | Manual | ✅ | ❌ | Customization |

---

## 🎯 Which Method to Use?

### Use GitHub Install If:
- ✅ You have internet access
- ✅ Want automatic updates
- ✅ Work on multiple projects
- ✅ Share with team

### Use Portable Package If:
- ✅ Work offline
- ✅ Need stable version
- ✅ Each project needs different config
- ✅ No global install allowed

### Use Source Copy If:
- ✅ Need to customize Ralph code
- ✅ Testing/Development
- ✅ Project-specific modifications

---

## 📂 Files Created

### For GitHub Deploy
- `ralph-cli-standalone/` - Clean standalone package
- `scripts/publish-ralph.bat` - Auto-publish script
- Ready to push to GitHub

### For Portable Package
- `ralph-cli-portable/` - Portable folder (50 KB)
- `ralph-cli-portable-v1.0.0.zip` - ZIP archive
- Copy anywhere, install with `pnpm install`

---

## 🔥 Quick Start Commands

```bash
# METHOD 1: GitHub (Recommended)
pnpm add -g git+https://github.com/Luahoa/ralph-cli.git
ralph --help

# METHOD 2: Portable
xcopy /E /I ralph-cli-portable E:\MyProject\
cd E:\MyProject\libs\ralph-cli && pnpm install

# METHOD 3: Source
xcopy /E /I libs\ralph-cli E:\MyProject\libs\ralph-cli
cd E:\MyProject\libs\ralph-cli && pnpm install
```

---

## ✅ Next Actions

1. **Create GitHub repo**: https://github.com/new
2. **Run publish script**: `scripts\publish-ralph.bat`
3. **Test install**: `pnpm add -g git+https://github.com/Luahoa/ralph-cli.git`
4. **Share with team**: Send install command

---

**Status**: ✅ Ready for deployment!  
**GitHub Repo**: https://github.com/Luahoa/ralph-cli  
**Install Command**: `pnpm add -g git+https://github.com/Luahoa/ralph-cli.git`
