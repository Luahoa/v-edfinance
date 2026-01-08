# Ralph CLI - Portable Package

**Version**: 1.0.0  
**Date**: 2026-01-06

## 📦 Cài Đặt Nhanh

### 1. Copy toàn bộ folder này vào project mới

```batch
REM Ví dụ: Copy vào E:\MyProject
xcopy /E /I ralph-cli-portable E:\MyProject\
```

### 2. Cài dependencies (chỉ lần đầu)

```batch
cd E:\MyProject\libs\ralph-cli
pnpm install
```

### 3. Chạy Ralph

```batch
cd E:\MyProject
test-ralph.bat --help
test-ralph.bat start my-epic --max-iter 30 --verbose
```

---

## 📁 Cấu Trúc Package

```
ralph-cli-portable/
├── libs/
│   └── ralph-cli/              # Ralph CLI source code
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── scripts/
│   ├── quality-gate-ultra-fast.bat  # Fast quality gate
│   ├── quality-gate-fast.bat        # Medium quality gate
│   └── quality-gate.bat             # Full quality gate
├── ralph.config.json           # Default configuration
├── test-ralph.bat             # Helper script to run Ralph
├── RALPH_QUICK_START.md       # Vietnamese quick start guide
└── README.md                  # This file
```

---

## ⚙️ Cấu Hình

### ralph.config.json

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

**Tùy chỉnh theo project:**
- `maxIterations`: Số iteration tối đa (30-50 cho epic lớn)
- `qualityGateScript`: Chọn quality gate phù hợp:
  - `quality-gate-ultra-fast.bat` - Chỉ check basic (3 gates, <5s)
  - `quality-gate-fast.bat` - Check syntax + lint (~30s)
  - `quality-gate.bat` - Full build + tests (~5 minutes)

---

## 📋 Yêu Cầu Hệ Thống

### Bắt Buộc
- **Node.js** 18+ và **pnpm**
- **Git** installed
- **Beads system** (beads.exe, bv.exe)
- **TypeScript** project (hoặc có tsconfig.json)

### Tùy Chọn
- **tsx** - Để chạy TypeScript trực tiếp (`pnpm add -g tsx`)

---

## 🚀 Sử Dụng

### Tạo Epic Mới

1. **Tạo execution plan:**
```batch
mkdir history\ved-xxxx
notepad history\ved-xxxx\execution-plan.md
```

2. **Tạo beads:**
```batch
beads.exe create "Task 1" --epic ved-xxxx --track 1
beads.exe create "Task 2" --epic ved-xxxx --track 2
```

3. **Chạy Ralph Loop:**
```batch
test-ralph.bat start ved-xxxx --max-iter 30 --verbose
```

### Các Lệnh Khác

```batch
# Xem status
test-ralph.bat status ved-xxxx

# List tất cả epics
test-ralph.bat list

# Dừng loop
test-ralph.bat stop ved-xxxx

# Resume lại
test-ralph.bat resume ved-xxxx
```

---

## 🎯 Workflow Chuẩn

### Phase 1: Planning
1. Tạo epic trong beads: `beads.exe create "Epic: My Feature" --epic`
2. Viết execution plan: `history/<epic-id>/execution-plan.md`
3. Tạo beads cho từng task

### Phase 2: Execution
1. Start Ralph: `test-ralph.bat start <epic-id> --max-iter 30 --verbose`
2. Ralph sẽ tự động:
   - Check execution plan
   - Spawn workers (TODO: integrate with Task() API)
   - Execute beads
   - Run quality gates
   - Detect completion

### Phase 3: Completion
1. Kiểm tra `.ralph-output.md` có `<promise>EPIC_COMPLETE</promise>`
2. Close epic: `beads.exe close <epic-id> --reason "Complete"`
3. Review quality gates: `type .quality-gate-result.json`

---

## 🛠️ Troubleshooting

### Ralph không chạy
```batch
# Kiểm tra dependencies
cd libs\ralph-cli
pnpm install

# Test trực tiếp
npx tsx src\index.ts --help
```

### Quality gates fail
```batch
# Test quality gate script
scripts\quality-gate-ultra-fast.bat

# Xem kết quả
type .quality-gate-result.json

# Switch sang fast gate nếu ultra-fast quá strict
# Edit ralph.config.json: qualityGateScript -> quality-gate-fast.bat
```

### Beads sync error
```batch
# Sync thủ công
beads.exe sync --no-daemon

# Kiểm tra git status
git status

# Fix conflicts nếu có
git add .
git commit -m "fix: resolve beads conflicts"
```

### Git push fail (large files)
```batch
# Kiểm tra file size
git ls-files -z | xargs -0 du -sh | sort -h | tail -20

# Thêm vào .gitignore nếu cần
echo .turbo/cache/*.tar.zst >> .gitignore
```

---

## 📚 Documentation

- **[RALPH_QUICK_START.md](RALPH_QUICK_START.md)** - Hướng dẫn nhanh tiếng Việt
- **[libs/ralph-cli/README.md](libs/ralph-cli/README.md)** - Full English docs
- **[libs/ralph-cli/GLOBAL_INSTALL.md](libs/ralph-cli/GLOBAL_INSTALL.md)** - Global installation

---

## 🔄 Cập Nhật Ralph

Khi có version mới của Ralph:

```batch
# Option 1: Copy từ v-edfinance project
xcopy /E /I /Y "e:\Demo project\v-edfinance\libs\ralph-cli" libs\ralph-cli

# Option 2: Pull từ git (nếu có remote)
cd libs\ralph-cli
git pull origin main

# Sau đó rebuild
pnpm install
```

---

## ✅ Checklist Sau Khi Copy

- [ ] Copy folder vào project root
- [ ] Run `pnpm install` trong `libs/ralph-cli`
- [ ] Test `test-ralph.bat --help` chạy được
- [ ] Tạo `history/` folder cho execution plans
- [ ] Customize `ralph.config.json` theo project
- [ ] Test quality gate: `scripts\quality-gate-ultra-fast.bat`
- [ ] Verify beads system: `beads.exe list`

---

## 📞 Support

**Source**: https://github.com/Luahoa/v-edfinance  
**Thread**: T-019b9333-6a5d-730e-b75c-2e12af9acd81  
**Version**: 1.0.0 (2026-01-06)

---

**Ready to automate your epic execution!** 🚀
