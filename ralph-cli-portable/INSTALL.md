# 🚀 Ralph CLI - Portable Installation Guide

Copy folder này vào project bất kỳ để dùng Ralph CLI.

## 📦 Quick Install

### 1. Copy toàn bộ folder vào project

```batch
REM Ví dụ: Copy vào E:\MyProject
xcopy /E /I ralph-cli-portable E:\MyProject\
```

### 2. Install dependencies

```batch
cd E:\MyProject\libs\ralph-cli
pnpm install
```

### 3. Test

```batch
cd E:\MyProject
test-ralph.bat --help
```

---

## 📁 Package Contents

```
ralph-cli-portable/
├── libs/ralph-cli/        # Ralph CLI source (NO node_modules)
│   ├── src/              # TypeScript source code
│   ├── package.json      # Dependencies list
│   ├── tsconfig.json     # TypeScript config
│   ├── README.md         # Full documentation
│   └── GLOBAL_INSTALL.md # Global install guide
├── scripts/
│   ├── quality-gate-ultra-fast.bat  # ⚡ Fastest (3 gates, <5s)
│   ├── quality-gate-fast.bat        # 🚀 Fast (syntax check, ~30s)
│   └── quality-gate.bat             # 🔍 Full (build+test, ~5min)
├── ralph.config.json     # Default config
├── test-ralph.bat       # Helper script
├── RALPH_QUICK_START.md # Vietnamese quick start
└── README.md            # This file
```

---

## ⚙️ Configuration

Edit `ralph.config.json` theo project:

```json
{
  "maxIterations": 30,
  "defaultWorkers": 0,
  "qualityGates": true,
  "beadsCommand": "beads.exe",
  "bvCommand": "bv.exe",
  "qualityGateScript": "scripts/quality-gate-ultra-fast.bat",
  "historyDir": "history/",
  "logDir": ".ralph/logs/"
}
```

**Choose quality gate:**
- `quality-gate-ultra-fast.bat` - Development (fastest)
- `quality-gate-fast.bat` - CI/CD (medium)
- `quality-gate.bat` - Production (full validation)

---

## 🎯 Usage Example

```batch
# 1. Create execution plan
mkdir history\my-epic-id
notepad history\my-epic-id\execution-plan.md

# 2. Create beads
beads.exe create "Task 1" --epic my-epic-id
beads.exe create "Task 2" --epic my-epic-id

# 3. Run Ralph
test-ralph.bat start my-epic-id --max-iter 30 --verbose

# 4. Check status
test-ralph.bat status my-epic-id
```

---

## 📋 Requirements

### Bắt Buộc
- **Node.js 18+** và **pnpm**
- **Git** installed
- **Beads system** (beads.exe, bv.exe)
- **TypeScript project**

### Tùy Chọn
- **tsx** global: `pnpm add -g tsx`

---

## 🔧 Post-Install Steps

### 1. Install dependencies (MUST DO)

```batch
cd libs\ralph-cli
pnpm install
```

### 2. Create project structure

```batch
mkdir history
mkdir .ralph\logs
```

### 3. Customize config

Edit `ralph.config.json`:
- Set correct `beadsCommand` path (if not in PATH)
- Choose quality gate script
- Adjust `maxIterations` for your epics

### 4. Test installation

```batch
test-ralph.bat --help

# Should show:
# ralph-cli/1.0.0
# Usage: test-ralph.bat <command> [options]
```

---

## 🚀 Advanced: Global Installation

Nếu muốn dùng `ralph` command globally:

```batch
cd libs\ralph-cli
pnpm link --global

# Now use anywhere:
ralph start my-epic --max-iter 30
```

See [GLOBAL_INSTALL.md](libs/ralph-cli/GLOBAL_INSTALL.md) for details.

---

## 📚 Documentation

- **[RALPH_QUICK_START.md](RALPH_QUICK_START.md)** - Vietnamese quick start
- **[libs/ralph-cli/README.md](libs/ralph-cli/README.md)** - Full English docs
- **[libs/ralph-cli/GLOBAL_INSTALL.md](libs/ralph-cli/GLOBAL_INSTALL.md)** - Global setup

---

## 🛠️ Troubleshooting

### "test-ralph.bat not found"
```batch
# Make sure you're in project root where test-ralph.bat exists
cd E:\MyProject
test-ralph.bat --help
```

### "Cannot find module"
```batch
# Install dependencies first!
cd libs\ralph-cli
pnpm install
```

### Quality gates fail
```batch
# Test script directly
scripts\quality-gate-ultra-fast.bat

# Switch to faster gate
# Edit ralph.config.json -> qualityGateScript
```

### Beads sync error
```batch
# Verify beads installed
beads.exe list

# Manual sync
beads.exe sync --no-daemon
```

---

## 📦 Package Size

- **Source only**: ~50 KB (fast copy)
- **After pnpm install**: ~50 MB (includes dependencies)

---

## ✅ Installation Checklist

- [ ] Copy folder to project root
- [ ] Run `pnpm install` in libs/ralph-cli
- [ ] Test `test-ralph.bat --help`
- [ ] Create `history/` folder
- [ ] Edit `ralph.config.json`
- [ ] Test quality gate: `scripts\quality-gate-ultra-fast.bat`
- [ ] Verify beads: `beads.exe list`

---

## 🔄 Updates

When Ralph gets updated in source project:

```batch
# Option 1: Re-copy src folder
xcopy /E /I /Y path\to\ralph-cli-portable\libs\ralph-cli\src libs\ralph-cli\src

# Option 2: Copy entire portable package again
xcopy /E /I /Y path\to\new\ralph-cli-portable .
cd libs\ralph-cli
pnpm install
```

---

**Version**: 1.0.0  
**Date**: 2026-01-06  
**Source**: https://github.com/Luahoa/v-edfinance

**Ready to automate!** 🚀
