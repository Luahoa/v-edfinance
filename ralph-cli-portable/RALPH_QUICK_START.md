# Ralph Loop CLI - Quick Start 🚀

## Ralph CLI Test Thành Công! ✅

Ralph CLI đã được test và hoạt động hoàn hảo trên Windows. Dùng để tối ưu hóa Video System!

## Sử Dụng Nhanh (Quick Usage)

### Chạy Video Optimization Epic

```bash
# Test dry-run trước
test-ralph.bat start ved-59th --dry-run --verbose

# Chạy thật (khi ready)
test-ralph.bat start ved-59th --max-iter 40 --verbose

# Monitor progress
test-ralph.bat status ved-59th
```

### Sử dụng script helper (Khuyên dùng)

```bash
# Xem help
test-ralph.bat --help

# Chạy loop cho epic (dry-run mode)
test-ralph.bat start ved-fz9m --dry-run --verbose

# Xem status
test-ralph.bat status ved-fz9m

# List tất cả epics
test-ralph.bat list
```

### Các Lệnh Chính (Main Commands)

#### 1. **ralph start** - Bắt đầu Ralph Loop

```bash
# Dry-run mode (không thay đổi gì)
test-ralph.bat start ved-fz9m --dry-run --max-iter 5 --verbose

# Chạy thật với quality gates
test-ralph.bat start ved-fz9m --max-iter 30 --verbose

# Skip quality gates (để test nhanh)
test-ralph.bat start ved-fz9m --skip-quality-gates --dry-run
```

**Options:**
- `--max-iter <number>` - Số iteration tối đa (mặc định: 30)
- `--workers <number>` - Số worker song song (mặc định: auto)
- `--skip-quality-gates` - Bỏ qua quality gate verification
- `--dry-run` - Chạy simulation không thay đổi thật
- `--verbose` - Hiển thị chi tiết log

#### 2. **ralph status** - Xem trạng thái loop

```bash
test-ralph.bat status ved-fz9m

# JSON format
test-ralph.bat status ved-fz9m --json
```

#### 3. **ralph list** - Liệt kê tất cả epics

```bash
test-ralph.bat list

# Filter theo status
test-ralph.bat list --status running
test-ralph.bat list --status complete
```

#### 4. **ralph stop** - Dừng loop đang chạy

```bash
test-ralph.bat stop ved-fz9m

# Force kill
test-ralph.bat stop ved-fz9m --force
```

#### 5. **ralph resume** - Resume từ checkpoint

```bash
test-ralph.bat resume ved-fz9m

# Resume từ iteration cụ thể
test-ralph.bat resume ved-fz9m --from-iteration 10
```

## Configuration

Tạo file `ralph.config.json` trong project root:

```json
{
  "maxIterations": 30,
  "defaultWorkers": 0,
  "qualityGates": true,
  "beadsCommand": "beads.exe",
  "bvCommand": "bv.exe",
  "qualityGateScript": "scripts/quality-gate.sh",
  "historyDir": "history/",
  "logDir": ".ralph/logs/"
}
```

## Environment Variables

```bash
# Override max iterations
set RALPH_MAX_ITER=50
test-ralph.bat start ved-fz9m

# Enable verbose mode
set RALPH_VERBOSE=1
test-ralph.bat start ved-fz9m

# JSON output
set RALPH_JSON=1
test-ralph.bat list
```

## Workflow Example

```bash
# 1. Tạo execution plan (manual hoặc dùng planning.md)
# Đảm bảo có file: history/ved-fz9m/execution-plan.md

# 2. Chạy Ralph Loop (dry-run test trước)
test-ralph.bat start ved-fz9m --dry-run --max-iter 5 --verbose

# 3. Nếu OK, chạy thật
test-ralph.bat start ved-fz9m --verbose

# 4. Monitor progress
test-ralph.bat status ved-fz9m

# 5. Nếu cần dừng
test-ralph.bat stop ved-fz9m

# 6. Resume lại
test-ralph.bat resume ved-fz9m
```

## How It Works

Ralph Loop chạy theo 4 phase cycle:

```
┌─────────────────────────────────────────┐
│ Phase 1: Planning Check                 │
│ - Kiểm tra execution plan exists        │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│ Phase 2: Orchestrator                   │
│ - Spawn parallel worker agents          │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│ Phase 3: Workers Execute                │
│ - Beads executed across tracks          │
│ - Sync với beads repo                   │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│ Phase 4: Quality Gates                  │
│ - Run quality-gate.sh                   │
│ - Check completion promise              │
└─────────────────────────────────────────┘
```

Loop dừng khi:
- ✅ Phát hiện `<promise>EPIC_COMPLETE</promise>` trong `.ralph-output.md`
- ✅ Quality gates pass
- ❌ Đạt max iterations

## Troubleshooting

### Loop không start

```bash
# Kiểm tra execution plan tồn tại
dir history\ved-fz9m\execution-plan.md

# Test beads command
beads.exe sync --no-daemon

# Test quality gate script
bash scripts/quality-gate.sh
```

### Quality gates fail

```bash
# Xem log chi tiết
type .quality-gate.log

# Xem JSON result
type .quality-gate-result.json

# Fix errors và resume
test-ralph.bat resume ved-fz9m
```

### Max iterations reached

```bash
# Xem progress
bv --robot-triage --graph-root ved-fz9m

# List beads còn lại
beads list --status open --epic ved-fz9m

# Tăng max iterations và resume
test-ralph.bat resume ved-fz9m --max-iter 50
```

## Advanced Usage

### Log to file

```bash
test-ralph.bat start ved-fz9m --log-file ralph.log --verbose
```

### JSON output cho CI/CD

```bash
test-ralph.bat status ved-fz9m --json > status.json
test-ralph.bat list --json > epics.json
```

### Integration với GitHub Actions

```yaml
- name: Run Ralph Loop
  run: |
    test-ralph.bat start ${{ env.EPIC_ID }} --max-iter 30 --json
  env:
    EPIC_ID: ved-fz9m
    RALPH_VERBOSE: 1
```

## Documentation

- **Full README**: [libs/ralph-cli/README.md](libs/ralph-cli/README.md)
- **Implementation Summary**: [docs/RALPH_CLI_IMPLEMENTATION_SUMMARY.md](docs/RALPH_CLI_IMPLEMENTATION_SUMMARY.md)
- **Planning Docs**: [docs/RALPH_CLI_PLANNING_SUMMARY.md](docs/RALPH_CLI_PLANNING_SUMMARY.md)

---

**Status**: ✅ Đã test thành công trên Windows
**Version**: 1.0.0
**Date**: 2026-01-06
